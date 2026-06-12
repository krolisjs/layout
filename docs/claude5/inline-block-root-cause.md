# inlineBlock 宽度计算缺陷根因分析

> 范围：`test/wpt-lite/css2/normal-flow.spec.ts` 中 `custom-inlineBlock-*` 开头的失败用例。
> 仅分析，未改动代码。

## 失败用例概览

| 用例 | 期望 → 实得 | 主因 |
|---|---|---|
| 第一组 custom-inlineBlock-inline-block-001 (L889) | w 100 → 0 | 缺陷 1a + 2；完全修复还需缺陷 3 |
| custom-inlineBlock-inline-001 (L982) | w 64 → 32 | 缺陷 3（连续 inline 取 max 未累加） |
| 第二组 custom-inlineBlock-inline-block-001/002 (L1012/L1050) | w 80 → 32 | 缺陷 1a + 2（inline 内定宽 block 丢失） |
| custom-inlineBlock-inline-block-003 (L1085) | w 48 → 32 | 缺陷 1a + 2 + 3 |
| custom-inlineBlock-inline-block-005 (L1163) | w 208 → 100 | 缺陷 1b + 3 |
| custom-inlineBlock-inline-block-006 (L1205) | 文本 'a' w 16→0、y 1→15 | 缺陷 1b（污染泄漏到正式布局） |
| custom-inlineBlock-inline-block-007 (L1294) | w 800 → 0 | 缺陷 1a + 2 |

通过的 004 与第一组 002 属于巧合：断言只查根宽度，恰好等于内部定宽 block
经由通用 `shrink2Fit` 正确分发后测出的值。

## 整体机制（为什么预测量错 = 最终宽度错）

`inlineBlock` 宽度为 auto 时，最终宽度完全由预测量决定：

- `Element.layInlineBlock`（src/node.ts:367）在布局前调用 `this.shrink2Fit(cs, global)`
  取得 min/max-content，然后 `res.w = Math.max(mm.min, Math.min(max, aw))`（src/node.ts:381）。
  这是 CSS 2.1 §10.3.5 的 shrink-to-fit 公式。
- 布局结束后 `afterFlowBox`（src/layout.ts:204）只回填自动高度，不回填宽度。

因此 `shrink2Fit` 家族测错，inlineBlock 的最终宽度必然错。缺陷集中在三处。

## 缺陷 1：`shrink2FitInline` 不对子节点调用 `calComputedStyle`

位置：src/node.ts:709-720。

对比同族的另外两个入口：

- `Element.shrink2Fit`（src/node.ts:659）：循环里先 `calComputedStyle(child, cs, global)` 再测量；
- `Element.shrink2FitBlock`（src/node.ts:697）：递归分支同样先 `calComputedStyle`；
- `Element.shrink2FitInline`：直接 `child.shrink2Fit(cs, global)`，没有计算样式。

同类代码三缺一，属遗漏。后果分两层：

### 1a. 直接后果：文本测量宽度为 0

`minMaxText`（src/layout.ts:462）用 `computedStyle.fontSize` 调 measureText。
未经 `calComputedStyle` 的节点 fontSize 是默认值 0（src/style.ts `getDefaultComputedStyle`），
于是 inline 下所有文本的 min/max 全为 0。这是 007（期望 800 实得 0）和
第一组 001（期望 100 实得 0）根宽度归零的直接原因。

### 1b. 持久污染：错误样式被缓存锁死，泄漏到正式布局

`calComputedStyle`（src/compute.ts:111-116）以 `node.computed = true` 做一次性缓存。
当 inline 内嵌套 inline 时：

1. 内层 inline 自身从未被 `calComputedStyle`（fontSize 保持 0）；
2. 但通用 `shrink2Fit` 会对它的孙子节点调用 `calComputedStyle`，
   孙子继承 `parent.computedStyle.fontSize = 0` 并被打上 `computed = true`；
3. 正式布局阶段 `calComputedStyle` 直接 early-return，
   错误的 fontSize / lineHeight / contentArea 永久生效。

实证（006 用例）：文本 `'a'` 最终布局结果为
`{x:16, y:15, w:0, h:0, baseline:0}`，期望 `{w:16, y:1}`。
这不只是测量错——真实渲染几何也错了。同样的子树不包在 inlineBlock 下
（不经预测量路径）时结果完全正确，证明污染来源是测量阶段。

