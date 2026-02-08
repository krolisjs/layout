import { Context } from './context';
import { Display, Position, Style, Unit } from './style';

export type Rect = {
  x: number;
  y: number;
  w: number; // innerWidth
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
};

export type Constraints = {
  ox: number;
  oy: number;
  aw: number;
  ah: number;
  pbw: number;
  pbh: number;
};

export type MeasureText = (text: string, fontFamily: string, fontSize: number, fontWeight?: number, fontStyle?: string, letterSpacing?: number) => { width: number; height: number };

export class Layout<T extends object = any> {
  private measureText?: MeasureText;
  // 指令式无法感知tree结构，只能在入口begin时机存入栈，等待end出栈，过程中的节点就是先序遍历的节点
  private ctxNodeStack: WeakMap<Context<T>, T[]> = new WeakMap();
  // 过程中暂存结果，等待结束钩子回调
  private ctxNodeRect: WeakMap<Context<T>, WeakMap<T, Rect>> = new WeakMap();
  // private ctxNodeRes: WeakMap<Context<T>, T[]> = new WeakMap();

  constructor(measureText?: MeasureText) {
    this.measureText = measureText;
  }

  /**
   * @param ctx       - 全局状态钩子 (LayoutMode, AbsQueue...)
   * @param node      - 节点 ID (唯一 Key)
   * @param style     - 样式对象
   * @param ox        - 输入起始坐标 (数字)
   * @param oy
   * @param aw        - 可用空间约束 (数字)
   * @param ah
   * @param pbw       - 百分比计算基准 (数字)
   * @param pbh
   */
  begin(ctx: Context<T>, node: T, style: Style,
         ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {
    // 每次发起调用以ctx是否为新的作为入口判断
    const isEntry = !this.ctxNodeStack.has(ctx);
    const nodeStack = isEntry ? [] : this.ctxNodeStack.get(ctx)!;
    const nodeRect = isEntry ? new WeakMap() : this.ctxNodeRect.get(ctx)!;
    if (isEntry) {
      this.ctxNodeStack.set(ctx, nodeStack);
      this.ctxNodeRect.set(ctx, nodeRect);
    }
    nodeStack.push(node);
    if (style.position === Position.ABSOLUTE) {
      return this.absolute(ctx, node, style, ox, oy, aw, ah, pbw, pbh);
    }
    else if (style.display === Display.INLINE) {
      return this.inline(ctx, node, style, ox, oy, aw, ah, pbw, pbh);
    }
    else {
      return this.block(ctx, nodeRect, node, style, ox, oy, aw, ah, pbw, pbh);
    }
  }

  end(ctx: Context<T>) {
    const nodeStack = this.ctxNodeStack.get(ctx);
    if (!nodeStack) {
      throw new Error('Context Error: Context not found. Ensure \'start(ctx)\' is called before \'end(ctx)\'. ' + ctx.label);
    }
    if (!nodeStack.length) {
      throw new Error('Stack Error: Attempted to end a node but the stack is already empty. This indicates an extra \'end()\' call or missing \'begin()\'.');
    }
    const node = nodeStack.pop()!;
    ctx.onConfigured(node, this.ctxNodeRect.get(ctx)!.get(node)!);
  }

  block(ctx: Context<T>, nodeRect: WeakMap<T, Rect>, node: T, style: Style,
         ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {
    const res = this.preset(ctx, style, ox, oy, aw, ah, pbw, pbh);
    nodeRect.set(node, res);
    const constraints: Constraints = {
      ox: ox + res.marginLeft + res.paddingLeft + res.borderLeftWidth,
      oy: oy + res.marginTop + res.paddingTop + res.borderTopWidth,
      aw: res.w,
      ah: res.h,
      pbw: res.w,
      pbh: res.h,
    };
    return constraints;
  }

  inline(ctx: Context<T>, node: T, style: Style,
              ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {
    const constraints: Constraints = { ox, oy, aw, ah, pbw, pbh };
    return constraints;
  }

  inlineBlock(ctx: Context<T>, node: T, style: Style,
              ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  flex(ctx: Context<T>, node: T, style: Style,
              ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  inlineFlex(ctx: Context<T>, node: T, style: Style,
             ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  grid(ctx: Context<T>, node: T, style: Style,
             ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  inlineGrid(ctx: Context<T>, node: T, style: Style,
                   ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  absolute(ctx: Context<T>, node: T, style: Style,
                 ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {
    const constraints: Constraints = { ox, oy, aw, ah, pbw, pbh };
    return constraints;
  }

  preset(ctx: Context<T>, style: Style, ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah) {
    const res: Rect = {
      x: ox,
      y: oy,
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
    };
    const fontSize = ctx.em || 16;
    ([
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
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
        res[k] = v * 0.01 * pbw;
      }
      else if (u === Unit.EM) {
        res[k] = v * fontSize;
      }
    });
    ([
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
    ] as const).forEach(k => {
      const { v, u } = style[k];
      if (u === Unit.PX) {
        res[k] = v;
      }
      else if (u === Unit.EM) {
        res[k] = v * fontSize;
      }
    });

    if (style.width.u === Unit.AUTO) {
      res.w = aw;
    }
    else if (style.width.u === Unit.PX) {
      res.w = style.width.v;
    }
    else if (style.width.u === Unit.PERCENT) {
      res.w = style.width.v * 0.01 * pbw;
    }
    else if (style.width.u === Unit.EM) {
      res.w = style.width.v * fontSize;
    }

    if (style.height.u === Unit.PX) {
      res.h = style.height.v;
    }
    else if (style.height.u === Unit.PERCENT) {
      res.h = style.height.v * 0.01 * pbh;
    }
    else if (style.height.u === Unit.EM) {
      res.h = style.height.v * fontSize;
    }
    return res;
  }
}
