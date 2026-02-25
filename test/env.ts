import type { JStyle } from '../dist/index.js';
import { AbstractNode, Context, Node, Text } from '../dist/index.js';

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
    node = new Text(item.content, item.style, item);
  }
  else {
    node = new Node(item.style, [], item);
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
  return new Context<AbstractNode>({
    constraints: {
      aw: 10000,
      ah: 10000,
    },
    onConfigured: (node, rect) => {
      node.rect = rect;
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
