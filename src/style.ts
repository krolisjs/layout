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
  EM = 3,
  REM = 4,
  PERCENT = 5,
  NUMBER = 6,
  VW = 7,
  VH = 8,
  VMAX = 9,
  VMIN = 10,
}

export enum BoxSizing {
  CONTENT_BOX = 0,
  BORDER_BOX = 1,
}

export type Length = {
  v: number;
  u: Unit;
};

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
  fontSize: Length;
  // minWidth: Length;
  // maxWidth: Length;
  // minHeight: Length;
  // maxHeight: Length;
};

export type CssFontSize = number | `${number}px`| `${number}rem`;

export type CssLength = CssFontSize | 'auto' | `${number}%` | `${number}em`;

export type JStyle = {
  boxSizing: 'contentBox' | 'borderBox';
  display: 'none' | 'block' | 'inlineBlock' | 'flex' | 'inlineFlex' | 'grid' | 'inlineGrid';
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
  fontSize: CssFontSize;
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
    fontSize: { v: 16, u: Unit.PX },
  };
  if (style) {
    Object.assign(dft, style);
  }
  return dft;
};

export function calCssLength(v: CssLength): Length {
  if (v === 'auto') {
    return {
      v: 0,
      u: Unit.AUTO,
    };
  }
  let n = parseFloat(v as string) || 0;
  if (/%$/.test(v as string)) {
    return {
      v: n,
      u: Unit.PERCENT,
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
      u: Unit.PX,
    };
  }
}

export const normalizeJStyle = (style: Partial<JStyle>) => {
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
  ] as const).forEach(k => {
    const v = style[k];
    if (v === undefined) {
      return;
    }
    res[k] = calCssLength(v);
  });
  return res;
};
