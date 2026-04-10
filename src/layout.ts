import { BoxSizing, Position, Unit } from './constants';
import {
  CJK_REG_EXTENDED,
  getMeasureText,
  getMetricizeFont,
  lineBreak,
  smartMeasure,
} from './text';
import type { Global, IElementNode, INode, ITextNode } from './node';
import {
  calContentArea,
  calLength,
  getMbpLeft,
  getMbpRight,
  getMbpH,
  getMbpTop, calBaseline,
} from './compute';
import { LineBoxContext } from './context';

// 不包含边距边框，纯内容尺寸
export type Frag = { x: number; y: number; w: number; h: number };

export type Block = {
  type: 'block';
  frags: null;
} & Frag;

export type Inline = {
  type: 'inline';
  frags: Frag[];
} & Frag;

export type Text = {
  type: 'text';
  baseline: number; // 相对于TextBox的y的值
  // 包含所有折行后的矩形，按行序排列
  frags: TextBox[];
} & Frag;

export type InlineBlock = {
  type: 'inlineBlock';
  frags: null;
} & Frag;

export type TextBox = Frag & {
  content: string; // 这一行的内容
};

export type Result = Block | InlineBlock | Inline | Text;

export type Constraints = {
  ox: number; // 相对原点坐标
  oy: number;
  aw: number; // 可用尺寸
  ah: number;
  pbw: number | null; // 百分比基于尺寸
  pbh: number | null; // 可能出现null表示无法使用%计算，退化为auto
  cx: number; // 当前坐标，flow流用到，absolute时自动位置也会用
  cy: number;
};

export type InputConstraints = Pick<Constraints, 'aw' | 'ah'>
  & Partial<Omit<Constraints, 'aw' | 'ah'>>;

export type Offset = { x: number; y: number };

export function normalizeConstraints(ic: InputConstraints) {
  return Object.assign({
    ox: 0,
    oy: 0,
    cx: 0,
    cy: 0,
    pbw: ic.aw,
    pbh: ic.ah,
  }, ic) as Constraints;
}

export function preset(node: INode, cs: Constraints, type: Result['type'], global: Global) {
  const style = node.style;
  const computedStyle = node.computedStyle;
  let res: Result;
  if (type === 'text') {
    res = {
      type,
      frags: [],
      x: cs.cx,
      y: cs.cy,
      w: 0,
      h: 0,
      baseline: calBaseline(computedStyle.fontFamily, computedStyle.fontSize, computedStyle.lineHeight, true),
    }
  }
  else {
    res = {
      type,
      frags: ['block', 'inlineBlock'].includes(type) ? null : [],
      x: cs.cx,
      y: cs.cy,
      w: 0,
      h: 0,
    } as (Block | Inline | InlineBlock);
  }

  if (style.width.u !== Unit.AUTO) {
    res.w = Math.max(0, calLength(style.width, cs.pbw || 0, global.rem, computedStyle.fontSize));
    if (style.boxSizing === BoxSizing.BORDER_BOX) {
      res.w = Math.max(0, res.w - (computedStyle.borderLeftWidth + computedStyle.borderRightWidth + computedStyle.paddingLeft + computedStyle.paddingRight));
    }
  }

  // 父auto子%，不计算默认0
  if (style.height.u !== Unit.AUTO && (cs.pbh !== null || style.height.u !== Unit.PERCENT)) {
    res.h = Math.max(0, calLength(style.height, cs.pbh || 0, global.rem, computedStyle.fontSize));
    if (style.boxSizing === BoxSizing.BORDER_BOX) {
      res.h = Math.max(0, res.h - (computedStyle.borderTopWidth + computedStyle.borderBottomWidth + computedStyle.paddingTop + computedStyle.paddingBottom));
    }
  }

  // 排除mbp后的contentBox的坐标，注意inline不考虑y方向
  res.x += getMbpLeft(computedStyle);
  // box的marginTop先不算，因为有合并计算
  if (type === 'block') {
    res.y += computedStyle.borderTopWidth + computedStyle.paddingTop;
    return res as Block;
  }
  if (type === 'inlineBlock') {
    res.y += getMbpTop(computedStyle);
    return res as InlineBlock;
  }
  if (type === 'inline') {
    return res as Inline;
  }
  return res as Text;
}

