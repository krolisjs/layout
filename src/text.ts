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
  if (!measureText) {
    throw new Error('Text must be passed to the measureText method.');
  }
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
  if (!metricizeFont) {
    throw new Error('Text must be passed to the metricizeFont method.');
  }
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

export const LINE_REG = /\r\n|[\n\r\u2028\u2029]/;

export const CJK_REG_EXTENDED = /[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u30FF\uAC00-\uD7AF\u3000-\u303F\uFF00-\uFFEF]|\uD840[\uDC00-\uDFFF]|[\uD841-\uD87A][\uDC00-\uDFFF]|\uD87B[\uDC00-\uDEAF]/u;

// 涵盖了 汉字、平假名、片假名、韩文
export const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

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
    breakLine = false; // 是否需要自动换行，排不下时另起一行，不包含手动\n的换行
  const n = regexIndexOf(content, LINE_REG, start);
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
        width = mw;
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

export function estimateMeasure(
  measureText: MeasureText,
  content: string,
  segs: Segment[],
  start: number,
  aw: number,
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  fontWeight = 400,
  fontStyle = FontStyle.NORMAL,
  letterSpacing = 0,
) {
  const length = segs.length;
  const startIndex = segs[start].index;
  let i = start,
    j = length,
    width = 0,
    breakLine = false; // 是否需要自动换行，排不下时另起一行，不包含手动\n的换行
  // 这是假设按字符个数预测的，不是Segment的数量，但为了算法好写，把它当做Segment和字符是1：1的情况算
  const pw = fontSize * 0.8 + letterSpacing;
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
  console.log('i, j', i, j);
  // if (i === 6) debugger
  // 类似2分的一个循环，hypotheticalNum会动态不断调整
  while (i < j) {
    const end = segs[start + hypotheticalNum];
    mt = measureText(
      content.slice(startIndex, end ? end.index : content.length),
      fontFamily,
      fontSize,
      lineHeight,
      fontWeight,
      fontStyle,
      letterSpacing,
    );
    let mw = mt.width;
    // 凑巧情况，汉字整数倍宽
    if (mw === aw) {
      width = aw;
      breakLine = true;
      break;
    }
    // 超出，设置右边界，并根据余量推测减少个数，
    // 因为精度问题，固定宽度或者累加的剩余空间，不用相等判断，而是为原本w宽度加一点点冗余
    if (mw > aw + 1e-9) {
      breakLine = true;
      // 限制至少1个
      if (hypotheticalNum === 1) {
        width = mw;
        break;
      }
      // 注意特殊判断i和j就差1个可直接得出结果，因为现在j超了，而i=j-1不超肯定是i的结果
      if (i === j - 1 || i - start === hypotheticalNum - 1) {
        width = mw;
        hypotheticalNum = i - start;
        break;
      }
      // 2分设置j到目前的位置-1作为右边界，动态调整假设数量
      j = start + hypotheticalNum - 1;
      let reduce = Math.round((mw - aw) / pw);
      if (reduce <= 0) {
        reduce = 1;
      }
      hypotheticalNum -= reduce;
      // 防止假设数量太小不到边界
      if (hypotheticalNum < i - start) {
        hypotheticalNum = i - start;
      }
      if (hypotheticalNum <= 0) {
        hypotheticalNum = 1;
      }
    }
    // 还有空余，设置左边界，并根据余量推测增加的个数
    else {
      width = mw;
      if (hypotheticalNum === length - start) {
        break;
      }
      // 有一种情况，超出后j减小，恰好j=i+1，此时测量i是足够的，但j也可能足够，所以特殊判断
      if (i === j - 1) {
        const end = segs[j];
        mt = measureText(
          content.slice(startIndex, end ? end.index : content.length),
          fontFamily,
          fontSize,
          lineHeight,
          fontWeight,
          fontStyle,
          letterSpacing,
        );
        mw = mt.width;
        if (mw > aw + 1e-9) {
        }
        else {
          width = mw;
          hypotheticalNum = j - start;
        }
        break;
      }
      // 2分设置i到目前的位置作为左边界
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
  return { num: hypotheticalNum, width, breakLine };
}

export type Segment = {
  segment: string;
  index: number;
  isWordLike: boolean;
};

export type SegmentText = (text: string, granularity?: string) => Segment[];

let segmentText: SegmentText | null = null;

export function getSegmentText() {
  if (!segmentText) {
    throw new Error('Text must be passed to the segmentText method.');
  }
  return segmentText;
}

export function setSegmentText(st: SegmentText) {
  segmentText = st;
}
