import type { JStyle } from '../dist/index.js';
import { AbstractNode, Node, Text } from '../dist/index.js';

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
