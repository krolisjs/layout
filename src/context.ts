import { getMbpBottom, getMbpRight } from './compute';
import type { Inline, Frag, TextBox } from './layout';
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
  blocks: INode[];
  added: boolean;
} | {
  type: ContentBoxType.INLINE;
  lv: number;
  frag: Frag;
  node: INode;
  blocks: INode[]; // block占位引用
  added: boolean; // 是否被添加到节点result的frags，空inline会先生成一个不添加等行结束判断
} | {
  type: ContentBoxType.INLINE_BLOCK;
  lv: number;
  frag: Frag;
  node: INode;
  blocks: INode[];
  added: boolean;
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
  inlinePlaceHolder: WeakMap<INode, ITypeNode[]> = new WeakMap(); // inline节点包含的block占位引用
  readonly nodeList: INode[] = [];
  readonly nodeStack: INode[] = []; // 随着inline父子嵌套递归，记录当前所有inline节点，不包含叶子text节点
  readonly node?: INode; // 所属的block节点，强制每行baseline对齐，根节点inline的话就没有
  baseline = -1; // 上述节点的隐式支柱，用到时初始化一次

  constructor(x: number, y: number, node?: INode) {
    // 最初生成首行，是个空行，等后续子节点添加
    this.current = new LineBox(x, y);
    this.lineBoxes.push(this.current);
    this.node = node;
  }

  /**
   * inline(Block)节点begin时调用，递归嵌套的inline节点可能有多个，形成一个stack记录；
   * 同时向当前行添加一个占位，以便真实叶子结点为当前行添加内容时，扩展这些inline行的宽度；
   * 等待换行或者结束时，看占位符情况决定是否加入节点的frags结果中，同时进行vertical对齐操作；
   * 产生换行时，新的行能知道当前有哪些父inline节点还在。
   */
  addInline(node: INode, x: number, y: number) {
    const lineHeight = node.result!.lineHeight;
    const frag = { x, y, w: 0, h: lineHeight };
    this.current.list.push({ type: ContentBoxType.INLINE, lv: this.nodeStack.length, frag, node, blocks: [], added: false });
    this.nodeStack.push(node);
    this.nodeList.push(node);
  }

  // inline节点end时调用，后续再换行便和此节点无关了，需要计算末尾mbp
  popInline() {
    const nodeStack = this.nodeStack;
    const o = nodeStack.pop();
    const list = this.current.list;
    for (let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      const { node, lv } = item;
      if (node === o) {
        const result = node.result as Inline;
        if (result.marginRight || result.borderRightWidth || result.paddingRight) {
          if (!item.added) {
            item.added = true;
            result.frags.push(item.frag);
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
        break;
      }
    }
  }

  // 叶子节点调用，如text，真正添加内容
  addText(frag: TextBox, node: ITextNode) {
    const list = this.current!.list;
    const lv = this.nodeStack.length;
    list.push({ type: ContentBoxType.TEXT, lv, frag, node, blocks: [], added: true });
    // 所属的inline都要扩展本行的宽度，用lv判断
    for (let i = list.length - 2; i >= 0; i--) {
      const item = list[i];
      if (item.type === ContentBoxType.INLINE && item.lv < lv) {
        item.frag.w = frag.x + frag.w - item.frag.x;
      }
    }
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
      const node = nodeStack[i];
      const frag = { x, y, w: 0, h: node.result!.lineHeight };
      current.list.push({ type: ContentBoxType.INLINE, lv: i, node, frag, blocks: [], added: false });
    }
  }

  // lineBox结束时，比如遇到换行，或者block内部末尾调用，用以对齐verticalAlign
  endLine() {
    const lineBoxes = this.lineBoxes;
    const current = this.current;
    const list = current.list;
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
    // 非空行垂直对齐
    if (hasContent) {
      if (getNeedVerticalAlign(list, this.node)) {
        // TODO 处理支柱和每个inline的对齐
      }
      // 全部一样取首个就行
      else {
        current.h = list[0].frag.h;
      }
    }
    return hasContent;
  }

  // lbc结束计算所有节点的尺寸
  end() {
    const nodeList = this.nodeList;
    const inlinePlaceHolder = this.inlinePlaceHolder;
    for (let i = 0, len = nodeList.length; i < len; i++) {
      const item = nodeList[i];
      const result = item.result as Inline;
      const frags = result.frags;
      // inline先获取所有行取最大值
      if (frags.length) {
        const first = frags[0];
        let minX = first.x;
        let maxX = first.x + first.w;
        let minY = first.y;
        let maxY = first.y + first.h;
        for (let i = 1, len = frags.length; i < len; i++) {
          const item = frags[i];
          minX = Math.min(minX, item.x);
          minY = Math.min(minY, item.y);
          maxX = Math.max(maxX, item.x + item.w);
          maxY = Math.max(maxY, item.y + item.h);
        }
        result.x = minX;
        result.y = minY;
        result.w = Math.max(result.w, maxX - minX);
        result.h = Math.max(result.h, maxY - minY);
      }
      // 被block隔断的inline，取block的外包围盒和原本比较最大值
      if (inlinePlaceHolder.has(item)) {
        const list = inlinePlaceHolder.get(item)!;
        for (let i = 0, len = list.length; i < len; i++) {
          const r = list[i].result!;
          result.x = Math.min(result.x, r.x);
          result.y = Math.min(result.y, r.y);
          result.w = Math.max(result.w, r.x + r.w + getMbpRight(result) - result.x);
          result.h = Math.max(result.h, r.y + r.h + getMbpBottom(result) - result.y);
        }
      }
    }
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
