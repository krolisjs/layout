import { Style } from './style';
import { Layout } from './layout';
import { Context } from './context';

export class Node {
  id: number;
  style: Partial<Style>;
  children: Node[];
  parent: Node | null = null;
  prev: Node | null = null;
  next: Node | null = null;
  rect: { x: number, y: number, w: number, h: number } | null = null;

  constructor(id: number, style: Partial<Style>, children: Node[] = []) {
    this.id = id;
    this.style = style;
    this.children = children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.parent = this;
      if (i) {
        child.prev = children[i - 1];
      }
      if (i < len - 1) {
        child.next = children[i + 1];
      }
    }
  }

  lay(x: number, y: number, w: number, h: number, ctx?: Context<Node>) {
    if (!ctx) {
      ctx = {
        measureText(text: string, fontFamily: string, fontSize: number) {
          return { width: 0, height: 0 };
        },
        onConfigured(node: Node, rect: { x: number, y: number, w: number, h: number }) {
          node.rect = rect;
        },
      };
    }
    Layout.getInstance().layout(ctx, this, this.style, x, y, w, h);
    this.children.forEach(child => {
      child.lay(x, y, w, h, ctx);
    });
  }

  appendChild(node: Node) {
    this.children.push(node);
  }

  removeChild(node: Node) {
    const i = this.children.indexOf(node);
    if (i > -1) {
      this.children.splice(i, 1);
    }
  }
}
