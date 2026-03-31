import type { ComputedStyle, Style } from './style';
import { Display, isBlock, Overflow, Position, Unit } from './style';
import { getMetricizeFont } from './text';
import { type ITypeNode, NodeType } from './node';

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

export function hasContentBarrier(node: ITypeNode) {
  if (node.nodeType === NodeType.Text) {
    return true;
  }
  const res = node.result!;
  if (res.h || res.minHeight) {
    return true;
  }
  if (node.lineBoxContext!.lineBoxes.length) {
    return true;
  }
  const children = node.children;
  if (!children.length) {
    return false;
  }
  for (let i = 0, len = children.length; i < len; i++) {
    if (!children[i].collapse) {
      return true;
    }
  }
  return false;
}

export function isBFC(style: Style) {
  return style.overflow !== Overflow.VISIBLE || style.position === Position.ABSOLUTE
    || [Display.INLINE_BLOCK, Display.INLINE_FLEX, Display.INLINE_GRID].includes(style.display);
}

export function canCollapseTop(parent: ITypeNode, child: ITypeNode) {
  return parent.style.display === Display.BLOCK
    && isBlock(child.style)
    && !isBFC(parent.style)
    && !isBFC(child.style)
    && !hasTopBarrier(parent.result!);
}

export function canCollapseSibling(prev: ITypeNode, next: ITypeNode) {
  return isBlock(prev.style) && isBlock(next.style) && !isBFC(prev.style) && !isBFC(next.style);
}

export function canCollapseBottom(parent: ITypeNode, child: ITypeNode) {
  return parent.style.display === Display.BLOCK
    && isBlock(child.style)
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
    if (!children[i].collapse) {
      return false;
    }
  }
  return true;
}
