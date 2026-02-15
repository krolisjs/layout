import { BoxSizing, Display, Position, Style, Unit } from './style';
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
  fontSize: number;
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

export type LayoutResult = Box | Inline | Text;

export type Constraints = {
  ox: number; // 相对原点坐标
  oy: number;
  aw: number; // 可用尺寸
  ah: number;
  pbw: number; // 百分比基于尺寸
  pbh: number;
  cx: number; // 当前坐标，block流用到
  cy: number;
};

export type InputConstraints = Pick<Constraints, 'aw' | 'ah'>
  & Partial<Omit<Constraints, 'aw' | 'ah'>>;

export enum LayoutMode {
  NORMAL = 0,
  MIN_MAX = 1, // flex
  OOF_MEASURE = 2, // absolute
}

class ConstraintsPool {
  private pool: Constraints[] = [];
  private ptr = 0;

  get(ox: number, oy: number, aw: number, ah: number, cx = ox, cy = oy, pbw = aw, pbh = ah) {
    if (this.ptr < this.pool.length) {
      const obj = this.pool[this.ptr++];
      // 重新赋值，复用旧对象
      obj.ox = ox;
      obj.oy = oy;
      obj.aw = aw;
      obj.ah = ah;
      obj.cx = cx;
      obj.cy = cy;
      obj.pbw = pbw;
      obj.pbh = pbh;
      return obj;
    }
    const newObj = { ox, oy, aw, ah, cx, cy, pbw, pbh } as Constraints;
    this.pool.push(newObj);
    this.ptr++;
    return newObj;
  }

  pop() {
    this.ptr--;
  }

  reset() {
    this.ptr = 0;
    this.pool.splice(0);
  }
}

export class Layout<T extends (INode | ITextNode)> {
  private readonly onConfigured: (node: T, res: LayoutResult) => void;
  private readonly measureText?: MeasureText;
  private readonly rem?: number;
  private readonly ignoreEnter?: boolean;

  // constraints和node是一一对应的，入口节点就是构造器传入的inputConstraints
  private readonly constraintsStack: Constraints[] = [];
  private readonly nodeStack: T[] = [];
  private readonly styleStack: Style[] = [];
  private readonly resultStack: LayoutResult[] = [];

  // constraintsStack会因递归产生大量小对象，防止gc抖动用对象池
  private constraintsPool: ConstraintsPool = new ConstraintsPool();

  // inline在end()结束时需看最后一个子节点的mpb-right，递归过程记录最后一个处理的节点就是子节点
  private lastIT: Inline | Text | null = null;

  constructor(
    inputConstraints: InputConstraints,
    onConfigured: (node: T, res: LayoutResult) => void,
    measureText?: MeasureText,
    rem?: number,
    ignoreEnter?: boolean,
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
    this.ignoreEnter = ignoreEnter;
  }

  /**
   * @param node      - 节点 ID (唯一 Key)
   * @param style     - 节点样式对象
   */
  begin(node: T, style: Style) {
    this.nodeStack.push(node);
    this.styleStack.push(style);
    const constraintsStack = this.constraintsStack;
    const constraints = constraintsStack[constraintsStack.length - 1];
    // text一定是叶子节点无需继续递归
    if (node.nodeType === NodeType.Text) {
      this.text(style, constraints, (node as ITextNode).content);
    }
    else if (style.position === Position.ABSOLUTE) {
      this.absolute(style, constraints);
    }
    else if (style.display === Display.INLINE) {
      const c = this.inline(style, constraints);
      constraintsStack.push(c);
    }
    // 默认block
    else {
      const c = this.block(style, constraints);
      constraintsStack.push(c);
    }
  }

