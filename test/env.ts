import type { Style } from '../dist/index.js';
import { Node } from '../dist/index.js';

type Item = {
  id: number;
  style: Partial<Style>;
  children?: Item[];
};

export function genNode(item: Item) {
  const node = new Node(item.id, item.style);
  if (item.children) {
    node.children = item.children.map(item => genNode(item));
  }
  return node;
}
