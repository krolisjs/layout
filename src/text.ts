import { FontStyle } from './constants';

export type TextMeasures = { width: number };

export type MeasureText = (
  content: string,
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  fontWeight?: number,
  fontStyle?: FontStyle,
  letterSpacing?: number,
) => TextMeasures;

let measureText: MeasureText | null = null;

export function getMeasureText() {
  return measureText;
}

export function setMeasureText(mt: MeasureText) {
  measureText = mt;
}

export type FontMetrics = {
  ascentRatio: number;
  descentRatio: number;
  lineGapRatio?: number; // 默认0
  xHeightRatio?: number; // xHeight，verticalAlign在middle时用，有近似值约等于fontSize
}

export type MetricizeFont = (fontFamily: string) => FontMetrics;

let metricizeFont: MetricizeFont | null = null;

export function getMetricizeFont() {
  return metricizeFont;
}

export function setMetricizeFont(mf: MetricizeFont) {
  metricizeFont = mf;
}

function regexIndexOf(str: string, regex: RegExp, startPos = 0) {
  // 确保正则带有 'g' 标志，以便我们可以控制 lastIndex
  const internalRegex = new RegExp(
    regex.source,
    regex.flags.includes('g') ? regex.flags : regex.flags + 'g'
  );

  internalRegex.lastIndex = startPos;
  const match = internalRegex.exec(str);

  return match ? match.index : -1;
}

export const lineBreak = /[\n\r\u2028\u2029]/;

export const CJK_REG_EXTENDED = /[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u30FF\uAC00-\uD7AF\u3000-\u303F\uFF00-\uFFEF]|\uD840[\uDC00-\uDFFF]|[\uD841-\uD87A][\uDC00-\uDFFF]|\uD87B[\uDC00-\uDEAF]/u;

// 智能测量，防止逐字遍历性能缺失
export function smartMeasure(
  measureText: MeasureText,
  content: string,
  start: number,
  aw: number,
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  fontWeight = 400,
  fontStyle = FontStyle.NORMAL,
  letterSpacing = 0,
) {
  const length = content.length;
  const pw = fontSize * 0.8 + letterSpacing;
  let i = start,
    j = length,
    width = 0,
    breakLine = false;
  const n = regexIndexOf(content, lineBreak, start);
  if (n > -1) {
    j = n;
  }
  // 没有letterSpacing或者是svg模式可以完美获取TextMetrics
  let hypotheticalNum = Math.round(aw / pw);
  // 不能增长0个字符，至少也要1个
  if (hypotheticalNum <= 0) {
    hypotheticalNum = 1;
  }
  // 超过内容长度范围也不行
  else if (hypotheticalNum > j) {
    hypotheticalNum = j;
  }
  let mt: TextMeasures;
  // 类似2分的一个循环
  while (i < j) {
    mt = measureText(
      content.slice(start, start + hypotheticalNum),
      fontFamily,
      fontSize,
      lineHeight,
      fontWeight,
      fontStyle,
      letterSpacing,
    );
    let mw = mt.width;
    if (mw === aw) {
      width = aw;
      breakLine = true;
      break;
    }
    // 超出，设置右边界，并根据余量推测减少个数，
    // 因为精度问题，固定宽度或者累加的剩余空间，不用相等判断，而是为原本w宽度加一点点冗余1e-10
    if (mw > aw + 1e-9) {
      breakLine = true;
      // 限制至少1个
      if (hypotheticalNum === 1) {
        width = mw;
        break;
      }
      // 注意特殊判断i和j就差1个可直接得出结果，因为现在超了而-1不超肯定是-1的结果
      if (i === j - 1 || i - start === hypotheticalNum - 1) {
        hypotheticalNum = i - start;
        break;
      }
      j = hypotheticalNum + start - 1;
      let reduce = Math.round((mw - aw) / pw);
      if (reduce <= 0) {
        reduce = 1;
      }
      hypotheticalNum -= reduce;
      if (hypotheticalNum < i - start) {
        hypotheticalNum = i - start;
      }
    }
    // 还有空余，设置左边界，并根据余量推测增加的个数
    else {
      width = mw;
      if (hypotheticalNum === length - start) {
        break;
      }
      i = hypotheticalNum + start;
      let add = Math.round((aw - mw) / pw);
      if (add <= 0) {
        add = 1;
      }
      hypotheticalNum += add;
      if (hypotheticalNum > j - start) {
        hypotheticalNum = j - start;
      }
    }
  }
  // 末尾是英文或数字时，本行前面有空格或者CJK，需要把末尾英文数字放到下一行
  // if ((start + hypotheticalNum) < length &&
  //   /[\w.-]/.test(content[start + hypotheticalNum - 1])) {
  //   for (let i = start + hypotheticalNum - 2; i > start; i--) {
  //     if (!/[\w.-]/.test(content[i])) {
  //       hypotheticalNum = i - start + 1;
  //       mt = measureText(
  //         content.slice(start, start + hypotheticalNum),
  //         fontFamily,
  //         fontSize,
  //         lineHeight,
  //         fontWeight,
  //         fontStyle,
  //         letterSpacing,
  //       );
  //       width = mt.width;
  //       newLine = true;
  //       return { num: hypotheticalNum, width, newLine };
  //     }
  //   }
  // }
  return { num: hypotheticalNum, width, breakLine };
}
