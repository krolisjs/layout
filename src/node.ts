import { BoxSizing, calLength, Display, getDefaultStyle, isFixed, JStyle, Position, Style, Unit } from './style';
import type { Box, Constraints, Inline, InputConstraints, Result, Root, Text } from './layout';
import { block, ComputedStyle, inline, LayoutMode, normalizeConstraints, oofText, preset, text } from './layout';

export enum NodeType {
  Node = 0,
  Text = 1,
}

export interface ITypeNode {
  readonly nodeType: NodeType;
}

export interface INode extends ITypeNode {
  readonly nodeType: NodeType.Node;
}

export interface ITextNode extends ITypeNode {
  readonly nodeType: NodeType.Text;
  content: string;
}

export type IAllNode = INode | ITextNode;

type Oof = {
  node: AbstractNode;
  cx: number;
  cy: number;
};

let id = 0;

export abstract class AbstractNode implements ITypeNode {
  readonly id = id++;
  readonly nodeType: NodeType;
  style: Style;
  readonly children: AbstractNode[] = [];
  parent: Node | null = null;
  prev: AbstractNode | null = null;
  next: AbstractNode | null = null;
  inputConstraints: InputConstraints | null = null;
  constraints: Constraints | null = null; // 本身产生的约束，传给children
  result: Result | null = null;

  protected constructor(nodeType: NodeType, style?: Partial<JStyle | Style>) {
    this.nodeType = nodeType;
    this.style = getDefaultStyle(style);
  }

  insertBefore(node: AbstractNode) {
    const parent = this.parent;
    if (parent) {
      const i = parent.children.indexOf(this);
      if (i > -1) {
        node.parent = parent;
        node.prev = this.prev;
        if (this.prev) {
          this.prev.next = node;
        }
        node.next = this;
        this.prev = node;
        parent.children.splice(i, 0, node);
      }
    }
  }

  insertAfter(node: AbstractNode) {
    const parent = this.parent;
    if (parent) {
      const i = parent.children.indexOf(this);
      if (i > -1) {
        node.parent = parent;
        node.prev = this;
        if (this.next) {
          this.next.prev = node;
        }
        node.next = this.next;
        this.next = node;
        parent.children.splice(i + 1, 0, node);
      }
    }
  }

  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  lay(inputConstraints: InputConstraints) {
    this.inputConstraints = inputConstraints;
    const root = getRoot(this);
    const rem = calLength(root.style.fontSize, 1600, 16, 16) || 16;
    const r: Root = {
      rem,
      w: inputConstraints.aw,
      h: inputConstraints.ah,
    };
    // 遇到absolute进入测量模式，等其包含块节点end时机开始测量
    const oofMap: WeakMap<AbstractNode, Oof[]> = new WeakMap();
    // 入口普通模式
    this.layMode(normalizeConstraints(inputConstraints), LayoutMode.NORMAL, oofMap, r);
  }

