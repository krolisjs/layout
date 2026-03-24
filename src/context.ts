import { calBaseline, calContentArea, calLeading, getMbpBottom, getMbpRight } from './compute';
import type { Frag, Inline, Text, TextBox } from './layout';
import { VerticalAlign } from './style';
import type { INode, ITextNode, ITypeNode } from './node';

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
  frag: Frag;
  node: INode;
  added: boolean; // 是否被添加到节点result的frags，空inline会先生成一个不添加等行结束判断
} | {
  type: ContentBoxType.INLINE_BLOCK;
  lv: number;
  frag: Frag;
  node: INode;
  added: boolean; // 无用
};

export class LineBox {
  readonly x: number;
  readonly y: number;
  h: number;
  readonly list: ContentBox[] = [];

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
  readonly struct: INode | null = null; // 所属的block节点支柱，强制每行baseline对齐，根节点inline的话就没有
  structBaseline: number | null = null;
  readonly inlinePlaceHolder: WeakMap<INode, ITypeNode[]> = new WeakMap(); // inline节点包含的block占位记录
  readonly nodeStack: INode[] = []; // 随着inline父子嵌套递归，记录当前所有inline节点，不包含叶子text节点
  readonly endList: ITypeNode[] = []; // inline/text节点结束时记录，在每行end时这些结束的节点要计算自身尺寸

  constructor(x: number, y: number, struct?: INode) {
    // 最初生成首行，是个空行，等后续子节点添加
    this.current = new LineBox(x, y);
    this.lineBoxes.push(this.current);
    this.struct = struct || null;
  }

  /**
   * inline(Block)节点begin时调用，递归嵌套的inline节点可能有多个，形成一个stack记录；
   * 同时向当前行添加一个占位，以便真实叶子结点为当前行添加内容时，扩展这些inline行的宽度；
   * 等待换行或者结束时，看占位符情况决定是否加入节点的frags结果中，同时进行vertical对齐操作；
   * 产生换行时，新的行能知道当前有哪些父inline节点还在。
   */
  addInline(node: INode, x: number, y: number) {
    this.addInlineFrag(node, x, y, this.nodeStack.length);
    this.nodeStack.push(node);
  }

  private addInlineFrag(node: INode, x: number, y: number, lv: number) {
    const { fontSize, fontFamily, lineHeight } = node.result!;
    // inline的内容区域（背景色）高度和font有关，但整行换行却使用lineHeight来隔开
    const h = calContentArea(fontFamily, fontSize);
    const leading = lineHeight - h;
    const frag = { x, y: y + leading * 0.5, w: 0, h };
    this.current.list.push({ type: ContentBoxType.INLINE, lv, frag, node, added: false });
  }

  // inline节点end时调用，后续再换行便和此节点无关了，需要计算末尾mbp
  popInline() {
    const inlinePlaceHolder = this.inlinePlaceHolder;
    const nodeStack = this.nodeStack;
    const o = nodeStack.pop()!;
    this.endList.push(o);
    const list = this.current.list;
    for (let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      const { node, lv } = item;
      // 找到结束的inline节点和lv，有末尾mbp才有效
      if (node === o) {
        const result = node.result as Inline;
        if (result.marginRight || result.borderRightWidth || result.paddingRight) {
          if (!item.added) {
            item.added = true;
            result.frags.push(item.frag as Frag);
          }
          const mbp = getMbpRight(result);
          // 父inline一定在前面出现，且lv更小
          for (let j = 0; j < i; j++) {
            const item = list[j];
            if (item.type === ContentBoxType.INLINE && item.lv < lv) {
              if (!item.added) {
                item.added = true;
                const frag = item.frag;
                if (mbp) {
                  frag.w += mbp;
                }
                (item.node.result as Inline).frags.push(frag);
              }
            }
          }
        }
        if (inlinePlaceHolder.has(o)) {
          const list = inlinePlaceHolder.get(node)!;
          for (let i = 0, len = list.length; i < len; i++) {
            const r = list[i].result!;
            result.x = Math.min(result.x, r.x);
            result.y = Math.min(result.y, r.y);
            result.w = Math.max(result.w, r.x + r.w + getMbpRight(r) - result.x);
            result.h = Math.max(result.h, r.y + r.h + getMbpBottom(r) - result.y);
          }
        }
        break;
      }
    }
  }

