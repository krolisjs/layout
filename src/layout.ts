import { BoxSizing, calLength, FontStyle, Style, Unit } from './style';
import type { LineBox, TextBox } from './text';
import { CJK_REG_EXTENDED, getMeasureText, isEnter, smartMeasure } from './text';
import { AbstractNode } from './node';

export type Rect = { x: number; y: number; w: number; h: number };

export type ComputedStyle = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  borderTopWidth: number;
  borderRightWidth: number;
  borderBottomWidth: number;
  borderLeftWidth: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: FontStyle;
  lineHeight: number;
  letterSpacing: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
};

export type Box = {
  type: 'box',
  rects: null,
} & Rect & ComputedStyle;

export type Inline = {
  type: 'inline',
  rects: Rect[],
} & Rect & ComputedStyle;

export type Text = {
  type: 'text',
  // 包含所有折行后的矩形，按行序排列
  rects: LineBox[];
} & Rect & ComputedStyle;

export type Result = Box | Inline | Text;

export type Global = {
  root: AbstractNode,
  rem: number,
  w: number,
  h: number,
};

export type Constraints = {
  ox: number; // 相对原点坐标
  oy: number;
  aw: number; // 可用尺寸
  ah: number;
  pbw: number; // 百分比基于尺寸
  pbh?: number; // 可能出现undefined表示auto
  cx: number; // 当前坐标，flow流用到，absolute时自动位置也会用
  cy: number;
};

export type InputConstraints = Pick<Constraints, 'aw' | 'ah'>
  & Partial<Omit<Constraints, 'aw' | 'ah'>>;

export enum LayoutMode {
  NORMAL       = 0b000,
  MIN_MAX      = 0b001, // flex测量阶段
  OOF_MEASURE  = 0b100, // absolute测量阶段
}

export class MarginStruct {
  pos = 0;
  neg = 0;

  append(n: number) {
    if (n > 0) {
      this.pos = Math.max(this.pos, n);
    }
    else if (n < 0) {
      this.neg = Math.min(this.neg, n);
    }
  }

  solve() {
    return this.pos + this.neg;
  }

  reset(n = 0) {
    if (n > 0) {
      this.pos = n;
      this.neg = 0;
    }
    else if (n < 0) {
      this.pos = 0;
      this.neg = n;
    }
    else {
      this.pos = this.neg = n;
    }
  }
}

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

export function preset(style: Style, constraints: Constraints, type: Result['type'], global: Global, pc?: ComputedStyle, ps?: Style) {
  const res: any = {
    type,
    rects: type === 'box' ? null : [],
    x: constraints.cx,
    y: constraints.cy,
    w: 0,
    h: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: 400,
    fontStyle: FontStyle.NORMAL,
    lineHeight: 24,
    letterSpacing: 0,
  };

  if (style.fontFamily === 'inherit') {
    res.fontFamily = pc?.fontFamily || 'sans-serif';
  }
  else {
    res.fontFamily = style.fontFamily;
  }

  if (style.fontSize.u === Unit.INHERIT) {
    res.fontSize = pc?.fontSize || global.rem;
  }
  else {
    res.fontSize = calLength(style.fontSize, (pc?.fontSize || global.rem) * 100, global.rem, 0) || pc?.fontSize || global.rem;
  }

  if (style.fontWeight === 0) {
    res.fontWeight = pc?.fontWeight || 400;
  }
  else {
    res.fontWeight = style.fontWeight;
  }

  if (style.fontStyle === FontStyle.INHERIT) {
    res.fontStyle = pc?.fontStyle || FontStyle.NORMAL;
  }
  else {
    res.fontStyle = style.fontStyle;
  }

  ([
    'top',
    'right',
    'bottom',
    'left',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
  ] as const).forEach(k => {
    const v = style[k];
    if (v.u === Unit.INHERIT && ps) {
      res[k] = calLength(ps[k], constraints.pbw, global.rem, res.fontSize);
    }
    else {
      res[k] = calLength(style[k], constraints.pbw, global.rem, res.fontSize);
    }
  });

  ([
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'minWidth',
    'maxWidth',
  ] as const).forEach(k => {
    const v = style[k];
    if (v.u === Unit.INHERIT && ps) {
      res[k] = calLength(ps[k], constraints.pbw, global.rem, res.fontSize);
    }
    else {
      res[k] = Math.max(0, calLength(style[k], constraints.pbw, global.rem, res.fontSize));
    }
  });

  ([
    'minHeight',
    'maxHeight',
  ] as const).forEach(k => {
    const v = style[k];
    if (v.u === Unit.INHERIT && ps) {
      res[k] = calLength(ps[k], constraints.pbh || 0, global.rem, res.fontSize);
    }
    else {
      res[k] = Math.max(0, calLength(style[k], constraints.pbh || 0, global.rem, res.fontSize));
    }
  });

  ([
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'lineHeight',
    'letterSpacing',
  ] as const).forEach(k => {
    const { v, u } = style[k];
    if (k === 'lineHeight' && u === Unit.NUMBER) {
      res[k] = Math.max(0, v * res.fontSize);
    }
    else if (k === 'lineHeight' && u === Unit.INHERIT) {
      res[k] = pc?.lineHeight || 24;
    }
    else if (k === 'lineHeight') {
      res[k] = Math.max(0, calLength(style[k], pc?.lineHeight || 24, global.rem, res.fontSize));
    }
    else {
      res[k] = Math.max(0, calLength(style[k], constraints.pbw, global.rem, res.fontSize));
    }
  });

  if (style.width.u !== Unit.AUTO) {
    res.w = Math.max(0, calLength(style.width, constraints.pbw, global.rem, res.fontSize));
    if (style.boxSizing === BoxSizing.BORDER_BOX) {
      res.w = Math.max(0, res.w - (res.borderLeftWidth + res.borderRightWidth + res.paddingLeft + res.paddingRight));
    }
  }

  // 父auto子%，不计算默认0
  if (style.height.u !== Unit.AUTO && (constraints.pbh !== undefined || style.height.u !== Unit.PERCENT)) {
    res.h = Math.max(0, calLength(style.height, constraints.pbh || 0, global.rem, res.fontSize));
    if (style.boxSizing === BoxSizing.BORDER_BOX) {
      res.h = Math.max(0, res.h - (res.borderTopWidth + res.borderBottomWidth + res.paddingTop + res.paddingBottom));
    }
  }

  // 排除mbp后的contentBox的坐标，注意inline不考虑y方向
  res.x += res.marginLeft + res.borderLeftWidth + res.paddingLeft;
  if (type === 'box') {
    res.y += res.marginTop + res.borderTopWidth + res.paddingTop;
    return res as Box;
  }
  return type === 'inline' ? (res as Inline) : (res as Text);
}

