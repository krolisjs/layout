# AGENTS.md

## 项目概述

- 自研 TypeScript layout engine，面向 custom UI 框架、canvas 渲染和 headless 布局测试，不依赖浏览器 DOM/CSS layout engine。
- `display`、normal flow、line box、shrink-to-fit、text measurement 等行为全部由 `src` 内部实现。
- 测试断言的是本项目输出的 `mixedResult`、`frags`、`x/y/w/h`，不是浏览器截图或 DOM 结果。

## 协作约定

- 默认使用中文回复；代码标识符、命令、路径、CSS/TypeScript 术语保留英文。
- 先读相关源码和测试，再判断问题。
- 分析类请求只分析，不改代码；如需落盘分析文档，放 `docs/<agent名>/` 下，kebab-case 命名。
- 修复类请求需要完成实现、构建和相关测试验证。
- 保持改动收敛，不做无关重构。

## 项目结构

- `src/index.ts` — 对外 API 导出入口。
- `src/node.ts` — 节点树（Element/TextNode）与布局主流程入口（`lay*` 系列），以及 shrink-to-fit 预测量（`shrink2Fit*` 系列）。
- `src/layout.ts` — 各 display 类型的具体布局算法与 Result/Constraints 类型定义。
- `src/context.ts` — 跨节点布局上下文：`LineBoxContext`（行盒、对齐、inline 嵌套）与 `MarginContext`（margin 合并）。
- `src/compute.ts` — computedStyle 求值（含缓存）与 baseline/mbp 等几何计算。
- `src/style.ts` — 样式解析与默认值。
- `src/text.ts` — 分词与文字测量预估。
- `test/wpt-lite/` — WPT 精简移植（按 css 模块分文件）；`test/custom/` — 自定义用例；`test/env.ts` — 测量函数注入。

## 构建与测试

- 修改 `src` 后必须先运行 `npm run build`，因为测试从 `dist/index.js` 导入。
- 不要手动编辑 `dist`。
- 常规测试命令：`npm run test`
- 如果 package script 无法加载 `.ts` 测试，使用：

```bash
NODE_OPTIONS='--import tsx --no-warnings' npx mocha --extension ts
```

- 支持 mocha 标准过滤：传入 spec 文件路径限定文件，`-g <pattern>` 限定用例，调试期间优先用过滤而非全量。
- 测试不使用真实字体：所有度量由 `test/env.ts` 注入确定性 stub（`width = fontSize × 字符数`，metrics 为固定比例），具体数值以 `test/env.ts` 当前实现为准。因此用例期望值是可手工推算的精确几何值，怀疑"期望值写错了"之前，先按 stub 规则推算核对。

## 架构与实现要点

- 布局是先根深度递归：block/inlineBlock 生成新的 `Constraints` 和 `LineBoxContext` 传给子树，inline 复用父级的并只推进 `cx/cy`。
- auto 尺寸分两阶段决议：宽度在进入子树递归前确定（block 撑满可用宽，inlineBlock/absolute 走 `shrink2Fit` 预测量做 shrink-to-fit），高度在子树布局完成后回填。布局过程不会回头修正已定的宽度，因此预测量是宽度正确性的唯一来源。
- 样式继承自上而下单向求值：`calComputedStyle` 假定 parent 的 computedStyle 已就绪，且结果一次性缓存（`node.computed`）。任何在正式布局前触发样式计算的路径（预测量、二次布局），必须保证当时的继承链与正式布局一致，否则脏值被冻结。
- 测量路径（`shrink2Fit` 族、`minMaxText`）与布局路径共享样式计算和缓存，两条路径对同一节点求出的样式必须一致；新增提前测量的逻辑时要审视缓存副作用。
- 引擎不内置任何字体/分词能力，全部经 `setMeasureText`、`setMetricizeFont`、`setSegmentText` 注入；实现里不得绕过注入接口假设字体行为。
- inline/line box 相关变更要特别注意 `LineBoxContext` 的状态传递和收口逻辑：行的结束（`endLine`）才结算 inline/text 的包围盒，行内任何节点的尺寸在收口前都可能变。
- inline 内包含文档流 block-level box 是 CSS 特殊场景（前后强制断行、产生匿名块），布局和测量两条路径都不能当作普通连续 inline 序列累加。
- 涉及 CSS-like 行为时，优先对照 W3C/CSS 规范和现有 WPT-lite 测试，再决定项目实现应如何收敛。行为正确性的最终裁判是 CSS 规范语义，不是某个用例碰巧通过。
