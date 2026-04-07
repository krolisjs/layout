import { BoxSizing, Position, Unit } from './style';
import {
  CJK_REG_EXTENDED,
  getMeasureText,
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
  getMbpTop,
} from './compute';
import { LineBoxContext } from './context';

export type Frag = { x: number; y: number; w: number; h: number };

export type Block = {
  type: 'block',
  frags: null,
} & Frag;

export type Inline = {
  type: 'inline',
  frags: Frag[],
} & Frag;

export type Text = {
  type: 'text',
  // 包含所有折行后的矩形，按行序排列
  frags: TextBox[];
} & Frag;

export type InlineBlock = {
  type: 'inlineBlock',
  frags: null,
} & Frag;

export type TextBox = Frag & {
  content: string;
};

export type Result = Block | InlineBlock | Inline | Text;

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

export type Offset = { x: number; y: number };

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

export function preset(node: INode, cs: Constraints, type: Result['type'], global: Global) {
  const style = node.style;
  const computedStyle = node.computedStyle;
  const res: any = {
    type,
    frags: ['block', 'inlineBlock'].includes(type) ? null : [],
    x: cs.cx,
    y: cs.cy,
    w: 0,
    h: 0,
    // top: 0,
    // right: 0,
    // bottom: 0,
    // left: 0,
    // marginTop: 0,
    // marginRight: 0,
    // marginBottom: 0,
    // marginLeft: 0,
    // paddingTop: 0,
    // paddingRight: 0,
    // paddingBottom: 0,
    // paddingLeft: 0,
    // borderTopWidth: 0,
    // borderRightWidth: 0,
    // borderBottomWidth: 0,
    // borderLeftWidth: 0,
    // fontFamily: 'sans-serif',
    // fontSize: 16,
    // fontWeight: 400,
    // fontStyle: FontStyle.NORMAL,
    // lineHeight: 24,
    // letterSpacing: 0,
  };

  // if (style.fontFamily === 'inherit') {
  //   if (parent) {
  //     res.fontFamily = parent.result!.fontFamily;
  //   }
  //   else {
  //     res.fontFamily = 'sans-serif';
  //   }
  // }
  // else {
  //   res.fontFamily = style.fontFamily;
  // }
  //
  // if (style.fontSize.u === Unit.INHERIT) {
  //   if (parent) {
  //     res.fontSize = parent.result!.fontSize;
  //   }
  //   else {
  //     res.fontSize = global.rem;
  //   }
  // }
  // else {
  //   res.fontSize = calLength(style.fontSize, (parent?.result!.fontSize || global.rem) * 100, global.rem, 0) || parent?.result!.fontSize || global.rem;
  // }
  //
  // if (style.fontWeight === 0) {
  //   if (parent) {
  //     res.fontWeight = parent.result!.fontWeight;
  //   }
  //   else {
  //     res.fontWeight = 400;
  //   }
  // }
  // else {
  //   res.fontWeight = style.fontWeight;
  // }
  //
  // if (style.fontStyle === FontStyle.INHERIT) {
  //   if (parent) {
  //     res.fontStyle = parent.result!.fontStyle;
  //   }
  //   else {
  //     res.fontStyle = FontStyle.NORMAL;
  //   }
  // }
  // else {
  //   res.fontStyle = style.fontStyle;
  // }
  //
  // ([
  //   'top',
  //   'right',
  //   'bottom',
  //   'left',
  //   'marginTop',
  //   'marginRight',
  //   'marginBottom',
  //   'marginLeft',
  // ] as const).forEach(k => {
  //   const v = style[k];
  //   if (v.u === Unit.INHERIT && parent) {
  //     let p: INode | null = parent;
  //     while (p) {
  //       const style = p.style;
  //       if (style[k].u !== Unit.INHERIT) {
  //         if (style[k].u === Unit.PERCENT) {
  //           res[k] = Math.max(0, calLength(style[k], cs.pbw, global.rem, res.fontSize));
  //         }
  //         else {
  //           res[k] = p.result![k];
  //         }
  //         return;
  //       }
  //       p = p.parent;
  //     }
  //   }
  //   else {
  //     const pbw = (k === 'top' || k === 'bottom') ? cs.pbh : cs.pbw;
  //     res[k] = calLength(style[k], pbw || 0, global.rem, res.fontSize);
  //   }
  // });
  //
  // ([
  //   'paddingTop',
  //   'paddingRight',
  //   'paddingBottom',
  //   'paddingLeft',
  //   'minWidth',
  //   'maxWidth',
  // ] as const).forEach(k => {
  //   const v = style[k];
  //   if (v.u === Unit.INHERIT && parent) {
  //     let p: INode | null = parent;
  //     while (p) {
  //       const style = p.style;
  //       if (style[k].u !== Unit.INHERIT) {
  //         if (style[k].u === Unit.PERCENT) {
  //           res[k] = Math.max(0, calLength(style[k], cs.pbw, global.rem, res.fontSize));
  //         }
  //         else {
  //           res[k] = p.result![k];
  //         }
  //         return;
  //       }
  //       p = p.parent;
  //     }
  //   }
  //   else {
  //     res[k] = Math.max(0, calLength(style[k], cs.pbw, global.rem, res.fontSize));
  //   }
  // });
  //
  // ([
  //   'minHeight',
  //   'maxHeight',
  // ] as const).forEach(k => {
  //   const v = style[k];
  //   if (v.u === Unit.INHERIT && parent) {
  //     let p: INode | null = parent;
  //     while (p) {
  //       const style = p.style;
  //       if (style[k].u !== Unit.INHERIT) {
  //         if (style[k].u === Unit.PERCENT) {
  //           res[k] = Math.max(0, calLength(style[k], cs.pbw, global.rem, res.fontSize));
  //         }
  //         else {
  //           res[k] = p.result![k];
  //         }
  //         return;
  //       }
  //       p = p.parent;
  //     }
  //   }
  //   else {
  //     res[k] = Math.max(0, calLength(style[k], cs.pbh || 0, global.rem, res.fontSize));
  //   }
  // });
  //
  // ([
  //   'borderTopWidth',
  //   'borderRightWidth',
  //   'borderBottomWidth',
  //   'borderLeftWidth',
  //   'lineHeight',
  //   'letterSpacing',
  // ] as const).forEach(k => {
  //   const { v, u } = style[k];
  //   if (k === 'lineHeight' && u === Unit.NUMBER && v >= 0) {
  //     res[k] = v * res.fontSize;
  //   }
  //   // lineHeight<0非法，视为继承，root视为auto
  //   else if (k === 'lineHeight' && (u === Unit.INHERIT || u === Unit.NUMBER)) {
  //     if (parent) {
  //       let p: INode | null = parent;
  //       while (p) {
  //         const style = p.style;
  //         if (style.lineHeight.u !== Unit.INHERIT) {
  //           if (style.lineHeight.u === Unit.NUMBER) {
  //             res[k] = Math.max(0, v * res.fontSize);
  //           }
  //           else if (style.lineHeight.u === Unit.PX) {
  //             res[k] = p.result!.lineHeight;
  //           }
  //           else if (style.lineHeight.u === Unit.PERCENT) {
  //             res[k] = p.result!.lineHeight;
  //           }
  //           else if (style.lineHeight.u === Unit.AUTO) {
  //             res[k] = calNormalLineHeight(res.fontFamily, res.fontSize);
  //           }
  //           return;
  //         }
  //         p = p.parent;
  //       }
  //       res[k] = calNormalLineHeight(res.fontFamily, res.fontSize);
  //     }
  //     else {
  //       res[k] = calNormalLineHeight(res.fontFamily, res.fontSize);
  //     }
  //   }
  //   else if (k === 'lineHeight') {
  //     if (v < 0 || u === Unit.AUTO) {
  //       res[k] = calNormalLineHeight(res.fontFamily, res.fontSize);
  //     }
  //     else {
  //       res[k] = calLength(style[k], parent?.result!.lineHeight || 24, global.rem, res.fontSize);
  //     }
  //   }
  //   // border没有%
  //   else if (u === Unit.INHERIT && parent) {
  //     res[k] = parent.result![k];
  //   }
  //   else {
  //     res[k] = Math.max(0, calLength(style[k], cs.pbw, global.rem, res.fontSize));
  //   }
  // });
  //
  if (style.width.u !== Unit.AUTO) {
    res.w = Math.max(0, calLength(style.width, cs.pbw, global.rem, computedStyle.fontSize));
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
  return type === 'inline' ? (res as Inline) : (res as Text);
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
    fw: false,
    fh: false,
  };
  if (style.width.u === Unit.AUTO && res.type === 'block') {
    scs.pbw = scs.aw = res.w
      = Math.max(0, cs.aw - getMbpH(computedStyle));
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
  const style = node.style;
  const res = preset(node, cs, 'text', global) as Text;
  node.result = res;
  const computedStyle = node.computedStyle;
  // inline的上下margin无效
  // res.marginTop = res.marginBottom = 0;
  let cx = cs.cx + getMbpLeft(computedStyle);
  let cy = cs.cy;
  let aw = cs.aw;
  let maxW = 0;
  const frags: TextBox[] = res.frags;
  const content = node.content;
  // 每个textBox还要额外的计算内容区域高度，设置上下平分leading
  let contentArea = node.contentArea;
  if (contentArea === null) {
    contentArea = node.contentArea = calContentArea(computedStyle.fontFamily, computedStyle.fontSize);
  }
  const leading = (computedStyle.lineHeight - contentArea) * 0.5;
  // 不在行首时要检查换行，有可能本行一个字符都排不下
  if (!lbc.current.begin) {
    const c = node.content[0];
    const m = measureText(
      c,
      style.fontFamily,
      computedStyle.fontSize,
      computedStyle.lineHeight,
      style.fontWeight,
      style.fontStyle,
      computedStyle.letterSpacing,
    );
    const w = m.width;
    if (cs.cx + w - cs.ox > cs.aw) {
      lbc.prepareNextLine();
      lbc.endLine(); // 这里传个标识符绝对有下一行新的，这样刚开始的inline父节点会变到下一行
      cx = cs.ox;
      cy += computedStyle.lineHeight;
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
      cy += computedStyle.lineHeight;
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
      computedStyle.fontSize,
      computedStyle.lineHeight,
      style.fontWeight,
      style.fontStyle,
      computedStyle.letterSpacing,
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
      cy += computedStyle.lineHeight;
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
    res.h = computedStyle.lineHeight;
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
  // 逐字遍历，需做缓存
  else {
    const cache: Record<string, number> = {};
    for (let i = 0, len = content.length; i < len; i++) {
      const c = content[i];
      let width = 0;
      // 最大单字可能已求得，可省略
      if (min < computedStyle.fontSize && !i && i !== len - 1) {
        if (cache[c] !== undefined) {
          width = cache[c];
        }
        else {
          width = measureText(c, computedStyle.fontFamily, computedStyle.fontSize, computedStyle.lineHeight, computedStyle.fontWeight, computedStyle.fontStyle, computedStyle.letterSpacing).width;
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
