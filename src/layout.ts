import { BoxSizing, Display, FontStyle, Length, Position, Style, Unit } from './style';
import { isEnter, LineBox, MeasureText, smartMeasure, TextBox } from './text';
import { INode, ITextNode, NodeType } from './node';

export type Rect = { x: number; y: number; w: number; h: number };

export type ComputedStyle = {
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  borderTopWidth: number;
  borderRightWidth: number;
  borderBottomWidth: number;
  borderLeftWidth: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: FontStyle;
  lineHeight: number;
  letterSpacing: number;
};

export type Box = {
  type: 'box',
  rects: null,
} & Rect & ComputedStyle;

export type Inline = {
  type: 'inline',
  rects: Rect[],
} & Rect & ComputedStyle;

export type Text = {
  type: 'text',
  // 包含所有折行后的矩形，按行序排列
  rects: LineBox[];
} & Rect & ComputedStyle;

export type Result = Box | Inline | Text;

export type Constraints = {
  ox: number; // 相对原点坐标
  oy: number;
  aw: number; // 可用尺寸
  ah: number;
  pbw: number; // 百分比基于尺寸
  pbh?: number; // 可能出现undefined表示auto
  cx: number; // 当前坐标，flow流用到，absolute时自动位置也会用
  cy: number;
};

export type InputConstraints = Pick<Constraints, 'aw' | 'ah'>
  & Partial<Omit<Constraints, 'aw' | 'ah'>>;

export enum LayoutMode {
  NORMAL       = 0b000,
  MIN_MAX      = 0b001, // flex测量阶段
  OOF_MEASURE  = 0b010, // absolute测量阶段
  MEASURE_DONE = 0b100,
}

type Oof<T extends (INode | ITextNode)> = {
  node: T;
  style: Style;
  children: Oof<T>[];
}

type OofRoot<T extends (INode | ITextNode)> = Oof<T> & {
  cx: number;
  cy: number;
  min: number; // absolute节点预测量阶段，最终需要求得的宽度2个极值，然后最终取max(min, min(aw, max))
  max: number;
}

export class Layout<T extends (INode | ITextNode)> {
  private readonly onConfigured: (node: T, res: Result) => void;
  private readonly measureText?: MeasureText;
  private readonly rem?: number;

  // constraints和node是一一对应的，入口节点就是构造器传入的inputConstraints
  private readonly constraintsStack: Constraints[] = [];
  private readonly nodeStack: T[] = [];
  private readonly styleStack: Style[] = [];
  private readonly resultStack: Result[] = []; // 不考虑relative偏移修正的中间结果
  // 最终relative修正队列，end时所有数据暂存进这个队列，整体结束遍历一遍修正偏移并触发onConfigured回调
  private readonly offsetQueue: { node: T, style: Style, parentConstraints?: Constraints, res: Result, level: number }[] = [];

  private layoutMode: LayoutMode = LayoutMode.NORMAL;

  // absolute且自适应尺寸时需要暂停并记录子树结构，在相对父节点end()后获得约束尺寸后重新开始处理
  private oof: Oof<T> | null = null;
  private oofRoot: OofRoot<T> | null = null;
  // 预测量时伴随begin入栈/end出栈，使得currentOof能够正确指向
  private readonly oofStack: Oof<T>[] = [];
  // absolute节点为key，end时检测结束预测量状态
  private oofMap: WeakMap<T, OofRoot<T>> = new WeakMap();
  // 有相对父节点的以父节点为key，end时检查，此时预测量结束状态重置开始处理此节点
  private oofParentMap: WeakMap<T, OofRoot<T>> = new WeakMap();
  // 没有相对父节点的记录下来等全部结束后处理
  private oofQueue: OofRoot<T>[] = [];

  // inline在end()结束时需看最后一个子节点的mpb-right，递归过程记录最后一个处理的节点就是子节点
  private lastChild: Inline | Text | null = null;

