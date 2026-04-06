import type { JStyle } from '../dist/index.js';
import { Element, setMeasureText, setMetricizeFont, TextNode } from '../dist/index.js';

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
  if ('content' in item) {
    return new TextNode(item.content, item.style);
  }
  else {
    const node = new Element(item.style, []);
    if (item.children) {
      item.children.forEach(child => {
        const n = genNode(child);
        node.appendChild(n);
      });
    }
    return node;
  }
}

export function createTestInputConstraints() {
  setMeasureText((content: string, fontFamily: string, fontSize: number, lineHeight: number) => {
    return {
      width: fontSize * content.length,
    };
  });
  setMetricizeFont((fontFamily: string) => {
    if (fontFamily === 'Ahem') {
      return {
        ascentRatio: 0.8,
        descentRatio: 0.2,
        lineGapRatio: 0,
      };
    }
    return {
      ascentRatio: 0.875,
      descentRatio: 0.5,
      lineGapRatio: 0.125,
    };
  });
  return { aw: 10000, ah: 10000 };
}
