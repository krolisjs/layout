import { calBaseline, calContentArea, calLeading, getMbpBottom, getMbpRight, getMbpV } from './compute';
import type { Constraints, Frag, Inline, Text, TextBox } from './layout';
import { VerticalAlign } from './style';
import type { IElementNode, INode, ITextNode } from './node';

enum ContentBoxType {
  TEXT = 0, // 一个lineBox中，text内容形成的一个区域
  BLOCK = 1, // block会形成一个占位空间并隔断
  INLINE = 2, // inline很特殊，要看首尾行和mbp
  INLINE_BLOCK = 3, // 行内占位且有baseline和对齐
}

type ContentBox = {
  type: ContentBoxType.TEXT;
  lv: number; // 一行中的内容需要考虑包含层级关系，叶子节点会影响父级inline的本行宽度计算
  frag: TextBox;
  node: ITextNode;
  added: boolean; // 无用
} | {
  type: ContentBoxType.INLINE;
  lv: number;
  frag: Frag; // 可能不被添加到result.frags里，仅占位参与行高计算（空节点时），有内容或有左右边距才会
  node: IElementNode;
  added: boolean; // 防重添加到节点result的frags，空inline会生成一个不添加只占位参与行高计算
} | {
  type: ContentBoxType.INLINE_BLOCK;
  lv: number;
  frag: null; // 无用
  node: IElementNode;
  added: boolean; // 无用
};

export class LineBox {
  readonly x: number;
  readonly y: number;
  h: number;
  readonly list: ContentBox[] = [];
  begin = true; // 无真实内容标识，第一个内容节点（如text）看到无需考虑尺寸换行一定会进入，同时置false

  constructor(x: number, y: number, h = 0) {
    this.x = x;
    this.y = y;
    this.h = h;
  }
}

let id = 0;

export class LineBoxContext {
  readonly id = id++;
  readonly lineBoxes: LineBox[] = [];
  current: LineBox; // 当前行，即最后一行
  readonly struct: IElementNode | null = null; // 所属的block节点支柱，强制每行baseline对齐，根节点inline的话就没有
  structBaseline: number | null = null; // 缓存支柱的计算值
  readonly inlineMap: WeakMap<IElementNode, IElementNode[]> = new WeakMap(); // inline节点包含的block占位记录
  readonly inlineStack: IElementNode[] = []; // 随着inline父子嵌套递归，记录当前所有inline节点，不包含叶子text节点
  readonly endList: INode[] = []; // inline/text节点结束时记录，在每行end时这些结束的节点要计算自身尺寸，end前因为对齐可能会变

  constructor(x: number, y: number, struct?: IElementNode) {
    // 最初生成首行，是个空行，等后续子节点添加
    this.current = new LineBox(x, y);
    this.lineBoxes.push(this.current);
    this.struct = struct || null;
  }

  /**
   * inline节点begin时调用，递归嵌套的inline节点可能有多个，形成一个stack记录；
   * 同时向当前行添加一个占位frag，以便真实叶子结点（如text）为当前行添加内容时，扩展这些frag的宽度，同时取消占位记录进frags；
   * 如果是0宽没有真实叶子结点调用，只参与行高计算，不计入自身的frags；
   * 产生换行时，新的行能知道当前有哪些父inline节点还在。
   */
  addInline(node: IElementNode, x: number, y: number) {
    this.addInlineFrag(node, x, y, this.inlineStack.length);
    this.inlineStack.push(node);
  }

  private addInlineFrag(node: IElementNode, x: number, y: number, lv: number) {
    const { fontSize, fontFamily, lineHeight } = node.result!;
    let contentArea = node.contentArea;
    // inline的内容区域（背景色）高度和font有关，但整行换行却使用lineHeight来隔开
    if (contentArea === null) {
      contentArea = node.contentArea = calContentArea(fontFamily, fontSize);
    }
    const leading = lineHeight - contentArea;
    const frag = { x, y: y + leading * 0.5, w: 0, h: contentArea };
    // added: false说明暂时未被添加，只参与行高计算，防止空inline，等叶子内容节点坐实它；
    // 但开始mbp行首强制添加，因为歧义，节点能看到占位了，哪怕是0宽
    let added = this.current.begin;
    if (added) {
      const res = node.result!;
      if (!res.marginLeft && !res.borderLeftWidth && !res.paddingLeft) {
        added = false;
      }
    }
    this.current.list.push({ type: ContentBoxType.INLINE, lv, frag, node, added });
    if (added) {
      (node.result as Inline).frags.push(frag);
    }
  }