export function block(style: Style, constraints: Constraints, global: Global, pc?: ComputedStyle, ps?: Style, res?: Box) {
  if (!res) {
    res = preset(style, constraints, 'box', global, pc, ps) as Box;
    res.type = 'box';
  }
  // 返回递归的供子节点使用
  const ox = constraints.cx + res.marginLeft + res.paddingLeft + res.borderLeftWidth;
  const oy = constraints.cy + res.marginTop + res.paddingTop + res.borderTopWidth;
  const c: Constraints = {
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
    c.pbw = c.aw = res.w
      = Math.max(0, constraints.aw - (res.marginLeft + res.marginRight + res.paddingLeft + res.paddingRight + res.borderLeftWidth + res.borderRightWidth));
  }
  if (style.height.u === Unit.AUTO) {
    c.ah = constraints.ah;
    c.pbh = undefined; // auto
  }
  // 父级高度auto时，%失效也是auto
  else if (style.height.u === Unit.PERCENT && constraints.pbh === undefined) {
    c.ah = constraints.ah;
    c.pbh = undefined;
  }
  // 父级约束x归零
  constraints.cx = constraints.ox;
  constraints.cy = oy + res.h + res.marginBottom + res.paddingBottom + res.borderBottomWidth;
  return { res, c };
}

export function inline(style: Style, constraints: Constraints, global: Global, pc?: ComputedStyle, ps?: Style) {
  const res = preset(style, constraints, 'inline', global, pc, ps) as Inline;
  // inline的上下margin无效，border/padding对绘制有效但布局无效
  res.marginTop = res.marginBottom = 0;
  // 修改当前的，inline复用
  constraints.cx += res.marginLeft + res.paddingLeft + res.borderLeftWidth;
  return { res, c: constraints };
}

export function inlineBlock(style: Style, constraints: Constraints, global: Global, pc?: ComputedStyle, ps?: Style) {
  const res = preset(style, constraints, 'box', global, pc, ps) as Box;
  return { res, c: constraints };
}