// block和inlineBlock复用
function bib(node: IElementNode, cs: Constraints, res: Block | InlineBlock) {
  node.result = res;
  const style = node.style;
  const computedStyle = node.computedStyle;
  // 返回递归的供子节点使用，block因为可能有margin合并，先不计入marginTop
  const ox = cs.cx + computedStyle.marginLeft + computedStyle.paddingLeft + computedStyle.borderLeftWidth;
  let oy = cs.cy + computedStyle.paddingTop + computedStyle.borderTopWidth;
  if (res.type === 'inlineBlock') {
    oy += computedStyle.marginTop;
  }
  const scs: Constraints = {
    ox,
    oy,
    aw: res.w,
    ah: res.h,
    cx: ox,
    cy: oy,
    pbw: res.w,
    pbh: res.h,
  };
  if (style.width.u === Unit.AUTO) {
    // 这里block的auto视作撑满，inlineBlock在进入布局时无效，预测量完后在layInlineBlock里自己改
    if (res.type === 'block') {
      scs.pbw = scs.aw = res.w = Math.max(0, cs.aw - getMbpH(computedStyle));
    }
    else {
      scs.pbw = null;
    }
    // 应用minWidth和maxWidth约束，它们已校验不可能为负值
    const minWidth = computedStyle.minWidth;
    if (minWidth !== null && minWidth > 0) {
      res.w = Math.max(res.w, minWidth);
      scs.pbw = scs.aw = res.w;
    }
    // min>max冲突时，min优先级更高
    const maxWidth = computedStyle.maxWidth;
    if (maxWidth !== null && maxWidth >= 0 && style.maxWidth.u !== Unit.AUTO) {
      if (minWidth !== null) {
        if (maxWidth >= minWidth) {
          res.w = Math.min(res.w, maxWidth);
          scs.pbw = scs.aw = res.w;
        }
      }
      else {
        res.w = Math.min(res.w, maxWidth);
        scs.pbw = scs.aw = res.w;
      }
    }
  }
  // 父级高度auto时，%失效也是auto
  if (style.height.u === Unit.AUTO || style.height.u === Unit.PERCENT && cs.pbh === null) {
    scs.ah = cs.ah;
    scs.pbh = null; // auto
  }
  return scs;
}

// 广义的block（flex/grid也是）开始，处理行结束换行，因为可能prev是inline
export function beforeFlowBox(cs: Constraints, lbc: LineBoxContext) {
  if (lbc.endLine()) {
    const current = lbc.current;
    cs.cx = cs.ox;
    cs.cy = current.y + current.h;
  }
}

export function afterFlowBox(cs: Constraints, node: IElementNode) {
  const scs = node.constraints!;
  const lbc = node.lineBoxContext!;
  if (lbc.endLine()) {
    const current = lbc.current;
    scs.cx = scs.ox;
    scs.cy = current.y + current.h;
  }
  const style = node.style;
  const res = node.result!;
  const computedStyle = node.computedStyle;
  // 自动高度，以及%高度但父级是auto
  if (style.height.u === Unit.AUTO || style.height.u === Unit.PERCENT && cs.pbh === null) {
    res.h = Math.max(0, scs.cy - scs.oy);
  }
  // 没有包含marginBottom，因为要处理合并
  cs.cx = cs.ox;
  cs.cy = res.y + res.h + computedStyle.paddingBottom + computedStyle.borderBottomWidth;
}

