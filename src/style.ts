export enum Display {
  NONE = 0,
  BLOCK = 1,
  INLINE = 2,
  INLINE_BLOCK = 3,
  FLEX = 4,
  INLINE_FLEX = 5,
  GRID = 6,
  INLINE_GRID = 7,
}

export enum Position {
  STATIC = 0,
  RELATIVE = 1,
  ABSOLUTE = 2,
}

export enum Unit {
  AUTO = 0,
  INHERIT = 1,
  PX = 2,
  IN = 3,
  PT = 4,
  PC = 5,
  CM = 6,
  EM = 7,
  REM = 8,
  PERCENT = 9,
  NUMBER = 10,
  VW = 11,
  VH = 12,
  VMAX = 13,
  VMIN = 14,
  MIN_CONTENT = 15,
  MAX_CONTENT = 16,
}

export enum BoxSizing {
  CONTENT_BOX = 0,
  BORDER_BOX = 1,
}

export type Length = {
  v: number;
  u: Unit;
};

export enum FontStyle {
  INHERIT = 0,
  NORMAL = 1,
  ITALIC = 2,
  OBLIQUE = 3,
}

export enum VerticalAlign {
  BASELINE = 0,
  TOP = 1,
  BOTTOM = 2,
  MIDDLE = 3,
}

export enum Overflow {
  VISIBLE = 0,
  HIDDEN = 1,
  CLIP = 2,
  SCROLL = 3,
  AUTO = 4,
}

// export enum WordBreak {
//   INHERIT = 0,
//   NORMAL = 1,
//   BREAK_ALL = 2,
//   KEEP_ALL = 3,
// }
//
// export enum OverflowWrap {
//   INHERIT = 0,
//   NORMAL = 1,
//   ANYWHERE = 2,
//   BREAK_WORD = 3,
// }

export type Style = {
  boxSizing: BoxSizing;
  display: Display;
  position: Position;
  top: Length;
  right: Length;
  bottom: Length;
  left: Length;
  marginTop: Length;
  marginRight: Length;
  marginBottom: Length;
  marginLeft: Length;
  paddingTop: Length;
  paddingRight: Length;
  paddingBottom: Length;
  paddingLeft: Length;
  borderTopWidth: Length;
  borderRightWidth: Length;
  borderBottomWidth: Length;
  borderLeftWidth: Length;
  width: Length;
  height: Length;
  fontFamily: string;
  fontStyle: FontStyle;
  fontWeight: number;
  fontSize: Length;
  lineHeight: Length;
  letterSpacing: Length;
  verticalAlign: VerticalAlign;
  overflow: Overflow;
  minWidth: Length;
  maxWidth: Length;
  minHeight: Length;
  maxHeight: Length;
  // wordBreak: WordBreak;
  // overflowWrap: OverflowWrap;
};

export type CssFontSize = number | `${number}px` | `${number}%` | `${number}in` | `${number}rem` | 'inherit' | 'normal';

export type CssLength = Omit<CssFontSize, 'inherit'> | 'auto' | `${number}em`;

export type CssLengthMMF = CssLength | 'minContent' | 'maxContent' | 'fitContent';

export type JStyle = {
  boxSizing: 'contentBox' | 'borderBox';
  display: 'none' | 'block' | 'inline' | 'inlineBlock' | 'flex' | 'inlineFlex' | 'grid' | 'inlineGrid';
  position: 'static' | 'relative' | 'absolute';
  marginTop: CssLength;
  marginRight: CssLength;
  marginBottom: CssLength;
  marginLeft: CssLength;
  paddingTop: CssLength;
  paddingRight: CssLength;
  paddingBottom: CssLength;
  paddingLeft: CssLength;
  top: CssLength;
  right: CssLength;
  bottom: CssLength;
  left: CssLength;
  width: CssLengthMMF;
  height: CssLengthMMF;
  borderTopWidth: CssLength;
  borderRightWidth: CssLength;
  borderBottomWidth: CssLength;
  borderLeftWidth: CssLength;
  fontFamily: string;
  fontStyle: 'inherit' | 'normal' | 'italic' | 'oblique';
  fontWeight: number | 'inherit' | 'thin' | 'lighter' | 'light' | 'medium' | 'semiBold' | 'bold' | 'extraBold' | 'black' | 'normal';
  fontSize: CssFontSize;
  lineHeight: CssFontSize;
  letterSpacing: CssFontSize;
  verticalAlign: 'baseline' | 'top' | 'bottom' | 'middle';
  overflow: 'visible' | 'hidden' | 'clip' | 'scroll' | 'auto';
  minWidth: CssLengthMMF;
  maxWidth: CssLengthMMF;
  minHeight: CssLengthMMF;
  maxHeight: CssLengthMMF;
  // wordBreak: 'normal' | 'breakAll' | 'keepAll';
  // overflowWrap: 'normal' | 'breakWord';
};