  end(node: T) {
    const { constraintsPool, constraintsStack, nodeStack, resultStack, styleStack } = this;
    if (!nodeStack.length) {
      throw new Error('Stack Error: Attempted to end a node but the stack is already empty. This indicates an extra \'end()\' call or missing \'begin()\'.');
    }
    const n = nodeStack.pop()!;
    if (node !== n) {
      throw new Error('Layout mismatch: end() was called for ' + node + ', but the current stack expects ' + node + '. Ensure start() and end() are called in balanced pairs.');
    }
    const style = styleStack.pop()!;
    const c = constraintsStack.pop()!;
    constraintsPool.pop();
    const rect = resultStack.pop()!;
    // 真正的inline内容叶子节点递归向上处理所有inline父节点
    if (node.nodeType === NodeType.Text) {
      if (styleStack.length) {
        let index = styleStack.length - 1;
        while (index >= 0) {
          const parentStyle = styleStack[index];
          if (parentStyle.display === Display.INLINE) {
            const parentRect = resultStack[index] as Inline;
            const current = resultStack[index + 1] || rect; // 向上递归current指向之前的孩子
            let mpb = 0;
            (rect as Text).rects.forEach(lineBox => {
              // inline的开头要考虑mpb
              if (!parentRect.rects.length) {
                mpb = current.marginLeft + current.paddingLeft + current.borderLeftWidth;
                parentRect.rects.push({
                  x: lineBox.x - mpb,
                  y: lineBox.y,
                  w: lineBox.w + mpb,
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
              parentRect.w = Math.max(parentRect.w, current.x + current.w - parentRect.x + mpb);
              parentRect.h = Math.max(parentRect.h, current.y + current.h - parentRect.y);
            });
          }
          else {
            break;
          }
          index--;
        }
      }
      this.lastIT = rect as Text;
    }
    else if (style.position === Position.ABSOLUTE) {
      this.lastIT = null;
    }
    // 每个inline结束时，检查最后一个子节点的mpb-right，需考虑
    else if (style.display === Display.INLINE) {
      const r= (rect as Inline);
      // 有可能没有，比如inline没有子节点
      if (r.rects.length && this.lastIT && this.lastIT.rects.length) {
        const mpb = this.lastIT.marginRight + this.lastIT.paddingRight + this.lastIT.borderRightWidth;
        if (mpb) {
          const last = r.rects[r.rects.length - 1];
          last.w += mpb;
          r.w = Math.max(r.w, last.x + last.w - r.x);
        }
      }
      this.lastIT = rect as Inline;
    }
    // 默认block
    else {
      if (style.height.u === Unit.AUTO) {
        rect.h = c.cy - c.oy - (rect.marginBottom + rect.paddingTop + rect.paddingBottom + rect.borderTopWidth + rect.borderBottomWidth);
      }
      this.lastIT = null;
    }
    // 为空说明此轮布局结束
    if (!nodeStack.length) {
      constraintsPool.reset();
    }
    this.onConfigured(node, rect);
  }

  block(style: Style, constraints: Constraints) {
    const res = this.preset(style, constraints, 'box') as Box;
    res.type = 'box';
    this.resultStack.push(res);
    // 修改当前的
    constraints.cy += res.marginTop + res.paddingTop + res.borderTopWidth + res.h + res.marginBottom + res.paddingBottom + res.borderBottomWidth;
    // 返回递归的供子节点使用
    const ox = constraints.ox + res.marginLeft + res.paddingLeft + res.borderLeftWidth;
    const oy = constraints.oy + res.marginTop + res.paddingTop + res.borderTopWidth;
    const c = this.constraintsPool.get(ox, oy, res.w, res.h);
    if (style.width.u === Unit.AUTO) {
      c.pbw = c.aw = res.w =
        Math.max(0, constraints.aw - (res.marginLeft + res.marginRight + res.paddingLeft + res.paddingRight + res.borderLeftWidth + res.borderRightWidth));
    }
    return c;
  }

  inline(style: Style, constraints: Constraints) {
    const res = this.preset(style, constraints, 'inline') as Inline;
    // inline的上下margin无效
    res.marginTop = res.marginBottom = 0;
    this.resultStack.push(res);
    // 修改当前的
    constraints.cx += res.marginLeft + res.paddingLeft + res.borderLeftWidth;
    return this.constraintsPool.get(
      constraints.ox, constraints.oy,
      constraints.aw, constraints.ah,
      constraints.cx, constraints.cy,
      constraints.pbw, constraints.pbh,
    );
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
      if (isEnter(content[i]) && !this.ignoreEnter) {
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
  }

  inlineBlock(style: Style, constraints: Constraints) {
    return constraints;
  }

  flex(style: Style, constraints: Constraints) {
    return constraints;
  }

  inlineFlex(style: Style, constraints: Constraints) {
    return constraints;
  }

  grid(style: Style, constraints: Constraints) {
    return constraints;
  }

  inlineGrid(style: Style, constraints: Constraints) {
    return constraints;
  }

  absolute(style: Style, constraints: Constraints) {
    return constraints;
  }

  preset(style: Style, constraints: Constraints, type: LayoutResult['type']) {
    const res: any = {
      type,
      rects: type === 'box' ? null : [],
      x: constraints.ox,
      y: constraints.oy,
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
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
    };
    const rem = this.rem ?? 16;

    const { v, u } = style.fontSize;
    if (u === Unit.PX) {
      res.fontSize = Math.max(0, v);
    }
    else if (u === Unit.REM) {
      res.fontSize = Math.max(0, v * rem);
    }

    ([
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
    ] as const).forEach(k => {
      const { v, u } = style[k];
      if ([Unit.AUTO, Unit.PX].includes(u)) {
        res[k] = 0;
      }
      else if (u === Unit.PERCENT) {
        res[k] = v * 0.01 * constraints.pbw;
      }
      else if (u === Unit.EM) {
        res[k] = v * res.fontSize;
      }
      else if (u === Unit.REM) {
        res[k] = v * rem;
      }
    });

    res.x += res.marginLeft;
    res.y += res.marginTop;

    ([
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
    ] as const).forEach(k => {
      const { v, u } = style[k];
      if ([Unit.AUTO, Unit.PX].includes(u)) {
        res[k] = 0;
      }
      else if (u === Unit.PERCENT) {
        res[k] = Math.max(0, v * 0.01 * constraints.pbw);
      }
      else if (u === Unit.EM) {
        res[k] = Math.max(0, v * res.fontSize);
      }
      else if (u === Unit.REM) {
        res[k] = Math.max(0, v * rem);
      }
    });

    ([
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
      'fontSize',
      'lineHeight',
      'letterSpacing',
    ] as const).forEach(k => {
      const { v, u } = style[k];
      if (u === Unit.PX) {
        res[k] = Math.max(0, v);
      }
      else if (u === Unit.EM) {
        res[k] = Math.max(0, v * res.fontSize);
      }
      else if (u === Unit.REM) {
        res[k] = Math.max(0, v * rem);
      }
      // 只有lineHeight可能
      else if (u === Unit.NUMBER) {
        if (k === 'lineHeight') {
          res[k] = Math.max(0, v * res.fontSize);
        }
        else {
          res[k] = Math.max(0, v);
        }
      }
    });

    if (style.width.u === Unit.PX) {
      res.w = Math.max(0, style.width.v);
    }
    else if (style.width.u === Unit.PERCENT) {
      res.w = Math.max(0, style.width.v * 0.01 * constraints.pbw);
    }
    else if (style.width.u === Unit.EM) {
      res.w = Math.max(0, style.width.v * res.fontSize);
    }
    else if (style.width.u === Unit.REM) {
      res.w = Math.max(0, style.width.v * rem);
    }
    if (style.boxSizing === BoxSizing.BORDER_BOX) {
      res.w = Math.max(0, res.w - (res.borderLeftWidth + res.borderRightWidth + res.paddingLeft + res.paddingRight));
    }

    if (style.height.u === Unit.PX) {
      res.h = Math.max(0, style.height.v);
    }
    else if (style.height.u === Unit.PERCENT) {
      res.h = Math.max(0, style.height.v * 0.01 * constraints.pbh);
    }
    else if (style.height.u === Unit.EM) {
      res.h = Math.max(0, style.height.v * res.fontSize);
    }
    else if (style.height.u === Unit.REM) {
      res.h = Math.max(0, style.height.v * rem);
    }
    if (style.boxSizing === BoxSizing.BORDER_BOX) {
      res.h = Math.max(0, res.h - (res.borderTopWidth + res.borderBottomWidth + res.paddingTop + res.paddingBottom));
    }

    if (type === 'box') {
      return res as Box;
    }

    return type === 'inline' ? (res as Inline) : (res as Text);
  }
}
