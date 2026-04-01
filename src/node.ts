import {
  BoxSizing,
  calLength,
  type ComputedStyle,
  Display,
  getDefaultStyle,
  isFixed,
  type JStyle,
  Position,
  type Style,
  Unit
} from './style';
import type { Box, Constraints, Global, Inline, InlineBox, InputConstraints, Result, Text, } from './layout';
import {
  block,
  inline,
  inlineBlock,
  minMaxText,
  normalizeConstraints,
  offsetX,
  offsetY,
  preset,
  text,
} from './layout';
import { LineBoxContext, MarginContext } from './context';
import { getMbpH, hasBottomBarrier, hasTopBarrier, isBFC, } from './compute';

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
  constraints: Constraints | null;
  result: Result | null;
  lineBoxContext: LineBoxContext | null;
  layAbs(cs: Constraints, absMap: WeakMap<ITypeNode, Abs[]>, global: Global): void;
  hasContent(): boolean; // 是否有内容，比如text有非空字符串，img强制有内容
}

export interface INode extends ITypeNode {
  readonly nodeType: NodeType.Node;
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

type Abs = {
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
  lineBoxContext: LineBoxContext | null = null; // block本身产生的行级上下文管理，传给children

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

  hasContent() {
    return false;
  }

  lay(ics: InputConstraints) {
    const root = getRoot(this);
    if (root !== this) {
      throw new Error('Cannot call lay() on a non-root node.');
    }
    let rem = calLength(root.style.fontSize, 1600, 16, 16);
    if (!rem || rem < 0) {
      rem = 16;
    }
    // root入口处初始化，可能用不到，比如block会创建自己的lbc，为了方法参数一致性
    const absMap: WeakMap<AbstractNode, Abs[]> = new WeakMap();
    const cs = normalizeConstraints(ics);
    const mc = new MarginContext();
    const lbc = new LineBoxContext(cs.ox, cs.oy);
    const global: Global = {
      root,
      rem,
      w: ics.aw,
      h: ics.ah,
      cs,
    };
    // 入口判断文档流or定位流，因为比较特殊，root没有相对包围块节点
    if (this.style.position === Position.ABSOLUTE) {
      this.layAbs(cs, absMap, global);
    }
    else {
      this.layFlow(cs, absMap, global, mc, lbc);
      mc.mergeTop();
      mc.reset();
    }
    this.finish(0, 0, global);
  }

  /**
   * @param cs 约束空间，目前可用的尺寸、百分比、是否可计算百分比状态和位置
   * @param absMap abs节点和其相对包含块节点记录，等end时开始处理所拥有的abs节点
   * @param global root的一些全局单位
   * @param mc 父节点传下来的处理margin合并的上下文
   * @param lbc 父节点传下来的处理每行对齐的上下文
   * 这是一个深度递归先根遍历的过程，处理文档流的主流程，定位流脱离于文档流在规范时期重新发起一个新的定位流递归循环；
   * 每遇到block产生一个新的Constraints供子节点使用，并且赋值给自身同名属性，再传给参数递归，inline则复用仅更新cx/cy不给自己赋值；
   * LineBoxContext情况和上面完全相同，遇到block产生新的传给子节点，inline复用同一个上下文；
   * MarginContext有点类似但比较复杂，仅block会用到，依旧是向下递归传递，但是在遇到阻断情况时（如BFC）会产生结算并重置，防止共享影响。
   */
  layFlow(cs: Constraints, absMap: WeakMap<ITypeNode, Abs[]>, global: Global, mc: MarginContext, lbc: LineBoxContext) {
    const { position, display } = this.style;
    if (position === Position.ABSOLUTE || display !== Display.BLOCK) {
      mc.mergeTop();
      mc.reset();
    }
    // absolute脱离文档流
    if (position === Position.ABSOLUTE) {
      this.recordAbs(cs, absMap, global);
    }
    // 普通文档流
    else {
      if (this.nodeType === NodeType.Text) {
        this.layText(cs, global, mc, lbc);
      }
      else if (display === Display.INLINE) {
        this.layInline(cs, absMap, global, mc, lbc);
      }
      else if (display === Display.INLINE_BLOCK) {
        this.layInlineBlock(cs, absMap, global, mc, lbc);
      }
      // 默认block
      else {
        this.layBlock(cs, absMap, global, mc, lbc);
      }
      // 特殊时机，root是inline节点需要在absolute前执行计算
      if (this === global.root && display === Display.INLINE) {
        lbc.endLine();
      }
      // 包含块节点end时检查是否有absolute节点，每个absolute继续递归普通模式布局
      this.checkAbs(absMap, global);
    }
  }

  // 将absolute节点记录下来，等到其包围块节点布局结束后有了确定的尺寸再布局
  private recordAbs(cs: Constraints, absMap: WeakMap<ITypeNode, Abs[]>, global: Global) {
    // 获取相对包围块节点后记录，没有就是相对root
    const n = this.getContainingBlockNode() || { hook: global.root, parent: undefined };
    let list: Abs[];
    if (absMap.has(n.hook)) {
      list = absMap.get(n.hook)!;
    }
    else {
      list = [];
      absMap.set(n.hook, list);
    }
    list.push({
      node: this,
      parent: n.parent,
      cx: cs.cx,
      cy: cs.cy,
    });
  }

  private checkAbs(absMap: WeakMap<ITypeNode, Abs[]>, global: Global) {
    if (absMap.has(this)) {
      const list = absMap.get(this)!;
      list.forEach((item) => {
        let x: number, y: number, pbw: number, pbh: number;
        if (item.parent) {
          const res = item.parent.result!;
          // inline的包围块特殊逻辑，以首尾行为准
          if (res.type === 'inline') {
            const frags = res.frags;
            if (frags.length) {
              const start = frags[0];
              const end = frags[frags.length - 1];
              x = start.x;
              y = start.y;
              pbw = end.x + end.w - start.x + res.paddingRight + res.paddingLeft;
              pbh = end.y + end.h - start.y + res.paddingTop + res.paddingBottom;
            }
            else {
              x = res.x;
              y = res.y;
              pbw = res.w;
              pbh = res.h;
            }
          }
          else {
            x = res.x;
            y = res.y;
            pbw = res.w + res.paddingLeft + res.paddingRight;
            pbh = res.h + res.paddingTop + res.paddingBottom;
          }
        }
        // 相当于全局的absolute
        else {
          x = y = 0;
          pbw = global.w;
          pbh = global.h;
        }
        const res = this.result!;
        const c: Constraints = {
          ox: x - res.paddingLeft,
          oy: y - res.paddingTop,
          aw: pbw,
          ah: pbh,
          pbw,
          pbh,
          cx: item.cx,
          cy: item.cy,
          fw: false,
          fh: false,
        };
        // 可用尺寸以当前位置和end距离为准
        c.aw -= c.cx - c.ox;
        c.ah -= c.cy - c.oy;
        // 获取到测量宽后，走一遍普通布局，inline要视作block
        (item.node as AbstractNode).layAbs(c, absMap, global);
      });
    }
  }

  layText(cs: Constraints, global: Global, mc: MarginContext, lbc: LineBoxContext) {
    this.constraints = cs;
    const t = this as unknown as TextNode;
    text(t, cs, global, lbc);
  }

  layBlock(cs: Constraints, absMap: WeakMap<ITypeNode, Abs[]>, global: Global, mc: MarginContext, lbc: LineBoxContext) {
    this.blockStart(cs, lbc);
    const n = this as unknown as Node;
    // block自身的约束、自身的lineBoxContext是新的
    const scs = block(n, cs, global);
    this.constraints = scs;
    const slbc = new LineBoxContext(scs.cx, scs.cy, this as INode);
    this.lineBoxContext = slbc;
    const style = this.style;
    const res = this.result!;
    /**
     * block独有的marginTop合并检查，在首个节点（无prev）发生；
     * 如果节点是有paddingTop、borderTop、BFC则直接中断；
     * 如果有height也可以中断，但auto且有孩子时无法提前预知孩子是否是可穿透，所以后置判断。
     * 如果有隔断，节点和marginTop存入上下文记录当中，等待结束时（被隔断）统一计算；
     * 如果没有隔断，检查当前存入的节点和数据，用规范的正正、负负、正负不同情况计算合并最终值。
     * 首个block节点（如root，inline中的block）触发时没有prev/parent，
     * 连续的bfc隔离也不会有合并情况，因此先判断当前存入了多少个节点和数据。
     */
    const htb = hasTopBarrier(res);
    const hbb = hasBottomBarrier(res);
    const bfc = isBFC(this);
    if (htb || bfc) {
      // 先算上自己，隔断是和自己和子节点隔断，如果只有自己一个节点等于直接生效
      mc.append(res.marginTop, this);
      mc.mergeTop();
      mc.reset();
    }
    else {
      mc.append(res.marginTop, this);
    }
    const isAutoH = style.height.u === Unit.AUTO || style.height.u === Unit.PERCENT && cs.pbh === undefined;
    let collapse = !hbb && !bfc && isAutoH;
    // text节点特殊，一般有内容，视为不被穿透
    if (collapse && this.hasContent()) {
      collapse = false;
    }
    // 先序遍历，同时由于子节点先触发，计算子节点是否可以被折叠后父节点可以直接读取
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.layFlow(scs, absMap, global, mc, slbc);
    }
    this.blockEnd(cs);
    this.marginAuto(global);
    // 如果可以穿透，说明上下合并，记录下来等后续判断
    if (collapse) {
      mc.append(res.marginBottom);
    }
    // 不可以穿透，处理之前累计的top合并和偏移
    else {
      const m = mc.mergeTop();
      if (m) {
        /**
         * 这里和开始不同，如果是唯一的叶子结点，因为blockEnd已经结算过cy了，所以要加上偏移，list[0]一定是自己，cs就是所属的约束；
         * 如果是叶子节点但有多个，即list不唯一，那么在刚刚的处理中倒数第2个一定是父节点，它的cs已经处理过了
         */
        if (!children.length && mc.list.length === 1) {
          cs.cy += m;
        }
        if (isAutoH) {
          res.h += m;
        }
      }
      mc.reset();
      mc.append(res.marginBottom);
    }
    // block所属的inline（如有）中断撑开开始新行，记录下来
    lbc.addBlock(this);
    lbc.newLine(cs.cx, cs.cy);
  }

