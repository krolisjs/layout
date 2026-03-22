import { Display, Overflow, Position, Unit } from './style';
import type { ComputedStyle, Style } from './style';
import { getMetricizeFont } from './text';
import type { ITypeNode } from './node';

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
  const normal = calNormalLineHeight(fontFamily, fontSize);
  const metricizeFont = getMetricizeFont();
  const m = metricizeFont!(fontFamily);
  return (lineHeight - normal) * 0.5 + fontSize * m.ascentRatio;
}

export function calContentArea(fontFamily: string, fontSize: number) {
  const metricizeFont = getMetricizeFont();
  if (!metricizeFont) {
    throw new Error('Text must be passed to the metricizeFont method.');
  }
  const m = metricizeFont(fontFamily);
  return fontSize * (m.ascentRatio + m.descentRatio);
}

function isBlock(item: ITypeNode) {
  return [Display.BLOCK, Display.FLEX].includes(item.style.display);
}

function hasTopBarrier(style: ComputedStyle) {
  return style.paddingTop > 0 || style.borderTopWidth > 0;
}

function hasBottomBarrier(style: ComputedStyle) {
  return style.paddingBottom > 0 || style.borderBottomWidth > 0;
}

export function isBFC(style: Style) {
  if (style.position === Position.ABSOLUTE) {
    return true;
  }
  if ([Display.INLINE_BLOCK, Display.INLINE_FLEX, Display.INLINE_GRID].includes(style.display)) {
    return true;
  }
  if (style.display === Display.INLINE) {
    return false;
  }
  if (style.overflow !== Overflow.VISIBLE) {
    return true;
  }
  return false;
}

export function canCollapseTop(parent: ITypeNode, child: ITypeNode) {
  return parent.style.display === Display.BLOCK
    && isBlock(child)
    && !isBFC(parent.style)
    && !isBFC(child.style)
    && !hasTopBarrier(parent.result!);
}

export function canCollapseSibling(prev: ITypeNode, next: ITypeNode) {
  return isBlock(prev) && isBlock(next) && !isBFC(prev.style) && !isBFC(next.style);
}

export function canCollapseBottom(parent: ITypeNode, child: ITypeNode) {
  return parent.style.display === Display.BLOCK
    && isBlock(child)
    && !isBFC(parent.style)
    && !isBFC(child.style)
    && !hasBottomBarrier(parent.result!)
    && parent.style.height.u === Unit.AUTO;
}

export function canCollapseSelf(node: ITypeNode) {
  const style = node.style;
  if (style.display !== Display.BLOCK || isBFC(style)) {
    return false;
  }
  const res = node.result!;
  if (hasTopBarrier(res) || hasBottomBarrier(res) || style.height.u !== Unit.AUTO) {
    return false;
  }
  const children = node.children;
  if (!children.length) {
    return true;
  }
  for (let i = 0, len = children.length; i < len; i++) {
    if (!canCollapseSelf(children[i])) {
      return false;
    }
  }
  return true;
}

export function calMarginCollapse(list: number[]) {
  let max = 0, min = 0;
  for (let i = 0; i < list.length; i++) {
    const n = list[i];
    max = Math.max(max, n);
    min = Math.min(min, n);
  }
  return max + min;
}
