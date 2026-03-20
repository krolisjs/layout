import type { ComputedStyle, JStyle, Style } from './style';
import {
  BoxSizing,
  calLength,
  Display,
  getDefaultStyle,
  isFixed,
  Position,
  Unit,
} from './style';
import type {
  Box,
  Constraints,
  Global,
  Inline,
  InputConstraints,
  Result,
  Text,
} from './layout';
import {
  block,
  inline,
  LayoutMode,
  MarginStruct,
  normalizeConstraints,
  oofText,
  preset,
  text,
} from './layout';
import { LineBoxContext } from './context';
import {
  getMbpH,
  canCollapseBottom,
  canCollapseSelf,
  canCollapseSibling,
  canCollapseTop,
  calMarginCollapse,
} from './compute';

export enum NodeType {
  Node = 0,
  Text = 1,
  IMG = 2,
}

export interface ITypeNode {
  readonly id: number;
  readonly nodeType: NodeType;
  readonly style: Style;
  readonly children: ITypeNode[];
  parent: INode | null;
  prev: ITypeNode | null;
  next: ITypeNode | null;
  result: Result | null;
  layAbs(constraints: Constraints, oofMap: WeakMap<ITypeNode, Oof[]>, global: Global): void;
}

export interface INode extends ITypeNode {
  readonly nodeType: NodeType.Node;
  constraints: Constraints | null;
}

export interface ITextNode extends ITypeNode {
  readonly nodeType: NodeType.Text;
  content: string;
  result: Text | null;
}

export interface IImgNode extends ITypeNode {
  readonly nodeType: NodeType.IMG;
  src: string;

}
export type IAllNode = INode | ITextNode | IImgNode;

type Oof = {
  node: ITypeNode;
  parent?: INode;
  cx: number;
  cy: number;
};

let id = 0;