  // flex/grid也是block，开始换行处理是一样的
  private blockStart(cs: Constraints, lbc: LineBoxContext) {
    // 可能存在prev是inline，lineBox最后一行对齐
    if (lbc.endLine()) {
      const current = lbc.current;
      cs.cx = cs.ox;
      cs.cy = current.y + current.h;
    }
  }

  // absolute强制block，flex/grid也是block，尾部处理是一样的
  private blockEnd(cs: Constraints) {
    const scs = this.constraints!;
    const lbc = this.lineBoxContext!;
    if (lbc.endLine()) {
      const current = lbc.current;
      scs.cx = scs.ox;
      scs.cy = current.y + current.h;
    }
    const style = this.style;
    const res = this.result!;
    // 自动高度，以及%高度但父级是auto
    if (style.height.u === Unit.AUTO || style.height.u === Unit.PERCENT && cs.pbh === undefined) {
      res.h = Math.max(0, scs.cy - scs.oy);
    }
    // 没有包含marginBottom，因为要处理合并
    cs.cx = cs.ox;
    cs.cy = res.y + res.h + res.paddingBottom + res.borderBottomWidth;
  }

  // flex/grid也是block，尾部auto处理是一样的
  private marginAuto(global: Global) {
    const { boxSizing, marginLeft, marginRight } = this.style;
    const res = this.result!;
    const parent = this.parent;
    const w = parent ? parent.result!.w : global.w;
    let w2 = res.w;
    if (boxSizing === BoxSizing.CONTENT_BOX) {
      w2 += res.borderLeftWidth + res.borderRightWidth + res.paddingLeft + res.paddingRight;
    }
    if (marginLeft.u === Unit.AUTO && marginRight.u === Unit.AUTO) {
      if (w2 < w) {
        const half = (w - w2) * 0.5;
        res.x += half;
        res.marginLeft = half;
        res.marginRight = half;
      }
    }
    else if (marginLeft.u === Unit.AUTO && marginRight.u !== Unit.AUTO && marginRight.v) {
      res.x -= res.marginRight;
    }
  }

