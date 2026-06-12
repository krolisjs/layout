# inlineBlock shrink-to-fit 修复方案

日期：2026-06-12

## 目标

修复 `normal-flow.spec.ts` 中 `custom-inlineBlock-inline-*` 与 `custom-inlineBlock-inline-block-*` 相关失败，重点解决 `display: inlineBlock` 在 `width: auto` 时的 shrink-to-fit 宽度预测错误。

本方案不改变项目对外 API，不手动编辑 `dist`，只修改 `src` 后通过构建生成产物。

## 设计依据

本项目是自研 TypeScript layout engine。`inlineBlock` 不依赖浏览器实现，而是由 `Element.layInlineBlock()` 在引擎内部计算。

CSS 规范中，normal-flow 的非 replaced `inline-block` 在 `width: auto` 时使用 shrink-to-fit width：

```text
min(max(preferred minimum width, available width), preferred width)
```

同时，inline 内容中如果出现文档流 block-level box，该 block 会打断 inline flow。预测 preferred width 时不能把它当作普通 inline item 连续累加。

## 当前问题

当前 `shrink2FitInline()` 只有 `{ min, max }` 两个标量，并且把所有 child 当作连续 inline 内容：

```ts
const o = child.shrink2Fit(cs, global);
min = Math.max(min, o.min);
max += o.max;
```

这个模型缺少两类信息：

1. block-level child 会打断 inline run。
2. 嵌套 inline 如果内部包含 block，需要把“第一个 open inline segment”和“最后一个 open inline segment”暴露给外层，以便外层前后内容继续拼接。

因此，简单 `{ min, max }` 无法正确表达 nested inline-with-block。

## 修复模型

内部引入一个用于预测量的结构：

```ts
type ShrinkMeasure = {
  min: number;
  max: number;
  first: number;
  last: number;
  split: boolean;
};
```

含义：

- `min`：preferred minimum width。
- `max`：当前子树内部已经形成的最大 preferred width。
- `first`：遇到第一个 block break 之前的 open inline segment 宽度。
- `last`：最后一个 block break 之后仍可与外层后续 inline 内容拼接的 open inline segment 宽度。
- `split`：该 inline 子树内部是否出现过 block break。

### block container 测量

block container 的 children 按 normal flow 分组：

- text / inline / inlineBlock 属于 inline-level，进入当前 inline run。
- block-level child 会先 flush 当前 inline run，然后作为独立候选宽度参与 `max`。
- 如果 inline child 自身 `split = true`，则：
  - 当前 run 拼上 child.first 后 flush；
  - child.max 作为内部最大候选；
  - 当前 run 继续从 child.last 开始。

### inline 测量

inline 的 children 类似处理，但它需要返回 `first/last/split` 给外层：

- 无 block break：`first = last = max = 连续 inline run 宽度`。
- 有 block break：
  - 第一次 break 前的 run 是 `first`；
  - 中间 block 或中间 inline segment 进入 `max`；
  - 最后一次 break 后的 run 是 `last`。

## 额外修复点

预测量遍历 child 前必须先调用 `calComputedStyle(child, cs, global)`，保证 text 和 nested inline 能拿到正确继承后的 `fontSize`、`lineHeight` 等值。

这能避免 `node.computed` 缓存把错误的 inherited text metrics 冻结到真实布局阶段。

## 验证计划

1. `npm run build`
2. 聚焦验证：

```bash
env TS_NODE_PROJECT=tsconfig.test.json NODE_OPTIONS='--loader ts-node/esm --no-warnings' npx mocha --grep "custom-inlineBlock-inline" test/wpt-lite/css2/normal-flow.spec.ts
```

3. 扩大验证：

```bash
env TS_NODE_PROJECT=tsconfig.test.json NODE_OPTIONS='--loader ts-node/esm --no-warnings' npx mocha test/wpt-lite/css2/normal-flow.spec.ts
```

4. 如有时间，再运行全量测试。
