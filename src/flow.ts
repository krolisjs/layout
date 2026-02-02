import { Context } from './context';
import { Style } from './types';

export function layoutBlock(ctx: Context, style: Style, originX: number, originY: number, availableWidth: number, availableHeight: number) {
  return { x: 0, y: 0, w: 0, h: 0 };
}

export function layoutInline(ctx: Context, style: Style, originX: number, originY: number, availableWidth: number, availableHeight: number) {
  return { x: 0, y: 0, w: 0, h: 0 };
}

export function layoutInlineBlock(ctx: Context, style: Style, originX: number, originY: number, availableWidth: number, availableHeight: number) {
  return { x: 0, y: 0, w: 0, h: 0 };
}

export function layoutFlex(ctx: Context, style: Style, originX: number, originY: number, availableWidth: number, availableHeight: number) {
  return { x: 0, y: 0, w: 0, h: 0 };
}

export function layoutFlexInline(ctx: Context, style: Style, originX: number, originY: number, availableWidth: number, availableHeight: number) {
  return { x: 0, y: 0, w: 0, h: 0 };
}

export function layoutAbsolute(ctx: Context, style: Style, originX: number, originY: number, availableWidth: number, availableHeight: number) {
  return { x: 0, y: 0, w: 0, h: 0 };
}
