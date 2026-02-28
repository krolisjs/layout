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
  EM = 4,
  REM = 5,
  PERCENT = 6,
  NUMBER = 7,
  VW = 8,
  VH = 9,
  VMAX = 10,
  VMIN = 11,
  MIN_CONTENT = 12,
  MAX_CONTENT = 13,
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

export type Style = {
  boxSizing: BoxSizing;
  display: Display;
  position: Position;
  marginTop: Length;
  marginRight: Length;
  marginBottom: Length;
  marginLeft: Length;
  paddingTop: Length;
  paddingRight: Length;
  paddingBottom: Length;
  paddingLeft: Length;
  top: Length;
  right: Length;
  bottom: Length;
  left: Length;
  width: Length;
  height: Length;
  borderTopWidth: Length;
  borderRightWidth: Length;
  borderBottomWidth: Length;
  borderLeftWidth: Length;
  fontFamily: string;
  fontStyle: FontStyle;
  fontWeight: number;
  fontSize: Length;
  lineHeight: Length;
  letterSpacing: Length;
  verticalAlign: VerticalAlign;
  minWidth: Length;
  maxWidth: Length;
};

export type CssFontSize = number | `${number}px` | `${number}%` | `${number}in` | `${number}rem` | 'inherit';

export type CssLength = Omit<CssFontSize, 'inherit'> | 'auto' | `${number}em`;

export type CssMinMax = CssLength | 'minContent' | 'maxContent';

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
  width: CssLength;
  height: CssLength;
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
  minWidth: CssMinMax;
  maxWidth: CssMinMax;
};

export const getDefaultStyle = (style?: Partial<Style>) => {
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
    minWidth: { v: 0, u: Unit.AUTO },
    maxWidth: { v: 0, u: Unit.AUTO },
  };
  if (style) {
    Object.assign(dft, style);
  }
  return dft;
};

export function calCssLength(v: CssLength, number2Px = false): Length {
  if (v === 'auto') {
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

export const normalizeJStyle = (style: Partial<JStyle> = {}) => {
  const res: Partial<Style> = {};
  if (style.boxSizing !== undefined) {
    if (style.boxSizing === 'borderBox') {
      res.boxSizing = BoxSizing.BORDER_BOX;
    }
    else {
      res.boxSizing = BoxSizing.CONTENT_BOX;
    }
  }
  if (style.display !== undefined) {
    if (style.display === 'none') {
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
    if (style.position === 'relative') {
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
  ] as const).forEach(k => {
    const v = style[k];
    if (v === undefined) {
      return;
    }
    res[k] = calCssLength(v, k !== 'lineHeight');
  });
  if (style.fontFamily !== undefined) {
    res.fontFamily = style.fontFamily;
  }
  if (style.fontStyle !== undefined) {
    res.fontStyle = {
      inherit: FontStyle.INHERIT,
      normal: FontStyle.NORMAL,
      italic: FontStyle.ITALIC,
      oblique: FontStyle.OBLIQUE,
    }[style.fontStyle] || FontStyle.INHERIT;
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
  return res;
};
