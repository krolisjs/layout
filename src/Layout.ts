import { Context } from './context';
import { Display, Hook, Position, Style } from './types';

export class Layout {
  constructor() {
  }

  /**
   * @param ctx       - 全局状态 (traceId, LayoutMode, AbsQueue...)
   * @param node      - 节点 ID (唯一 Key)
   * @param style     - 样式对象
   * @param hooks     - 布局钩子，在一些过程和结果时调用，外部获取数据
   * @param ox        - 输入起始坐标 (数字)
   * @param oy
   * @param aw        - 可用空间约束 (数字)
   * @param ah
   * @param pbw       - 百分比计算基准 (数字)
   * @param pbh
   */
  layout(ctx: Context, node: object, style: Partial<Style>, hooks: Hook,
         ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {
    if (style.position === Position.ABSOLUTE) {
      return this.layoutAbsolute(ctx, node, style, hooks, ox, oy, aw, ah, pbw, pbh);
    }
    else if (style.display === Display.BLOCK) {
      return this.layoutBlock(ctx, node, style, hooks, ox, oy, aw, ah, pbw, pbh);
    }
    else if (style.display === Display.INLINE) {
      return this.layoutInline(ctx, node, style, hooks, ox, oy, aw, ah, pbw, pbh);
    }
  }

  layoutBlock(ctx: Context, node: object, style: Partial<Style>, hooks: Hook,
         ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutInline(ctx: Context, node: object, style: Partial<Style>, hooks: Hook,
              ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutInlineBlock(ctx: Context, node: object, style: Partial<Style>, hooks: Hook,
              ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutFlex(ctx: Context, node: object, style: Partial<Style>, hooks: Hook,
              ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutInlineFlex(ctx: Context, node: object, style: Partial<Style>, hooks: Hook,
             ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutGrid(ctx: Context, node: object, style: Partial<Style>, hooks: Hook,
             ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutInlineGrid(ctx: Context, node: object, style: Partial<Style>, hooks: Hook,
                   ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}

  layoutAbsolute(ctx: Context, node: object, style: Partial<Style>, hooks: Hook,
                 ox: number, oy: number, aw: number, ah: number, pbw = aw, pbh = ah,
  ) {}
}
