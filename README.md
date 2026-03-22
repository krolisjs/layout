# @krolis/layout

A high-performance layout Engine designed for custom UI frameworks, canvas rendering, and headless layout testing.

高性能布局引擎，专为自定义 UI 框架、Canvas 渲染和无头布局测试而设计。

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

```ts
import { AbstractNode, Context, Node, setMeasureText, TextNode } from '@krolis/layout';

const text = new TextNode('content', {
  borderLeftWidth: 2,
});

const child = new Node({
  paddingTop: '10%',
  height: 50,
}, [text]);

const root = new Node({
  width: 500,
}, [child]);

root.lay({
  aw: 10000,
  ah: 10000,
}); // Entry 入口

console.log(root.rect); // { x: 0, y: 0, w: 500, h: 100, ... }
console.log(child.rect); // { x: 0, y: 0, w: 500, h: 50, paddingTop: 50, ... }
console.log(text.rect); // { x: 2, y: 0, rects: { x: 2, y: 50, ... } }

/**
 * If text measurement is involved,
 * please call setMeasureText first to set the font metrics method.
 * The measureText method of the Canvas context on the web only returns width and height,
 * the baseline must be retrieved from font metrics information.
 */
/**
 * 如果涉及到文字测量，请先调用setMeasureText设置字体度量方法。
 * web上常见的canvas的context的measureText方法仅返回width和height，baseline需要从字体信息中读取。
 */
setMeasureText((
  content: string,
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  fontWeight?: number,
  fontStyle?: FontStyle,
  letterSpacing?: number,
) => ({ width: number, height: number, baseline: number }));
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
