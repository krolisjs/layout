import { Display, getDefaultStyle, Position, Unit } from './style';
import type { JStyle, Style } from './style';
import {
  block,
  calLength,
  Constraints,
  Inline,
  inline,
  LayoutMode,
  oofBlock,
  oofInline,
  oofText,
  Result,
  text,
  Text
} from './layout';
import { MeasureText } from './text.js';

type Options = {
  label?: string;
};

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

  protected constructor(nodeType: NodeType, style?: Partial<JStyle | Style>, options?: Options) {
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

  lay(constraints: Constraints, layoutMode = LayoutMode.NORMAL) {
    // 非正常中断，如absolute预测量阶段递归到子absolute无返回
    const b = this.begin(constraints, layoutMode);
    if (!b) {
      return;
    }
    this.constraints = b.c;
    // 先序遍历递归
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      children[i].lay(b.c, b.layoutMode);
    }
    this.end(layoutMode);
  }

  private begin(constraints: Constraints, layoutMode: LayoutMode) {
    const style = this.style;
    const pr = this.parent ? this.parent.result! : undefined;
    const rem = this.root ? this.root.result!.fontSize : 16;
    if (layoutMode & LayoutMode.OOF_MEASURE) {
      this.beginOof(constraints);
      return;
    }
    let c: Constraints;
    if (style.position === Position.ABSOLUTE) {
      // 如果绝对值定宽，且没有最小限制，直接处理即可；位置可以等最后处理偏移
      const { width, minWidth } = style;
      let isFixedWidth = false;
      if ([Unit.PX, Unit.IN, Unit.EM, Unit.REM, Unit.NUMBER].includes(width.u)
        && minWidth.u === Unit.AUTO) {
        isFixedWidth = true;
      }
      // 定宽不用测量，inline强制为对应block
      if (isFixedWidth) {
        const o = block(style, constraints, rem, pr);
        this.result = o.res;
        c = o.c;
      }
      // 进入测量模式
      else {
        layoutMode |= LayoutMode.OOF_MEASURE;
        c = constraints;
      }
    }
    else if (this.nodeType === NodeType.Text) {
      const t = this as unknown as TextNode;
      const o = text(style, constraints, t.content, t.measureText, rem, pr);
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

  private end(layoutMode: LayoutMode) {
    // 预测量阶段不需要任何处理
    if (layoutMode & LayoutMode.OOF_MEASURE) {
      return;
    }
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
      // 定宽且无最小限制的，无向上处理被inline包含逻辑；偏移等到包含块end时处理
      if (style.position === Position.ABSOLUTE) {}
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
        x += calLength(left, res.w, res.fontSize, rem);
      }
      else if (right.u !== Unit.AUTO) {
        x -= calLength(right, res.w, res.fontSize, rem);
      }
      if (top.u !== Unit.AUTO) {
        // 注意%单位时如果约束尺寸为auto（父节点height为auto）视为0
        if (top.u !== Unit.PERCENT || this.parent?.constraints!.pbh !== undefined) {
          y += calLength(top, res.h, res.fontSize, rem);
        }
      }
      else if (bottom.u !== Unit.AUTO) {
        if (bottom.u !== Unit.PERCENT || this.parent?.constraints!.pbh !== undefined) {
          y -= calLength(bottom, res.h, res.fontSize, rem);
        }
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

  private beginOof(constraints: Constraints) {
    const style = this.style;
    const pr = this.parent ? this.parent.result! : undefined;
    const rem = this.root ? this.root.result!.fontSize : 16;
    // absolute预测量阶段忽略递归的absolute
    if (style.position === Position.ABSOLUTE) {
      return;
    }
    if (this.nodeType === NodeType.Text) {
      const t = this as unknown as TextNode;
      return oofText(style, constraints, t.content, t.measureText, rem, pr);
    }
    else if (style.display === Display.INLINE) {
      return oofInline(style, constraints, rem, pr);
    }
    else {
      return oofBlock(style, constraints, rem, pr);
    }
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
  children: AbstractNode[];

  constructor(style?: Partial<JStyle | Style>, children: AbstractNode[] = [], options?: Options) {
    super(NodeType.Node, style, options);
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
  measureText: MeasureText;

  constructor(content: string, measureText: MeasureText, style?: Partial<JStyle | Style>, options?: Options) {
    super(NodeType.Text, style, options);
    this.content = content;
    this.measureText = measureText;
  }
}

export function genNode(node: IAllNode, style?: Partial<JStyle | Style>, measureText?: MeasureText) {
  if (node.nodeType === NodeType.Text) {
    if (!measureText) {
      throw new Error('Text must be passed to the measureText method.');
    }
    return new TextNode(node.content, measureText, style);
  }
  return new Node(style);
}
