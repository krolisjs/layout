export enum LayoutMode {
  NORMAL = 0,
  MIN_MAX = 1, // flex
  OOF_MEASURE = 2, // absolute
}

export interface Context<T extends object = any> {
  readonly measureText: (text: string, fontFamily: string, fontSize: number, fontWeight?: number, fontStyle?: string, letterSpacing?: number) => { width: number; height: number }; // 外部提供的测量文字方法，最常见的比如canvas的measureText

  layoutMode?: LayoutMode; // absolute/flex第一次测量时标识

  readonly onConfigured: (node: T, rect: { x: number, y: number, w: number, h: number }) => void; // 结果钩子
}