export function text(style: Style, constraints: Constraints, content: string, global: Global, pc?: ComputedStyle, ps?: Style) {
  const measureText = getMeasureText();
  if (!measureText) {
    throw new Error('Text must be passed to the measureText method.');
  }
  const res = preset(style, constraints, 'text', global, pc, ps) as Text;
  // inline的上下margin无效
  res.marginTop = res.marginBottom = 0;
  let cx = constraints.cx + res.marginLeft + res.paddingLeft + res.borderLeftWidth;
  let cy = constraints.cy;
  let aw = constraints.aw;
  let maxW = 0;
  let lineBox: LineBox = {
    x: cx,
    y: cy,
    w: 0,
    h: 0,
    baseline: 0,
    list: [],
  };
  const lineBoxes: LineBox[] = [lineBox];
  let i = 0;
  let length = content.length;
  // 使用一种预测字符长度的技术，结合2分查找，减少调用measureText的次数
  while (i < length) {
    if (isEnter(content[i])) {
      i++;
      cx = constraints.ox;
      cy += res.lineHeight;
    }
    const {
      num,
      width,
      newLine,
      baseline,
    } = smartMeasure(
      measureText,
      content,
      i,
      length,
      aw,
      style.fontFamily,
      res.fontSize,
      res.lineHeight,
      style.fontWeight,
      style.fontStyle,
      res.letterSpacing,
    );
    const textBox: TextBox = {
      x: cx,
      y: cy,
      w: width,
      h: res.lineHeight,
      baseline,
      content: content.slice(i, num),
    };
    i += num;
    lineBox.w = textBox.x + width - lineBox.x;
    lineBox.list.push(textBox);
    maxW = Math.max(maxW, lineBox.w);
    // 每行按baseline对齐
    if (newLine || i === length) {
      let baseline = 0;
      lineBox.list.forEach(textBox => {
        baseline = Math.max(baseline, textBox.baseline);
      });
      lineBox.baseline = baseline;
      lineBox.list.forEach(textBox => {
        const d = baseline - textBox.baseline;
        textBox.y += d;
        lineBox.h = Math.max(lineBox.h, textBox.y - lineBox.y + textBox.h);
      });
    }
    if (newLine) {
      cx = constraints.ox;
      cy += res.lineHeight;
      // 新开一行
      if (i < length) {
        lineBox = {
          x: cx,
          y: cy,
          w: 0,
          h: 0,
          baseline: 0,
          list: [],
        };
        lineBoxes.push(lineBox);
      }
    }
    else {
      cx = textBox.x + textBox.w;
    }
  }
  res.w = maxW;
  const last = lineBox;
  res.h = last.y + last.h - constraints.cy;
  res.rects = lineBoxes;
  // 没有子节点不需要产生新的递归约束，但要修改父级约束当前位置
  constraints.cx = cx;
  constraints.cy = cy;
  return { res, c: constraints };
}

export function oofText(style: Style, constraints: Constraints, content: string, global: Global, pc: ComputedStyle, ps: Style) {
  const measureText = getMeasureText();
  if (!measureText) {
    throw new Error('Text must be passed to the measureText method.');
  }
  const res = preset(style, constraints, 'text', global, pc, ps) as Text;
  let min = 0, max = 0;
  // 最大值需按行拆分求
  const list = content.split(/[\n\u2028]/);
  for (let i = 0, len = list.length; i < len; i++) {
    let { width } = measureText(list[i], res.fontFamily, res.fontSize, res.lineHeight, res.fontWeight, res.fontStyle, res.letterSpacing);
    if (!i) {
      width += res.marginLeft + res.paddingLeft + res.borderLeftWidth;
    }
    if (i === len - 1) {
      width += res.marginRight + res.paddingRight + res.borderRightWidth;
    }
    max = Math.max(max, width);
  }
  // 最小值优化，如果包含CJK字符直接用fontSize
  if (CJK_REG_EXTENDED.test(content)) {
    min = res.fontSize + res.letterSpacing;
  }
  // 非CJK如果有W/M特殊优化
  else if (content.includes('W')) {
    min = measureText('W', res.fontFamily, res.fontSize, res.lineHeight, res.fontWeight, res.fontStyle, res.letterSpacing).width;
    if (content[0] === 'W') {
      min += res.marginLeft + res.paddingLeft + res.borderLeftWidth;
    }
    if (content[content.length - 1] === 'W') {
      min += res.marginRight + res.paddingRight + res.borderRightWidth;
    }
  }
  else if (content.includes('M')) {
    min = measureText('M', res.fontFamily, res.fontSize, res.lineHeight, res.fontWeight, res.fontStyle, res.letterSpacing).width;
    if (content[0] === 'M') {
      min += res.marginLeft + res.paddingLeft + res.borderLeftWidth;
    }
    if (content[content.length - 1] === 'M') {
      min += res.marginRight + res.paddingRight + res.borderRightWidth;
    }
  }
  // 逐字遍历，需做缓存
  else {
    const cache: Record<string, number> = {};
    for (let i = 0, len = content.length; i < len; i++) {
      const c = content[i];
      let width = 0;
      // 最大单字可能已求得，可省略
      if (min < res.fontSize && !i && i !== len - 1) {
        if (cache[c] !== undefined) {
          width = cache[c];
        }
        else {
          width = measureText(c, res.fontFamily, res.fontSize, res.lineHeight, res.fontWeight, res.fontStyle, res.letterSpacing).width;
        }
      }
      if (!i) {
        width += res.marginLeft + res.paddingLeft + res.borderLeftWidth;
      }
      if (i === len - 1) {
        width += res.marginRight + res.paddingRight + res.borderRightWidth;
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