  // 叶子节点调用，如text，真正添加内容
  addText(frag: TextBox, node: ITextNode) {
    const list = this.current!.list;
    const lv = this.nodeStack.length;
    list.push({ type: ContentBoxType.TEXT, lv, frag, node, added: true });
    // 所属的inline都要扩展本行的宽度，用lv判断
    for (let i = list.length - 2; i >= 0; i--) {
      const item = list[i];
      if (item.type === ContentBoxType.INLINE && item.lv < lv) {
        item.frag.w = frag.x + frag.w - item.frag.x;
      }
    }
  }

  popText(node: ITextNode) {
    this.endList.push(node);
  }

  addBlock(node: ITypeNode) {
    const inlinePlaceHolder = this.inlinePlaceHolder;
    const nodeStack = this.nodeStack;
    for (let i = 0, len = nodeStack.length; i < len; i++) {
      const inline = this.nodeStack[i];
      let list: ITypeNode[];
      if (inlinePlaceHolder.has(inline)) {
        list = inlinePlaceHolder.get(inline)!;
      }
      else {
        list = [];
        inlinePlaceHolder.set(inline, list);
      }
      list.push(node);
    }
  }

  // 换行后开启新行调用，当前如果还有inline嵌套没有结束，每个inline跟随开启新行
  newLine(x: number, y: number) {
    const current = this.current = new LineBox(x, y);
    this.lineBoxes.push(current);
    const nodeStack = this.nodeStack;
    for (let i = 0, len = nodeStack.length; i < len; i++) {
      this.addInlineFrag(nodeStack[i], x, y, i);
    }
  }