  // inline节点end时调用，后续再换行便和此节点无关了，需要计算末尾mbp
  popInline() {
    const inlineMap = this.inlineMap;
    const inlineStack = this.inlineStack;
    const o = inlineStack.pop()!;
    this.endList.push(o); // 等行结束时机计算尺寸
    const list = this.current.list;
    for (let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      const { node, lv } = item;
      // 找到结束的inline节点和lv，有末尾mbp计算
      if (node === o) {
        const res = node.result as Inline;
        // 这里的判断分开，因为合起来可能为0（负margin）
        if (res.marginRight || res.borderRightWidth || res.paddingRight) {
          const mbp = getMbpRight(res);
          if (mbp) {
            // 父inline一定在前面出现，且lv更小
            for (let j = 0; j < i; j++) {
              const item = list[j];
              if (item.type === ContentBoxType.INLINE && item.lv < lv) {
                const frag = item.frag;
                frag.w += mbp;
                // 末尾mbp一定跟着不会另起一行，无需判断added
              }
            }
          }
        }
        // 如果包含block，需要将block考虑进来计算极值
        if (inlineMap.has(o)) {
          const list = inlineMap.get(o)!;
          for (let i = 0, len = list.length; i < len; i++) {
            const r = list[i].result!;
            res.x = Math.min(res.x, r.x);
            res.y = Math.min(res.y, r.y);
            // block是需要考虑mbp的
            res.w = Math.max(res.w, r.x + r.w + getMbpRight(r) - res.x);
            res.h = Math.max(res.h, r.y + r.h + getMbpBottom(r) - res.y);
          }
        }
        break;
      }
    }
  }

  // 叶子节点调用，如text，真正添加内容
  addText(frag: TextBox, node: ITextNode) {
    const current = this.current!;
    current.begin = false; // 不再是行首
    const list = current.list;
    const lv = this.inlineStack.length;
    list.push({ type: ContentBoxType.TEXT, lv, frag, node, added: true });
    // 所属的inline都要扩展本行的宽度，用lv判断
    for (let i = list.length - 2; i >= 0; i--) {
      const item = list[i];
      if (item.type === ContentBoxType.INLINE && item.lv < lv) {
        const res = item.node.result as Inline;
        // 修改inline的frag的宽，标记并添加到节点的result，除非开始mbp强制添加，其它都是这里
        item.frag.w = frag.x + frag.w - item.frag.x;
        if (!item.added) {
          item.added = true;
          res.frags.push(item.frag);
        }
      }
    }
  }

  // 记录等本行结束时结算text的尺寸
  popText(node: ITextNode) {
    this.endList.push(node);
  }

  addInlineBlock(node: IElementNode) {
    const current = this.current!;
    current.begin = false; // 不再是行首
    const list = current.list;
    const lv = this.inlineStack.length;
    this.current.list.push({ type: ContentBoxType.INLINE_BLOCK, lv, node, frag: null, added: true });
    // 这个和addText有点像
    for (let i = list.length - 2; i >= 0; i--) {
      const item = list[i];
      if (item.type === ContentBoxType.INLINE && item.lv < lv) {
        const res = item.node.result as Inline;
        item.frag.w = res.x + res.w + getMbpRight(res) - item.frag.x;
        if (!item.added) {
          item.added = true;
          res.frags.push(item.frag);
        }
      }
    }
  }

  // 一行中添加block是个奇怪行为，它会隔断，并且对所属的inline产生最终尺寸特殊极值计算
  addBlock(node: IElementNode) {
    const inlineMap = this.inlineMap;
    const inlineStack = this.inlineStack;
    for (let i = 0, len = inlineStack.length; i < len; i++) {
      const inline = this.inlineStack[i];
      let list: IElementNode[];
      if (inlineMap.has(inline)) {
        list = inlineMap.get(inline)!;
      }
      else {
        list = [];
        inlineMap.set(inline, list);
      }
      list.push(node);
    }
  }

