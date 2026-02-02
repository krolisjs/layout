import type { Style } from '../dist/index.js';

type Node = {
  id: number;
  style: Partial<Style>;
  children?: Node[];
};

export function genNode(node: Node) {
  return node;
}
