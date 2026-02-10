# @krolis/layout

A high-performance, imperative layout Orchestrator/Engine designed for custom UI frameworks, canvas rendering, and headless layout testing.

一款高性能、指令式布局编排器、引擎，专为自定义 UI 框架、Canvas 渲染和无头布局测试而设计。

_Derived from Kronos (Titan of Time) + Belisama (Goddess of Fire & Craft)._

_断时流火，因文化不同英文名源自克洛诺斯（时间之神）与贝莉萨玛（火与工艺之神）。_

[![NPM version](https://img.shields.io/npm/v/@krolis/layout.svg)](https://npmjs.org/package/@krolis/layout)
![CI](https://github.com/krolisjs/layout/workflows/CI/badge.svg)

<img src="https://raw.githubusercontent.com/krolisjs/layout/refs/heads/main/layout.svg" width="200" height="200" />

## Install

```shell
npm install @krolis/layout
```

## Usage

### Simple integration 简单接入

```ts
import { AbstractNode, Context, Node } from '@krolis/layout';

// A context object must be created for each layout cycle 每轮布局需要创建一个context对象
const ctx = new Context<AbstractNode>({
  constraints: {
    aw: 10000, // Available dimensions for the outermost boundary; this definition is ignored if the root node has a fixed size
    ah: 10000, // 最外层可用尺寸，如果根节点固定尺寸这里定义无效
  },
  // Hook, callback when the layout is completed 钩子，在布局完成时回调
  onConfigured: (node, rect) => {
    node.rect = rect;
  },
});

const child = new Node({
  paddingTop: '10%',
  width: 100,
  height: 50,
});

const container = new Node({
  width: 500,
}, [
  child,
]);

container.lay(ctx); // Entry 入口

console.log(container.rect); // { x: 0, y: 0, w: 500, h: 100, ... }
console.log(child.rect); // { x: 0, y: 0, w: 100, h: 50, paddingTop: 50, ... }
```

### Imperative integration 指令式接入

```ts
import { Context, Style } from '@krolis/layout';

// You might already have your own render tree and leaf node structures 你可能有自己的渲染树和叶子结点结构
class Node {
  style: Style;
  children: Node[];

  constructor(style: Style, children: Node[] = []) {
    this.style = style;
    this.children = children;
  }
  
  // Implement the lay() method to traverse leaf nodes in pre-order 实现一个lay()方法，先序遍历叶子节点
  lay(ctx: Context<Node>) {
    // First, invoke the begin method 先调用begin()方法
    ctx.begin(this, this.style);
    // Followed by a pre-order traversal 再先序遍历
    this.children.forEach(child => {
      child.lay(ctx);
    });
    // Finally call the end method 最后调用end()方法
    ctx.end(this, this.style);
  }
}

// The remaining steps are identical to the simple integration, but without generating redundant layout tree structures
// 剩下的和简单接入一样，但不产生多余的布局树结构

```

## Dev

```shell
npm run dev
```

## Test

```shell
npm run test
```

Test cases are adapted from the official Web Platform Tests: https://github.com/web-platform-tests/wpt

Each subdirectory corresponds to a *.spec.ts file wrapped in a describe block. Within these directories, each individual test page is mapped to a corresponding it block within the expect assertions.

测试用例改写自官方 Web Platform Tests：https://github.com/web-platform-tests/wpt

每个子目录对应一个*.spec.ts文件，该文件被封装在describe块中。在这些目录中，每个单独的测试页面都映射到expect断言中相应的it块。

# License

[MIT License]