export const getDefaultStyle = (style?: Partial<JStyle | Style>) => {
  const dft: Style = {
    boxSizing: BoxSizing.CONTENT_BOX,
    display: Display.BLOCK,
    position: Position.STATIC,
    marginTop: { v: 0, u: Unit.PX },
    marginRight: { v: 0, u: Unit.PX },
    marginBottom: { v: 0, u: Unit.PX },
    marginLeft: { v: 0, u: Unit.PX },
    paddingTop: { v: 0, u: Unit.PX },
    paddingRight: { v: 0, u: Unit.PX },
    paddingBottom: { v: 0, u: Unit.PX },
    paddingLeft: { v: 0, u: Unit.PX },
    top: { v: 0, u: Unit.AUTO },
    right: { v: 0, u: Unit.AUTO },
    bottom: { v: 0, u: Unit.AUTO },
    left: { v: 0, u: Unit.AUTO },
    width: { v: 0, u: Unit.AUTO },
    height: { v: 0, u: Unit.AUTO },
    borderTopWidth: { v: 0, u: Unit.PX },
    borderRightWidth: { v: 0, u: Unit.PX },
    borderBottomWidth: { v: 0, u: Unit.PX },
    borderLeftWidth: { v: 0, u: Unit.PX },
    fontFamily: 'inherit',
    fontStyle: FontStyle.INHERIT,
    fontWeight: 0,
    fontSize: { v: 0, u: Unit.INHERIT },
    lineHeight: { v: 0, u: Unit.INHERIT },
    letterSpacing: { v: 0, u: Unit.INHERIT },
    verticalAlign: VerticalAlign.BASELINE,
    overflow: Overflow.VISIBLE,
    minWidth: { v: 0, u: Unit.AUTO },
    maxWidth: { v: 0, u: Unit.AUTO },
    minHeight: { v: 0, u: Unit.AUTO },
    maxHeight: { v: 0, u: Unit.AUTO },
    // wordBreak: WordBreak.INHERIT,
    // overflowWrap: OverflowWrap.INHERIT,
  };
  if (style) {
    Object.assign(dft, normalizeStyle(style));
  }
  return dft;
};

export function calCssLength(v: CssLength, number2Px = false): Length {
  if (v === 'auto' || v === 'normal') {
    return {
      v: 0,
      u: Unit.AUTO,
    };
  }
  if (v === 'inherit') {
    return {
      v: 0,
      u: Unit.INHERIT,
    };
  }
  if (v === 'minContent') {
    return {
      v: 0,
      u: Unit.MIN_CONTENT,
    };
  }
  if (v === 'maxContent') {
    return {
      v: 0,
      u: Unit.MAX_CONTENT,
    };
  }
  let n = parseFloat(v as string) || 0;
  if (/%$/.test(v as string)) {
    return {
      v: n,
      u: Unit.PERCENT,
    };
  }
  else if (/in$/.test(v as string)) {
    return {
      v: n,
      u: Unit.IN,
    };
  }
  else if (/pt$/.test(v as string)) {
    return {
      v: n,
      u: Unit.PT,
    };
  }
  else if (/pc$/.test(v as string)) {
    return {
      v: n,
      u: Unit.PC,
    };
  }
  else if (/cm$/.test(v as string)) {
    return {
      v: n,
      u: Unit.CM,
    };
  }
  else if (/em$/.test(v as string)) {
    return {
      v: n,
      u: Unit.EM,
    };
  }
  else if (/rem$/.test(v as string)) {
    return {
      v: n,
      u: Unit.REM,
    };
  }
  else {
    return {
      v: n,
      u: number2Px ? Unit.PX : Unit.NUMBER,
    };
  }
}