  layInline(cs: Constraints, absMap: WeakMap<ITypeNode, Abs[]>, global: Global, mc: MarginContext, lbc: LineBoxContext) {
    this.constraints = cs;
    const n = this as unknown as Node;
    inline(n, cs, global, lbc);
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.layFlow(cs, absMap, global, mc, lbc);
    }
    // inline结束时，检查最后一个子节点的mpb，看是否影响宽度
    lbc.popInline();
  }

  layInlineBlock(cs: Constraints, absMap: WeakMap<ITypeNode, Abs[]>, global: Global, mc: MarginContext, lbc: LineBoxContext) {
    const style = this.style;
    const n = this as unknown as Node;
    // 固定且不换行，不固定都需要用到一个临时的computedStyle
    const temp = preset(n, cs, 'inlineBox', global) as InlineBox;
    const d = cs.cx - cs.ox;
    // 不固定则预测量
    if (!isFixed(style.width)) {
      const { min, max } = this.shrink2Fit(cs, global, temp);
      const aw = cs.aw - d;
      temp.w = Math.max(min, Math.min(max, aw));
    }
    let scs: Constraints;
    // inlineBlock放不下要换行
    if (d && temp.w + getMbpH(temp) < (cs.aw - d) + 1e-9) {
      lbc.endLine();
      const current = lbc.current;
      cs.cx = cs.ox;
      cs.cy = current.y + current.h;
      scs = inlineBlock(n, cs, global);
    }
    else {
      scs = inlineBlock(n, cs, global, temp);
    }
    this.constraints = scs;
    const slbc = new LineBoxContext(scs.cx, scs.cy, this as INode);
    this.lineBoxContext = slbc;
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.layFlow(scs, absMap, global, mc, slbc);
    }
    this.blockEnd(cs);
  }

  // TODO 性能优化，不整体root再递归一遍，用到的地方end时做
  finish(x: number, y: number, global: Global) {
    const style = this.style;
    const res = this.result!;
    if (style.position === Position.RELATIVE) {
      const { left, top, right, bottom } = style;
      if (left.u !== Unit.AUTO) {
        x += calLength(left, res.w, global.rem, res.fontSize);
      }
      else if (right.u !== Unit.AUTO) {
        x -= calLength(right, res.w, global.rem, res.fontSize);
      }
      if (top.u !== Unit.AUTO) {
        // 注意%单位时如果约束尺寸为auto（父节点height为auto）视为0
        if (top.u !== Unit.PERCENT || this.parent?.constraints!.pbh !== undefined) {
          y += calLength(top, res.h, global.rem, res.fontSize);
        }
      }
      else if (bottom.u !== Unit.AUTO) {
        if (bottom.u !== Unit.PERCENT || this.parent?.constraints!.pbh !== undefined) {
          y -= calLength(bottom, res.h, global.rem, res.fontSize);
        }
      }
    }
    if (x) {
      offsetX(res, x);
    }
    if (y) {
      offsetY(res, y);
    }
    const children = this.children;
    for (let i = 0; i < children.length; i++) {
      children[i].finish(x, y, global);
    }
  }

  layAbs(cs: Constraints, absMap: WeakMap<AbstractNode, Abs[]>, global: Global) {
    const style = this.style;
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
    const res = preset(this, cs, 'box', global) as Box;
    this.result = res;
    if (left.u !== Unit.AUTO) {
      res.x = cs.ox + res.left + res.marginLeft + res.borderLeftWidth + res.paddingLeft;
    }
    if (top.u !== Unit.AUTO) {
      res.y = cs.oy + res.top + res.marginTop + res.borderTopWidth + res.paddingTop;
    }
    // 尺寸优先级
    if (width.u !== Unit.AUTO) {}
    else if (left.u !== Unit.AUTO && right.u !== Unit.AUTO) {
      res.w = cs.pbw - res.left - res.right - res.marginLeft - res.marginRight;
    }
    else {
      const { min, max } = this.shrink2Fit(cs, global, res);
      const l = left.u === Unit.AUTO ? (cs.cx - cs.ox) : res.left;
      const r = right.u === Unit.AUTO ? 0 : res.right;
      const aw = cs.aw - l - r;
      res.w = Math.max(min, Math.min(max, aw));
    }
    if (height.u !== Unit.AUTO) {}
    else if (top.u !== Unit.AUTO && bottom.u !== Unit.AUTO) {
      res.h = cs.pbh! - res.top - res.bottom - res.marginTop - res.marginBottom;
    }
    else {}
    // 边距平分
    if (left.u !== Unit.AUTO && right.u !== Unit.AUTO && width.u !== Unit.AUTO) {
      const residual = cs.aw - (res.left + res.right + res.w);
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
      const residual = cs.ah - (res.top + res.bottom + res.h);
      if (marginTop.u === Unit.AUTO && marginBottom.u === Unit.AUTO) {
        const half = residual * 0.5;
        res.y += half;
        res.marginTop = half;
        res.marginBottom = half;
      }
    }
    // 超额约束修正
    if (left.u === Unit.AUTO && right.u === Unit.AUTO) {
      res.left = cs.cx - cs.ox;
      res.right = cs.aw - res.left - res.w - res.marginLeft - res.marginRight;
    }
    else if (left.u === Unit.AUTO) {
      res.left = cs.aw - res.right - res.w - res.marginLeft - res.marginRight;
    }
    else {
      res.right = cs.aw - res.left - res.w - res.marginLeft - res.marginRight;
    }
    res.x = cs.ox + res.left + res.marginLeft + res.borderLeftWidth + res.paddingLeft;
    if (top.u === Unit.AUTO && bottom.u === Unit.AUTO) {
      res.top = cs.cy - cs.oy;
      res.bottom = cs.ah - res.top - res.h - res.marginTop - res.marginBottom;
    }
    else if (top.u === Unit.AUTO) {
      res.top = cs.ah - res.bottom - res.h - res.marginTop - res.marginBottom;
    }
    else {
      res.bottom = cs.ah - res.top - res.h - res.marginTop - res.marginBottom;
    }
    res.y = cs.oy + res.top + res.marginTop + res.borderTopWidth + res.paddingTop;
    // 特殊处理自己，不能复用begin，因为自己是absolute，会死循环进入预测量
    const scs: Constraints = {
      ox: res.x,
      oy: res.y,
      aw: res.w,
      ah: cs.ah,
      pbw: res.w,
      pbh: cs.ah,
      cx: res.x,
      cy: res.y,
      fw: false,
      fh: false,
    };
    this.constraints = scs;
    // 继续普通递归
    const mc = new MarginContext();
    const slbc = new LineBoxContext(scs.cx, scs.cy, this.nodeType === NodeType.Text ? undefined : this as INode);
    this.lineBoxContext = slbc;
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      children[i].layFlow(scs, absMap, global, mc, slbc);
    }
    // 模拟end
    const isAutoH = style.height.u === Unit.AUTO && (top.u === Unit.AUTO || bottom.u === Unit.AUTO);
    if (isAutoH) {
      res.h = scs.cy - scs.oy;
    }
    const m = mc.mergeTop();
    if (isAutoH) {
      res.h += m;
    }
    mc.reset();
    // absolute递归包含absolute
    this.checkAbs(absMap, global);
  }

  private shrink2Fit(cs: Constraints, global: Global, pc: ComputedStyle) {
    let min = 0, max = 0;
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      const style = child.style;
      // 测量阶段递归的子节点absolute忽略
      if (style.position !== Position.ABSOLUTE) {
        if (child.nodeType === NodeType.Text) {
          const o = child.shrink2FitText(cs, global);
          min = Math.max(min, o.min);
          max = Math.max(max, o.max);
        }
        else if (style.display === Display.INLINE) {
          const o = child.shrink2FitInline(cs, global);
          min = Math.max(min, o.min);
          max = Math.max(max, o.max);
        }
        else {
          const o = child.shrink2FitBlock(cs, global, pc);
          min = Math.max(min, o.min);
          max = Math.max(max, o.max);
        }
      }
    }
    return { min, max };
  }

  private shrink2FitBlock(cs: Constraints, global: Global, pc: ComputedStyle) {
    let min = 0, max = 0;
    const style = this.style;
    // block如果定宽则直接返回（不考虑%），否则递归
    if (isFixed(style.width)) {
      let w = calLength(style.width, cs.pbw, global.rem, pc.fontSize);
      if (style.boxSizing === BoxSizing.CONTENT_BOX) {
        const r = preset(this, cs, 'box', global) as Box;
        w += getMbpH(r);
      }
      min = w;
      max = w;
    }
    else {
      const r = preset(this, cs, 'box', global) as Box;
      const children = this.children;
      for (let i = 0, len = children.length; i < len; i++) {
        const o = children[i].shrink2Fit(cs, global, r);
        min = Math.max(min, o.min);
        max = Math.max(max, o.max);
      }
      const mbp = getMbpH(r);
      min += mbp;
      max += mbp;
    }
    return { min, max };
  }

  private shrink2FitInline(cs: Constraints, global: Global) {
    let min = 0, max = 0;
    const r = preset(this, cs, 'inline', global) as Inline;
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const o = children[i].shrink2Fit(cs, global, r);
      min = Math.max(min, o.min);
      max += o.max;
    }
    return { min, max };
  }

  private shrink2FitText(cs: Constraints, global: Global) {
    const t = this as unknown as TextNode;
    return minMaxText(t, cs, t.content, global);
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

  override hasContent() {
    return !!this.content;
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