export function block(node: IElementNode, cs: Constraints, global: Global, lbc: LineBoxContext, res?: Block) {
  beforeFlowBox(cs, lbc);
  if (!res) {
    res = preset(node, cs, 'block', global) as Block;
  }
  return bib(node, cs, res);
}

export function inline(node: IElementNode, cs: Constraints, global: Global, lbc: LineBoxContext) {
  const res = preset(node, cs, 'inline', global) as Inline;
  // inline的上下margin无效，border/padding对绘制有效但布局无效
  const computedStyle = node.computedStyle;
  computedStyle.marginTop = computedStyle.marginBottom = 0;
  node.result = res;
  // 修改当前的，inline复用
  cs.cx += getMbpLeft(computedStyle);
  // 就算有左mbp，可能放不下也不管，因为可能是空节点（递归空也是），等后续判断
  lbc.addInline(node, cs.cx, cs.cy);
}

export function inlineBlock(node: IElementNode, cs: Constraints, global: Global, res?: InlineBlock) {
  if (!res) {
    res = preset(node, cs, 'inlineBlock', global) as InlineBlock;
  }
  return bib(node, cs, res);
}

export function text(node: ITextNode, cs: Constraints, global: Global, lbc: LineBoxContext) {
  // 忽略空文字节点
  if (!node.content) {
    return;
  }
  const measureText = getMeasureText();
  if (!measureText) {
    throw new Error('Text must be passed to the measureText method.');
  }
  const metricizeFont = getMetricizeFont();
  if (!metricizeFont) {
    throw new Error('Text must be passed to the metricizeFont method.');
  }
  const style = node.style;
  const res = preset(node, cs, 'text', global) as Text;
  node.result = res;
  const computedStyle = node.computedStyle;
  const { fontFamily, fontSize, letterSpacing, lineHeight } = computedStyle;
  // inline的上下margin无效，但不修改值只是无视它
  let cx = cs.cx + getMbpLeft(computedStyle);
  let cy = cs.cy;
  let aw = cs.aw;
  let maxW = 0;
  const frags: TextBox[] = res.frags;
  const content = node.content;
  // 每个textBox还要额外的计算内容区域高度，设置上下平分leading
  let contentArea = node.contentArea;
  if (contentArea === null) {
    contentArea = node.contentArea = calContentArea(fontFamily, fontSize);
  }
  const leading = (lineHeight - contentArea) * 0.5;
  // 不在行首时要检查换行，有可能本行一个字符都排不下
  if (!lbc.current.begin) {
    const c = node.content[0];
    const m = measureText(
      c,
      fontFamily,
      fontSize,
      lineHeight,
      style.fontWeight,
      style.fontStyle,
      letterSpacing,
    );
    const w = m.width;
    if (cs.cx + w - cs.ox > cs.aw) {
      lbc.prepareNextLine();
      lbc.endLine(); // 这里传个标识符绝对有下一行新的，这样刚开始的inline父节点会变到下一行
      cx = cs.ox;
      cy += lineHeight;
      lbc.newLine(cx, cy);
    }
  }
  // 遇到\n换行符手动标识
  let newLineLB = false;
  // 非\n换行标识
  let newLineAuto = false;
  // 循环获取满足宽度下的字符串
  let i = 0;
  let length = content.length;
  while (i < length) {
    if (lineBreak.test(content[i])) {
      i++;
      // 连续的换行符，每个产生一个空行
      if (newLineLB || !newLineAuto) {
        lbc.endLine();
        cx = cs.ox;
        cy += lineHeight;
        lbc.newLine(cx, cy);
        if (newLineLB) {
          addEmptyLine(cx, cy + leading, contentArea, node, frags, lbc);
        }
      }
      // 后续普通的字符自动用新的行y坐标，如果这是最后一个字符，后面逻辑识别生成新行
      newLineLB = true;
      newLineAuto = false;
      continue;
    }
    // 置false，前面假如有换行已经设置好换行坐标了，新的内容用这个坐标即可
    newLineLB = false;
    newLineAuto = false;
    // 使用一种预测字符长度的技术，结合2分查找，减少调用measureText的次数
    const {
      num,
      width,
      breakLine, // 长度不足需要换行，不考虑\n
    } = smartMeasure(
      measureText,
      content,
      i,
      aw,
      fontFamily,
      fontSize,
      lineHeight,
      style.fontWeight,
      style.fontStyle,
      letterSpacing,
    );
    const textBox: TextBox = {
      x: cx,
      y: cy + leading,
      w: width,
      h: contentArea,
      content: content.slice(i, i + num),
    };
    frags.push(textBox);
    i += num;
    lbc.addText(textBox, node);
    maxW = Math.max(maxW, textBox.w);
    if (breakLine) {
      newLineAuto = true;
      // 新开一行，这里能提前知道
      if (i < length) {
        lbc.endLine();
        cx = cs.ox;
        cy += lineHeight;
        lbc.newLine(cx, cy);
      }
    }
    else {
      cx = textBox.x + textBox.w;
    }
  }
  // 最后一个换行符手动空行
  if (newLineLB) {
    if (lbc.endLine()) {
      cx = cs.ox;
      cy += lineHeight;
      lbc.newLine(cx, cy);
    }
    addEmptyLine(cx, cy + leading, contentArea, node, frags, lbc);
  }
  lbc.popText(node);
  res.w = maxW;
  if (frags.length) {
    const last = frags[frags.length - 1];
    res.h = last.y + last.h - cs.cy;
  }
  else {
    res.h = lineHeight;
  }
  // 没有子节点不需要产生新的递归约束，但要修改父级约束当前位置
  cs.cx = cx;
  cs.cy = cy;
}

