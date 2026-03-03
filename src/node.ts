import type { JStyle, Style } from './style';
import { calLength, Display, getDefaultStyle, isFixed, Position, Unit, } from './style';
import type { Box, Constraints, Inline, InputConstraints, Result, Text, } from './layout';
import { block, ComputedStyle, inline, LayoutMode, normalizeConstraints, oofText, preset, text, } from './layout';

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
  root: AbstractNode | null = null;
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
        node.root = this.root;
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
        node.root = this.root;
        parent.children.splice(i + 1, 0, node);
      }
    }
  }

  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  lay(constraints: InputConstraints) {
    // 遇到absolute进入测量模式，等其包含块节点end时机开始测量
    const oofMap: WeakMap<AbstractNode, Oof[]> = new WeakMap();
    // 入口普通模式
    this.layMode(normalizeConstraints(constraints), LayoutMode.NORMAL, oofMap);
  }

  layMode(constraints: Constraints, layoutMode: LayoutMode, oofMap: WeakMap<AbstractNode, Oof[]>) {
    const b = this.begin(constraints, layoutMode);
    // 可能进入absolute预测量阶段，在包含块节点end时进行预测量，没有包含块则相对于root的约束
    if (b.layoutMode & LayoutMode.OOF_MEASURE) {
      const n = this.getContainingBlockNode() || this.root;
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
      children[i].layMode(b.c, b.layoutMode, oofMap);
    }
    this.end(oofMap);
  }

  private begin(constraints: Constraints, layoutMode: LayoutMode) {
    const style = this.style;
    const pr = this.parent ? this.parent.result! : undefined;
    const rem = this.root ? this.root.result!.fontSize : 16;
    let c: Constraints;
    if (style.position === Position.ABSOLUTE) {
      // 如果绝对值定宽，且没有最小限制，直接处理即可；位置可以等最后处理偏移
      const { width, minWidth } = style;
      let isFixedWidth = false;
      if (isFixed(width) && minWidth.u === Unit.AUTO) {
        isFixedWidth = true;
      }
      // 定宽不用测量，inline强制为对应block
      if (isFixedWidth) {
        const o = block(style, constraints, rem, pr);
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
      const o = text(style, constraints, t.content, rem, pr);
      this.result = o.res;
      c = o.c;
    }
    else if (style.display === Display.INLINE) {
      const o = inline(style, constraints, rem, pr);
      this.result = o.res;
      c = o.c;
    }
    else {
      const o = block(style, constraints, rem, pr);
      this.result = o.res;
      c = o.c;
    }
    return { layoutMode, c };
  }

  private end(oofMap: WeakMap<AbstractNode, Oof[]>) {
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
        const cp = this.parent?.constraints;
        if (cp) {
          const mbp = result.marginBottom + result.paddingBottom + result.borderBottomWidth;
          cp.cy = result.y + result.h + mbp;
        }
        // inline可能包含block，兼容也需要向上处理，类似子inline一样的逻辑
        if (this.parent) {
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
      }
      // 包含块节点end时检查是否有absolute节点，每个absolute继续递归普通模式布局
      if ([Position.RELATIVE, Position.ABSOLUTE].includes(style.position) && oofMap.has(this)) {
        const list = oofMap.get(this)!;
        list.forEach(item => {
          const aw = result.w + result.paddingLeft + result.paddingRight;
          const ah = result.h + result.paddingTop + result.paddingBottom;
          const c: Constraints = {
            ox: result.x - result.paddingLeft,
            oy: result.y - result.paddingTop,
            aw,
            ah,
            pbw: aw,
            pbh: ah,
            cx: item.cx,
            cy: item.cy,
          };
          // 获取到测量宽后用作aw，然后走一遍普通布局，inline要视作block
          item.node.layOof(c, oofMap);
        });
      }
    }
    // root节点开始处理relative的偏移
    if (!this.parent) {
      this.finish(0, 0, result.fontSize);
    }
  }

  finish(x: number, y: number, rem: number) {
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
        const root = this.root!;
        w = root.constraints!.aw;
        h = root.constraints!.ah;
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
      children[i].finish(x, y, rem);
    }
  }

  layOof(constraints: Constraints, oofMap: WeakMap<AbstractNode, Oof[]>) {
    const { cx, cy } = constraints;
    const pr = this.parent ? this.parent.result! : undefined;
    const rem = this.root ? this.root.result!.fontSize : 16;
    const inherit = preset(this.style, constraints, 'box', rem, pr) as Box;
    const { min, max } = this.beginOof(constraints, rem, inherit);
    const w = Math.max(min, Math.min(max, constraints.aw));
    constraints.aw = constraints.pbw = w;
    constraints.cx = cx;
    constraints.cy = cy;
    // 特殊之处，约束要包含border/padding
    const style = this.style;
    const r = preset(style, constraints, 'box', rem, pr) as Box;
    constraints.aw += r.marginLeft + r.marginRight
      + r.borderLeftWidth + r.borderRightWidth
      + r.paddingLeft + r.paddingRight;
    constraints.pbw = constraints.aw;
    // 特殊处理自己，不能复用begin，因为自己是absolute，会死循环进入预测量
    const o = block(style, constraints, rem, pr);
    this.result = o.res;
    this.constraints = o.c;
    // 继续普通递归
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      children[i].layMode(o.c, LayoutMode.NORMAL, oofMap);
    }
    // 模拟end
    if (style.height.u === Unit.AUTO || style.height.u === Unit.PERCENT && constraints.pbh === undefined) {
      this.result!.h = this.constraints.cy - this.constraints.oy;
    }
  }

  private beginOof(constraints: Constraints, rem?: number, inherit?: ComputedStyle) {
    let min = 0, max = 0;
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      const style = child.style;
      // 测量阶段递归的子节点absolute忽略
      if (style.position !== Position.ABSOLUTE) {
        if (child.nodeType === NodeType.Text) {
          const t = child as unknown as TextNode;
          const o = oofText(style, constraints, t.content, rem, inherit);
          min = min ? Math.min(min, o.min) : o.min;
          max = Math.max(max, o.max);
        }
        else if (style.display === Display.INLINE) {}
        else {
          // block如果定宽则直接返回，否则递归
          if (isFixed(style.width)) {
            const r = preset(style, constraints, 'box', rem, inherit);
            const w = calLength(style.width, constraints.pbw, rem, inherit?.fontSize)
              + r.marginLeft + r.marginRight
              + r.borderLeftWidth + r.borderRightWidth
              + r.paddingLeft + r.paddingRight;
            min = min ? Math.min(min, w) : w;
            max = Math.max(max, w);
          }
          else {
            const o = child.beginOof(constraints, rem, inherit);
            min = min ? Math.min(min, o.min) : o.min;
            max = Math.max(max, o.max);
          }
        }
      }
    }
    return { min, max };
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
    item.root = this.root;
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
    item.root = this.root;
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
      item.parent = item.prev = item.next = item.root = null;
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
