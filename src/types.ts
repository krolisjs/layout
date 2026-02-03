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
  PERCENT = 3,
  NUMBER = 4,
  VW = 5,
  VH = 6,
  VMAX = 7,
  VMIN = 8,
}

export enum BoxSizing {
  CONTENT_BOX = 0,
  BORDER_BOX = 1,
}

export type StyleLength = {
  v: number;
  u: Unit;
};

export type Style = {
  boxSizing: BoxSizing;
  display: Display;
  position: Position;
  margin: StyleLength;
  padding: StyleLength;
  left: StyleLength;
  top: StyleLength;
  right: StyleLength;
  bottom: StyleLength;
  width: StyleLength;
  height: StyleLength;
  minWidth: StyleLength;
  maxWidth: StyleLength;
  minHeight: StyleLength;
  maxHeight: StyleLength;
};
