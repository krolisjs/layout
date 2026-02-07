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
  // minWidth: Length;
  // maxWidth: Length;
  // minHeight: Length;
  // maxHeight: Length;
};

export const getDefaultStyle = (style?: Partial<Style>) => {
  const dft: Style = {
    boxSizing: BoxSizing.BORDER_BOX,
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
  };
  if (style) {
    Object.assign(dft, style);
  }
  return dft;
}
