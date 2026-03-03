import { InputConstraints, Result } from './layout';
import { MeasureText } from './text';
import type { Style } from './style';
import { AbstractNode, genNode, Node } from './node';
import type { IAllNode } from './node';

export class Context<T extends IAllNode> {
  readonly constraints: InputConstraints;
  readonly onConfigured: (node: T, res: Result) => void; // 结果钩子
  measureText?: MeasureText;
  private root: AbstractNode | null = null;
  private current: AbstractNode | null = null;
  private stack: { source: T, node: AbstractNode }[] = []; // 生成layoutTree用，伴随begin/end出入栈
  private stackCopy: { source: T, node: AbstractNode }[] = []; // 同上但结果调用，记录整树不出栈

  constructor(props: {
    constraints: InputConstraints;
    onConfigured: (node: T, res: Result) => void;
    measureText?: MeasureText;
    rem?: number;
  }) {
    this.constraints = props.constraints;
    this.onConfigured = props.onConfigured;
    this.measureText = props.measureText;
  }

  begin(source: T, style: Style) {
    const node = genNode(source, style);
    if (this.current) {
      (this.current as Node).appendChild(node);
    }
    this.current = node;
    const o = { source, node };
    this.stack.push(o);
    this.stackCopy.push(o);
    // 首个是根节点
    if (!this.root) {
      this.root = node;
    }
  }

  end() {
    const stack = this.stack;
    stack.pop();
    if (stack.length) {
      this.current = stack[stack.length - 1].node;
    }
    else {
      this.current = null;
    }
    // 收集结束，从root开始布局
    if (!this.current) {
      this.root!.lay(this.constraints);
      const onConfigured = this.onConfigured;
      const stackCopy = this.stackCopy;
      for (let i = 0, len = stackCopy.length; i < len; i++) {
        const item = stackCopy[i];
        onConfigured(item.source, item.node.result!);
      }
    }
  }
}