  // 换行后开启新行调用，当前如果还有inline嵌套没有结束，每个inline跟随开启新行
  newLine(x: number, y: number) {
    const current = this.current = new LineBox(x, y);
    this.lineBoxes.push(current);
    const inlineStack = this.inlineStack;
    for (let i = 0, len = inlineStack.length; i < len; i++) {
      this.addInlineFrag(inlineStack[i], x, y, i);
    }
  }

  // 一行放不下内容的情况（比如text）要起新行，在endLine之前调用，行末尾如果是空inline，将其占位符删除
  // 这会发生在拥有开始mbp的inline包含无法放下text的情况，另起一行，那么刚添加的inline需要删掉不参与计算。
  prepareNextLine() {
    const list = this.current.list;
    // 理论一定有，要求是inline且未added
    const last = list[list.length - 1]!;
    if (last.type !== ContentBoxType.INLINE || last.added) {
      return;
    }
    // 删除掉，因为要放在下一行，同时向前查找这个inline的空父inline，因为可能嵌套
    list.pop();
    const lv = last.lv;
    for (let i = list.length - 1; i >= 0; i--) {
      const item = list[i];
      if (item.type !== ContentBoxType.INLINE || item.added || item.lv >= lv) {
        return;
      }
      list.pop();
    }
  }

