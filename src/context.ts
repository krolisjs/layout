export enum LayoutMode {
  NORMAL = 0,
  MIN_MAX = 1, // flex
  OOF_MEASURE = 2, // absolute
}

export interface Context {
  // readonly storage: WeakMap<object, {}>;

  readonly measureText: (text: string) => { width: number; height: number }; // 外部提供的测量文字方法，最常见的比如canvas的measureText

  layoutMode?: LayoutMode; // absolute/flex第一次测量时标识

  absQueue?: object[]; // absolute延迟处理记录

  readonly onConfigured: (node: Object, rect: { x: number, y: number, w: number, h: number }) => {}; // 结果钩子
}