  constructor(
    inputConstraints: InputConstraints,
    onConfigured: (node: T, res: Result) => void,
    measureText?: MeasureText,
    rem?: number,
  ) {
    const c = {
      ox: inputConstraints.ox || 0,
      oy: inputConstraints.oy || 0,
      aw: inputConstraints.aw,
      ah: inputConstraints.ah,
      pbw: inputConstraints.pbw ?? inputConstraints.aw,
      pbh: inputConstraints.pbh ?? inputConstraints.ah,
      cx: inputConstraints.cx ?? (inputConstraints.ox || 0),
      cy: inputConstraints.cy ?? (inputConstraints.oy || 0),
    };
    this.constraintsStack.push(c);
    this.onConfigured = onConfigured;
    this.measureText = measureText;
    this.rem = rem;
  }

  /**
   * @param node      - 节点
   * @param style     - 节点样式对象
   */
  begin(node: T, style: Style) {
    // absolute测量模式，只记录树结构，等其相对父节点end()时机重新唤起
    if (this.layoutMode & LayoutMode.OOF_MEASURE) {
      const oof: Oof<T> = {
        node,
        style,
        children: [],
      };
      this.oofStack.push(oof);
      this.oof!.children.push(oof);
      this.oof = oof;
      // return;
    }
    // if (style.position !== Position.ABSOLUTE) {
      this.nodeStack.push(node);
      this.styleStack.push(style);
    // }
    const constraintsStack = this.constraintsStack;
    const constraints = constraintsStack[constraintsStack.length - 1];
    // absolute进入预测量模式
    if (style.position === Position.ABSOLUTE) {
      this.absolute(node, style, constraints);
    }
    // text一定是叶子节点无需继续递归
    else if (node.nodeType === NodeType.Text) {
      this.text(style, constraints, (node as ITextNode).content);
    }
    else if (style.display === Display.INLINE) {
      this.inline(style, constraints);
    }
    // 默认block
    else {
      this.block(style, constraints);
    }
  }