  // lineBox结束时，比如遇到换行，或者block内部末尾调用，用以对齐verticalAlign
  endLine() {
    const lineBoxes = this.lineBoxes;
    const current = this.current;
    const list = current.list;
    // 空block情况
    if (!list.length) {
      return false;
    }
    let hasContent = false;
    // 根据是否有叶子结点（text/inlineBlock），是否有首尾行且水平mbp判断
    for (let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      if ([ContentBoxType.TEXT, ContentBoxType.INLINE_BLOCK].includes(item.type)) {
        hasContent = true;
        break;
      }
      // 有处理过末尾mbp会被added，提前跳出判断
      else if (item.added) {
        hasContent = true;
        break;
      }
    }
    // 有内容将inline的未添加的行内frag加到result里
    if (hasContent) {
      for (let i = 0, len = list.length; i < len; i++) {
        const item = list[i];
        if (item.type === ContentBoxType.INLINE && !item.added) {
          item.added = true;
          (item.node.result as Inline).frags.push(item.frag);
        }
      }
    }
    // 没内容判断是否首行，inline的首行即便是空也要看开始的mbp，这里面只会有inline了
    else if (lineBoxes.length === 1) {
      for (let i = 0, len = list.length; i < len; i++) {
        const item = list[i];
        if (item.type === ContentBoxType.INLINE) {
          const result = item.node.result as Inline;
          if (result.marginLeft || result.borderLeftWidth || result.paddingLeft) {
            hasContent = true;
            break;
          }
        }
      }
      // 只要一行里有一个有mbp，整行的inline都是个0宽的
      if (hasContent) {
        for (let i = 0, len = list.length; i < len; i++) {
          const item = list[i];
          if (item.type === ContentBoxType.INLINE) {
            const result = item.node.result as Inline;
            if (!item.added) {
              item.added = true;
              result.frags.push(item.frag);
            }
          }
        }
      }
    }
    /**
     * 对齐算法，css中支柱一定存在，但这里如果root是inline则可能不存在
     * 有支柱先求出支柱的baseline
     */
    if (hasContent) {
      let maxUpper: number | undefined = undefined;
      let maxLower: number | undefined = undefined; // 均是正直相对高度
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
      // 求出基线极值和初步行高度
      for (let i = 0, len = list.length; i < len; i++) {
        const { type, node } = list[i];
        const style = node.style;
        const res = node.result!;
        if (style.verticalAlign === VerticalAlign.BASELINE && [ContentBoxType.TEXT, ContentBoxType.INLINE].includes(type)) {
          const b = calBaseline(res.fontFamily, res.fontSize, res.lineHeight);
          if (maxUpper === undefined) {
            maxUpper = b;
          }
          else {
            maxUpper = Math.max(maxUpper, b);
          }
          if (maxLower === undefined) {
            maxLower = res.lineHeight - b;
          }
          else {
            maxLower = Math.max(maxLower, res.lineHeight - b);
          }
        }
      }
      if (maxUpper !== undefined && maxLower !== undefined) {
        hBase = Math.max(hBase, maxUpper + maxLower);
      }
      // 再看top/bottom对齐的
      for (let i = 0, len = list.length; i < len; i++) {
        const { type, node } = list[i];
        const style = node.style;
        const res = node.result!;
        if (style.verticalAlign === VerticalAlign.TOP && [ContentBoxType.TEXT, ContentBoxType.INLINE].includes(type)) {
          const b = calBaseline(res.fontFamily, res.fontSize, res.lineHeight);
          // 特殊的没有支柱且没有baseline的情况，只要判断hBase就可以了，另外2个会被条件包含
          if (hBase === undefined) {
            maxUpper = b;
            maxLower = res.lineHeight - b;
            hBase = res.lineHeight;
          }
          else if (res.lineHeight > hBase) {
            maxLower = Math.max(maxLower!, res.lineHeight - b);
          }
        }
        else if (style.verticalAlign === VerticalAlign.TOP && [ContentBoxType.TEXT, ContentBoxType.INLINE].includes(type)) {
          const b = calBaseline(res.fontFamily, res.fontSize, res.lineHeight);
          if (hBase === undefined) {
            maxUpper = b;
            maxLower = res.lineHeight - b;
            hBase = res.lineHeight;
          }
          else if (res.lineHeight > hBase) {
            maxUpper = Math.max(maxUpper!, b);
          }
        }
      }
      if (maxUpper !== undefined && maxLower !== undefined) {
        hBase = Math.max(hBase, maxUpper + maxLower);
      }
      current.h = hBase;
      // 遍历所有的设置
      for (let i = 0, len = list.length; i < len; i++) {
        const { node, frag } = list[i];
        const style = node.style;
        const res = node.result!;
        if (style.verticalAlign === VerticalAlign.TOP) {
          const leading = calLeading(res.fontFamily, res.fontSize, res.lineHeight);
          frag.y += leading * 0.5;
        }
        else if (style.verticalAlign === VerticalAlign.BASELINE) {
          const b = calBaseline(res.fontFamily, res.fontSize, res.lineHeight);
          frag.y += maxUpper! - b;
        }
        else if (style.verticalAlign === VerticalAlign.BOTTOM) {
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
    return hasContent;
  }
}

/**
 * 收集block支柱、所有inline节点、叶子内容节点的fontFamily，fontSize，lineHeight，
 * 如果全相等不用对齐，因为高度完全一致，任何对齐都没有作用；
 * 不相等需要根据每个节点自身的verticalAlign处理，强制和支柱的baseline进行对齐。
 */
function getNeedVerticalAlign(list: ContentBox[], node?: ITypeNode) {
  const ff: Record<string, boolean> = {};
  const fs: Record<number, boolean> = {};
  const lh: Record<number, boolean> = {};
  let ffc = 0, fsc = 0, lhc = 0;
  if (node) {
    const res = node.result!;
    ff[res.fontFamily] = true;
    fs[res.fontSize] = true;
    lh[res.lineHeight] = true;
    ffc = fsc = lhc = 1;
  }
  for (let i = 0, len = list.length; i < len; i++) {
    const res = list[i].node.result!;
    if (!ff[res.fontFamily]) {
      ff[res.fontFamily] = true;
      ffc++;
    }
    if (!fs[res.fontSize]) {
      fs[res.fontSize] = true;
      fsc++;
    }
    if (!lh[res.lineHeight]) {
      lh[res.lineHeight] = true;
      lhc++;
    }
  }
  return ffc > 1 || fsc > 1 || lhc > 1;
}
