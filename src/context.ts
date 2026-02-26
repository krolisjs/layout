import { InputConstraints, Layout, Result } from './layout';
import { MeasureText } from './text';
import { Style } from './style';
import { INode, ITextNode } from './node';

export class Context<T extends (INode | ITextNode)> {
  readonly onConfigured: (node: T, res: Result) => void; // 结果钩子
  readonly layout: Layout<T>;
  label = ''; // debug信息

  constructor(props: {
    constraints: InputConstraints;
    onConfigured: (node: T, res: Result) => void;
    measureText?: MeasureText;
    rem?: number;
    label?: string;
  }) {
    this.onConfigured = props.onConfigured;
    this.layout = new Layout<T>(
      props.constraints,
      props.onConfigured,
      props.measureText,
      props.rem,
    );
    this.label = props.label || this.label;
  }

  begin(node: T, style: Style) {
    this.layout.begin(node, style);
  }

  end(node: T) {
    this.layout.end(node);
  }
}