function addEmptyLine(cx: number, cy: number, h: number, node: ITextNode, frags: TextBox[], lbc: LineBoxContext) {
  const empty: TextBox = {
    x: cx,
    y: cy,
    w: 0,
    h,
    content: '\n', // 统一标准化
  };
  frags.push(empty);
  lbc.addText(empty, node);
}

export function minMaxText(node: ITextNode, cs: Constraints, global: Global) {
  const measureText = getMeasureText();
  if (!measureText) {
    throw new Error('Text must be passed to the measureText method.');
  }
  const content = node.content;
  const computedStyle = node.computedStyle;
  let min = 0, max = 0;
  // 最大值需按行拆分求
  const list = content.split(lineBreak);
  for (let i = 0, len = list.length; i < len; i++) {
    let { width } = measureText(list[i], computedStyle.fontFamily, computedStyle.fontSize, computedStyle.lineHeight, computedStyle.fontWeight, computedStyle.fontStyle, computedStyle.letterSpacing);
    if (!i) {
      width += getMbpLeft(computedStyle);
    }
    if (i === len - 1) {
      width += getMbpRight(computedStyle);
    }
    max = Math.max(max, width);
  }
  // 最小值优化，如果包含CJK字符直接用fontSize
  if (CJK_REG_EXTENDED.test(content)) {
    min = computedStyle.fontSize + computedStyle.letterSpacing;
  }
  // 非CJK如果有W/M特殊优化
  else if (content.includes('W')) {
    min = measureText('W', computedStyle.fontFamily, computedStyle.fontSize, computedStyle.lineHeight, computedStyle.fontWeight, computedStyle.fontStyle, computedStyle.letterSpacing).width;
    if (content[0] === 'W') {
      min += getMbpLeft(computedStyle);
    }
    if (content[content.length - 1] === 'W') {
      min += getMbpRight(computedStyle);
    }
  }
  else if (content.includes('M')) {
    min = measureText('M', computedStyle.fontFamily, computedStyle.fontSize, computedStyle.lineHeight, computedStyle.fontWeight, computedStyle.fontStyle, computedStyle.letterSpacing).width;
    if (content[0] === 'M') {
      min += getMbpLeft(computedStyle);
    }
    if (content[content.length - 1] === 'M') {
      min += getMbpRight(computedStyle);
    }
  }
  // 最小值逐字遍历，需做缓存
  else {
    const cache: Record<string, number> = {};
    for (let i = 0, len = content.length; i < len; i++) {
      const c = content[i];
      let width = 0;
      // 最大单字可能已求得，可省略
      if (min < computedStyle.fontSize) {
        if (cache[c] !== undefined) {
          width = cache[c];
        }
        else {
          width = cache[c] = measureText(c, computedStyle.fontFamily, computedStyle.fontSize, computedStyle.lineHeight, computedStyle.fontWeight, computedStyle.fontStyle, computedStyle.letterSpacing).width;
        }
      }
      if (!i) {
        width += getMbpLeft(computedStyle);
      }
      if (i === len - 1) {
        width += getMbpRight(computedStyle);
      }
      if (min) {
        min = Math.min(min, width);
      }
      else {
        min = width;
      }
    }
  }
  return { min, max };
}

