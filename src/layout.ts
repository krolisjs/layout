import { Context } from './context';
import { Display, Position, Style } from './style';

let layout: Layout | undefined;

export class Layout<T extends object = any> {
  private ctxStorage: WeakMap<Context<T>, any>; // 入口发起调用开始一次布局传入同一个ctx引用来识别

  constructor() {
    this.ctxStorage = new WeakMap();
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
  layout(ctx: Context<T>, node: T, style: Partial<Style>,
         ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {
    if (style.position === Position.ABSOLUTE) {
      return this.layoutAbsolute(ctx, node, style, ox, oy, aw, ah, pbw, pbh);
    }
    else if (style.display === Display.BLOCK) {
      return this.layoutBlock(ctx, node, style, ox, oy, aw, ah, pbw, pbh);
    }
    else if (style.display === Display.INLINE) {
      return this.layoutInline(ctx, node, style, ox, oy, aw, ah, pbw, pbh);
    }
  }

  layoutBlock(ctx: Context<T>, node: T, style: Partial<Style>,
         ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutInline(ctx: Context<T>, node: T, style: Partial<Style>,
              ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutInlineBlock(ctx: Context<T>, node: T, style: Partial<Style>,
              ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutFlex(ctx: Context<T>, node: T, style: Partial<Style>,
              ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutInlineFlex(ctx: Context<T>, node: T, style: Partial<Style>,
             ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutGrid(ctx: Context<T>, node: T, style: Partial<Style>,
             ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutInlineGrid(ctx: Context<T>, node: T, style: Partial<Style>,
                   ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutAbsolute(ctx: Context<T>, node: T, style: Partial<Style>,
                 ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  static getInstance() {
    if (!layout) {
      layout = new Layout();
    }
    return layout;
  }
}
