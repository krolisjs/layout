import { BoxSizing, calLength, FontStyle, Unit } from './style';
import type { ComputedStyle } from './style';
import {
  CJK_REG_EXTENDED,
  getMeasureText,
  lineBreak,
  smartMeasure,
} from './text';
import type { INode, ITextNode, ITypeNode } from './node';
import type { LineBoxContext } from './context';
import { calContentArea, calNormalLineHeight } from './compute';

export type Frag = { x: number; y: number; w: number; h: number };

type BasicBox = Frag & ComputedStyle;

export type Box = {
  type: 'box',
  frags: null,
} & BasicBox;

export type Inline = {
  type: 'inline',
  frags: Frag[],
} & BasicBox;

export type Text = {
  type: 'text',
  // 包含所有折行后的矩形，按行序排列
  frags: TextBox[];
} & BasicBox;

export type InlineBox = {
  type: 'inlineBox',
  frags: null,
} & BasicBox;

export type TextBox = Frag & {
  content: string;
};

export type Result = Box | InlineBox | Inline | Text;

export type Global = {
  root: ITypeNode,
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

export function preset(node: ITypeNode, constraints: Constraints, type: Result['type'], global: Global) {
  const style = node.style;
  const res: any = {
    type,
    frags: type === 'box' ? null : [],
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
  const parent = node.parent;

  if (style.fontFamily === 'inherit') {
    if (parent) {
      res.fontFamily = parent.result!.fontFamily;
    }
    else {
      res.fontFamily = 'sans-serif';
    }
  }
  else {
    res.fontFamily = style.fontFamily;
  }

  if (style.fontSize.u === Unit.INHERIT) {
    if (parent) {
      res.fontSize = parent.result!.fontSize;
    }
    else {
      res.fontSize = global.rem;
    }
  }
  else {
    res.fontSize = calLength(style.fontSize, (parent?.result!.fontSize || global.rem) * 100, global.rem, 0) || parent?.result!.fontSize || global.rem;
  }

  if (style.fontWeight === 0) {
    if (parent) {
      res.fontWeight = parent.result!.fontWeight;
    }
    else {
      res.fontWeight = 400;
    }
  }
  else {
    res.fontWeight = style.fontWeight;
  }

  if (style.fontStyle === FontStyle.INHERIT) {
    if (parent) {
      res.fontStyle = parent.result!.fontStyle;
    }
    else {
      res.fontStyle = FontStyle.NORMAL;
    }
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
    if (v.u === Unit.INHERIT && parent) {
      let p: INode | null = parent;
      while (p) {
        const style = p.style;
        if (style[k].u !== Unit.INHERIT) {
          if (style[k].u === Unit.PERCENT) {
            res[k] = Math.max(0, calLength(style[k], constraints.pbw, global.rem, res.fontSize));
          }
          else {
            res[k] = p.result![k];
          }
          return;
        }
        p = p.parent;
      }
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
    if (v.u === Unit.INHERIT && parent) {
      let p: INode | null = parent;
      while (p) {
        const style = p.style;
        if (style[k].u !== Unit.INHERIT) {
          if (style[k].u === Unit.PERCENT) {
            res[k] = Math.max(0, calLength(style[k], constraints.pbw, global.rem, res.fontSize));
          }
          else {
            res[k] = p.result![k];
          }
          return;
        }
        p = p.parent;
      }
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
    if (v.u === Unit.INHERIT && parent) {
      let p: INode | null = parent;
      while (p) {
        const style = p.style;
        if (style[k].u !== Unit.INHERIT) {
          if (style[k].u === Unit.PERCENT) {
            res[k] = Math.max(0, calLength(style[k], constraints.pbw, global.rem, res.fontSize));
          }
          else {
            res[k] = p.result![k];
          }
          return;
        }
        p = p.parent;
      }
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
      if (parent) {
        let p: INode | null = parent;
        while (p) {
          const style = p.style;
          if (style.lineHeight.u !== Unit.INHERIT) {
            if (style.lineHeight.u === Unit.NUMBER) {
              res[k] = Math.max(0, v * res.fontSize);
            }
            else if (style.lineHeight.u === Unit.PX) {
              res[k] = p.result!.lineHeight;
            }
            else if (style.lineHeight.u === Unit.PERCENT) {
              res[k] = p.result!.lineHeight;
            }
            else if (style.lineHeight.u === Unit.AUTO) {
              res[k] = calNormalLineHeight(res.fontFamily, res.fontSize);
            }
            return;
          }
          p = p.parent;
        }
        res[k] = calNormalLineHeight(res.fontFamily, res.fontSize);
      }
      else {
        res[k] = calNormalLineHeight(res.fontFamily, res.fontSize);
      }
    }
    else if (k === 'lineHeight') {
      if (v <= 0 || u === Unit.AUTO) {
        res[k] = calNormalLineHeight(res.fontFamily, res.fontSize);
      }
      else {
        res[k] = calLength(style[k], parent?.result!.lineHeight || 24, global.rem, res.fontSize);
      }
    }
    // border没有%
    else if (u === Unit.INHERIT && parent) {
      res[k] = parent.result![k];
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

export function block(node: INode, constraints: Constraints, global: Global, lbc: LineBoxContext, res?: Box) {
  if (!res) {
    res = preset(node, constraints, 'box', global) as Box;
    res.type = 'box';
  }
  node.result = res;
  const style = node.style;
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
  return c;
}

export function inline(node: INode, constraints: Constraints, global: Global, lbc: LineBoxContext) {
  const res = preset(node, constraints, 'inline', global) as Inline;
  // inline的上下margin无效，border/padding对绘制有效但布局无效
  res.marginTop = res.marginBottom = 0;
  node.result = res;
  // 修改当前的，inline复用
  constraints.cx += res.marginLeft + res.paddingLeft + res.borderLeftWidth;
  lbc.addInline(node, constraints.cx, constraints.cy);
}

export function inlineBlock(node: INode, constraints: Constraints, global: Global) {
  const res = preset(node, constraints, 'box', global) as Box;
  return { res, c: constraints };
}

export function text(node: ITextNode, constraints: Constraints, global: Global, lbc: LineBoxContext) {
  const measureText = getMeasureText();
  if (!measureText) {
    throw new Error('Text must be passed to the measureText method.');
  }
  const style = node.style;
  const res = preset(node, constraints, 'text', global) as Text;
  node.result = res;
  // inline的上下margin无效
  res.marginTop = res.marginBottom = 0;
  let cx = constraints.cx + res.marginLeft + res.paddingLeft + res.borderLeftWidth;
  let cy = constraints.cy;
  let aw = constraints.aw;
  let maxW = 0;
  const frags: TextBox[] = res.frags;
  const content = node.content;
  // 每个textBox还要额外的计算内容区域高度，设置上下平分leading
  const h = calContentArea(res.fontFamily, res.fontSize);
  const leading = (res.lineHeight - h) * 0.5;
  let i = 0;
  let length = content.length;
  // 遇到换行符手动标识
  let newLine = false;
  // 循环获取满足宽度下的字符串
  while (i < length) {
    if (lineBreak.test(content[i])) {
      // 连续的换行符，每个产生一个空行
      if (newLine) {
        lbc.endLine();
        lbc.newLine(cx, cy);
        addEmptyLine(cx, cy + leading, h, node, frags, lbc);
      }
      i++;
      cx = constraints.ox;
      cy += res.lineHeight;
      if (newLine) {
        lbc.newLine(cx, cy);
      }
      // 后续普通的字符自动用新的行y坐标，如果这是最后一个字符，后面逻辑识别生成新行
      newLine = true;
      continue;
    }
    // 置false，前面假如有换行已经设置好换行坐标了，新的内容用这个坐标即可
    newLine = false;
    // 使用一种预测字符长度的技术，结合2分查找，减少调用measureText的次数
    const {
      num,
      width,
      breakLine,
    } = smartMeasure(
      measureText,
      content,
      i,
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
      y: cy + leading,
      w: width,
      h,
      content: content.slice(i, num),
    };
    frags.push(textBox);
    i += num;
    lbc.addText(textBox, node);
    maxW = Math.max(maxW, textBox.w);
    if (breakLine) {
      lbc.endLine();
      cx = constraints.ox;
      cy += res.lineHeight;
      // 新开一行
      if (i < length) {
        lbc.newLine(cx, cy);
      }
    }
    else {
      cx = textBox.x + textBox.w;
    }
  }
  // 最后一个换行符手动空行
  if (newLine) {
    lbc.endLine();
    lbc.newLine(cx, cy);
    addEmptyLine(cx, cy + leading, h, node, frags, lbc);
  }
  lbc.popText(node);
  res.w = maxW;
  const last = frags[frags.length - 1]!;
  res.h = last.y + last.h - constraints.cy;
  // 没有子节点不需要产生新的递归约束，但要修改父级约束当前位置
  constraints.cx = cx;
  constraints.cy = cy;
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

export function oofText(node: ITextNode, constraints: Constraints, content: string, global: Global) {
  const measureText = getMeasureText();
  if (!measureText) {
    throw new Error('Text must be passed to the measureText method.');
  }
  const res = preset(node, constraints, 'text', global) as Text;
  let min = 0, max = 0;
  // 最大值需按行拆分求
  const list = content.split(lineBreak);
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
