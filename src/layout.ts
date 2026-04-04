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

export type Block = {
  type: 'block',
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

export type InlineBlock = {
  type: 'inlineBlock',
  frags: null,
} & BasicBox;

export type TextBox = Frag & {
  content: string;
};

export type Result = Block | InlineBlock | Inline | Text;

export type Global = {
  root: ITypeNode,
  rem: number,
  w: number,
  h: number,
  cs: Constraints,
};

export type Constraints = {
  ox: number; // 相对原点坐标
  oy: number;
  aw: number; // 可用尺寸
  ah: number;
  pbw: number; // 百分比基于尺寸
  pbh: number | null; // 可能出现null表示无法使用%计算，退化为auto
  cx: number; // 当前坐标，flow流用到，absolute时自动位置也会用
  cy: number;
  fw: boolean; // 是否固定尺寸，决定节点%是否可用，否则视为auto
  fh: boolean;
};

export type InputConstraints = Pick<Constraints, 'aw' | 'ah'>
  & Partial<Omit<Constraints, 'aw' | 'ah'>>;

export enum LayoutMode {
  NORMAL       = 0b000,
  MIN_MAX      = 0b001, // flex测量阶段
  OUT_FLOW     = 0b100, // absolute脱离文档流测量阶段
}

export function normalizeConstraints(ic: InputConstraints) {
  return Object.assign({
    ox: 0,
    oy: 0,
    cx: 0,
    cy: 0,
    pbw: ic.aw,
    pbh: ic.ah,
    fw: true,
    fh: true,
  }, ic) as Constraints;
}

export function preset(node: ITypeNode, cs: Constraints, type: Result['type'], global: Global) {
  const style = node.style;
  const res: any = {
    type,
    frags: ['block', 'inlineBlock'].includes(type) ? null : [],
    x: cs.cx,
    y: cs.cy,
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
            res[k] = Math.max(0, calLength(style[k], cs.pbw, global.rem, res.fontSize));
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
      res[k] = calLength(style[k], cs.pbw, global.rem, res.fontSize);
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
            res[k] = Math.max(0, calLength(style[k], cs.pbw, global.rem, res.fontSize));
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
      res[k] = Math.max(0, calLength(style[k], cs.pbw, global.rem, res.fontSize));
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
            res[k] = Math.max(0, calLength(style[k], cs.pbw, global.rem, res.fontSize));
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
      res[k] = Math.max(0, calLength(style[k], cs.pbh || 0, global.rem, res.fontSize));
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
    if (k === 'lineHeight' && u === Unit.NUMBER && v >= 0) {
      res[k] = v * res.fontSize;
    }
    // lineHeight<0非法，视为继承，root视为auto
    else if (k === 'lineHeight' && (u === Unit.INHERIT || u === Unit.NUMBER)) {
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
      if (v < 0 || u === Unit.AUTO) {
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
      res[k] = Math.max(0, calLength(style[k], cs.pbw, global.rem, res.fontSize));
    }
  });

  if (style.width.u !== Unit.AUTO) {
    res.w = Math.max(0, calLength(style.width, cs.pbw, global.rem, res.fontSize));
    if (style.boxSizing === BoxSizing.BORDER_BOX) {
      res.w = Math.max(0, res.w - (res.borderLeftWidth + res.borderRightWidth + res.paddingLeft + res.paddingRight));
    }
  }

  // 父auto子%，不计算默认0
  if (style.height.u !== Unit.AUTO && (cs.pbh !== null || style.height.u !== Unit.PERCENT)) {
    res.h = Math.max(0, calLength(style.height, cs.pbh || 0, global.rem, res.fontSize));
    if (style.boxSizing === BoxSizing.BORDER_BOX) {
      res.h = Math.max(0, res.h - (res.borderTopWidth + res.borderBottomWidth + res.paddingTop + res.paddingBottom));
    }
  }

  // 排除mbp后的contentBox的坐标，注意inline不考虑y方向
  res.x += res.marginLeft + res.borderLeftWidth + res.paddingLeft;
  // box的marginTop先不算，因为有合并计算
  if (type === 'block') {
    res.y += res.borderTopWidth + res.paddingTop;
    return res as Block;
  }
  if (type === 'inlineBlock') {
    res.y += res.marginTop + res.borderTopWidth + res.paddingTop;
    return res as InlineBlock;
  }
  return type === 'inline' ? (res as Inline) : (res as Text);
}

// block和inlineBlock复用
function bib(node: INode, cs: Constraints, res: Block | InlineBlock) {
  node.result = res;
  const style = node.style;
  // 返回递归的供子节点使用，block因为可能有margin合并，先不计入marginTop
  const ox = cs.cx + res.marginLeft + res.paddingLeft + res.borderLeftWidth;
  let oy = cs.cy + res.paddingTop + res.borderTopWidth;
  if (res.type === 'inlineBlock') {
    oy += res.marginTop;
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
    fw: false,
    fh: false,
  };
  if (style.width.u === Unit.AUTO) {
    scs.pbw = scs.aw = res.w
      = Math.max(0, cs.aw - (res.marginLeft + res.marginRight + res.paddingLeft + res.paddingRight + res.borderLeftWidth + res.borderRightWidth));
  }
  // 父级高度auto时，%失效也是auto
  if (style.height.u === Unit.AUTO || style.height.u === Unit.PERCENT && cs.pbh === null) {
    scs.ah = cs.ah;
    scs.pbh = null; // auto
  }
  return scs;
}

export function block(node: INode, cs: Constraints, global: Global, res?: Block) {
  if (!res) {
    res = preset(node, cs, 'block', global) as Block;
  }
  return bib(node, cs, res);
}

export function inline(node: INode, cs: Constraints, global: Global, lbc: LineBoxContext) {
  const res = preset(node, cs, 'inline', global) as Inline;
  // inline的上下margin无效，border/padding对绘制有效但布局无效
  res.marginTop = res.marginBottom = 0;
  node.result = res;
  // 修改当前的，inline复用
  cs.cx += res.marginLeft + res.paddingLeft + res.borderLeftWidth;
  // 就算有左mbp，可能放不下也不管，因为可能是空节点（递归空也是），等后续判断
  lbc.addInline(node, cs.cx, cs.cy);
}

export function inlineBlock(node: INode, cs: Constraints, global: Global, res?: InlineBlock) {
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
  const style = node.style;
  const res = preset(node, cs, 'text', global) as Text;
  node.result = res;
  // inline的上下margin无效
  res.marginTop = res.marginBottom = 0;
  let cx = cs.cx + res.marginLeft + res.paddingLeft + res.borderLeftWidth;
  let cy = cs.cy;
  let aw = cs.aw;
  let maxW = 0;
  const frags: TextBox[] = res.frags;
  const content = node.content;
  // 每个textBox还要额外的计算内容区域高度，设置上下平分leading
  let contentArea = node.contentArea;
  if (contentArea === null) {
    contentArea = node.contentArea = calContentArea(res.fontFamily, res.fontSize);
  }
  const leading = (res.lineHeight - contentArea) * 0.5;
  // 不在行首时要检查换行，有可能本行一个字符都排不下
  if (!lbc.current.begin) {
    const c = node.content[0];
    const m = measureText(
      c,
      style.fontFamily,
      res.fontSize,
      res.lineHeight,
      style.fontWeight,
      style.fontStyle,
      res.letterSpacing,
    );
    const w = m.width;
    if (cs.cx + w - cs.ox > cs.aw) {
      lbc.prepareNextLine();
      lbc.endLine(); // 这里传个标识符绝对有下一行新的，这样刚开始的inline父节点会变到下一行
      cx = cs.ox;
      cy += res.lineHeight;
      lbc.newLine(cx, cy);
    }
  }
  // 遇到换行符手动标识
  let newLine = false;
  // 循环获取满足宽度下的字符串
  let i = 0;
  let length = content.length;
  while (i < length) {
    if (lineBreak.test(content[i])) {
      // 连续的换行符，每个产生一个空行
      if (newLine) {
        lbc.endLine();
        lbc.newLine(cx, cy);
        addEmptyLine(cx, cy + leading, contentArea, node, frags, lbc);
      }
      i++;
      cx = cs.ox;
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
      breakLine, // 长度不足需要换行，不考虑\n
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
      h: contentArea,
      content: content.slice(i, num),
    };
    frags.push(textBox);
    i += num;
    lbc.addText(textBox, node);
    maxW = Math.max(maxW, textBox.w);
    if (breakLine) {
      lbc.endLine();
      cx = cs.ox;
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
    addEmptyLine(cx, cy + leading, contentArea, node, frags, lbc);
  }
  lbc.popText(node);
  res.w = maxW;
  if (frags.length) {
    const last = frags[frags.length - 1];
    res.h = last.y + last.h - cs.cy;
  }
  else {
    res.h = res.lineHeight;
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

export function minMaxText(node: ITextNode, cs: Constraints, content: string, global: Global) {
  const measureText = getMeasureText();
  if (!measureText) {
    throw new Error('Text must be passed to the measureText method.');
  }
  const res = preset(node, cs, 'text', global) as Text;
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
  if (y === 0) {
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
