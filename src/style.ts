import {
  AlignContent,
  AlignItems,
  AlignSelf,
  BoxSizing,
  Display,
  FlexDirection,
  FlexWrap,
  FontStyle,
  JustifyContent,
  Overflow,
  Position,
  Unit,
  VerticalAlign,
  WordBreak,
} from './constants';

export type Length = {
  v: number;
  u: Unit;
};

export type Style = {
  boxSizing: BoxSizing;
  display: Display;
  flexGrow: number;
  flexShrink: number;
  flexBasis: Length;
  flexWrap: FlexWrap;
  flexDirection: FlexDirection;
  alignItems: AlignItems;
  alignSelf: AlignSelf;
  alignContent: AlignContent;
  justifyContent: JustifyContent;
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
  wordBreak: WordBreak;
  // overflowWrap: OverflowWrap;
};

export type CssFontSize = number | `${number}px` | `${number}%` | `${number}in` | `${number}rem` | `${number}cm` | `${number}pc` | `${number}pt` | 'inherit' | 'normal';

export type CssLength = Omit<CssFontSize, 'inherit'> | 'auto' | `${number}em`;

export type CssLengthMMF = CssLength | 'minContent' | 'maxContent' | 'fitContent';

export type CssLengthMMFC = CssLengthMMF | 'content';

export type JStyle = {
  boxSizing: 'contentBox' | 'borderBox';
  display: 'none' | 'block' | 'inline' | 'inlineBlock' | 'flex' | 'inlineFlex' | 'grid' | 'inlineGrid';
  flexGrow: number;
  flexShrink: number;
  flexBasis: CssLengthMMFC;
  flex?: string | [number, number, CssLengthMMFC] | [number] | [number, number] | [number, CssLengthMMFC] | [number] | [CssLengthMMFC];
  flexWrap: 'nowrap' | 'wrap' | 'wrapReverse';
  flexDirection: 'row' | 'rowReverse' | 'column' | 'columnReverse';
  alignItems: 'normal' | 'stretch' | 'flexStart' | 'flexEnd' | 'center' | 'baseline';
  alignSelf: 'auto' | 'normal' | 'stretch' | 'flexStart' | 'flexEnd' | 'center' | 'baseline';
  alignContent: 'normal' | 'stretch' | 'flexStart' | 'flexEnd' | 'center' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
  justifyContent: 'normal' | 'stretch' | 'flexStart' | 'flexEnd' | 'center' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
  position: 'static' | 'relative' | 'absolute';
  margin?: CssLength | CssLength[] | string;
  marginTop: CssLength;
  marginRight: CssLength;
  marginBottom: CssLength;
  marginLeft: CssLength;
  padding?: CssLength | CssLength[] | string;
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
  border?: string;
  borderTopWidth: CssLength;
  borderRightWidth: CssLength;
  borderBottomWidth: CssLength;
  borderLeftWidth: CssLength;
  font?: string;
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
  wordBreak: 'normal' | 'breakAll' | 'keepAll';
  // overflowWrap: 'normal' | 'breakWord';
};

export const getDefaultStyle = (style?: Partial<JStyle | Style>) => {
  const dft: Style = {
    boxSizing: BoxSizing.CONTENT_BOX,
    display: Display.BLOCK,
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: { v: 0, u: Unit.AUTO },
    flexWrap: FlexWrap.NOWRAP,
    flexDirection: FlexDirection.ROW,
    alignItems: AlignItems.NORMAL,
    alignSelf: AlignSelf.AUTO,
    alignContent: AlignContent.NORMAL,
    justifyContent: JustifyContent.NORMAL,
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
    fontWeight: 400,
    fontSize: { v: 0, u: Unit.INHERIT },
    lineHeight: { v: 0, u: Unit.INHERIT },
    letterSpacing: { v: 0, u: Unit.INHERIT },
    verticalAlign: VerticalAlign.BASELINE,
    overflow: Overflow.VISIBLE,
    minWidth: { v: 0, u: Unit.AUTO },
    maxWidth: { v: 0, u: Unit.AUTO },
    minHeight: { v: 0, u: Unit.AUTO },
    maxHeight: { v: 0, u: Unit.AUTO },
    wordBreak: WordBreak.INHERIT,
    // overflowWrap: OverflowWrap.INHERIT,
  };
  if (style) {
    Object.assign(dft, normalizeStyle(style));
  }
  return dft;
};

