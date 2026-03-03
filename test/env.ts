import type { IAllNode, JStyle } from '../dist/index.js';
import { AbstractNode, Context, Node, TextNode } from '../dist/index.js';

type Item = {
  style?: Partial<JStyle>;
  children?: Item[];
  label?: string;
} | {
  content: string;
  style?: Partial<JStyle>;
  label?: string;
};

export function genNode(item: Item, ctx: Context<IAllNode>) {
  let node: AbstractNode;
  if ('content' in item) {
    node = new TextNode(item.content, ctx.measureText!, item.style, item);
  }
  else {
    node = new Node(item.style, [], item);
    if (item.children) {
      item.children.forEach(child => {
        const n = genNode(child, ctx);
        (node as Node).appendChild(n);
      });
    }
  }
  return node;
}

export function createTestContext() {
  return new Context<IAllNode>({
    constraints: {
      aw: 10000,
      ah: 10000,
    },
    onConfigured: (node, res) => {
    },
    measureText: (content, fontFamily, fontSize, lineHeight) => {
      // 这里的参数类型可以利用 TS 自动推导，不用全写一遍
      return {
        width: fontSize * content.length,
        height: lineHeight,
        baseline: lineHeight - 1,
      };
    },
  });
}
