# inlineBlock 根因分析

日期：2026-06-12

## 背景

`test/wpt-lite/css2/normal-flow.spec.ts` 中有多组以 `custom-inlineBlock-inline-block-` 开头的失败用例。这些用例覆盖的是一个 `width: auto` 的 `display: inlineBlock` 节点，其子树中同时包含 inline 内容和文档流内的 block 盒子。

这个项目是一个 TypeScript 布局引擎，不会把布局交给浏览器 CSS 引擎处理。`display: 'inlineBlock'` 是项目自定义 `JStyle` 模型中的一个取值，会被转换成内部的 `Display.INLINE_BLOCK` 枚举，再由 `Element.layInlineBlock()` 负责布局。

相关实现位置：

- `src/style.ts` 定义了包含 `'inlineBlock'` 的 `JStyle.display`。
- `src/style.ts` 会把 `'inlineBlock'` 映射成 `Display.INLINE_BLOCK`。
- `src/layout.ts` 定义了 `InlineBlock` 结果类型。
- `src/node.ts` 实现了 `layInlineBlock()` 和 shrink-to-fit 预测量逻辑。

## CSS 规范模型

CSS 对 `inline-block` 有规范模型：

- `inline-block` 会生成一个 inline-level 的 block container。它在外部 inline formatting context 中作为一个原子 inline-level box 参与排版，内部内容按 block container 规则排版。
- normal flow 中的非 replaced `inline-block`，如果 `width: auto`，其 used width 使用 shrink-to-fit width。
- shrink-to-fit width 的概念公式是：

```text
min(max(preferred minimum width, available width), preferred width)
```

- 当一个 inline box 包含文档流内的 block-level box 时，CSS 会把 inline box 在这个 block 前后打断，并用 anonymous block boxes 包住前后的 inline runs。这个 block 不能被当成普通 inline item 直接连续累加。

有用的规范入口：

- CSS 2.2 display model: https://www.w3.org/TR/CSS22/visuren.html#display-prop
- CSS 2.2 inline-block width: https://www.w3.org/TR/CSS22/visudet.html#inlineblock-width
- CSS 2.2 shrink-to-fit: https://www.w3.org/TR/CSS22/visudet.html#float-width
- CSS 2.2 anonymous block boxes: https://www.w3.org/TR/CSS22/visuren.html#anonymous-block-level

## 失败现象

用 ts-node ESM loader 单独跑这组用例，可以看到多个宽度断言不一致：

```bash
env TS_NODE_PROJECT=tsconfig.test.json NODE_OPTIONS='--loader ts-node/esm --no-warnings' npx mocha --grep "custom-inlineBlock-inline-block" test/wpt-lite/css2/normal-flow.spec.ts
```

典型失败包括：

- 期望 inlineBlock 宽度 `100`，实际 `0`。
- 期望 inlineBlock 宽度 `80`，实际 `32`。
- 期望 inlineBlock 宽度 `48`，实际 `32`。
- 期望 inlineBlock 宽度 `208`，实际 `100`。
- 期望 inlineBlock 宽度 `800`，实际 `0`。

这些是宽度计算错误，不只是最终绘制或坐标偏移问题。

## 根因

核心缺陷在于：`inlineBlock` 的 auto 宽度要先做 shrink-to-fit 预测量，但当前预测量没有正确处理“inline 子树中包含 block-level 盒子”的情况。

`Element.layInlineBlock()` 会在真实子布局前计算 auto 宽度：

```ts
const mm = this.shrink2Fit(cs, global);
max = mm.max;
const aw = cs.aw - used;
res.w = Math.max(mm.min, Math.min(max, aw));
```

这意味着 `shrink2Fit()` 必须正确计算 inlineBlock 后代的 preferred minimum width 和 preferred width。

但当前 `shrink2FitInline()` 把所有 inline 子节点都当作连续 inline 序列：

```ts
const o = child.shrink2Fit(cs, global);
min = Math.max(min, o.min);
max += o.max;
```

源码里已经有对应的未完成标记：

```ts
// TODO inline包含block时计算不一样
```

这正好命中失败用例覆盖的场景。

### 问题 1：inline 内部的 block 没有按 block 盒子测量

当 inline 包含 block 子节点时，block 应该打断当前 inline run。它的固定宽度需要作为一个独立的候选行宽或块宽参与 preferred width 计算。

当前 `shrink2FitInline()` 对 child 无条件调用 `child.shrink2Fit()`。对于 `display: block` 且有固定 `width` 的元素，这会绕开 `shrink2FitBlock()`，而 `shrink2FitBlock()` 才知道如何返回固定 block 宽度。

后果：

- `width: 80`、`100`、`500`、`800` 的 block 可能在 inlineBlock auto 宽度预测阶段被忽略或低估。
- 最终 inlineBlock 宽度会偏小。

### 问题 2：inline 包含 block 时不能简单连续求和

纯 inline 内容下，把各子项的 `max` 累加可以近似 preferred width。但 inline 中一旦出现 block-level box，CSS 要求在 block 处打断 inline。

preferred width 应该考虑多个片段的最大值，例如：

- block 前的 inline 文本片段；
- block 自身的 outer width；
- block 后的 inline 文本片段；
- 后续 block 和后续 inline continuation。

它不应该把所有 child 的 `max` 都当作同一行上的连续内容来盲目累加。

这解释了为什么有些用例期望宽度是最大 block 宽度，或者最大 inline run 宽度，而不是所有内容的简单总和。

### 问题 3：computed style 缓存会冻结错误的继承文本度量

`calComputedStyle()` 会设置 `node.computed = true`，之后再次调用会直接返回。

在 shrink-to-fit 预测量阶段，某些 child 可能在其 inline parent 尚未拥有有效 inherited computed style 时就被计算。这样会把子节点冻结在错误状态，例如：

- `fontFamily: inherit`
- `fontSize: 0`
- `lineHeight: 0`

后续真实布局再次调用 `calComputedStyle()` 时，因为 `computed` 已经是 `true`，不会重新计算。

后果：

- 文本测量使用 `fontSize = 0`。
- 文本宽度变成 `0`。
- 最终布局可能出现宽度为 0 的 text fragment，这解释了期望 `w: 100` 或 `w: 800` 却实际变成 `w: 0` 的失败。

## 为什么有些用例能通过

部分用例能通过，是因为真实布局阶段有一些兜底行为会部分修复尺寸：

- `LineBoxContext.addBlock()` 会记录 active inline ancestors 中包含的 block。
- `LineBoxContext.popInline()` 后续会把记录到的 block 纳入 inline result 的包围盒。
- `LineBoxContext.endLine()` 会根据累积的 fragments 计算 inline/text 的 result 盒子。

这些逻辑可以在子布局完成后掩盖一部分 shrink-to-fit 错误。但它们不能修复根因，因为 inlineBlock 的 auto 宽度已经在子布局前确定了，并且 computed style 缓存可能已经让文本度量保持在错误状态。

## 结论

`custom-inlineBlock-inline-block-*` 失败的根因是 inlineBlock auto 宽度的 shrink-to-fit 实现不完整：

1. `shrink2FitInline()` 没有实现 CSS 中 inline content 包含文档流 block box 的特殊规则。
2. inline 后代中的固定宽度 block box 没有稳定纳入 preferred width 计算。
3. shrink-to-fit 预测量会修改 computed style 状态，可能在真实布局前缓存错误的 inherited text metrics。

后续修复方向应当是：把 inline-with-block 当作会被 block 打断的分段结构处理，而不是连续 inline 序列；同时预测量阶段应避免永久缓存无效的 computed style。