export const normalizeStyle = (style: Partial<JStyle | Style> = {}) => {
  const res: Partial<Style> = {};
  if (style.boxSizing !== undefined) {
    if (typeof style.boxSizing === 'number') {
      res.boxSizing = style.boxSizing;
    }
    else if (style.boxSizing === 'borderBox') {
      res.boxSizing = BoxSizing.BORDER_BOX;
    }
    else {
      res.boxSizing = BoxSizing.CONTENT_BOX;
    }
  }
  if (style.display !== undefined) {
    if (typeof style.display === 'number') {
      res.display = style.display;
    }
    else if (style.display === 'none') {
      res.display = Display.NONE;
    }
    else if (style.display === 'inline') {
      res.display = Display.INLINE;
    }
    else if (style.display === 'inlineBlock') {
      res.display = Display.INLINE_BLOCK;
    }
    else if (style.display === 'flex') {
      res.display = Display.FLEX;
    }
    else if (style.display === 'inlineFlex') {
      res.display = Display.INLINE_FLEX;
    }
    else if (style.display === 'grid') {
      res.display = Display.GRID;
    }
    else if (style.display === 'inlineGrid') {
      res.display = Display.INLINE_GRID;
    }
    else {
      res.display = Display.BLOCK;
    }
  }
  if (style.position !== undefined) {
    if (typeof style.position === 'number') {
      res.position = style.position;
    }
    else if (style.position === 'relative') {
      res.position = Position.RELATIVE;
    }
    else if (style.position === 'absolute') {
      res.position = Position.ABSOLUTE;
    }
    else {
      res.position = Position.STATIC;
    }
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
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'width',
    'height',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'fontSize',
    'lineHeight',
    'letterSpacing',
    'minWidth',
    'maxWidth',
    'minHeight',
    'maxHeight',
  ] as const).forEach(k => {
    const v = style[k];
    if (v === undefined) {
      return;
    }
    if (typeof v === 'object' && 'u' in v) {
      res[k] = v;
    }
    else {
      res[k] = calCssLength(v, k !== 'lineHeight');
    }
  });
  if (style.fontFamily !== undefined) {
    res.fontFamily = style.fontFamily;
  }
  if (style.fontStyle !== undefined) {
    if (typeof style.fontStyle === 'number') {
      res.fontStyle = style.fontStyle;
    }
    else {
      res.fontStyle = {
        inherit: FontStyle.INHERIT,
        normal: FontStyle.NORMAL,
        italic: FontStyle.ITALIC,
        oblique: FontStyle.OBLIQUE,
      }[style.fontStyle] || FontStyle.INHERIT;
    }
  }
  if (style.fontWeight !== undefined) {
    if (typeof style.fontWeight === 'number') {
      res.fontWeight = Math.min(900, Math.max(100, style.fontWeight));
    }
    else {
      if (/thin/.test(style.fontWeight)) {
        res.fontWeight = 100;
      }
      else if (/lighter/.test(style.fontWeight)) {
        res.fontWeight = 200;
      }
      else if (/light/.test(style.fontWeight)) {
        res.fontWeight = 300;
      }
      else if (/medium/.test(style.fontWeight)) {
        res.fontWeight = 500;
      }
      else if (/semiBold/.test(style.fontWeight)) {
        res.fontWeight = 600;
      }
      else if (/bold/.test(style.fontWeight)) {
        res.fontWeight = 700;
      }
      else if (/extraBold/.test(style.fontWeight)) {
        res.fontWeight = 800;
      }
      else if (/black/.test(style.fontWeight)) {
        res.fontWeight = 900;
      }
      else {
        res.fontWeight = /inherit/.test(style.fontWeight) ? 0 : 400;
      }
    }
  }
  if (style.verticalAlign !== undefined) {
    if (typeof style.verticalAlign === 'number') {
      res.verticalAlign = style.verticalAlign;
    }
    else {
      res.verticalAlign = {
        baseline: VerticalAlign.BASELINE,
        top: VerticalAlign.TOP,
        bottom: VerticalAlign.BOTTOM,
        middle: VerticalAlign.MIDDLE,
      }[style.verticalAlign] || VerticalAlign.BASELINE;
    }
  }
  if (style.overflow !== undefined) {
    if (typeof style.overflow === 'number') {
      res.overflow = style.overflow;
    }
    else {
      res.overflow = {
        visible: Overflow.VISIBLE,
        hidden: Overflow.HIDDEN,
        clip: Overflow.CLIP,
        scroll: Overflow.SCROLL,
        auto: Overflow.AUTO,
      }[style.overflow] || Overflow.VISIBLE;
    }
  }
  return res;
};

export type ComputedStyle = {
  boxSizing: BoxSizing;
  display: Display;
  position: Position;
  top: number;
  right: number;
  bottom: number;
  left: number;
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
  width: number;
  height: number;
  fontFamily: string;
  fontStyle: FontStyle;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  verticalAlign: VerticalAlign;
  overflow: Overflow;
  minWidth: number | null;
  maxWidth: number | null;
  minHeight: number | null;
  maxHeight: number | null;
};

export function getDefaultComputedStyle(style?: Style) {
  const dft: ComputedStyle = {
    boxSizing: BoxSizing.CONTENT_BOX,
    display: Display.BLOCK,
    position: Position.STATIC,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    fontFamily: 'inherit',
    fontStyle: FontStyle.INHERIT,
    fontWeight: 0,
    fontSize: 0,
    lineHeight: 0,
    letterSpacing: 0,
    verticalAlign: VerticalAlign.BASELINE,
    overflow: Overflow.VISIBLE,
    minWidth: 0,
    maxWidth: 0,
    minHeight: 0,
    maxHeight: 0,
  };
  // 一些可以在布局前提前计算出的
  if (style) {
    dft.boxSizing = style.boxSizing;
    dft.display = style.display;
    dft.position = style.position;
    dft.fontFamily = style.fontFamily;
    dft.fontStyle = style.fontStyle;
    dft.verticalAlign = style.verticalAlign;
    dft.overflow = style.overflow;
    dft.fontWeight = style.fontWeight;
    ([
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'top',
      'right',
      'bottom',
      'left',
      'width',
      'height',
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
      'fontSize',
      'lineHeight',
      'letterSpacing',
      'minWidth',
      'maxWidth',
      'minHeight',
      'maxHeight',
    ] as const).forEach(k => {
      const v = style[k];
      if (v.u === Unit.PX) {
        dft[k] = v.v;
      }
    });
  }
  return dft;
}