/**
 * 解析 margin/padding 简写字符串，返回四个方向的值 [top, right, bottom, left]
 * 支持 1-4 个值的简写格式：
 * - 1个值：四个方向相同
 * - 2个值：上下、左右
 * - 3个值：上、左右、下
 * - 4个值：上、右、下、左
 */
export function parseMarginPadding(v: CssLength | CssLength[] | string): CssLength[] {
  if (typeof v === 'string') {
    const list = v.trim().split(/\s+/);
    if (list.length === 1) {
      list[1] = list[2] = list[3] = list[0];
    }
    else if (list.length === 2) {
      list[2] = list[0];
      list[3] = list[1];
    }
    else if (list.length === 3) {
      list[3] = list[1];
    }
    return list;
  }
  if (Array.isArray(v)) {
    if (!v.length) {
      return [0, 0, 0, 0];
    }
    if (v.length === 1) {
      return [v[0], v[0], v[0], v[0]];
    }
    if (v.length === 2) {
      return [v[0], v[1], v[0], v[1]];
    }
    if (v.length === 3) {
      return [v[0], v[1], v[2], v[1]];
    }
    return v;
  }
  return [v, v, v, v];
}

export function parseFont(v: string) {
  const res: {
    fontSize?: CssFontSize;
    fontFamily?: string;
    fontStyle?: 'normal' | 'italic' | 'oblique';
    fontWeight?: number | 'inherit' | 'thin' | 'lighter' | 'light' | 'medium' | 'semiBold' | 'bold' | 'extraBold' | 'black' | 'normal';
    lineHeight?: CssFontSize;
  } = {};
  if (!/([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)(px|%|in|cm|pc|pt|vw|vh|rem)(\s*\/\s*([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)(px|%|in|cm|pc|pt|vw|vh|em|rem)?)?\s+\S+/.test(v)) {
    return res;
  }
  let s = v.trim();
  if (/^(normal|italic|oblique)\s+/.test(s)) {
    if (/^(normal)\s+/.test(s)) {
      res.fontStyle = 'normal';
    }
    else if (/^(italic)\s+/.test(s)) {
      res.fontStyle = 'italic';
    }
    else {
      res.fontStyle = 'oblique';
    }
    s = s.replace(/^(normal|italic|oblique)\s+/, '');
  }
  if (/^(thin|lighter|light|medium|semiBold|bold|extraBold|black|normal|\d+)\s+/.test(s)) {
    if (/^(thin)\s+/.test(s)) {
      res.fontWeight = 'thin';
    }
    else if (/^(lighter)\s+/.test(s)) {
      res.fontWeight = 'lighter';
    }
    else if (/^(light)\s+/.test(s)) {
      res.fontWeight = 'light';
    }
    else if (/^(medium)\s+/.test(s)) {
      res.fontWeight = 'medium';
    }
    else if (/^(semiBold)\s+/.test(s)) {
      res.fontWeight = 'semiBold';
    }
    else if (/^(bold)\s+/.test(s)) {
      res.fontWeight = 'bold';
    }
    else if (/^(extraBold)\s+/.test(s)) {
      res.fontWeight = 'extraBold';
    }
    else if (/^(black)\s+/.test(s)) {
      res.fontWeight = 'black';
    }
    else if (/^(normal)\s+/.test(s)) {
      res.fontWeight = 'normal';
    }
    else {
      res.fontWeight = +(/^(\d+)\s+/.exec(s)![1]);
    }
    s = s.replace(/\b(thin|lighter|light|medium|semiBold|bold|extraBold|black|normal)\s+/, '');
  }
  const fs = /([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)(px|%|in|cm|pc|pt|vw|vh|rem)/.exec(s)!;
  res.fontSize = fs[0].trim() as CssFontSize;
  s = s.replace(/([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)(px|%|in|cm|pc|pt|vw|vh|rem)/, '');
  const lh = /\s*\/\s*([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)(px|%|in|cm|pc|pt|vw|vh|em|rem)?/.exec(s);
  if (lh) {
    res.lineHeight = lh[0].trim().slice(1).trim() as CssFontSize;
    s = s.replace(/\s*\/\s*([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)(px|%|in|cm|pc|pt|vw|vh|em|rem)?/, '');
  }
  res.fontFamily = s.trim();
  return res;
}

export function parseBorder(v: string) {
  const m = /([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)(px|%|in|cm|pc|pt|vw|vh|em|rem)/.exec(v);
  if (m) {
    return m[0] as CssLength;
  }
}

export function parseFlex(v: string) {
  if (v === 'none') {
    return { g: 0, s: 0, b: 'auto' };
  }

  else if(v === 'auto') {
    return { g: 1, s: 1, b: 'auto' };
  }
  else if(/^[\d.]+\s+[\d.]+\s+(auto|none|content)/.test(v) || /^[\d.]+\s+[\d.]+\s+[\d.]+(px|%|in|cm|pc|pt|vw|vh|em|rem)*/.test(v)) {
    const arr = v.split(/\s+/);
    return { g: parseFloat(arr[0]), s: parseFloat(arr[1]), b: arr[2] || 0 };
  }
  else if(/^[\d.]+\s+[\d.]+$/.test(v)) {
    const arr = v.split(/\s+/);
    return { g: parseFloat(arr[0]), s: parseFloat(arr[1]), b: 0 };
  }
  else if(/^[\d.]+\s+[\d.]+(px|%|in|cm|pc|pt|vw|vh|em|rem)+/.test(v)) {
    const arr = v.split(/\s+/);
    return { g: parseFloat(arr[0]), s: 1, b: arr[1] };
  }
  else if(/^[\d.]+$/.test(v)) {
    return { g: parseFloat(v), s: 1, b: 0 };
  }
  else if(/^[\d.]+(px|%|in|cm|pc|pt|vw|vh|em|rem)+/i.test(v)) {
    return { g: 1, s: 1, b: v };
  }
  else {
    return { g: 0, s: 1, b: 'auto' };
  }
}

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
  if (v === 'fitContent') {
    return {
      v: 0,
      u: Unit.FIT_CONTENT,
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

function abbr(style: Partial<JStyle | Style> = {}) {
  const margin = (style as JStyle).margin;
  const padding = (style as JStyle).padding;
  const font = (style as JStyle).font;
  const border = (style as JStyle).border;
  const flex = (style as JStyle).flex;
  if (margin || padding || font || border || flex) {
    const res = Object.assign({}, style);
    if (margin) {
      const [top, right, bottom, left] = parseMarginPadding(margin);
      if (res.marginTop === undefined) {
        res.marginTop = top;
      }
      if (res.marginRight === undefined) {
        res.marginRight = right;
      }
      if (res.marginBottom === undefined) {
        res.marginBottom = bottom;
      }
      if (res.marginLeft === undefined) {
        res.marginLeft = left;
      }
    }
    if (padding) {
      const [top, right, bottom, left] = parseMarginPadding(padding);
      if (res.paddingTop === undefined) {
        res.paddingTop = top;
      }
      if (res.paddingRight === undefined) {
        res.paddingRight = right;
      }
      if (res.paddingBottom === undefined) {
        res.paddingBottom = bottom;
      }
      if (res.paddingLeft === undefined) {
        res.paddingLeft = left;
      }
    }
    if (font) {
      const o = parseFont(font.trim());
      if (res.fontStyle === undefined && o.fontStyle) {
        res.fontStyle = o.fontStyle;
      }
      if (res.fontWeight === undefined && o.fontWeight) {
        res.fontWeight = o.fontWeight;
      }
      if (res.fontSize === undefined && o.fontSize) {
        res.fontSize = o.fontSize;
      }
      if (res.lineHeight === undefined && o.lineHeight) {
        res.lineHeight = o.lineHeight;
      }
      if (res.fontFamily === undefined && o.fontFamily) {
        res.fontFamily = o.fontFamily;
      }
    }
    if (border) {
      const o = parseBorder(border.trim());
      if (o) {
        res.borderTopWidth = o;
        res.borderRightWidth = o;
        res.borderBottomWidth = o;
        res.borderLeftWidth = o;
      }
    }
    if (flex) {
      if (Array.isArray(flex)) {
        const o = parseFlex(flex.join(' '));
        res.flexGrow = o.g;
        res.flexShrink = o.s;
        res.flexBasis = o.b;
      }
      else {
        const o = parseFlex(flex.trim());
        res.flexGrow = o.g;
        res.flexShrink = o.s;
        res.flexBasis = o.b;
      }
    }
    return res;
  }
  return style;
}

export const normalizeStyle = (st: Partial<JStyle | Style> = {}) => {
  const res: Partial<Style> = {};
  const style = abbr(st);
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
  if (style.flexGrow !== undefined) {
    res.flexGrow = Math.max(0, style.flexGrow);
  }
  if (style.flexShrink !== undefined) {
    res.flexShrink = Math.max(0, style.flexShrink);
  }
  if (style.flexBasis !== undefined) {
    if (style.flexBasis === 'content') {
      res.flexBasis = { v: 0, u: Unit.CONTENT };
    }
    else if (typeof style.flexBasis === 'object' && 'u' in style.flexBasis) {
      res.flexBasis = style.flexBasis;
    }
    else {
      res.flexBasis = calCssLength(style.flexBasis, true);
    }
  }
  if (style.alignItems !== undefined) {
    if (style.alignItems === 'stretch') {
      res.alignItems = AlignItems.STRETCH;
    }
    else if (style.alignItems === 'flexStart') {
      res.alignItems = AlignItems.FLEX_START;
    }
    else if (style.alignItems === 'flexEnd') {
      res.alignItems = AlignItems.FLEX_END;
    }
    else if (style.alignItems === 'center') {
      res.alignItems = AlignItems.CENTER;
    }
    else if (style.alignItems === 'baseline') {
      res.alignItems = AlignItems.BASELINE;
    }
    else {
      res.alignItems = AlignItems.NORMAL;
    }
  }
  if (style.alignSelf !== undefined) {
    if (style.alignSelf === 'stretch') {
      res.alignSelf = AlignSelf.STRETCH;
    }
    else if (style.alignSelf === 'flexStart') {
      res.alignSelf = AlignSelf.FLEX_START;
    }
    else if (style.alignSelf === 'flexEnd') {
      res.alignSelf = AlignSelf.FLEX_END;
    }
    else if (style.alignSelf === 'center') {
      res.alignSelf = AlignSelf.CENTER;
    }
    else if (style.alignSelf === 'baseline') {
      res.alignSelf = AlignSelf.BASELINE;
    }
    else if (style.alignSelf === 'normal') {
      res.alignSelf = AlignSelf.NORMAL;
    }
    else {
      res.alignSelf = AlignSelf.AUTO;
    }
  }
  if (style.alignContent !== undefined) {
    if (style.alignContent === 'stretch') {
      res.alignContent = AlignContent.STRETCH;
    }
    else if (style.alignContent === 'flexStart') {
      res.alignContent = AlignContent.FLEX_START;
    }
    else if (style.alignContent === 'flexEnd') {
      res.alignContent = AlignContent.FLEX_END;
    }
    else if (style.alignContent === 'center') {
      res.alignContent = AlignContent.CENTER;
    }
    else if (style.alignContent === 'spaceBetween') {
      res.alignContent = AlignContent.SPACE_BETWEEN;
    }
    else if (style.alignContent === 'spaceAround') {
      res.alignContent = AlignContent.SPACE_AROUND;
    }
    else if (style.alignContent === 'spaceEvenly') {
      res.alignContent = AlignContent.SPACE_EVENLY;
    }
    else {
      res.alignContent = AlignContent.NORMAL;
    }
  }
  if (style.justifyContent !== undefined) {
    if (style.justifyContent === 'stretch') {
      res.justifyContent = JustifyContent.STRETCH;
    }
    else if (style.justifyContent === 'flexStart') {
      res.justifyContent = JustifyContent.FLEX_START;
    }
    else if (style.justifyContent === 'flexEnd') {
      res.justifyContent = JustifyContent.FLEX_END;
    }
    else if (style.justifyContent === 'center') {
      res.justifyContent = JustifyContent.CENTER;
    }
    else if (style.justifyContent === 'spaceBetween') {
      res.justifyContent = JustifyContent.SPACE_BETWEEN;
    }
    else if (style.justifyContent === 'spaceAround') {
      res.justifyContent = JustifyContent.SPACE_AROUND;
    }
    else if (style.justifyContent === 'spaceEvenly') {
      res.justifyContent = JustifyContent.SPACE_EVENLY;
    }
    else {
      res.justifyContent = JustifyContent.NORMAL;
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
  if (style.wordBreak !== undefined) {
    if (typeof style.wordBreak === 'number') {
      res.wordBreak = style.wordBreak;
    }
    else {
      res.wordBreak = {
        inherit: WordBreak.INHERIT,
        breakAll: WordBreak.BREAK_ALL,
        keepAll: WordBreak.KEEP_ALL,
        normal: WordBreak.NORMAL,
      }[style.wordBreak] || WordBreak.INHERIT;
    }
  }
  return res;
};

export type ComputedStyle = {
  boxSizing: BoxSizing;
  display: Display;
  flexGrow: number;
  flexShrink: number;
  flexBasis: number;
  flexWrap: FlexWrap;
  flexDirection: FlexDirection;
  alignItems: AlignItems;
  alignSelf: AlignSelf;
  alignContent: AlignContent;
  justifyContent: JustifyContent;
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
  wordBreak: WordBreak;
};

export function getDefaultComputedStyle(style?: Style) {
  const dft: ComputedStyle = {
    boxSizing: BoxSizing.CONTENT_BOX,
    display: Display.BLOCK,
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 0,
    flexWrap: FlexWrap.NOWRAP,
    flexDirection: FlexDirection.ROW,
    alignItems: AlignItems.NORMAL,
    alignSelf: AlignSelf.AUTO,
    alignContent: AlignContent.NORMAL,
    justifyContent: JustifyContent.NORMAL,
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
    wordBreak: WordBreak.INHERIT,
  };
  // 一些可以在布局前提前计算出的，一些则不可以（如width%)
  if (style) {
    dft.boxSizing = style.boxSizing;
    dft.display = style.display;
    dft.flexGrow = style.flexGrow;
    dft.flexShrink = style.flexShrink;
    dft.flexWrap = style.flexWrap;
    dft.flexDirection = style.flexDirection;
    dft.alignItems = style.alignItems;
    dft.alignSelf = style.alignSelf;
    dft.alignContent = style.alignContent;
    dft.justifyContent = style.justifyContent;
    dft.position = style.position;
    dft.fontFamily = style.fontFamily;
    dft.fontStyle = style.fontStyle;
    dft.verticalAlign = style.verticalAlign;
    dft.overflow = style.overflow;
    dft.fontWeight = style.fontWeight;
    dft.wordBreak = style.wordBreak;
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
      'flexBasis',
    ] as const).forEach(k => {
      const v = style[k];
      // 绝对值px和相对0可以提前知道
      if (v.u === Unit.PX) {
        dft[k] = v.v;
      }
      else if (v.u === Unit.IN) {
        dft[k] = v.v * 96;
      }
      else if (v.u === Unit.CM) {
        dft[k] = v.v * 96 / 2.54;
      }
      else if (v.u === Unit.PT) {
        dft[k] = v.v * 96 / 72;
      }
      else if (v.u === Unit.PC) {
        dft[k] = v.v * 16;
      }
      else if (v.v === 0 && [Unit.PERCENT, Unit.EM, Unit.REM, Unit.PC, Unit.PT, Unit.CM, Unit.IN, Unit.VW, Unit.VH, Unit.VMAX, Unit.VMIN].includes(v.u)) {
        dft[k] = 0;
      }
    });
  }
  return dft;
}
