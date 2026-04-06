import {
  BoxSizing,
  calLength,
  Display,
  getDefaultStyle,
  isFixed,
  Overflow,
  Position,
  Unit,
} from './style';
import type { ComputedStyle, JStyle, Style } from './style';
import {
  afterFlowBox,
  block,
  checkRelative,
  inline,
  inlineBlock,
  marginAuto,
  minMaxText,
  normalizeConstraints,
  preset,
  text,
} from './layout';
import type { Block, Constraints, Inline, InlineBlock, InputConstraints, Result, Text, } from './layout';
import { LineBoxContext, MarginContext } from './context';
import { calBaseline, getMbpBottom, getMbpH, hasBottomBarrier, hasTopBarrier, isBFC } from './compute';

export enum NodeType {
  Element = 0,
  Text = 1,
}

export interface INode {
  readonly id: number;
  readonly nodeType: NodeType;
  readonly style: Style;
  parent: IElementNode | null;
  prev: INode | null;
  next: INode | null;
  result: Result | null;
  contentArea: number | null;
  collapse: boolean;
  insertBefore(item: INode): void;
  insertAfter(item: INode): void;
  remove(): void;
  hasContent(): boolean; // 是否有内容，比如text有非空字符串，img强制有内容
  lay(ics: InputConstraints): void;
  layFlow(cs: Constraints, absMap: WeakMap<INode, Abs[]>, global: Global, mc: MarginContext, lbc: LineBoxContext, x: number, y: number): void;
  layAbs(cs: Constraints, absMap: WeakMap<INode, Abs[]>, global: Global, x: number, y: number): void;
}

export interface IElementNode extends INode {
  readonly nodeType: NodeType.Element;
  readonly children: INode[];
  result: Block | InlineBlock | Inline | null;
  constraints: Constraints | null;
  lineBoxContext: LineBoxContext | null;
  getElementBaseline(): number;
  appendChild(item: INode): void;
  prependChild(item: INode): void;
  removeChild(item: INode): void;
}

export interface ITextNode extends INode {
  readonly nodeType: NodeType.Text;
  content: string;
  result: Text | null;
}

export type IAllNode = IElementNode | ITextNode;

export type Global = {
  root: Node,
  rem: number,
  w: number,
  h: number,
  cs: Constraints,
};

type Abs = {
  node: Node;
  parent?: Element;
  cx: number;
  cy: number;
};

let id = 0;

export abstract class Node implements INode {
  readonly id = id++;
  readonly nodeType: NodeType;
  readonly style: Style;
  parent: Element | null = null;
  prev: Node | null = null;
  next: Node | null = null;
  result: Result | null = null; // 布局结果
  collapse = false;
  contentArea: number | null = null;

  protected constructor(nodeType: NodeType, style?: Partial<JStyle | Style>) {
    this.nodeType = nodeType;
    this.style = getDefaultStyle(style);
  }

  insertBefore(node: Node) {
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

  insertAfter(node: Node) {
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
    const absMap: WeakMap<Element, Abs[]> = new WeakMap();
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
      this.layAbs(cs, absMap, global, 0, 0);
    }
    else {
      this.layFlow(cs, absMap, global, mc, lbc, 0, 0);
      mc.mergeTop();
      mc.reset();
    }
  };

  abstract layFlow(cs: Constraints, absMap: WeakMap<Element, Abs[]>, global: Global, mc: MarginContext, lbc: LineBoxContext, x: number, y: number): void;

  abstract layAbs(cs: Constraints, absMap: WeakMap<Element, Abs[]>, global: Global, x: number, y: number): void;

  abstract shrink2Fit(cs: Constraints, global: Global): { min: number, max: number };