export function offsetX(res: Result, x: number) {
  if (x === 0) {
    return;
  }
  res.x += x;
  const frags = res.frags;
  if (frags && frags.length) {
    for (let i = 0, len = frags.length; i < len; i++) {
      frags[i].x += x;
    }
  }
}

export function offsetY(res: Result, y: number) {
  if (!y) {
    return;
  }
  res.y += y;
  const frags = res.frags;
  if (frags && frags.length) {
    for (let i = 0, len = frags.length; i < len; i++) {
      frags[i].y += y;
    }
  }
}

export function offsetXY(res: Result, x: number, y: number) {
  if (!x && !y) {
    return;
  }
  res.x += x;
  res.y += y;
  const frags = res.frags;
  if (frags && frags.length) {
    for (let i = 0, len = frags.length; i < len; i++) {
      const frag = frags[i];
      frag.x += x;
      frag.y += y;
    }
  }
}

export function marginAuto(node: INode, global: Global) {
  const { boxSizing, marginLeft, marginRight } = node.style;
  const res = node.result!;
  const computedStyle = node.computedStyle;
  const parent = node.parent;
  const w = parent ? parent.result!.w : global.w;
  let w2 = res.w;
  if (boxSizing === BoxSizing.CONTENT_BOX) {
    w2 += computedStyle.borderLeftWidth + computedStyle.borderRightWidth + computedStyle.paddingLeft + computedStyle.paddingRight;
  }
  if (marginLeft.u === Unit.AUTO && marginRight.u === Unit.AUTO) {
    if (w2 < w) {
      const half = (w - w2) * 0.5;
      res.x += half;
      computedStyle.marginLeft = half;
      computedStyle.marginRight = half;
    }
  }
  else if (marginLeft.u === Unit.AUTO && marginRight.u !== Unit.AUTO && marginRight.v) {
    res.x -= computedStyle.marginRight;
  }
}

export function checkRelative(node: INode, offset: Offset) {
  const style = node.style;
  const computedStyle = node.computedStyle;
  if (style.position === Position.RELATIVE && (computedStyle.left || computedStyle.right || computedStyle.top || computedStyle.bottom)) {
    const o = { x: offset.x, y: offset.y };
    // 优先级是左上为先，即便是0，除了auto外还有可能是inherit
    if (style.left.u !== Unit.AUTO || computedStyle.left) {
      o.x += computedStyle.left;
    }
    else if (computedStyle.right) {
      o.x -= computedStyle.right;
    }
    if (style.top.u !== Unit.AUTO || computedStyle.top) {
      o.y += computedStyle.top;
    }
    else if (computedStyle.bottom) {
      o.y -= computedStyle.bottom;
    }
    return o;
  }
  return offset;
}

export function applyRelative(node: INode, offset: Offset) {
  const res = node.result!;
  offsetXY(res, offset.x, offset.y);
}