  end(node: T) {
    const { constraintsStack, nodeStack, oofMap, oofParentMap, oofStack, resultStack, styleStack } = this;
    // absolute测量模式，记录树结构，管理当前节点记录出栈
    if (this.layoutMode & LayoutMode.OOF_MEASURE) {
      oofStack.pop();
      this.oof = oofStack[oofStack.length - 1] || null;
      // absolute预测量结束了，回归正常模式
      if (oofMap.has(node)) {
        oofMap.delete(node);
        this.layoutMode &= ~LayoutMode.OOF_MEASURE;
        this.oofRoot = null;
      }
      return;
    }
    // 正常模式的匹配检测
    if (!nodeStack.length) {
      throw new Error('Stack Error: Attempted to end a node but the stack is already empty. This indicates an extra \'end()\' call or missing \'begin()\'.');
    }
    const n = nodeStack.pop()!;
    if (node !== n) {
      throw new Error('Layout mismatch: end() was called for ' + node + ', but the current stack expects ' + node + '. Ensure begin() and end() are called in balanced pairs.');
    }
    const style = styleStack.pop()!;
    const res = resultStack.pop()!;
    // 真正的inline内容叶子节点递归向上处理所有inline父节点
    if (node.nodeType === NodeType.Text) {
      if (styleStack.length) {
        let index = styleStack.length - 1;
        while (index >= 0) {
          const parentStyle = styleStack[index];
          if (parentStyle.display === Display.INLINE) {
            const parentRect = resultStack[index] as Inline;
            const current = resultStack[index + 1] || res; // 向上递归current指向之前的孩子
            let mbp = 0;
            (res as Text).rects.forEach(lineBox => {
              // inline的开头要考虑mpb
              if (!parentRect.rects.length) {
                mbp = current.marginLeft + current.borderLeftWidth + current.paddingLeft;
                parentRect.rects.push({
                  x: lineBox.x - mbp,
                  y: lineBox.y,
                  w: lineBox.w + mbp,
                  h: lineBox.h,
                });
              }
              else {
                parentRect.rects.push({
                  x: lineBox.x,
                  y: lineBox.y,
                  w: lineBox.w,
                  h: lineBox.h,
                });
              }
              parentRect.w = Math.max(parentRect.w, current.x + current.w - parentRect.x);
              parentRect.h = Math.max(parentRect.h, current.y + current.h - parentRect.y);
            });
          }
          // inline可能包含block，中断，在block中还会继续向上递归，因为流顺序最后处理的叶子节点一定是正确的
          else {
            break;
          }
          index--;
        }
      }
      this.lastChild = res as Text;
    }
    else {
      const c = constraintsStack.pop()!;
      const cp = constraintsStack[constraintsStack.length - 1];
      if (style.position === Position.ABSOLUTE) {
        this.lastChild = null;
      }
      // 每个inline结束时，检查最后一个子节点的mpb，需考虑
      else if (style.display === Display.INLINE) {
        const r = (res as Inline);
        // 有可能没有，比如inline没有子节点
        if (r.rects.length && this.lastChild && this.lastChild.rects.length) {
          const mbp = this.lastChild.marginRight + this.lastChild.borderRightWidth + this.lastChild.paddingRight;
          if (mbp) {
            const last = r.rects[r.rects.length - 1];
            last.w += mbp;
            r.w = Math.max(r.w, last.x + last.w - r.x);
          }
        }
        this.lastChild = res as Inline;
      }
      // 默认block
      else {
        const mbp = res.marginBottom + res.paddingBottom + res.borderBottomWidth;
        // 自动高度，以及%高度但父级是auto
        if (style.height.u === Unit.AUTO || style.height.u === Unit.PERCENT && c.pbh === undefined) {
          res.h = c.cy - c.oy;
        }
        if (cp) {
          cp.cy = res.y + res.h + mbp;
        }
        // inline可能包含block，兼容也需要向上处理，类似子inline一样的逻辑
        if (styleStack.length) {
          let index = styleStack.length - 1;
          while (index >= 0) {
            const parentStyle = styleStack[index];
            if (parentStyle.display === Display.INLINE) {
              const parentRect = resultStack[index] as Inline;
              const current = resultStack[index + 1] || res; // 向上递归current指向之前的孩子
              parentRect.w = Math.max(parentRect.w, current.x + current.w - parentRect.x);
              parentRect.h = Math.max(parentRect.h, current.y + current.h - parentRect.y);
            }
            else {
              break;
            }
            index--;
          }
        }
        this.lastChild = null;
      }
    }
    // 这里是后序进入offsetQueue，因为叶子节点先触发
    this.offsetQueue.push({
      node,
      style,
      parentConstraints: constraintsStack[constraintsStack.length - 1], // 存父节点的，根没有
      res,
      level: this.nodeStack.length,
    });
    // 处理有相对父节点的absolute节点，此时相对父节点已经有了计算尺寸，%可以正常计算
    if (oofParentMap.has(node)) {
      const root = oofParentMap.get(node)!;
      console.log(root);
    }
    // 根节点end()则全部结束，处理非根的absolute，然后所有结果进行偏移修正并触发回调
    if (!this.nodeStack.length) {
      this.finish();
    }
  }