  protected getContainingNode() {
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

export class Element extends Node implements IElementNode {
  declare nodeType: NodeType.Element;
  declare result: Block | InlineBlock | Inline | null;
  readonly children: Node[];
  constraints: Constraints | null = null;
  lineBoxContext: LineBoxContext | null = null;

  constructor(style?: Partial<JStyle | Style>, children: Node[] = []) {
    super(NodeType.Element, style);
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

  appendChild(node: Node) {
    const children = this.children;
    const last = children[children.length - 1];
    children.push(node);
    node.parent = this;
    if (last) {
      last.next = node;
      node.prev = last;
    }
  }

  prependChild(node: Node) {
    const children = this.children;
    const first = children[0];
    children.unshift(node);
    node.parent = this;
    if (first) {
      first.prev = node;
      node.next = first;
    }
  }

  removeChild(node: Node) {
    const children = this.children;
    const i = children.indexOf(node);
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
      node.parent = node.prev = node.next = null;
    }
  }

  getElementBaseline() {
    const { children, style } = this;
    const res = this.result!;
    if (style.overflow !== Overflow.VISIBLE || !children.length) {
      return res.h + getMbpBottom(res);
    }
    for (let i = children.length - 1; i >= 0; i++) {}
    return 0;
  }

  /**
   * @param cs 约束空间，目前可用的尺寸、百分比、是否可计算百分比状态和位置
   * @param absMap abs节点和其相对包含块节点记录，等end时开始处理所拥有的abs节点
   * @param global root的一些全局单位
   * @param mc 父节点传下来的处理margin合并的上下文
   * @param lbc 父节点传下来的处理每行对齐的上下文
   * @param x 因为relative造成的偏移
   * @param y
   * 这是一个深度递归先根遍历的过程，处理文档流的主流程，定位流脱离于文档流在规范时期重新发起一个新的定位流递归循环；
   * 每遇到block产生一个新的Constraints供子节点使用，并且赋值给自身同名属性，再传给参数递归，inline则复用仅更新cx/cy不给自己赋值；
   * LineBoxContext情况和上面完全相同，遇到block产生新的传给子节点，inline复用同一个上下文；
   * MarginContext有点类似但比较复杂，仅block会用到，依旧是向下递归传递，但是在遇到阻断情况时（如BFC）会产生结算并重置，防止共享影响。
   */
  layFlow(cs: Constraints, absMap: WeakMap<Element, Abs[]>, global: Global, mc: MarginContext, lbc: LineBoxContext, x: number, y: number) {
    const { position, display } = this.style;
    if (position === Position.ABSOLUTE || ![Display.BLOCK, Display.FLEX, Display.GRID].includes(display)) {
      mc.mergeTop();
      mc.reset();
    }
    // absolute脱离文档流
    if (position === Position.ABSOLUTE) {
      this.recordAbs(cs, absMap, global);
    }
    // 普通文档流
    else {
      if (display === Display.INLINE) {
        this.layInline(cs, absMap, global, mc, lbc, x, y);
      }
      else if (display === Display.INLINE_BLOCK) {
        this.layInlineBlock(cs, absMap, global, mc, lbc, x, y);
      }
      // 默认block
      else {
        this.layBlock(cs, absMap, global, mc, lbc, x, y);
      }
      // 特殊时机，root是inline节点需要在absolute前执行计算
      if (this === global.root && display === Display.INLINE) {
        lbc.endLine();
      }
      // 包含块节点end时检查是否有absolute节点，每个absolute继续递归普通模式布局
      this.checkAbs(absMap, global, x, y);
    }
  }

  private layInline(cs: Constraints, absMap: WeakMap<Element, Abs[]>, global: Global, mc: MarginContext, lbc: LineBoxContext, x: number, y: number) {
    this.constraints = cs;
    inline(this, cs, global, lbc);
    ({ x, y } = checkRelative(this, x, y));
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.layFlow(cs, absMap, global, mc, lbc, x, y);
    }
    // inline结束时，检查最后一个子节点的mpb，看是否影响宽度
    lbc.popInline();
  }

  private layInlineBlock(cs: Constraints, absMap: WeakMap<Element, Abs[]>, global: Global, mc: MarginContext, lbc: LineBoxContext, x: number, y: number) {
    const style = this.style;
    // 固定不固定都需要用到一个临时的computedStyle，后面可以复用
    const temp = preset(this, cs, 'inlineBlock', global) as InlineBlock;
    const used = cs.cx - cs.ox;
    // 不固定则预测量
    if (!isFixed(style.width)) {
      const { min, max } = this.shrink2Fit(cs, global);
      const aw = cs.aw - used;
      temp.w = Math.max(min, Math.min(max, aw));
    }
    let scs: Constraints;
    // inlineBlock放不下要换行，追加个精度冗余
    if (!lbc.current.begin && temp.w + getMbpH(temp) > (cs.aw - used) + 1e-9) {
      lbc.prepareNextLine();
      lbc.endLine();
      const current = lbc.current;
      cs.cx = cs.ox;
      cs.cy = current.y + current.h;
      lbc.newLine(cs.cx, cs.cy);
      scs = inlineBlock(this, cs, global);
    }
    else {
      scs = inlineBlock(this, cs, global, temp);
    }
    this.constraints = scs;
    const slbc = new LineBoxContext(scs.cx, scs.cy, this);
    this.lineBoxContext = slbc;
    ({ x, y } = checkRelative(this, x, y));
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.layFlow(scs, absMap, global, mc, slbc, x, y);
    }
    // 和block不同，inlineBlock不会直接新起一行，因此重设下
    const { cx, cy } = cs;
    afterFlowBox(cs, this);
    cs.cx = cx + temp.w;
    cs.cy = cy;
    lbc.addInlineBlock(this);
  }

