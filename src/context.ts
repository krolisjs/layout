export enum LayoutMode {
  NORMAL = 0,
  MIN_MAX = 1, // flex
  OOF_MEASURE = 2, // absolute
}

export interface Context {
  readonly traceId: number; // 外部每次递归调用传入一个唯一id，一般可以自增
  readonly node: object; // 外部树结构中的节点，传入方便根据node保存一些缓存数据在weakMap上

  readonly measureText: (text: string) => { width: number; height: number }; // 外部提供的测量文字方法，最常见的比如canvas的measureText

  layoutMode?: LayoutMode; // absolute/flex第一次测量时标识
}