  finish() {
    const offsetQueue = this.offsetQueue;
    const offsetStack: { x: number, y: number }[] = [];
    let offsetX = 0, offsetY = 0;
    let lastLevel = -1;
    // 倒过来就是先序遍历
    for (let i = offsetQueue.length - 1; i >= 0; i--) {
      const { node, style, parentConstraints, res, level } = offsetQueue[i];
      // 递归向下，或者平级（无children的兄弟节点）
      if (level >= lastLevel) {
        // 同级说明上一个无children节点，出栈
        if (level === lastLevel) {
          const o = offsetStack.pop()!;
          offsetX -= o.x;
          offsetY -= o.y;
        }
        if (node.nodeType === NodeType.Node && style.position === Position.RELATIVE) {
          let x = 0, y = 0;
          const { left, top, right, bottom } = style;
          if (left.u !== Unit.AUTO) {
            x = this.calLength(left, res.w, res.fontSize, this.rem ?? 16);
          }
          else if (right.u !== Unit.AUTO) {
            x = -this.calLength(right, res.w, res.fontSize, this.rem ?? 16);
          }
          if (top.u !== Unit.AUTO) {
            // 注意%单位时如果约束尺寸为auto（父节点height为auto）视为0
            if (top.u !== Unit.PERCENT || parentConstraints!.pbh !== undefined) {
              y = this.calLength(top, res.h, res.fontSize, this.rem ?? 16);
            }
          }
          else if (bottom.u !== Unit.AUTO) {
            if (bottom.u !== Unit.PERCENT || parentConstraints!.pbh !== undefined) {
              y = -this.calLength(bottom, res.h, res.fontSize, this.rem ?? 16);
            }
          }
          // 入栈，为后面向下递归或平级做准备
          offsetStack.push({ x, y });
          offsetX += x;
          offsetY += y;
        }
        else {
          offsetStack.push({ x: 0, y: 0 });
        }
      }
      // 向上可能出现多级
      else {
        for (let j = level; j <= lastLevel; j++) {
          const o = offsetStack.pop()!;
          offsetX -= o.x;
          offsetY -= o.y;
        }
      }
      // 有偏移才累加上去
      if (offsetX || offsetY) {
        res.x += offsetX;
        res.y += offsetY;
        if (res.rects) {
          res.rects.forEach(item => {
            item.x += offsetX;
            item.y += offsetY;
          });
          if (res.type === 'text') {
            res.rects.forEach(item => {
              item.list.forEach(v => {
                v.x += offsetX;
                v.y += offsetY;
              });
            });
          }
        }
      }
      this.onConfigured(node, res);
      lastLevel = level;
    }
    // 完成清空
    offsetQueue.splice(0);
  }

  block(style: Style, constraints: Constraints) {
    const res = this.preset(style, constraints, 'box') as Box;
    res.type = 'box';
    this.resultStack.push(res);
    // 返回递归的供子节点使用
    const ox = constraints.cx + res.marginLeft + res.paddingLeft + res.borderLeftWidth;
    const oy = constraints.cy + res.marginTop + res.paddingTop + res.borderTopWidth;
    const c: Constraints = {
      ox,
      oy,
      aw: res.w,
      ah: res.h,
      cx: oy,
      cy: oy,
      pbw: res.w,
      pbh: res.h,
    };
    if (style.width.u === Unit.AUTO) {
      c.pbw = c.aw = res.w =
        Math.max(0, constraints.aw - (res.marginLeft + res.marginRight + res.paddingLeft + res.paddingRight + res.borderLeftWidth + res.borderRightWidth));
    }
    if (style.height.u === Unit.AUTO) {
      c.ah = Infinity;
      c.pbh = undefined; // auto
    }
    // 父级高度auto时，%失效也是auto
    else if (style.height.u === Unit.PERCENT && constraints.pbh === undefined) {
      c.ah = Infinity;
      c.pbh = undefined;
    }
    this.constraintsStack.push(c);
  }

  inline(style: Style, constraints: Constraints) {
    const res = this.preset(style, constraints, 'inline') as Inline;
    // inline的上下margin无效，border/padding对绘制有效但布局无效
    res.marginTop = res.marginBottom = 0;
    this.resultStack.push(res);
    // 修改当前的，inline复用
    constraints.cx += res.marginLeft + res.paddingLeft + res.borderLeftWidth;
    this.constraintsStack.push(constraints);
  }