  private layBlock(cs: Constraints, absMap: WeakMap<Element, Abs[]>, global: Global, mc: MarginContext, lbc: LineBoxContext, x: number, y: number) {
    // block自身的约束、自身的lineBoxContext是新的
    const scs = block(this, cs, global, lbc);
    this.constraints = scs;
    const slbc = new LineBoxContext(scs.cx, scs.cy, this);
    this.lineBoxContext = slbc;
    const style = this.style;
    const res = this.result!;
    ({ x, y } = checkRelative(this, x, y));
    /**
     * block独有的marginTop合并检查，在首个节点（无prev）发生；
     * 如果节点是有paddingTop、borderTop、BFC则直接中断；
     * 如果有height也可以中断，但auto且有孩子时无法提前预知孩子是否是可穿透，所以后置判断。
     * 如果有隔断，节点和marginTop存入上下文记录当中，等待结束时（被隔断）统一计算；
     * 如果没有隔断，检查当前存入的节点和数据，用规范的正正、负负、正负不同情况计算合并最终值。
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
    /**
     * 空高节点且没有隔断视作空块可以被穿透，同时要满足所有子节点也是可以穿透的；
     * 子节点先遍历拿到自身状态，赋值给collapse属性，父节点可以直接获得无需递归；
     * 注意幽灵情况，即父节点height显示为0，但是子节点是有内容的，此时不能穿透。
     */
    const isAutoH = style.height.u === Unit.AUTO || style.height.u === Unit.PERCENT && cs.pbh === null;
    const isEmptyH = isAutoH || style.height.v <= 0;
    let collapse = !htb && !hbb && !bfc && isEmptyH;
    // text节点特殊，一般有内容，视为不被穿透
    if (collapse && this.hasContent()) {
      collapse = false;
    }
    // 先序遍历，同时由于子节点先触发，计算子节点是否空块可以被穿透，父节点后面可以直接读取
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.layFlow(scs, absMap, global, mc, slbc, x, y);
      if (collapse && !child.collapse) {
        collapse = false;
      }
    }
    this.collapse = collapse;
    afterFlowBox(cs, this);
    marginAuto(this, global);
    // 如果可以穿透，说明上下合并，记录下来等后续判断
    if (collapse) {
      mc.append(res.marginBottom);
    }
    // 不可以穿透，要分是有下隔断或BFC，还是非空高
    else {
      // 有下隔断或BFC，以及之前遗留的都要处理，非空高的话要检测list是否有遗留，否则不要处理透传marginBottom
      if (mc.list.length || hbb || bfc) {
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
      }
      mc.append(res.marginBottom);
    }
    // block所属的inline（如有）中断撑开开始新行，记录下来
    lbc.addBlock(this);
    lbc.newLine(cs.cx, cs.cy);
  }

  layAbs(cs: Constraints, absMap: WeakMap<Element, Abs[]>, global: Global, x: number, y: number) {
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
    const res = preset(this, cs, 'block', global) as Block;
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
      const { min, max } = this.shrink2Fit(cs, global);
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
    const slbc = new LineBoxContext(scs.cx, scs.cy, this);
    this.lineBoxContext = slbc;
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      children[i].layFlow(scs, absMap, global, mc, slbc, x, y);
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
    this.checkAbs(absMap, global, x, y);
  }

  shrink2Fit(cs: Constraints, global: Global) {
    let min = 0, max = 0;
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      const style = child.style;
      // 测量阶段递归的子节点absolute忽略
      if (style.position !== Position.ABSOLUTE) {
        if (child.nodeType === NodeType.Text) {
          const o = child.shrink2Fit(cs, global);
          min = Math.max(min, o.min);
          max = Math.max(max, o.max);
        }
        else if (style.display === Display.INLINE) {
          const o = (child as Element).shrink2FitInline(cs, global);
          min = Math.max(min, o.min);
          max = Math.max(max, o.max);
        }
        else {
          const o = (child as Element).shrink2FitBlock(cs, global);
          min = Math.max(min, o.min);
          max = Math.max(max, o.max);
        }
      }
    }
    return { min, max };
  }

  private shrink2FitBlock(cs: Constraints, global: Global) {
    let min = 0, max = 0;
    const style = this.style;
    // block如果定宽则直接返回（不考虑%），否则递归
    if (isFixed(style.width)) {
      let w = calLength(style.width, cs.pbw, global.rem);
      if (style.boxSizing === BoxSizing.CONTENT_BOX) {
        const r = preset(this, cs, 'block', global) as Block;
        w += getMbpH(r);
      }
      min = w;
      max = w;
    }
    else {
      const r = preset(this, cs, 'block', global) as Block;
      const children = this.children;
      for (let i = 0, len = children.length; i < len; i++) {
        const o = children[i].shrink2Fit(cs, global);
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
    // const r = preset(this, cs, 'inline', global) as Inline;
    const children = this.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const o = children[i].shrink2Fit(cs, global);
      min = Math.max(min, o.min);
      max += o.max;
    }
    return { min, max };
  }

  // 将absolute节点记录下来，等到其包围块节点布局结束后有了确定的尺寸再布局，没有就是相对root
  private recordAbs(cs: Constraints, absMap: WeakMap<Element, Abs[]>, global: Global) {
    const n = this.getContainingNode() || { hook: global.root as Element, parent: undefined };
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

  // 作为包围块节点结束后拥有了宽高，可以查看以自己为相对基础的所有absolute节点，进入定位流
  private checkAbs(absMap: WeakMap<Element, Abs[]>, global: Global, x: number, y: number) {
    if (absMap.has(this)) {
      const style = this.style;
      const res = this.result!;
      if (style.position === Position.RELATIVE) {
        x += res.left;
        y += res.top;
      }
      const list = absMap.get(this)!;
      list.forEach((item) => {
        let ox: number, oy: number, pbw: number, pbh: number;
        if (item.parent) {
          const res = item.parent.result!;
          // inline的包围块特殊逻辑，以首尾行为准
          if (res.type === 'inline') {
            const frags = res.frags;
            if (frags.length) {
              const start = frags[0];
              const end = frags[frags.length - 1];
              ox = start.x;
              oy = start.y;
              pbw = end.x + end.w - start.x + res.paddingRight + res.paddingLeft;
              pbh = end.y + end.h - start.y + res.paddingTop + res.paddingBottom;
            }
            else {
              ox = res.x;
              oy = res.y;
              pbw = res.w;
              pbh = res.h;
            }
          }
          else {
            ox = res.x;
            oy = res.y;
            pbw = res.w + res.paddingLeft + res.paddingRight;
            pbh = res.h + res.paddingTop + res.paddingBottom;
          }
        }
        // 相当于全局的absolute
        else {
          ox = oy = 0;
          pbw = global.w;
          pbh = global.h;
        }
        const res = this.result!;
        const c: Constraints = {
          ox: ox - res.paddingLeft,
          oy: oy - res.paddingTop,
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
        item.node.layAbs(c, absMap, global, x, y);
      });
    }
  }
}

export class TextNode extends Node implements ITextNode {
  declare nodeType: NodeType.Text;
  declare result: Text | null;
  content = '';

  constructor(content: string, style?: Partial<JStyle | Style>) {
    super(NodeType.Text, style);
    // text默认inline，和标准不同，text可以单独存在，而非依附Dom
    if (!style || !style.display) {
      this.style.display = Display.INLINE;
    }
    this.content = content;
  }

  override hasContent() {
    return !!this.content;
  }

  layFlow(cs: Constraints, absMap: WeakMap<Element, Abs[]>, global: Global, mc: MarginContext, lbc: LineBoxContext, x: number, y: number) {
    const { position, display } = this.style;
    if (position === Position.ABSOLUTE || ![Display.BLOCK, Display.FLEX, Display.GRID].includes(display)) {
      mc.mergeTop();
      mc.reset();
    }
    if (position === Position.ABSOLUTE || [Display.BLOCK, Display.FLEX, Display.GRID].includes(display)) {
    }
    else if (display === Display.INLINE) {
      text(this, cs, global, lbc);
      checkRelative(this, x, y);
    }
    else if (display === Display.INLINE_BLOCK) {}
  }

  layAbs(cs: Constraints, absMap: WeakMap<Node, Abs[]>, global: Global, x: number, y: number) {}

  shrink2Fit(cs: Constraints, global: Global) {
    return minMaxText(this, cs, global);
  }
}

function getRoot(item: Node) {
  let parent: Node | null = item;
  let temp = item;
  while (parent) {
    temp = parent;
    parent = parent.parent;
  }
  return temp;
}
