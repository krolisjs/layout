import { Display, JStyle, Position, Style, getDefaultStyle, normalizeJStyle } from './style';
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
  readonly children: AbstractNode[] = [];
  label: string = '';
  layout: Layout | null = null;
  parent: Node | null = null;
  prev: AbstractNode | null = null;
  next: AbstractNode | null = null;
  rect: Rect | null = null;

  protected constructor(style: Partial<JStyle>, options?: Options) {
    this.nodeType = NodeType.Node;
    this.style = getDefaultStyle(normalizeJStyle((style)));
    if (this.style.position === Position.ABSOLUTE) {
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
        node.layout = this.parent.layout;
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
        node.layout = this.parent.layout;
        this.parent.children.splice(i + 1, 0, node);
      }
    }
  }

  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  lay(ctx: Context<AbstractNode> | null, ox = 0, oy = 0, aw = 0, ah = 0, pbw = aw, pbh = ah) {
    if (!this.layout) {
      throw new Error('Missing layout: ' + this.label);
    }
    if (!ctx) {
      ctx = {
        onConfigured(node: AbstractNode, rect: Rect) {
          node.rect = rect;
        },
      };
    }
    const constraints = this.layout.begin(ctx, this, this.style, ox, oy, aw, ah, pbw, pbh);
    this.children.forEach(child => {
      child.lay(ctx, constraints.ox, constraints.oy, constraints.aw, constraints.ah, constraints.pbw, constraints.pbh);
    });
    this.layout.end(ctx);
  }
}

export class Node extends AbstractNode {
  children: AbstractNode[];

  constructor(style: Partial<JStyle>, children: Node[] = [], options?: Options) {
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
    item.layout = this.layout;
  }

  prependChild(item: AbstractNode) {
    this.children.unshift(item);
    item.layout = this.layout;
  }

  removeChild(item: AbstractNode) {
    const i = this.children.indexOf(item);
    if (i > -1) {
      this.children.splice(i, 1);
      item.layout = null;
    }
  }
}

export class Text extends AbstractNode {
  content: string;

  constructor(style: Partial<JStyle>, content: string, options?: Options) {
    super(style, options);
    if (style.display === undefined) {
      this.style.display = Display.INLINE;
    }
    this.nodeType = NodeType.Text;
    this.content = content;
  }
}
