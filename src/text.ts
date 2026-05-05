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

// 各种换行符
export const LINE_REG = /\r\n|[\n\r\u2028\u2029]/;

// 涵盖了 汉字、平假名、片假名、韩文
export const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

// 包含各种形式的左部括弧、左引号、以及前置符号
const PROHIBITED_AT_LINE_END = /[({\[〈《「『【〔〖（［｛“‘'"@#$%^&*_+=|\\~]/;

// 避头标点：各种结束括号、引号、逗号、句号等
const PROHIBITED_AT_LINE_START = /[!,.:;?\]})〉》」』】〕〗）］｝’”"、。？！，：；]/;

// 前置条件一定end>=start，end包含
function findSafeBreakIndex(segs: Segment[], start: number, end: number) {
  let i = end;
  // 先向左看避尾，一行至少保留一个，所以不看start
  while (i > start) {
    const item = segs[i];
    if (item.isWordLike || !PROHIBITED_AT_LINE_END.test(item.segment)) {
      break;
    }
    i--;
  }
  const length = segs.length;
  // 没有动再看右边避头，如果动了则挤到下行的肯定是避尾标点，所以不用判断
  if (i === end && length > end + 1) {
    const next = segs[end + 1];
    // 下一个是避头的话，需要向左看把单元挤到下一行去，如果左边恰好是避尾则继续向左，直到start
    if (!next.isWordLike && PROHIBITED_AT_LINE_START.test(next.segment)) {
      if (i > start) {
        i--;
      }
      while (i > start) {
        const item = segs[i];
        if (item.isWordLike || !PROHIBITED_AT_LINE_END.test(item.segment)) {
          break;
        }
        i--;
      }
      // start=end只有1个的时候需要向后看把所有避头包含
      if (start === end) {
        i = Math.min(length - 1, end + 2);
        while (i < length) {
          const item = segs[i];
          if (item.isWordLike || !PROHIBITED_AT_LINE_START.test(item.segment)) {
            i--;
            break;
          }
          i++;
        }
      }
      // 除非start也是避尾才忽略
      else if (i === start) {
        const first = segs[i];
        if (!first.isWordLike && PROHIBITED_AT_LINE_END.test(first.segment)) {
          i = end;
        }
      }
    }
  }
  return i;
}

function getCacheWidth(
  measureText: MeasureText,
  s: string,
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  fontWeight = 400,
  fontStyle = FontStyle.NORMAL,
  letterSpacing = 0,
  cache: Record<string, number>,
) {
  let mw: number;
  if (cache.hasOwnProperty(s)) {
    mw = cache[s];
  }
  else {
    mw = measureText(
      s,
      fontFamily,
      fontSize,
      lineHeight,
      fontWeight,
      fontStyle,
      letterSpacing,
    ).width;
    cache[s] = mw;
  }
  return mw;
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
  cache: Record<string, number>,
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
  else if (hypotheticalNum > j - i) {
    hypotheticalNum = j - i;
  }
  // 类似2分的一个循环，hypotheticalNum会动态不断调整
  while (i < j) {
    const end = segs[start + hypotheticalNum];
    const s = content.slice(startIndex, end ? end.index : content.length);
    const mw = getCacheWidth(
      measureText,
      s,
      fontFamily,
      fontSize,
      lineHeight,
      fontWeight,
      fontStyle,
      letterSpacing,
      cache,
    );
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
        if (hypotheticalNum <= 0) {
          hypotheticalNum = 1;
        }
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
        const s = content.slice(startIndex, end ? end.index : content.length);
        const mw = getCacheWidth(
          measureText,
          s,
          fontFamily,
          fontSize,
          lineHeight,
          fontWeight,
          fontStyle,
          letterSpacing,
          cache,
        );
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
  let old = hypotheticalNum;
  // 检查\n，防止手动换行
  if (hypotheticalNum > 1 && length >= start + hypotheticalNum) {
    for (i = start + 1; i < start + hypotheticalNum; i++) {
      const item = segs[i];
      if (!item.isWordLike && LINE_REG.test(item.segment)) {
        hypotheticalNum = i - start;
      }
    }
  }
  // 避头避尾标点，防止单行只有它一个情况忽略掉
  if (length >= start + hypotheticalNum) {
    const i = findSafeBreakIndex(segs, start, start + hypotheticalNum - 1);
    hypotheticalNum = i + 1 - start;
  }
  if (old !== hypotheticalNum) {
    const end = segs[start + hypotheticalNum];
    const s = content.slice(startIndex, end ? end.index : content.length);
    width = getCacheWidth(
      measureText,
      s,
      fontFamily,
      fontSize,
      lineHeight,
      fontWeight,
      fontStyle,
      letterSpacing,
      cache,
    );
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