  layMode(constraints: Constraints, layoutMode: LayoutMode, oofMap: WeakMap<AbstractNode, Oof[]>, root: Root, pr?: Result, ps?: Style) {
    const b = this.begin(constraints, layoutMode, root, pr, ps);
    // 可能进入absolute预测量阶段，在包含块节点end时进行预测量，没有包含块则相对于root的约束
    if (b.layoutMode & LayoutMode.OOF_MEASURE) {
      const n = this.getContainingBlockNode() || getRoot(this);
      if (n) {
        let list: Oof[];
        if (oofMap.has(n)) {
          list = oofMap.get(n)!;
        }
        else {
          list = [];
          oofMap.set(n, list);
        }
        list.push({
          node: this,
          cx: constraints.cx,
          cy: constraints.cy,
        });
      }
      return;
    }
    this.constraints = b.c;
    // 先序遍历递归
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      children[i].layMode(b.c, b.layoutMode, oofMap, root, this.result!, this.style);
    }
    this.end(oofMap, root);
  }

  private begin(constraints: Constraints, layoutMode: LayoutMode, root: Root, pc?: ComputedStyle, ps?: Style) {
    const style = this.style;
    const rem = root.rem;
    let c: Constraints;
    if (style.position === Position.ABSOLUTE) {
      // 如果绝对值定宽，且没有最小限制，直接处理即可；位置可以等最后处理偏移
      const { width, minWidth, maxWidth } = style;
      let isFixedWidth = false;
      if (isFixed(width)) {
        isFixedWidth = true;
      }
      // 定宽不用测量，inline强制为对应block
      if (isFixedWidth) {
        const res = preset(style, constraints, 'box', root, pc, ps) as Box;
        if (minWidth.u !== Unit.AUTO) {
          const m = calLength(minWidth, constraints.pbw, rem, res.fontSize);
          res.w = Math.max(res.w, m);
        }
        if (maxWidth.u !== Unit.AUTO) {
          const m = calLength(maxWidth, constraints.pbw, rem, res.fontSize);
          res.w = Math.min(res.w, m);
        }
        const o = block(style, constraints, root, pc, ps, res);
        this.result = o.res;
        c = o.c;
      }
      // 进入测量模式，等包含块节点end时开始测量
      else {
        layoutMode |= LayoutMode.OOF_MEASURE;
        c = constraints;
      }
    }
    else if (this.nodeType === NodeType.Text) {
      const t = this as unknown as TextNode;
      const o = text(style, constraints, t.content, root, pc, ps);
      this.result = o.res;
      c = o.c;
    }
    else if (style.display === Display.INLINE) {
      const o = inline(style, constraints, root, pc, ps);
      this.result = o.res;
      c = o.c;
    }
    else {
      const o = block(style, constraints, root, pc, ps);
      this.result = o.res;
      c = o.c;
    }
    return { layoutMode, c };
  }

  private end(oofMap: WeakMap<AbstractNode, Oof[]>, root: Root) {
    const style = this.style;
    const result = this.result!;
    // 递归结束后处理
    if (this.nodeType === NodeType.Text) {
      let parent = this.parent;
      let current = this.result as Inline;
      while (parent) {
        const parentStyle = parent.style;
        if (parentStyle.display === Display.INLINE) {
          const parentResult = parent.result as Inline;
          let mbp = 0;
          (result as Text).rects.forEach(lineBox => {
            // inline的开头要考虑mpb
            if (!parentResult.rects.length) {
              mbp = current.marginLeft + current.borderLeftWidth + current.paddingLeft;
              parentResult.rects.push({
                x: lineBox.x - mbp,
                y: lineBox.y,
                w: lineBox.w + mbp,
                h: lineBox.h,
              });
            }
            else {
              parentResult.rects.push({
                x: lineBox.x,
                y: lineBox.y,
                w: lineBox.w,
                h: lineBox.h,
              });
            }
          });
          parentResult.w = Math.max(parentResult.w, current.x + current.w - parentResult.x);
          parentResult.h = Math.max(parentResult.h, current.y + current.h - parentResult.y);
          current = parentResult;
          parent = parent.parent;
        }
        // inline可能包含block，中断，在block中还会继续向上递归，因为流顺序最后处理的叶子节点一定是正确的
        else {
          break;
        }
      }
    }
    else {
      // 定宽且无最小限制的，无向上处理被inline包含逻辑；trbl偏移等到最后处理
      if (style.position === Position.ABSOLUTE) {
        // 不用做任何事情
      }
      // inline结束时，检查最后一个子节点的mpb，看是否影响宽度
      else if (style.display === Display.INLINE) {
        const r = (result as Inline);
        const lc = this.children[this.children.length - 1];
        // 有可能没有，比如inline没有子节点
        if (r.rects.length && lc && lc.result?.rects?.length) {
          const mbp = lc.result.marginRight + lc.result.borderRightWidth + lc.result.paddingRight;
          if (mbp) {
            const last = r.rects[r.rects.length - 1];
            last.w += mbp;
            r.w = Math.max(r.w, last.x + last.w - r.x);
          }
        }
      }
      // 默认block
      else {
        const constraints = this.constraints!;
        // 自动高度，以及%高度但父级是auto
        if (style.height.u === Unit.AUTO || style.height.u === Unit.PERCENT && constraints.pbh === undefined) {
          result.h = constraints.cy - constraints.oy;
        }
        const parent = this.parent;
        const cp = parent?.constraints;
        if (cp) {
          const mbp = result.marginBottom + result.paddingBottom + result.borderBottomWidth;
          cp.cy = result.y + result.h + mbp;
        }
        // inline可能包含block，兼容也需要向上处理，类似子inline一样的逻辑
        if (parent) {
          let parent = this.parent as Node | null;
          let current = this.result!;
          while (parent) {
            const parentStyle = parent.style;
            if (parentStyle.display === Display.INLINE) {
              const parentResult = parent.result as Inline;
              parentResult.w = Math.max(parentResult.w, current.x + current.w - parentResult.x);
              parentResult.h = Math.max(parentResult.h, current.y + current.h - parentResult.y);
              current = parentResult;
              parent = parent.parent;
            }
            // 依旧中断，逻辑也一样，上层block/flex会继续处理
            else {
              break;
            }
          }
        }
        // margin:auto水平居中
        const { boxSizing, marginLeft, marginRight } = style;
        const pr = parent?.result;
        const w = pr ? pr.w : root.w;
        let w2 = result.w;
        if (boxSizing === BoxSizing.CONTENT_BOX) {
          w2 += result.borderLeftWidth + result.borderRightWidth + result.paddingLeft + result.paddingRight;
        }
        if (marginLeft.u === Unit.AUTO && marginRight.u === Unit.AUTO) {
          if (w2 < w) {
            const half = (w - w2) * 0.5;
            result.x += half;
          }
        }
        else if (marginLeft.u === Unit.AUTO && marginRight.u !== Unit.AUTO && marginRight.v) {
          result.x -= result.marginRight;
        }
      }
      // 包含块节点end时检查是否有absolute节点，每个absolute继续递归普通模式布局
      if ([Position.RELATIVE, Position.ABSOLUTE].includes(style.position) && oofMap.has(this)) {
        const list = oofMap.get(this)!;
        list.forEach(item => {
          const pbw = result.w + result.paddingLeft + result.paddingRight;
          const pbh = result.h + result.paddingTop + result.paddingBottom;
          const c: Constraints = {
            ox: result.x - result.paddingLeft,
            oy: result.y - result.paddingTop,
            aw: pbw - item.cx, // 默认trbl都是auto时就是文档流当前位置
            ah: pbh - item.cy,
            pbw,
            pbh,
            cx: item.cx,
            cy: item.cy,
          };
          // 预测量的约束尺寸也受trbl影响
          const { left, right, top, bottom } = item.node.style;
          const pr = item.node.parent!.result!;
          if (left.u !== Unit.AUTO && right.u !== Unit.AUTO) {
            const lt = calLength(left, pbw, root.rem, pr.fontSize);
            const rt = calLength(right, pbw, root.rem, pr.fontSize);
            c.aw = pbw - lt - rt;
          }
          else if (left.u !== Unit.AUTO) {
            const lt = calLength(left, pbw, root.rem, pr.fontSize);
            c.aw = pbw - lt;
          }
          else if (right.u !== Unit.AUTO) {
            const rt = calLength(right, pbw, root.rem, pr.fontSize);
            c.aw = pbw - rt;
          }
          if (top.u !== Unit.AUTO && bottom.u !== Unit.AUTO) {
            const tt = calLength(top, pbh, root.rem, pr.fontSize);
            const bt = calLength(bottom, pbh, root.rem, pr.fontSize);
            c.ah = pbh - tt - bt;
          }
          else if (top.u !== Unit.AUTO) {
            const tt = calLength(top, pbh, root.rem, pr.fontSize);
            c.ah = pbh - tt;
          }
          else if (bottom.u !== Unit.AUTO) {
            const bt = calLength(bottom, pbh, root.rem, pr.fontSize);
            c.ah = pbh - bt;
          }
          // 获取到测量宽后，走一遍普通布局，inline要视作block
          item.node.layOof(c, oofMap, root);
        });
      }
    }
    // root节点开始处理relative的偏移
    if (!this.parent) {
      this.finish(0, 0, result.fontSize, root);
    }
  }

  finish(x: number, y: number, rem: number, root: Root) {
    const style = this.style;
    const res = this.result!;
    if (style.position === Position.RELATIVE) {
      const { left, top, right, bottom } = style;
      if (left.u !== Unit.AUTO) {
        x += calLength(left, res.w, rem, res.fontSize);
      }
      else if (right.u !== Unit.AUTO) {
        x -= calLength(right, res.w, rem, res.fontSize);
      }
      if (top.u !== Unit.AUTO) {
        // 注意%单位时如果约束尺寸为auto（父节点height为auto）视为0
        if (top.u !== Unit.PERCENT || this.parent?.constraints!.pbh !== undefined) {
          y += calLength(top, res.h, rem, res.fontSize);
        }
      }
      else if (bottom.u !== Unit.AUTO) {
        if (bottom.u !== Unit.PERCENT || this.parent?.constraints!.pbh !== undefined) {
          y -= calLength(bottom, res.h, rem, res.fontSize);
        }
      }
    }
    // absolute要考虑trbl的偏移
    else if (style.position === Position.ABSOLUTE) {
      let w = 0, h = 0;
      const parent = this.getContainingBlockNode();
      if (parent) {
        const pr = parent.result!;
        w = pr.w + pr.paddingLeft + pr.paddingRight;
        h = pr.h + pr.paddingTop + pr.paddingBottom;
      }
      // 根节点特殊处理
      else {
        w = root.w;
        h = root.h;
      }
      const { left, top, right, bottom } = style;
      if (left.u !== Unit.AUTO) {
        x += calLength(left, w, rem, res.fontWeight);
      }
      if (top.u !== Unit.AUTO) {
        y += calLength(top, h, rem, res.fontSize);
      }
    }
    if (x || y) {
      res.x += x;
      res.y += y;
      if (res.rects) {
        res.rects.forEach(item => {
          item.x += x;
          item.y += y;
        });
        if (res.type === 'text') {
          res.rects.forEach(item => {
            item.list.forEach(v => {
              v.x += x;
              v.y += y;
            });
          });
        }
      }
    }
    const children = this.children;
    for (let i = 0; i < children.length; i++) {
      children[i].finish(x, y, rem, root);
    }
  }

  layOof(constraints: Constraints, oofMap: WeakMap<AbstractNode, Oof[]>, root: Root) {
    const { cx, cy } = constraints;
    const style = this.style;
    const parent = this.parent!;
    const pr = parent.result!;
    const ps = parent.style;
    const pc = preset(style, constraints, 'box', root, pr, ps);
    const { min, max } = this.beginOof(constraints, root, pc, style);
    // 怕beginOof影响cx/cy
    constraints.cx = cx;
    constraints.cy = cy;
    // 根据trbl确定最终尺寸
    const { boxSizing, left, right, top, bottom, marginLeft, marginRight, marginTop, marginBottom, width, height } = style;
    const res = preset(style, constraints, 'box', root, pr, ps) as Box;
    const mbpW = res.marginLeft + res.marginRight
      + res.borderLeftWidth + res.borderRightWidth
      + res.paddingLeft + res.paddingRight;
    constraints.pbw = constraints.aw;
    const mbpH = res.marginTop + res.marginBottom
      + res.borderTopWidth + res.borderBottomWidth
      + res.paddingTop + res.paddingBottom;
    constraints.pbh = constraints.ah;
    // 尺寸优先级，显式width不走这里
    if (left.u !== Unit.AUTO && right.u !== Unit.AUTO) {
      res.w = constraints.aw - res.left - res.right;
      if (boxSizing === BoxSizing.CONTENT_BOX) {
        res.w += mbpW;
      }
      constraints.aw = res.w;
    }
    else if (left.u === Unit.AUTO || right.u === Unit.AUTO) {
      res.w = Math.max(min, Math.min(max, constraints.aw));
      if (boxSizing === BoxSizing.CONTENT_BOX) {
        res.w += mbpW;
      }
      constraints.aw = res.w;
    }
    if (top.u !== Unit.AUTO && bottom.u !== Unit.AUTO) {
      res.h = constraints.ah - res.top - res.bottom;
      if (boxSizing === BoxSizing.CONTENT_BOX) {
        res.h += mbpH;
      }
      constraints.ah = res.h;
    }
    else if (boxSizing === BoxSizing.CONTENT_BOX) {
      res.h += mbpH;
      constraints.ah = res.h;
    }
    // 边距平分
    if (left.u !== Unit.AUTO && right.u !== Unit.AUTO && width.u !== Unit.AUTO) {
      if (marginLeft.u === Unit.AUTO && marginRight.u === Unit.AUTO) {}
      else if (marginLeft.u === Unit.AUTO) {}
      else if (marginRight.u === Unit.AUTO) {}
    }
    else {
      if (marginLeft.u === Unit.AUTO) {
        const d = res.marginLeft;
        res.marginLeft = 0;
        if (d) {
          res.x -= d;
          res.w += d;
        }
      }
      if (marginRight.u === Unit.AUTO) {
        const d = res.marginRight;
        res.marginRight = 0;
        if (d) {
          res.w += d;
        }
      }
    }
    // 定位填充
    if (left.u !== Unit.AUTO) {
      res.x = constraints.ox + res.left + res.marginLeft + res.borderLeftWidth + res.paddingLeft;
      constraints.cx = res.left;
    }
    if (top.u !== Unit.AUTO) {
      res.y = constraints.oy + res.top + res.marginTop + res.borderTopWidth + res.paddingTop;
      constraints.cy = res.top;
    }
    // 特殊处理自己，不能复用begin，因为自己是absolute，会死循环进入预测量
    const o = block(style, constraints, root, pr, ps, res);
    this.result = o.res;
    this.constraints = o.c;
    // 继续普通递归
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      children[i].layMode(o.c, LayoutMode.NORMAL, oofMap, root, this.result, style);
    }
    // 模拟end
    if (style.height.u === Unit.AUTO || style.height.u === Unit.PERCENT && constraints.pbh === undefined) {
      this.result!.h = this.constraints.cy - this.constraints.oy;
    }
  }

  private beginOof(constraints: Constraints, root: Root, pc: ComputedStyle, ps: Style) {
    let min = 0, max = 0;
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      const style = child.style;
      // 测量阶段递归的子节点absolute忽略
      if (style.position !== Position.ABSOLUTE) {
        if (child.nodeType === NodeType.Text) {
          const o = child.beginOofText(constraints, root, pc, ps);
          min = Math.max(min, o.min);
          max = Math.max(max, o.max);
        }
        else if (style.display === Display.INLINE) {
          const o = child.beginOofInline(constraints, root, pc, ps);
          min = Math.max(min, o.min);
          max = Math.max(max, o.max);
        }
        else {
          const o = child.beginOofBlock(constraints, root, pc, ps);
          min = Math.max(min, o.min);
          max = Math.max(max, o.max);
        }
      }
    }
    return { min, max };
  }

  private beginOofBlock(constraints: Constraints, root: Root, pc: ComputedStyle, ps: Style) {
    let min = 0, max = 0;
    const style = this.style;
    // block如果定宽则直接返回，否则递归
    if (isFixed(style.width)) {
      let w = calLength(style.width, constraints.pbw, root.rem, pc.fontSize);
      if (style.boxSizing === BoxSizing.CONTENT_BOX) {
        const r = preset(style, constraints, 'box', root, pc, ps) as Box;
        w += r.marginLeft + r.marginRight
          + r.borderLeftWidth + r.borderRightWidth
          + r.paddingLeft + r.paddingRight;
      }
      min = w;
      max = w;
    }
    else {
      const r = preset(style, constraints, 'box', root, pc, ps) as Box;
      const children = this.children;
      for (let i = 0, len = children.length; i < len; i++) {
        const o = children[i].beginOof(constraints, root, r, style);
        min = Math.max(min, o.min);
        max = Math.max(max, o.max);
      }
      const mbp = r.marginLeft + r.marginRight
        + r.borderLeftWidth + r.borderRightWidth
        + r.paddingLeft + r.paddingRight;
      min += mbp;
      max += mbp;
    }
    return { min, max };
  }

  private beginOofInline(constraints: Constraints, root: Root, pc: ComputedStyle, ps: Style) {
    let min = 0, max = 0;
    const style = this.style;
    const r = preset(style, constraints, 'inline', root, pc, ps) as Inline;
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const o = children[i].beginOof(constraints, root, r, this.style);
      min = Math.max(min, o.min);
      max += o.max;
    }
    return { min, max };
  }

  private beginOofText(constraints: Constraints, root: Root, pc: ComputedStyle, ps: Style) {
    const t = this as unknown as TextNode;
    return oofText(this.style, constraints, t.content, root, pc, ps);
  }

  // 获取absolute的包围块节点
  getContainingBlockNode() {
    let parent = this.parent;
    while (parent) {
      const style = parent.style;
      if ([Position.RELATIVE, Position.ABSOLUTE].includes(style.position)) {
        return parent;
      }
      if (parent.parent) {
        parent = parent.parent;
      }
      else {
        return parent;
      }
    }
  }
}