## 缺陷 2：`shrink2FitInline` 对元素子节点不按 display 分发

位置：src/node.ts:709-720。

它对所有元素子节点统一调用通用 `child.shrink2Fit()`。而通用 `shrink2Fit`
是"容器测量"：只遍历该节点的孩子，完全无视节点自身的固定 width 与 mbp。

对比正确路径：通用 `shrink2Fit`（src/node.ts:665-674）会按 display 分发——
inline 走 `shrink2FitInline`，block 走 `shrink2FitBlock`；后者有
`isFixed(style.width)` 分支（src/node.ts:686）能拿到固定宽。

后果：inline 内 `display:block; width:80` 的空块被测成 `{min:0, max:0}`。
这是第二组 001/002（期望 80 实得 32）的主因。同理，嵌套 inline 被通用
`shrink2Fit` 以"取 max"语义测量，而 inline 应是"行内累加"语义。

## 缺陷 3：max-content 的累加 / 断行语义错误

位置：src/node.ts:714 作者自留 `// TODO inline包含block时计算不一样`。

两个方向都错：

### 3a. block 容器内连续 inline 子节点应累加，代码取 max

`shrink2Fit` / `shrink2FitBlock` 对每个孩子都是 `max = Math.max(max, o.max)`。
连续的文本/inline 在 max-content 下同处一行，应当求和。
实证：custom-inlineBlock-inline-001（block 内文本 `'12'`、`'ab'`）
期望 64（32+32 同行），实得 32。

### 3b. inline 内含 block 子节点应断行，代码无脑求和

`shrink2FitInline` 里 `max += o.max` 把所有孩子相加。但 CSS 2.1 §9.2.1.1
规定 inline 内的 block 会在其前后强制断行（生成匿名块盒），正确语义是：

```
max = max(块前行内段累加宽, block 自身宽, 块后行内段累加宽)
```

且断行信息需向上传播：父级累加行内段时，遇到含 block 的 inline 子节点
要在该处切段，不能把它当作一个整体宽度加进当前行。

期望值来源（均按测试度量 16px/字符）：

- 003：`max('12'+0=32, 30, '567'+'12'?…)`→ 实际为 `'12'`(32) 断行、30、`'567'`(48) 三段取最大 = 48；
- 005：第一行 `'1234567890'+'abc'` = 160+48 = 208；
- 006：中段 500px block 独占一行 = 500；
- 第一组 001：`max('12'=32, 100, 'ab'=32)` = 100（而非 32+100+32=164）。

## 修复注意事项（三处需同时处理）

三个缺陷相互掩盖：只修缺陷 1（fontSize）而不修缺陷 3，
部分用例会从"全 0"变成"求和过大"——例如第一组 001 会得 164 而非 100。
建议顺序：

1. `shrink2FitInline` 补 `calComputedStyle`，并按 display 分发到
   `shrink2FitBlock` / `shrink2FitInline`（修缺陷 1、2）；
2. 重写 inline 的 max-content 语义：维护"当前行内段累计 + 段极值"，
   遇 block 子节点切段（修缺陷 3b），并让返回值携带首段/尾段宽度
   以支持父级跨子节点拼接行内段（修缺陷 3a 在 inline 场景的传播）；
3. block 容器内连续 inline 级孩子的 max 改为按行内段累加（修缺陷 3a）；
4. 警惕缺陷 1b 的缓存语义：测量阶段对子树的 `calComputedStyle`
   结果会被 `computed` 标记缓存进正式布局，修复时必须保证测量阶段
   计算样式的入参（继承链）与正式布局一致，否则污染依旧。

## 附：测试运行环境问题（非本缺陷，但会挡住复现）

Node 20.19 下 `package.json` 的
`NODE_OPTIONS='--import ts-node/esm'` 会报
`Unknown file extension ".ts"`，改用 `--loader ts-node/esm` 可正常运行：

```shell
TS_NODE_PROJECT=tsconfig.test.json NODE_OPTIONS='--loader ts-node/esm --no-warnings' \
  npx mocha test/wpt-lite/css2/normal-flow.spec.ts
```