  text(style: Style, constraints: Constraints, content: string) {
    const res = this.preset(style, constraints, 'text') as Text;
    this.resultStack.push(res);
    if (!this.measureText) {
      throw new Error('Text must be passed to the measureText method.');
    }
    // inline的上下margin无效
    res.marginTop = res.marginBottom = 0;
    let cx = constraints.cx + res.marginLeft + res.paddingLeft + res.borderLeftWidth;
    let cy = constraints.cy;
    let aw = constraints.aw;
    let maxW = 0;
    let lineBox: LineBox = {
      x: cx,
      y: cy,
      w: 0,
      h: 0,
      baseline: 0,
      list: [],
    };
    const lineBoxes: LineBox[] = [lineBox];
    let i = 0;
    let length = content.length;
    // 使用一种预测字符长度的技术，结合2分查找，减少调用measureText的次数
    while (i < length) {
      if (isEnter(content[i])) {
        i++;
        cx = constraints.ox;
        cy += res.lineHeight;
      }
      const {
        num,
        width,
        newLine,
        baseline,
      } = smartMeasure(
        this.measureText,
        content,
        i,
        length,
        aw,
        style.fontFamily,
        res.fontSize,
        res.lineHeight,
        style.fontWeight,
        style.fontStyle,
        res.letterSpacing,
      );
      const textBox: TextBox = {
        x: cx,
        y: cy,
        w: width,
        h: res.lineHeight,
        baseline,
        content: content.slice(i, num),
      };
      i += num;
      lineBox.w = textBox.x + width - lineBox.x;
      lineBox.list.push(textBox);
      maxW = Math.max(maxW, lineBox.w);
      // 每行按baseline对齐
      if (newLine || i === length) {
        let baseline = 0;
        lineBox.list.forEach(textBox => {
          baseline = Math.max(baseline, textBox.baseline);
        });
        lineBox.baseline = baseline;
        lineBox.list.forEach(textBox => {
          const d = baseline - textBox.baseline;
          textBox.y += d;
          lineBox.h = Math.max(lineBox.h, textBox.y - lineBox.y + textBox.h);
        });
      }
      if (newLine) {
        cx = constraints.ox;
        cy += res.lineHeight;
        // 新开一行
        if (i < length) {
          lineBox = {
            x: cx,
            y: cy,
            w: 0,
            h: 0,
            baseline: 0,
            list: [],
          };
          lineBoxes.push(lineBox);
        }
      }
      else {
        cx = textBox.x + textBox.w;
      }
    }
    res.w = maxW;
    const last = lineBox;
    res.h = last.y + last.h - constraints.cy;
    res.rects = lineBoxes;
    // 没有子节点不需要产生新的递归约束
    constraints.cy += res.h;
  }

  inlineBlock(style: Style, constraints: Constraints) {
  }

  flex(style: Style, constraints: Constraints) {
  }

  inlineFlex(style: Style, constraints: Constraints) {
  }

  grid(style: Style, constraints: Constraints) {
  }

  inlineGrid(style: Style, constraints: Constraints) {
  }

  absolute(node: T, style: Style, constraints: Constraints) {
    // absolute预测量阶段忽略递归的absolute
    if (this.layoutMode & LayoutMode.OOF_MEASURE) {
      return;
    }
    // 寻找到相对父节点，没有则相对于全局或者是root节点；等到父节点end()前知道尺寸后开始处理absolute节点
    let parent: T | null = null;
    for (let i = this.styleStack.length - 1; i >= 0; i--) {
      const item = this.styleStack[i];
      if (item.position === Position.ABSOLUTE || item.position === Position.RELATIVE) {
        parent = this.nodeStack[i];
        break;
      }
    }
    // 如果绝对值定宽，直接处理即可；位置可以等最后处理偏移
    const { left, right, width } = style;
    let isFixedWidth = false;
    if ([Unit.PX, Unit.IN, Unit.EM, Unit.REM, Unit.NUMBER].includes(width.u)) {
      isFixedWidth = true;
    }
    // absolute强制block
    if (isFixedWidth) {
      this.block(style, constraints);
      return;
    }
    // 统一在相对父节点的end()时处理，没有相对父节点在全部结束后处理（非根）
    if (parent || this.nodeStack.length) {
      this.layoutMode |= LayoutMode.OOF_MEASURE;
      this.oof = {
        node,
        style,
        children: [],
      };
      const root: OofRoot<T>
        = this.oofRoot
        = Object.assign({ cx: constraints.cx, cy: constraints.cy, min: 0, max: 0 }, this.oof);
      this.oofMap.set(node, root);
      if (parent) {
        this.oofParentMap.set(parent, root);
      }
      else {
        this.oofQueue.push(root);
      }
    }
    // 如果自己就是根节点可以直接处理
    else {
      if (style.display === Display.INLINE) {
        this.inline(style, constraints);
      }
      else {
        this.block(style, constraints);
      }
    }
  }

