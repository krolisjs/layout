import { InputConstraints, Layout, MeasureText, Rect } from './layout';
import { Style } from './style';

// export enum LayoutMode {
//   NORMAL = 0,
//   MIN_MAX = 1, // flex
//   OOF_MEASURE = 2, // absolute
// }

export class Context<T extends object = any> {
  readonly onConfigured: (node: T, rect: Rect) => void; // 结果钩子
  readonly layout: Layout<T>;
  label = ''; // debug信息

  constructor(props: {
    constraints: InputConstraints;
    onConfigured: (node: T, rect: Rect) => void;
    measureText?: MeasureText;
    rem?: number;
    label?: string;
  }) {
    this.onConfigured = props.onConfigured;
    this.layout = new Layout<T>(props.constraints, props.onConfigured,  props.measureText, props.rem);
    this.label = props.label || this.label;
  }

  begin(node: T, style: Style) {
    this.layout.begin(node, style);
  }

  end(node: T, style: Style) {
    this.layout.end(node, style);
  }
}
