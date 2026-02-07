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
  margin: Length;
  padding: Length;
  left: Length;
  top: Length;
  right: Length;
  bottom: Length;
  width: Length;
  height: Length;
  minWidth: Length;
  maxWidth: Length;
  minHeight: Length;
  maxHeight: Length;
};
