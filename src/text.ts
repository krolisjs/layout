import { FontStyle } from './style';

export type MeasureTextRes = { width: number, height: number, baseline: number };

export type MeasureText = (
  content: string,
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  fontWeight?: number,
  fontStyle?: FontStyle,
  letterSpacing?: number,
) => MeasureTextRes;

let measureText: MeasureText | null = null;

export function getMeasureText() {
  return measureText;
}

export function setMeasureText(mt: MeasureText) {
  measureText = mt;
}

export function isEnter(s: string) {
  return s === '\n' || s === '\u2028';
}

// 智能测量，防止逐字遍历性能缺失
export function smartMeasure(
  measureText: MeasureText,
  content: string,
  start: number,
  length: number,
  aw: number,
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  fontWeight = 400,
  fontStyle = FontStyle.NORMAL,
  letterSpacing = 0,
) {
  const pw = fontSize * 0.8 + letterSpacing;
  let i = start,
    j = length,
    width = 0,
    newLine = false,
    baseline = fontSize;
  // 没有letterSpacing或者是svg模式可以完美获取TextMetrics
  let hypotheticalNum = Math.round(aw / pw);
  // 不能增长0个字符，至少也要1个
  if (hypotheticalNum <= 0) {
    hypotheticalNum = 1;
  }
  // 超过内容长度范围也不行
  else if (hypotheticalNum > length - start) {
    hypotheticalNum = length - start;
  }
  let mt: MeasureTextRes;
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
    baseline = mt.baseline;
    if (mw === aw) {
      width = aw;
      newLine = true;
      break;
    }
    // 超出，设置右边界，并根据余量推测减少个数，
    // 因为精度问题，固定宽度或者累加的剩余空间，不用相等判断，而是为原本w宽度加一点点冗余1e-10
    if (mw > aw + 1e-9) {
      newLine = true;
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
  // 查看是否有换行，防止字符串过长indexOf无效查找
  for (let i = start, len = start + hypotheticalNum; i < len; i++) {
    if (isEnter(content[i])) {
      hypotheticalNum = i - start; // 遇到换行数量变化，不包含换行，强制newLine为false，换行在主循环
      mt = measureText(
        content.slice(start, start + hypotheticalNum),
        fontFamily,
        fontSize,
        lineHeight,
        fontWeight,
        fontStyle,
        letterSpacing,
      );
      width = mt.width;
      baseline = mt.baseline;
      newLine = false;
      return { num: hypotheticalNum, width, newLine, baseline };
    }
  }
  // 末尾是英文或数字时，本行前面有空格或者CJK，需要把末尾英文数字放到下一行
  if ((start + hypotheticalNum) < length &&
    /[\w.-]/.test(content[start + hypotheticalNum - 1])) {
    for (let i = start + hypotheticalNum - 2; i > start; i--) {
      if (!/[\w.-]/.test(content[i])) {
        hypotheticalNum = i - start + 1;
        mt = measureText(
          content.slice(start, start + hypotheticalNum),
          fontFamily,
          fontSize,
          lineHeight,
          fontWeight,
          fontStyle,
          letterSpacing,
        );
        width = mt.width;
        baseline = mt.baseline;
        newLine = true;
        return { num: hypotheticalNum, width, newLine, baseline };
      }
    }
  }
  // 下一个字符是回车，强制忽略换行，外层循环识别
  if (isEnter(content[start + hypotheticalNum])) {
    newLine = false;
  }
  return { num: hypotheticalNum, width, newLine, baseline };
}

export type TextBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  baseline: number;
  content: string;
};

export type LineBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  baseline: number;
  list: TextBox[];
};