  preset(style: Style, constraints: Constraints, type: Result['type']) {
    const res: any = {
      type,
      rects: type === 'box' ? null : [],
      x: constraints.cx,
      y: constraints.cy,
      w: 0,
      h: 0,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: FontStyle.NORMAL,
      lineHeight: 24,
      letterSpacing: 0,
    };
    const rem = this.rem ?? 16;

    const last = this.resultStack.length ? this.resultStack[this.resultStack.length - 1] : null;

    if (style.fontFamily === 'inherit') {
      if (last) {
        res.fontFamily = last.fontFamily;
      }
    }
    else {
      res.fontFamily = style.fontFamily;
    }

    if (style.fontSize.u === Unit.INHERIT) {
      if (last) {
        res.fontSize = last.fontSize;
      }
    }
    else {
      res.fontSize = Math.max(0, this.calLength(style.fontSize, last ? last.fontSize * 100 : 1600, 0, rem));
    }

    ([
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
    ] as const).forEach(k => {
      res[k] = this.calLength(style[k], constraints.pbw, res.fontSize, rem);
    });

    ([
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
    ] as const).forEach(k => {
      res[k] = Math.max(0, this.calLength(style[k], constraints.pbw, res.fontSize, rem));
    });

    ([
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
      'lineHeight',
      'letterSpacing',
    ] as const).forEach(k => {
      const { v, u } = style[k];
      if (k === 'lineHeight' && u === Unit.NUMBER) {
        res[k] = Math.max(0, v * res.fontSize);
      }
      else if (k === 'lineHeight' && u === Unit.INHERIT) {
        if (last) {
          res[k] = last.lineHeight;
        }
      }
      else if (k === 'lineHeight') {
        res[k] = Math.max(0, this.calLength(style[k], last?.lineHeight || 0, res.fontSize, rem));
      }
      else {
        res[k] = Math.max(0, this.calLength(style[k], constraints.pbw, res.fontSize, rem));
      }
    });

    if (style.width.u !== Unit.AUTO) {
      res.w = Math.max(0, this.calLength(style.width, constraints.pbw, res.fontSize, rem));
      if (style.boxSizing === BoxSizing.BORDER_BOX) {
        res.w = Math.max(0, res.w - (res.borderLeftWidth + res.borderRightWidth + res.paddingLeft + res.paddingRight));
      }
    }

    // 父auto子%，不计算默认0
    if (style.height.u !== Unit.AUTO && (constraints.pbh !== undefined || style.height.u !== Unit.PERCENT)) {
      res.h = Math.max(0, this.calLength(style.height, constraints.pbh || 0, res.fontSize, rem));
      if (style.boxSizing === BoxSizing.BORDER_BOX) {
        res.h = Math.max(0, res.h - (res.borderTopWidth + res.borderBottomWidth + res.paddingTop + res.paddingBottom));
      }
    }

    // 排除mbp后的contentBox的坐标，注意inline不考虑y方向
    res.x += res.marginLeft + res.borderLeftWidth + res.paddingLeft;
    if (type === 'box') {
      res.y += res.marginTop + res.borderTopWidth + res.paddingTop;
      return res as Box;
    }
    return type === 'inline' ? (res as Inline) : (res as Text);
  }

  calLength(target: Length, pb: number, em: number, rem: number) {
    if (target.u === Unit.PX || target.u === Unit.NUMBER) {
      return target.v;
    }
    else if (target.u === Unit.PERCENT) {
      return target.v * 0.01 * pb;
    }
    else if (target.u === Unit.IN) {
      return target.v * 96;
    }
    else if (target.u === Unit.EM) {
      return target.v * em;
    }
    else if (target.u === Unit.REM) {
      return target.v * rem;
    }
    return 0;
  }

  getParentHeightWhenRelative() {
    const styleStack = this.styleStack;
    let res = 0;
    // 最后一个是当前relative节点，从-2开始
    for (let i = styleStack.length - 2; i >= 0; i--) {}
    return res;
  }
}
