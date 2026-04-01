import type { ITypeNode } from './node';
import type { ComputedStyle } from './style';
import { Display, Overflow, Position } from './style';
import { getMetricizeFont } from './text';

export function getMbpH(res: ComputedStyle) {
  return getMbpLeft(res) + getMbpRight(res);
}

export function getMbpLeft(res: ComputedStyle) {
  return res.marginLeft + res.borderLeftWidth + res.paddingLeft;
}

export function getMbpRight(res: ComputedStyle) {
  return res.marginRight + res.borderRightWidth + res.paddingRight;
}

export function getMbpV(res: ComputedStyle) {
  return getMbpTop(res) + getMbpBottom(res);
}

export function getMbpTop(res: ComputedStyle) {
  return res.marginTop + res.borderTopWidth + res.paddingTop;
}

export function getMbpBottom(res: ComputedStyle) {
  return res.marginBottom + res.borderBottomWidth + res.paddingBottom;
}

export function calNormalLineHeight(fontFamily: string, fontSize: number) {
  const metricizeFont = getMetricizeFont();
  if (!metricizeFont) {
    throw new Error('Text must be passed to the metricizeFont method.');
  }
  const m = metricizeFont(fontFamily);
  return fontSize * (m.ascentRatio + m.descentRatio + (m.lineGapRatio || 0));
}

export function calBaseline(fontFamily: string, fontSize: number, lineHeight: number) {
  const metricizeFont = getMetricizeFont();
  const m = metricizeFont!(fontFamily);
  const leading = calLeading(fontFamily, fontSize, lineHeight);
  return leading * 0.5 + fontSize * m.ascentRatio;
}

export function calLeading(fontFamily: string, fontSize: number, lineHeight: number) {
  const h = calContentArea(fontFamily, fontSize);
  return lineHeight - h;
}

export function calContentArea(fontFamily: string, fontSize: number) {
  const metricizeFont = getMetricizeFont();
  if (!metricizeFont) {
    throw new Error('Text must be passed to the metricizeFont method.');
  }
  const m = metricizeFont(fontFamily);
  return fontSize * Math.max(0, m.ascentRatio + m.descentRatio);
}

export function hasTopBarrier(style: ComputedStyle) {
  return style.paddingTop > 0 || style.borderTopWidth > 0;
}

export function hasBottomBarrier(style: ComputedStyle) {
  return style.paddingBottom > 0 || style.borderBottomWidth > 0;
}

export function isBFC(node: ITypeNode) {
  const style = node.style;
  return !node.parent
    || style.overflow !== Overflow.VISIBLE
    || style.position === Position.ABSOLUTE
    || [Display.INLINE_BLOCK, Display.INLINE_FLEX, Display.INLINE_GRID].includes(style.display)
    || [Display.FLEX, Display.GRID, Display.INLINE_FLEX, Display.INLINE_GRID].includes(node.parent!.style.display);
}
