import { BoxSizing, Display, Position, Style, Unit } from './style';

export type Rect = {
  x: number; // 算上margin后的
  y: number;
  w: number; // innerSize
  h: number;
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
};

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

export type MeasureText = (text: string, fontFamily: string, fontSize: number, fontWeight?: number, fontStyle?: string, letterSpacing?: number) => { width: number; height: number };

export class Layout<T extends object = any> {
  private readonly onConfigured: (node: T, rect: Rect) => void;
  private readonly measureText?: MeasureText;
  private readonly rem?: number;
  // constraints和node是一一对应的，入口节点就是构造器传入的inputConstraints
  private readonly constraintsStack: Constraints[] = [];
  private readonly nodeStack: T[] = [];
  private readonly rectStack: Rect[] = [];

  // constraintsStack会因递归产生大量小对象，防止gc抖动用对象池
  private constraintsPool: ConstraintsPool = new ConstraintsPool();

  constructor(inputConstraints: InputConstraints, onConfigured: (node: T, rect: Rect) => void, measureText?: MeasureText, rem?: number) {
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
   * @param node      - 节点 ID (唯一 Key)
   * @param style     - 节点样式对象
   */
  begin(node: T, style: Style) {
    this.nodeStack.push(node);
    const constraintsStack = this.constraintsStack;
    const constraints = constraintsStack[constraintsStack.length - 1];
    if (style.position === Position.ABSOLUTE) {
      this.absolute(style, constraints);
    }
    else if (style.display === Display.INLINE) {
      this.inline(style, constraints);
    }
    // 默认block
    else {
      const c = this.block(style, constraints);
      constraintsStack.push(c);
    }
  }

  end(node: T, style: Style) {
    if (!this.nodeStack.length) {
      throw new Error('Stack Error: Attempted to end a node but the stack is already empty. This indicates an extra \'end()\' call or missing \'begin()\'.');
    }
    const n = this.nodeStack.pop()!;
    if (node !== n) {
      throw new Error('Layout mismatch: end() was called for ' + node + ', but the current stack expects ' + node + '. Ensure start() and end() are called in balanced pairs.');
    }
    const c = this.constraintsStack.pop()!;
    this.constraintsPool.pop();
    const rect = this.rectStack.pop()!;
    if (style.position === Position.ABSOLUTE) {}
    else if (style.display === Display.INLINE) {}
    // 默认block
    else {
      if (style.height.u === Unit.AUTO) {
        rect.h = c.cy - c.oy - (rect.marginBottom + rect.paddingTop + rect.paddingBottom + rect.borderTopWidth + rect.borderBottomWidth);
      }
    }
    // 为空说明此轮布局结束
    if (!this.nodeStack.length) {
      this.constraintsPool.reset();
    }
    this.onConfigured(node, rect);
  }

  block(style: Style, constraints: Constraints) {
    const res = this.preset(style, constraints);
    this.rectStack.push(res);
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
    return constraints;
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

  preset(style: Style, constraints: Constraints) {
    const res: Rect = {
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
      fontSize: 0,
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

    return res;
  }
}
