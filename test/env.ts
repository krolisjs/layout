import type { Style } from '../dist/index.js';
import { AbstractNode, Layout, Node, Text } from '../dist/index.js';

type Item = {
  id: number;
  style: Partial<Style>;
  children?: Item[];
  label?: string;
  layout?: Layout;
} | {
  id: number;
  style: Partial<Style>;
  content: string;
  label?: string;
  layout?: Layout;
};

export function genNode(item: Item) {
  let node: AbstractNode;
  if ('content' in item) {
    node = new Text(item.style, item.content, item);
  }
  else {
    node = new Node(item.style, [], item);
    if (item.children) {
      node.children = item.children.map(item => genNode(item));
    }
  }
  node.label = item.id.toString();
  return node;
}
