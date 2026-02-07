import { Rect } from './layout';

export enum LayoutMode {
  NORMAL = 0,
  MIN_MAX = 1, // flex
  OOF_MEASURE = 2, // absolute
}

export interface Context<T extends object = any> {
  layoutMode?: LayoutMode; // absolute/flex第一次测量时标识

  readonly onConfigured: (node: T, rect: Rect) => void; // 结果钩子

  label?: string;
}
