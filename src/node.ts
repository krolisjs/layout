import { Display, getDefaultStyle, Position, Style } from './style';
import { Layout, Rect } from './layout';
import { Context } from './context';

export enum NodeType {
  Node = 0,
  Text = 1,
}

type Options = {
  label?: string;
  layout?: Layout;
};

export abstract class AbstractNode {
  nodeType: NodeType;
  style: Style;
  children: AbstractNode[] = [];
  label: string = '';
  layout: Layout | null = null;
  parent: Node | null = null;
  prev: AbstractNode | null = null;
  next: AbstractNode | null = null;
  rect: Rect | null = null;

  protected constructor(style: Partial<Style>, options?: Options) {
    this.nodeType = NodeType.Node;
    this.style = getDefaultStyle(style);
    if (style.position === Position.ABSOLUTE) {
      if (this.style.display === Display.INLINE || this.style.display === Display.INLINE_BLOCK) {
        this.style.display = Display.BLOCK;
      }
      else if (this.style.display === Display.INLINE_FLEX) {
        this.style.display = Display.FLEX;
      }
    }
    if (options) {
      if (options.label) {
        this.label = options.label;
      }
      if (options.layout) {
        this.layout = options.layout;
      }
    }
  }

  insertBefore(node: AbstractNode) {
    if (this.parent) {
      const i = this.parent.children.indexOf(this);
      if (i > -1) {
        node.parent = this.parent;
        node.prev = this.prev;
        if (this.prev) {
          this.prev.next = node;
        }
        node.next = this;
        this.prev = node;
        this.parent.children.splice(i, 0, node);
      }
    }
  }

  insertAfter(node: AbstractNode) {
    if (this.parent) {
      const i = this.parent.children.indexOf(this);
      if (i > -1) {
        node.parent = this.parent;
        node.prev = this;
        if (this.next) {
          this.next.prev = node;
        }
        node.next = this.next;
        this.next = node;
        this.parent.children.splice(i + 1, 0, node);
      }
    }
  }

  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  lay(x: number, y: number, w: number, h: number, ctx?: Context<AbstractNode>) {
    if (!this.layout) {
      throw new Error('Missing layout: ' + this);
    }
    if (!ctx) {
      ctx = {
        onConfigured(node: AbstractNode, rect: Rect) {
          node.rect = rect;
        },
      };
    }
    this.layout.begin(ctx, this, this.style, x, y, w, h);
    this.children.forEach(child => {
      child.lay(x, y, w, h, ctx);
    });
    this.layout.end(ctx);
  }
}

export class Node extends AbstractNode {
  children: AbstractNode[];

  constructor(style: Partial<Style>, children: Node[] = [], options?: Options) {
    super(style, options);
    this.children = children;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.parent = this;
      // 树共用一个layout
      if (this.layout) {
        child.layout = this.layout;
      }
      if (i) {
        child.prev = children[i - 1];
      }
      if (i < len - 1) {
        child.next = children[i + 1];
      }
      if (child.nodeType === NodeType.Text) {
        child.style = this.style;
      }
    }
  }

  appendChild(item: AbstractNode) {
    this.children.push(item);
  }

  prependChild(item: AbstractNode) {
    this.children.unshift(item);
  }

  removeChild(item: AbstractNode) {
    const i = this.children.indexOf(item);
    if (i > -1) {
      this.children.splice(i, 1);
    }
  }
}

export class Text extends AbstractNode {
  content: string;

  constructor(style: Partial<Style>, content: string, options?: Options) {
    super(style, options);
    if (style.display === undefined) {
      this.style.display = Display.INLINE;
    }
    this.nodeType = NodeType.Text;
    this.content = content;
  }
}
