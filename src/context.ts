import { getMbpLeft, getMbpRight, type Inline, type LineBoxItem } from './layout';
import { VerticalAlign } from './style';
import { AbstractNode } from './node';

type ListItem = {
  node: AbstractNode;
  lbi: LineBoxItem;
};

type InlineListItem = ListItem & { max?: number };

export class LineBox {
  readonly x: number;
  readonly y: number;
  h = 0;
  readonly list: ListItem[] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

let id = 0;

export class LineBoxContext {
  readonly id = id++;
  readonly lineBoxes: LineBox[] = [];
  current: LineBox; // 当前行，即最后一行
  readonly currentInline: InlineListItem[] = [];
  hasEnd = true; // 当前行添加新的区块，需要重新对齐的标识
  readonly nodeStack: AbstractNode[] = []; // 随着inline父子嵌套递归，记录当前所有inline节点，不包含叶子text节点
  readonly node?: AbstractNode; // 所属的block节点，强制每行baseline对齐
  baseline = -1; // 上述节点的隐式支柱，用到时初始化一次

  constructor(x: number, y: number, node?: AbstractNode) {
    // block节点内部最初生成首行，是个空行，等后续子节点添加
    this.current = new LineBox(x, y);
    this.lineBoxes.push(this.current);
    this.node = node;
  }

  /**
   * inline节点begin时调用，递归嵌套的inline节点可能有多个，形成一个stack记录；
   * 同时向当前行添加一个占位，以便真实叶子结点为当前行添加内容时，扩展这些inline行的宽度；
   * 等待换行或者结束时，再进行对齐操作，产生换行时，新的行能知道当前有哪些inline节点还在。
   */
  addInline(node: AbstractNode, x: number, y: number) {
    const lineHeight = node.result!.lineHeight;
    const lbi = { x, y, w: 0, h: lineHeight };
    (node.result as Inline).frags.push(lbi);
    this.currentInline.push({ node, lbi });
    this.nodeStack.push(node);
  }

  // inline节点end时调用，后续再换行便和此节点无关了
  popInline() {
    const nodeStack = this.nodeStack;
    const o = nodeStack.pop();
    const currentInline = this.currentInline;
    // 要注意，inline结束时末尾的mbp影响父级
    if (currentInline.length) {
      for (let i = currentInline.length - 1; i > 0; i--) {
        const last = currentInline[i];
        if (last.node === o) {
          const mbp = getMbpRight(last.node.result!);
          if (!mbp) {
            return;
          }
          for (let j = 0; j < i; j++) {
            const lbi2 = currentInline[j].lbi;
            lbi2.w += mbp;
          }
          break;
        }
      }
    }
  }

  // 叶子节点调用，如text，真正添加内容
  addBox(lbi: LineBoxItem, node: AbstractNode) {
    const list = this.current!.list;
    list.push({ lbi, node });
    // 需要遍历当前inline的占位符，重设它们的宽度
    const currentInline = this.currentInline;
    for (let i = 0, len = currentInline.length; i < len; i++) {
      const lbi2 = currentInline[i].lbi;
      lbi2.w = lbi.x + lbi.w - lbi2.x;
    }
    this.hasEnd = false;
  }

  // 换行后开启新行调用，当前如果还有inline嵌套没有结束，每个inline跟随开启新行
  newLine(x: number, y: number) {
    this.current = new LineBox(x, y);
    this.lineBoxes.push(this.current);
    this.currentInline.splice(0);
    const nodeStack = this.nodeStack;
    for (let i = 0, len = nodeStack.length; i < len; i++) {
      const node = nodeStack[i];
      const lbi = { x, y, w: 0, h: node.result!.lineHeight };
      (node.result as Inline).frags.push(lbi);
      this.currentInline.push({ node, lbi });
    }
    this.hasEnd = false;
  }

  // lineBox结束时，比如遇到换行，或者block内部末尾调用，用以对齐verticalAlign
  endLine() {
    // 防止重复
    if (!this.hasEnd) {
      const current = this.current;
      const list = current.list;
      const currentInline = this.currentInline;
      const node = this.node;
      // 剪枝优化，无需对齐也就无需获取baseline等字体度量信息，注意可能block没有子inline或内容
      if (!getNeedVerticalAlign(list, currentInline, node)) {
        if (list.length) {
          current.h = list[0].lbi.h;
        }
        return true;
      }
      // TODO 处理支柱和每个inline的对齐
      return true;
    }
    this.hasEnd = true;
    return false;
  }

  // lbc结束时调用，汇总计算inline的尺寸
  computeFrags() {
    const currentInline = this.currentInline;
    for (let i = 0, len = currentInline.length; i < len; i++) {
      const item = currentInline[i];
      const result = item.node.result as Inline;
      const frags = result.frags;
      // 有子内容节点，先处理可能被子block撑开
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
          maxX = Math.max(minX, item.x + item.w);
          maxY = Math.max(maxY, item.y + item.h);
        }
        result.x = minX;
        result.y = minY;
        result.w = Math.max(result.w, maxX - minX);
        result.h = Math.max(result.h, maxY - minY);
      }
      // 处理可能被子block撑开的逻辑，block一定是新行
      if (item.max !== undefined) {
        result.w = Math.max(result.w, item.max);
      }
    }
  }

  // inline的子block可能会撑开，记录下来
  setMaxW(x: number) {
    const currentInline = this.currentInline;
    for (let i = 0, len = currentInline.length; i < len; i++) {
      const item = currentInline[i];
      if (item.max === undefined) {
        item.max = x;
      }
      else {
        item.max = Math.max(item.max, x);
      }
    }
  }
}

/**
 * 收集block支柱、所有inline节点、叶子内容节点的fontFamily，fontSize，lineHeight，
 * 如果全相等不用对齐，因为高度完全一致，任何对齐都没有作用；
 * 不相等需要根据每个节点自身的verticalAlign处理，强制和支柱的baseline进行对齐。
 */
function getNeedVerticalAlign(list: ListItem[], currentInline: ListItem[], node?: AbstractNode) {
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
  const scan = (list: ListItem[]) => {
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
  };
  scan(list);
  scan(currentInline);
  return ffc > 1 || fsc > 1 || lhc > 1;
}