export class Node extends AbstractNode {
  declare nodeType: NodeType.Node;
  children: AbstractNode[];

  constructor(style?: Partial<JStyle | Style>, children: AbstractNode[] = []) {
    super(NodeType.Node, style);
    this.children = children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.parent = this;
      if (i) {
        child.prev = children[i - 1];
      }
      if (i < len - 1) {
        child.next = children[i + 1];
      }
    }
  }

  appendChild(item: AbstractNode) {
    const children = this.children;
    const last = children[children.length - 1];
    children.push(item);
    item.parent = this;
    if (last) {
      last.next = item;
      item.prev = last;
    }
  }

  prependChild(item: AbstractNode) {
    const children = this.children;
    const first = children[0];
    children.unshift(item);
    item.parent = this;
    if (first) {
      first.prev = item;
      item.next = first;
    }
  }

  removeChild(item: AbstractNode) {
    const children = this.children;
    const i = children.indexOf(item);
    if (i > -1) {
      const prev = children[i - 1];
      const next = children[i];
      if (prev) {
        prev.next = next || null;
      }
      if (next) {
        next.prev = prev || null;
      }
      children.splice(i, 1);
      item.parent = item.prev = item.next = null;
    }
  }
}

export class TextNode extends AbstractNode implements ITextNode {
  declare nodeType: NodeType.Text;
  content = '';

  constructor(content: string, style?: Partial<JStyle | Style>) {
    super(NodeType.Text, style);
    this.content = content;
  }
}

export function genNode(node: IAllNode, style?: Partial<JStyle | Style>) {
  if (node.nodeType === NodeType.Text) {
    return new TextNode(node.content, style);
  }
  return new Node(style);
}

function getRoot(item: AbstractNode) {
  let parent: AbstractNode | null = item;
  let temp = item;
  while (parent) {
    temp = parent;
    parent = parent.parent;
  }
  return temp;
}
