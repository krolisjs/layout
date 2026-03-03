import type { IAllNode, JStyle, Result } from '../dist/index.js';
import { AbstractNode, Context, Node, setMeasureText, TextNode } from '../dist/index.js';

type Item = {
  style?: Partial<JStyle>;
  children?: Item[];
  label?: string;
} | {
  content: string;
  style?: Partial<JStyle>;
  label?: string;
};

export function genNode(item: Item) {
  let node: AbstractNode;
  if ('content' in item) {
    node = new TextNode(item.content, item.style);
  }
  else {
    node = new Node(item.style, []);
    if (item.children) {
      item.children.forEach(child => {
        const n = genNode(child);
        (node as Node).appendChild(n);
      });
    }
  }
  return node;
}

export function createTestContext() {
  const ctx = new Context<IAllNode>({
    constraints: {
      aw: 10000,
      ah: 10000,
    },
    onConfigured: (node: IAllNode, res: Result) => {
    },
    measureText: (content: string, fontFamily: string, fontSize: number, lineHeight: number) => {
      // 这里的参数类型可以利用 TS 自动推导，不用全写一遍
      return {
        width: fontSize * content.length,
        height: lineHeight,
        baseline: lineHeight - 1,
      };
    },
  });
  setMeasureText(ctx.measureText!);
  return ctx;
}