export abstract class AbstractNode implements ITypeNode {
  readonly id = id++;
  readonly nodeType: NodeType;
  readonly style: Style;
  readonly children: AbstractNode[] = [];
  parent: Node | null = null;
  prev: AbstractNode | null = null;
  next: AbstractNode | null = null;
  constraints: Constraints | null = null; // block本身产生的约束，传给children
  result: Result | null = null; // 布局结果
  lbc: LineBoxContext | null = null; // block本身产生的行级上下文管理，传给children

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
    const root = getRoot(this);
    if (root !== this) {
      throw new Error('Cannot call lay() on a non-root node.');
    }
    let rem = calLength(root.style.fontSize, 1600, 16, 16);
    if (!rem || rem < 0) {
      rem = 16;
    }
    const global: Global = {
      root,
      rem,
      w: inputConstraints.aw,
      h: inputConstraints.ah,
    };
    const ms = new MarginStruct();
    // 遇到absolute进入测量模式，等其包含块节点end时机开始测量
    const oofMap: WeakMap<AbstractNode, Oof[]> = new WeakMap();
    const constraints = normalizeConstraints(inputConstraints);
    // 虚拟支柱，如果root是个inline的话也能运行
    const lbc = new LineBoxContext(constraints.ox, constraints.oy);
    // 入口普通模式
    this.layMode(constraints, LayoutMode.NORMAL, oofMap, global, ms, lbc);
  }

  /**
   *
   * @param constraints 父级约束
   * @param layoutMode 模式
   * @param oofMap 包含块节点记录，等end时开始处理拥有的absolute
   * @param global root的一些单位
   * @param ms marginStruct，处理margin合并
   * @param lbc LineBoxContext，行元素处理每行对齐
   * @param pc parentComputedStyle（Result的一部分），子节点计算继承style需要
   * @param ps parentStyle，子节点继承style需要
   // * @param prevFlow 流的兄弟节点，遇到absolute跳过
   */
  layMode(constraints: Constraints, layoutMode: LayoutMode, oofMap: WeakMap<ITypeNode, Oof[]>, global: Global,
          ms: MarginStruct, lbc: LineBoxContext, pc?: ComputedStyle, ps?: Style) {
    const b = this.begin(constraints, layoutMode, global, lbc, pc, ps);
    // 可能进入absolute预测量阶段，在包含块节点end时进行预测量，没有包含块则相对于root的约束
    if (b.layoutMode & LayoutMode.OOF_MEASURE) {
      const n = this.getContainingBlockNode() || { hook: global.root, parent: undefined };
      let list: Oof[];
      if (oofMap.has(n.hook)) {
        list = oofMap.get(n.hook)!;
      }
      else {
        list = [];
        oofMap.set(n.hook, list);
      }
      list.push({
        node: this,
        parent: n.parent,
        cx: constraints.cx,
        cy: constraints.cy,
      });
      return;
    }
    const res = this.result!;
    const style = this.style;
    const prev = this.prev;
    // margin合并检查，先尝试与父级的marginTop折叠，只发生在首个子节点；非首个节点处理相邻prev节点的折叠
    if ((!prev && (ms.pos || ms.neg) && res.marginTop && this.parent && canCollapseTop(this.parent, this))
      || (prev && (ms.pos || ms.neg) && res.marginTop && canCollapseSibling(prev, this))
    ) {
      const d = calMarginCollapse([ms.pos, ms.neg, res.marginTop]);
      // 正正、负负计算，正负preset默认算过忽略
      if (d > 0 && res.marginTop > 0) {
        if (res.marginTop > d) {
          res.y -= d;
        }
        else {
          res.y -= res.marginTop;
        }
      }
      else if (d < 0 && res.marginTop < 0) {
        if (res.marginTop < d) {
          res.y -= d;
        }
        else {
          res.y -= res.marginTop;
        }
      }
      ms.append(res.marginTop);
    }
    else {
      ms.solve();
      ms.reset(res.marginTop);
    }
    this.constraints = b.c;
    // block创建新的上下文管理行元素，传给children；inline则继续复用
    let newLbc: LineBoxContext | undefined;
    if (res.type === 'box' || res.type === 'inlineBox') {
      newLbc = new LineBoxContext(this.constraints.cx, this.constraints.cy, this as INode);
      this.lbc = newLbc;
    }
    // 先序遍历递归
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.layMode(b.c, b.layoutMode, oofMap, global, ms, newLbc || lbc, res, style);
    }
    // 判定是否为“完全穿透”的空盒子
    if (canCollapseSelf(this)) {
      ms.append(res.marginBottom);
    }
    // 最后一个子节点的底部是否合并
    else if (children.length && canCollapseBottom(this, children[children.length - 1])) {
      ms.append(res.marginBottom);
    }
    else {
      ms.solve();
      ms.reset(res.marginBottom);
    }
    // 最后一个子节点的折叠
    this.end(constraints, oofMap, global, lbc);
  }

  private begin(constraints: Constraints, layoutMode: LayoutMode, global: Global,
                lbc: LineBoxContext, pc?: ComputedStyle, ps?: Style) {
    const style = this.style;
    let c: Constraints;
    // absolute进入预测量模式
    if (style.position === Position.ABSOLUTE) {
      layoutMode |= LayoutMode.OOF_MEASURE;
      c = constraints;
    }
    else if (this.nodeType === NodeType.Text) {
      const t = this as unknown as TextNode;
      text(t, constraints, global, lbc, pc, ps);
      c = constraints;
    }
    else if (style.display === Display.INLINE) {
      const n = this as unknown as Node;
      inline(n, constraints, global, lbc, pc, ps);
      c = constraints;
    }
    // else if (style.display === Display.INLINE_BLOCK) {
    //   // if (isFixed(style.width)) {
    //     const res = preset(style, constraints, 'box', global, pc, ps) as Box;
    //     const mbp = getMbpH(res);
    //     // 换行
    //     if (res.w + mbp > constraints.aw - (constraints.cx - constraints.ox)) {}
    //     else {
    //       const o = block(style, constraints, global, pc, ps, res);
    //       this.result = o.res;
    //       c = o.c;
    //     }
    //   // }
    // }
    else {
      // 可能存在prev的inlineBox最后一行对齐
      if (lbc.endLine()) {
        const current = lbc.current;
        constraints.cx = constraints.ox;
        constraints.cy = current.y + current.h;
      }
      const n = this as unknown as Node;
      c = block(n, constraints, global, lbc, pc, ps);
    }
    return { layoutMode, c };
  }

  private end(constraints: Constraints, oofMap: WeakMap<AbstractNode, Oof[]>, global: Global, lbc: LineBoxContext) {
    const style = this.style;
    const result = this.result!;
    // 递归结束后处理
    if (this.nodeType === NodeType.Text) {
    }
    else {
      // 不用做任何事情
      if (style.position === Position.ABSOLUTE) {}
      // inline结束时，检查最后一个子节点的mpb，看是否影响宽度
      else if (style.display === Display.INLINE) {
        lbc.popInline();
      }
      // 默认block
      else {
        const c = this.constraints!;
        const lbc2 = this.lbc!;
        lbc2.endLine();
        lbc2.end();
        const current = lbc2.current;
        c.cx = c.ox;
        c.cy = current.y + current.h;
        // 自动高度，以及%高度但父级是auto
        if (style.height.u === Unit.AUTO || style.height.u === Unit.PERCENT && c.pbh === undefined) {
          result.h = c.cy - c.oy;
        }
        const parent = this.parent;
        const cp = parent?.constraints;
        if (cp) {
          const mbp = result.marginBottom + result.paddingBottom + result.borderBottomWidth;
          cp.cy = result.y + result.h + mbp;
        }
        // margin:auto处理
        const { boxSizing, marginLeft, marginRight } = style;
        const pr = parent?.result;
        const w = pr ? pr.w : global.w;
        let w2 = result.w;
        if (boxSizing === BoxSizing.CONTENT_BOX) {
          w2 += result.borderLeftWidth + result.borderRightWidth + result.paddingLeft + result.paddingRight;
        }
        if (marginLeft.u === Unit.AUTO && marginRight.u === Unit.AUTO) {
          if (w2 < w) {
            const half = (w - w2) * 0.5;
            result.x += half;
            result.marginLeft = half;
            result.marginRight = half;
          }
        }
        else if (marginLeft.u === Unit.AUTO && marginRight.u !== Unit.AUTO && marginRight.v) {
          result.x -= result.marginRight;
        }
        constraints.cx = constraints.ox;
        constraints.cy = result.y + result.h + result.marginBottom + result.borderBottomWidth + result.paddingBottom;
        // block所属的开始新行，同时应为block可能导致父级inline中断撑开，设置最大宽的
        lbc.addBlock(this);
        lbc.newLine(constraints.cx, constraints.cy);
        // lbc.setMaxX(result.x + result.w + getMbpRight(result));
      }
      // 特殊时机，root的inline节点需要在absolute前执行计算
      if (this === global.root && style.display === Display.INLINE && style.position !== Position.ABSOLUTE) {
        lbc.endLine();
        lbc.end();
      }
      // 包含块节点end时检查是否有absolute节点，每个absolute继续递归普通模式布局
      if (oofMap.has(this)) {
        const list = oofMap.get(this)!;
        list.forEach((item) => {
          let x: number, y: number, pbw: number, pbh: number;
          if (item.parent) {
            const result = item.parent.result!;
            // inline的包围块特殊逻辑，以首尾行为准
            if (result.type === 'inline') {
              const frags = result.frags;
              if (frags.length) {
                const start = frags[0];
                const end = frags[frags.length - 1];
                x = start.x;
                y = start.y;
                pbw = end.x + end.w - start.x + result.paddingRight + result.paddingLeft;
                pbh = end.y + end.h - start.y + result.paddingTop + result.paddingBottom;
              }
              else {
                x = result.x;
                y = result.y;
                pbw = result.w;
                pbh = result.h;
              }
            }
            else {
              x = result.x;
              y = result.y;
              pbw = result.w + result.paddingLeft + result.paddingRight;
              pbh = result.h + result.paddingTop + result.paddingBottom;
            }
          }
          // 相当于全局的absolute
          else {
            x = y = 0;
            pbw = global.w;
            pbh = global.h;
          }
          const c: Constraints = {
            ox: x - result.paddingLeft,
            oy: y - result.paddingTop,
            aw: pbw,
            ah: pbh,
            pbw,
            pbh,
            cx: item.cx,
            cy: item.cy,
          };
          // 可用尺寸以当前位置和end距离为准
          c.aw -= c.cx - c.ox;
          c.ah -= c.cy - c.oy;
          // 获取到测量宽后，走一遍普通布局，inline要视作block
          item.node.layAbs(c, oofMap, global);
        });
      }
    }
    // root节点开始处理relative的偏移
    if (!this.parent) {
      this.finish(0, 0, result.fontSize, global);
    }
  }

  finish(x: number, y: number, rem: number, global: Global) {
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
    if (x || y) {
      res.x += x;
      res.y += y;
      if (res.frags) {
        res.frags.forEach(item => {
          item.x += x;
          item.y += y;
        });
        if (res.type === 'text') {
          res.frags.forEach(item => {
            item.x += x;
            item.y += y;
          });
        }
      }
    }
    const children = this.children;
    for (let i = 0; i < children.length; i++) {
      children[i].finish(x, y, rem, global);
    }
  }

  layAbs(constraints: Constraints, oofMap: WeakMap<AbstractNode, Oof[]>, global: Global) {
    const style = this.style;
    const parent = this.parent!;
    const pr = parent.result!;
    const ps = parent.style;
    // 根据trbl确定最终尺寸
    const {
      boxSizing,
      left,
      right,
      top,
      bottom,
      marginLeft,
      marginRight,
      marginTop,
      marginBottom,
      width,
      height
    } = style;
    const res = preset(this, constraints, 'box', global, pr, ps) as Box;
    this.result = res;
    if (left.u !== Unit.AUTO) {
      res.x = constraints.ox + res.left + res.marginLeft + res.borderLeftWidth + res.paddingLeft;
    }
    if (top.u !== Unit.AUTO) {
      res.y = constraints.oy + res.top + res.marginTop + res.borderTopWidth + res.paddingTop;
    }
    // 尺寸优先级
    if (width.u !== Unit.AUTO) {}
    else if (left.u !== Unit.AUTO && right.u !== Unit.AUTO) {
      res.w = constraints.pbw - res.left - res.right - res.marginLeft - res.marginRight;
    }
    else {
      const { min, max } = this.shrink2Fit(constraints, global, res, style);
      res.w = Math.max(min, Math.min(max, constraints.aw));
      // constraints.aw = constraints.aw - (left.u === Unit.AUTO ? cx : res.left) - res.right;
    }
    if (height.u !== Unit.AUTO) {}
    else if (top.u !== Unit.AUTO && bottom.u !== Unit.AUTO) {
      res.h = constraints.pbh! - res.top - res.bottom - res.marginTop - res.marginBottom;
    }
    else {}
    // 边距平分
    if (left.u !== Unit.AUTO && right.u !== Unit.AUTO && width.u !== Unit.AUTO) {
      const residual = constraints.aw - (res.left + res.right + res.w);
      if (marginLeft.u === Unit.AUTO && marginRight.u === Unit.AUTO) {
        if (residual > 0) {
          const half = residual * 0.5;
          res.x += half;
          res.marginLeft = half;
          res.marginRight = half;
        }
        else if (residual < 0) {
          res.marginRight = residual;
        }
      }
      else if (marginLeft.u === Unit.AUTO) {
        res.marginLeft = residual;
      }
      else if (marginRight.u === Unit.AUTO) {
        res.marginRight = residual;
      }
    }
    if (top.u !== Unit.AUTO && bottom.u !== Unit.AUTO && height.u !== Unit.AUTO) {
      const residual = constraints.ah - (res.top + res.bottom + res.h);
      if (marginTop.u === Unit.AUTO && marginBottom.u === Unit.AUTO) {
        const half = residual * 0.5;
        res.y += half;
        res.marginTop = half;
        res.marginBottom = half;
      }
    }
    // 超额约束修正
    if (left.u === Unit.AUTO && right.u === Unit.AUTO) {
      res.left = constraints.cx - constraints.ox;
      res.right = constraints.aw - res.left - res.w - res.marginLeft - res.marginRight;
    }
    else if (left.u === Unit.AUTO) {
      res.left = constraints.aw - res.right - res.w - res.marginLeft - res.marginRight;
    }
    else {
      res.right = constraints.aw - res.left - res.w - res.marginLeft - res.marginRight;
    }
    res.x = constraints.ox + res.left + res.marginLeft + res.borderLeftWidth + res.paddingLeft;
    if (top.u === Unit.AUTO && bottom.u === Unit.AUTO) {
      res.top = constraints.cy - constraints.oy;
      res.bottom = constraints.ah - res.top - res.h - res.marginTop - res.marginBottom;
    }
    else if (top.u === Unit.AUTO) {
      res.top = constraints.ah - res.bottom - res.h - res.marginTop - res.marginBottom;
    }
    else {
      res.right = constraints.ah - res.top - res.h - res.marginLeft - res.marginRight;
    }
    res.y = constraints.oy + res.top + res.marginTop + res.borderTopWidth + res.paddingTop;
    // 特殊处理自己，不能复用begin，因为自己是absolute，会死循环进入预测量
    const c: Constraints = {
      ox: res.x,
      oy: res.y,
      aw: res.w,
      ah: constraints.ah,
      pbw: res.w,
      pbh: constraints.ah,
      cx: res.x,
      cy: res.y,
    };
    this.constraints = c;
    // 继续普通递归
    const ms = new MarginStruct();
    const lbc = new LineBoxContext(c.cx, c.cy, this.nodeType === NodeType.Text ? undefined : this as INode);
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      children[i].layMode(c, LayoutMode.NORMAL, oofMap, global, ms, lbc, res, style);
    }
    // 模拟end
    if (style.height.u === Unit.AUTO && (top.u === Unit.AUTO || bottom.u === Unit.AUTO)) {
      res.h = c.cy - c.oy;
    }
    this.end(constraints, oofMap, global, lbc);
  }

  private shrink2Fit(constraints: Constraints, global: Global, pc: ComputedStyle, ps: Style) {
    let min = 0, max = 0;
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      const style = child.style;
      // 测量阶段递归的子节点absolute忽略
      if (style.position !== Position.ABSOLUTE) {
        if (child.nodeType === NodeType.Text) {
          const o = child.shrink2FitText(constraints, global, pc, ps);
          min = Math.max(min, o.min);
          max = Math.max(max, o.max);
        }
        else if (style.display === Display.INLINE) {
          const o = child.shrink2FitInline(constraints, global, pc, ps);
          min = Math.max(min, o.min);
          max = Math.max(max, o.max);
        }
        else {
          const o = child.shrink2FitBlock(constraints, global, pc, ps);
          min = Math.max(min, o.min);
          max = Math.max(max, o.max);
        }
      }
    }
    return { min, max };
  }

  private shrink2FitBlock(constraints: Constraints, global: Global, pc: ComputedStyle, ps: Style) {
    let min = 0, max = 0;
    const style = this.style;
    // block如果定宽则直接返回（不考虑%），否则递归
    if (isFixed(style.width)) {
      let w = calLength(style.width, constraints.pbw, global.rem, pc.fontSize);
      if (style.boxSizing === BoxSizing.CONTENT_BOX) {
        const r = preset(this, constraints, 'box', global, pc, ps) as Box;
        w += getMbpH(r);
      }
      min = w;
      max = w;
    }
    else {
      const r = preset(this, constraints, 'box', global, pc, ps) as Box;
      const children = this.children;
      for (let i = 0, len = children.length; i < len; i++) {
        const o = children[i].shrink2Fit(constraints, global, r, style);
        min = Math.max(min, o.min);
        max = Math.max(max, o.max);
      }
      const mbp = getMbpH(r);
      min += mbp;
      max += mbp;
    }
    return { min, max };
  }

  private shrink2FitInline(constraints: Constraints, global: Global, pc: ComputedStyle, ps: Style) {
    let min = 0, max = 0;
    const style = this.style;
    const r = preset(this, constraints, 'inline', global, pc, ps) as Inline;
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const o = children[i].shrink2Fit(constraints, global, r, this.style);
      min = Math.max(min, o.min);
      max += o.max;
    }
    return { min, max };
  }

  private shrink2FitText(constraints: Constraints, global: Global, pc: ComputedStyle, ps: Style) {
    const t = this as unknown as TextNode;
    return oofText(t, constraints, t.content, global, pc, ps);
  }

  // 获取absolute的包围块节点，可能是relative+inline，需要返回钩子节点（所属block）和真正的包围块
  getContainingBlockNode() {
    let parent = this.parent;
    while (parent) {
      const style = parent.style;
      if (style.position === Position.ABSOLUTE) {
        return { parent, hook: parent };
      }
      if (style.position === Position.RELATIVE) {
        // inline的hook继续往上找非inline
        if ([Display.INLINE].includes(style.display)) {
          let hook = parent.parent;
          let root = parent;
          while (hook) {
            root = hook;
            const style = hook.style;
            if (![Display.INLINE].includes(style.display)) {
              return { parent, hook };
            }
            hook = hook.parent;
          }
          return { parent, hook: root };
        }
        else {
          return { parent, hook: parent };
        }
      }
      parent = parent.parent;
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
  declare result: Text;
  content = '';

  constructor(content: string, style?: Partial<JStyle | Style>) {
    super(NodeType.Text, style);
    this.content = content;
  }
}

function getRoot(item: ITypeNode) {
  let parent: ITypeNode | null = item;
  let temp = item;
  while (parent) {
    temp = parent;
    parent = parent.parent;
  }
  return temp;
}