  /**
   * lineBox结束时，比如遇到换行，或者block内部末尾调用，用以对齐verticalAlign，
   * 在特定情况下，nextNewline参数会传true，比如放不下必须新开一行，能够提前知道这不是尾行。
   */
  endLine() {
    const current = this.current;
    const list = current.list;
    // 找到无效的inline的frag去除，防止空行inline
    for (let i = list.length - 1; i >= 0; i--) {
      const item = list[i];
      // 没被added去除，防止空行inline
      if (item.type === ContentBoxType.INLINE && !item.added) {
        list.splice(i, 1);
      }
    }
    // 空block情况，以及block等刚开始检查prev遗留的情况
    if (!list.length) {
      return false;
    }
    /**
     * 对齐算法，css中支柱一定存在，但这里如果root是inline则可能不存在
     * 有支柱先求出支柱的baseline
     */
    let maxUpper: number | null = null;
    let maxLower: number | null = null; // 均是正值，相对高度
    let hBase = 0;
    const struct = this.struct;
    let structBaseline = this.structBaseline;
    // 缓存只求一次，多行情况下支柱不用重复计算
    if (struct && structBaseline === null) {
      const res = struct.result!;
      structBaseline = calBaseline(res.fontFamily, res.fontSize, res.lineHeight);
      this.structBaseline = structBaseline;
    }
    if (structBaseline !== null) {
      maxUpper = structBaseline;
      const res = struct!.result!;
      maxLower = res.lineHeight - maxUpper;
      hBase = res.lineHeight;
    }
    // 求出基线极值和初步的行高
    for (let i = 0, len = list.length; i < len; i++) {
      const { type, node } = list[i];
      const style = node.style;
      const res = node.result!;
      if (style.verticalAlign === VerticalAlign.BASELINE) {
        let b: number;
        if (ContentBoxType.INLINE_BLOCK === type) {
          b = node.getBaseline();
          const n = res.h + getMbpV(res) - b;
          if (maxLower === null) {
            maxLower = n;
          }
          else {
            maxLower = Math.max(maxLower, n);
          }
        }
        else {
          b = calBaseline(res.fontFamily, res.fontSize, res.lineHeight);
          if (maxLower === null) {
            maxLower = res.lineHeight - b;
          }
          else {
            maxLower = Math.max(maxLower, res.lineHeight - b);
          }
        }
        // 没有支柱的特殊情况
        if (maxUpper === null) {
          maxUpper = b;
        }
        else {
          maxUpper = Math.max(maxUpper, b);
        }
      }
    }
    if (maxUpper !== null && maxLower !== null) {
      hBase = Math.max(hBase, maxUpper + maxLower);
    }
    // 再看top/bottom对齐的
    for (let i = 0, len = list.length; i < len; i++) {
      const { type, node } = list[i];
      const style = node.style;
      const res = node.result!;
      if (style.verticalAlign === VerticalAlign.TOP) {
        let b: number;
        if (ContentBoxType.INLINE_BLOCK === type) {
          b = node.getBaseline();
        }
        else {
          b = calBaseline(res.fontFamily, res.fontSize, res.lineHeight);
        }
        // 特殊的没有支柱且没有baseline的情况，只要判断hBase就可以了，另外2个会被条件包含
        if (hBase === null) {
          maxUpper = b;
          maxLower = res.lineHeight - b;
          hBase = res.lineHeight;
        }
        else if (res.lineHeight > hBase) {
          maxLower = Math.max(maxLower!, res.lineHeight - b);
        }
      }
      else if (style.verticalAlign === VerticalAlign.BOTTOM) {
        let b: number;
        if (ContentBoxType.INLINE_BLOCK === type) {
          b = node.getBaseline();
        }
        else {
          b = calBaseline(res.fontFamily, res.fontSize, res.lineHeight);
        }
        if (hBase === null) {
          maxUpper = b;
          maxLower = res.lineHeight - b;
          hBase = res.lineHeight;
        }
        else if (res.lineHeight > hBase) {
          maxUpper = Math.max(maxUpper!, b);
        }
      }
    }
    if (maxUpper !== null && maxLower !== null) {
      hBase = Math.max(hBase, maxUpper + maxLower);
    }
    current.h = hBase;
    // 遍历所有的设置
    for (let i = 0, len = list.length; i < len; i++) {
      const { node, frag, type } = list[i];
      const style = node.style;
      const res = node.result!;
      if (style.verticalAlign === VerticalAlign.TOP) {
        const leading = calLeading(res.fontFamily, res.fontSize, res.lineHeight);
        if (type === ContentBoxType.INLINE_BLOCK) {
        }
        else {
          frag.y += leading * 0.5;
        }
      }
      else if (style.verticalAlign === VerticalAlign.BASELINE) {
        if (type === ContentBoxType.INLINE_BLOCK) {
          node.offsetY(maxUpper! - node.getBaseline());
        }
        else {
          frag.y += maxUpper! - calBaseline(res.fontFamily, res.fontSize, res.lineHeight);
        }
      }
      else if (style.verticalAlign === VerticalAlign.BOTTOM) {
        if (type === ContentBoxType.INLINE_BLOCK) {
          node.offsetY(hBase - node.getBaseline());
        }
        else {
          frag.y += hBase - res.lineHeight;
        }
      }
    }
    // 这行已结束的inline/text自身计算包围盒尺寸
    const end = this.endList.splice(0);
    for (let i = 0, len = end.length; i < len; i++) {
      const node = end[i];
      const res = node.result as (Inline | Text);
      const frags = res.frags;
      if (frags.length) {
        const first = frags[0];
        const last = frags[frags.length - 1];
        res.y = first.y;
        res.h = last.y + last.h - res.y;
        for (let i = 0, len = frags.length; i < len; i++) {
          const item = frags[i];
          res.x = Math.min(res.x, item.x);
          res.w = Math.max(res.w, item.x + item.w - res.x);
        }
      }
    }
    return true;
  }
}

export class MarginContext {
  pos = 0;
  neg = 0;
  list: INode[] = [];

  append(n: number, node?: INode) {
    if (node) {
      this.list.push(node);
    }
    if (n > 0) {
      this.pos = Math.max(this.pos, n);
    }
    else if (n < 0) {
      this.neg = Math.min(this.neg, n);
    }
  }

  solve() {
    return this.pos + this.neg;
  }

  reset() {
    this.pos = this.neg = 0;
    this.list.splice(0);
  }

  // 仅处理挂起的节点，统计累计了多少margin，为这些节点做y偏移，同时影响自身的约束，这些节点一定是递归连续的
  mergeTop() {
    const m = this.solve();
    if (m) {
      const list = this.list;
      for (let i = 0, len = list.length; i < len; i++) {
        const node = list[i];
        const r = node.result!;
        r.y += m;
        if ('constraints' in node) {
          const c = node.constraints as Constraints;
          c.cy += m;
          c.oy += m;
        }
      }
    }
    return m;
  }
}
