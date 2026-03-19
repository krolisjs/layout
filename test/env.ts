import type { JStyle } from '../dist/index.js';
import { AbstractNode, Node, setMeasureText, setMetricizeFont, TextNode } from '../dist/index.js';

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

export function createTestInputConstraints() {
  setMeasureText((content: string, fontFamily: string, fontSize: number, lineHeight: number) => {
    return {
      width: fontSize * content.length,
      height: lineHeight,
    };
  });
  setMetricizeFont((fontFamily: string) => {
    return {
      blr: 0.875,
      car: 1,
      lgr: 1.5,
    };
  });
  return { aw: 10000, ah: 10000 };
}
