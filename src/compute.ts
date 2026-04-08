import type { Constraints } from './layout';
import type { Global, INode } from './node';
import { Display, FontStyle, Overflow, Position, Unit } from './style';
import type { ComputedStyle, Length } from './style';
import { getMetricizeFont } from './text';

export function getMbpH(computedStyle: ComputedStyle) {
  return getMbpLeft(computedStyle) + getMbpRight(computedStyle);
}

export function getMbpLeft(computedStyle: ComputedStyle) {
  return computedStyle.marginLeft + computedStyle.borderLeftWidth + computedStyle.paddingLeft;
}

export function getMbpRight(computedStyle: ComputedStyle) {
  return computedStyle.marginRight + computedStyle.borderRightWidth + computedStyle.paddingRight;
}

export function getMbpV(computedStyle: ComputedStyle) {
  return getMbpTop(computedStyle) + getMbpBottom(computedStyle);
}

export function getMbpTop(computedStyle: ComputedStyle) {
  return computedStyle.marginTop + computedStyle.borderTopWidth + computedStyle.paddingTop;
}

export function getMbpBottom(computedStyle: ComputedStyle) {
  return computedStyle.marginBottom + computedStyle.borderBottomWidth + computedStyle.paddingBottom;
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

export function isBFC(node: INode) {
  const style = node.style;
  return !node.parent
    || style.overflow !== Overflow.VISIBLE
    || style.position === Position.ABSOLUTE
    || [Display.INLINE_BLOCK, Display.INLINE_FLEX, Display.INLINE_GRID].includes(style.display)
    || [Display.FLEX, Display.GRID, Display.INLINE_FLEX, Display.INLINE_GRID].includes(node.parent!.style.display);
}

export function isFixed(o: Length, includePercent = false, pb: number | null = null) {
  if ([Unit.PX, Unit.IN, Unit.PT, Unit.PC, Unit.CM, Unit.EM, Unit.REM, Unit.NUMBER].includes(o.u)) {
    return true;
  }
  return includePercent && o.u === Unit.PERCENT && pb !== null;
}

export function calLength(target: Length, pb: number, rem = 16, em = 16) {
  if (target.u === Unit.PX || target.u === Unit.NUMBER) {
    return target.v;
  }
  else if (target.u === Unit.PERCENT) {
    return target.v * 0.01 * pb;
  }
  else if (target.u === Unit.IN) {
    return target.v * 96;
  }
  else if (target.u === Unit.PT) {
    return target.v * 4 / 3;
  }
  else if (target.u === Unit.PC) {
    return target.v * 16;
  }
  else if (target.u === Unit.CM) {
    return target.v * 37.8;
  }
  else if (target.u === Unit.EM) {
    return target.v * em;
  }
  else if (target.u === Unit.REM) {
    return target.v * rem;
  }
  return 0;
}

export function calComputedStyle(node: INode, cs: Constraints, global: Global) {
  // 仅计算一次，移除DOM后重置
  if (node.computed) {
    return;
  }
  node.computed = true;
  const style = node.style;
  const computedStyle = node.computedStyle;
  const parent = node.parent;

  if (style.fontFamily === 'inherit') {
    if (parent) {
      computedStyle.fontFamily = parent.computedStyle.fontFamily;
    }
    else {
      computedStyle.fontFamily = 'sans-serif';
    }
  }
  else {
    computedStyle.fontFamily = style.fontFamily;
  }

  if (style.fontSize.u === Unit.INHERIT) {
    if (parent) {
      computedStyle.fontSize = parent.computedStyle.fontSize;
    }
    else {
      computedStyle.fontSize = global.rem;
    }
  }
  else {
    computedStyle.fontSize = calLength(
      style.fontSize,
      (parent?.computedStyle.fontSize || global.rem) * 100,
      global.rem,
      0
    ) || parent?.computedStyle.fontSize || global.rem;
  }

  if (style.fontWeight === 0) {
    if (parent) {
      computedStyle.fontWeight = parent.computedStyle.fontWeight;
    }
    else {
      computedStyle.fontWeight = 400;
    }
  }
  else {
    computedStyle.fontWeight = style.fontWeight;
  }

  if (style.fontStyle === FontStyle.INHERIT) {
    if (parent) {
      computedStyle.fontStyle = parent.computedStyle.fontStyle;
    }
    else {
      computedStyle.fontStyle = FontStyle.NORMAL;
    }
  }
  else {
    computedStyle.fontStyle = style.fontStyle;
  }

  ([
    'top',
    'right',
    'bottom',
    'left',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
  ] as const).forEach(k => {
    const v = style[k];
    if (v.u === Unit.INHERIT && parent) {
      let p: INode | null = parent;
      while (p) {
        const ps = p.style;
        if (ps[k].u !== Unit.INHERIT) {
          if (ps[k].u === Unit.PERCENT) {
            computedStyle[k] = Math.max(0, calLength(ps[k], cs.pbw || 0, global.rem, computedStyle.fontSize));
          }
          else {
            computedStyle[k] = p.computedStyle[k];
          }
          return;
        }
        p = p.parent;
      }
    }
    else {
      const pbw = (k === 'top' || k === 'bottom') ? cs.pbh : cs.pbw;
      computedStyle[k] = calLength(style[k], pbw || 0, global.rem, computedStyle.fontSize);
    }
  });

  ([
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'minWidth',
    'maxWidth',
    'minHeight',
    'maxHeight',
  ] as const).forEach(k => {
    const v = style[k];
    const pb = k === 'minHeight' || k === 'maxHeight' ? cs.pbh : cs.pbw;
    if (v.u === Unit.INHERIT && parent) {
      let p: INode | null = parent;
      while (p) {
        const ps = p.style;
        if (ps[k].u !== Unit.INHERIT) {
          if (ps[k].u === Unit.PERCENT) {
            computedStyle[k] = Math.max(0, calLength(ps[k], pb || 0, global.rem, computedStyle.fontSize));
          }
          else {
            // @ts-ignore
            computedStyle[k] = p.computedStyle[k];
          }
          return;
        }
        p = p.parent;
      }
    }
    else {
      computedStyle[k] = Math.max(0, calLength(style[k], pb || 0, global.rem, computedStyle.fontSize));
    }
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
    if (k === 'lineHeight' && u === Unit.NUMBER && v >= 0) {
      computedStyle[k] = v * computedStyle.fontSize;
    }
    // lineHeight<0非法，视为继承，root视为auto
    else if (k === 'lineHeight' && (u === Unit.INHERIT || u === Unit.NUMBER)) {
      if (parent) {
        let p: INode | null = parent;
        while (p) {
          const ps = p.style;
          if (ps.lineHeight.u !== Unit.INHERIT) {
            if (ps.lineHeight.u === Unit.NUMBER) {
              computedStyle[k] = Math.max(0, v * computedStyle.fontSize);
            }
            else if (ps.lineHeight.u === Unit.PX) {
              computedStyle[k] = p.computedStyle.lineHeight;
            }
            else if (ps.lineHeight.u === Unit.PERCENT) {
              computedStyle[k] = p.computedStyle.lineHeight;
            }
            else if (ps.lineHeight.u === Unit.AUTO) {
              computedStyle[k] = calNormalLineHeight(computedStyle.fontFamily, computedStyle.fontSize);
            }
            return;
          }
          p = p.parent;
        }
        computedStyle[k] = calNormalLineHeight(computedStyle.fontFamily, computedStyle.fontSize);
      }
      else {
        computedStyle[k] = calNormalLineHeight(computedStyle.fontFamily, computedStyle.fontSize);
      }
    }
    else if (k === 'lineHeight') {
      if (v < 0 || u === Unit.AUTO) {
        computedStyle[k] = calNormalLineHeight(computedStyle.fontFamily, computedStyle.fontSize);
      }
      else {
        computedStyle[k] = calLength(style[k], parent?.computedStyle.lineHeight || 24, global.rem, computedStyle.fontSize);
      }
    }
    // border没有%
    else if (u === Unit.INHERIT && parent) {
      computedStyle[k] = parent.computedStyle[k];
    }
    else {
      computedStyle[k] = Math.max(0, calLength(style[k], cs.pbw || 0, global.rem, computedStyle.fontSize));
    }
  });
}
