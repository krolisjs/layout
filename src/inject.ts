import { FontStyle } from './constants';
import type { MeasureText, SegmentText } from './text';

// 提供浏览器/node环境下默认的注入依赖，如字体测量

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

function getContext() {
  if (ctx) {
    return ctx;
  }
  // 字体抗锯齿需要添加到DOM
  if (typeof document !== 'undefined') {
    canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.left = '9999px';
    canvas.style.top = '0px';
    // @ts-ignore
    canvas.style.webkitFontSmoothing = 'antialiased'; // offscreenCanvas无效
    // @ts-ignores
    canvas.style.mozOsxFontSmoothing = 'grayscale';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
  }
  else if (typeof OffscreenCanvas !== 'undefined') {
    ctx = new OffscreenCanvas(1, 1).getContext('2d');
  }
  if (!ctx) {
    throw new Error('@krolis/layout/inject requires OffscreenCanvas or a canvas element.');
  }
  return ctx;
}

function getFontStyle(fontStyle = FontStyle.NORMAL) {
  if (fontStyle === FontStyle.ITALIC) {
    return 'italic';
  }
  if (fontStyle === FontStyle.OBLIQUE) {
    return 'oblique';
  }
  return 'normal';
}

export const defaultMeasureText: MeasureText = (
  content,
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight = 400,
  fontStyle = FontStyle.NORMAL,
  letterSpacing = 0,
) => {
  const ctx = getContext();
  ctx.font = `${getFontStyle(fontStyle)} ${fontWeight} ${fontSize}px/${lineHeight}px ${fontFamily}`;
  ctx.letterSpacing = letterSpacing + 'px';
  return ctx.measureText(content);
};

let sw: Intl.Segmenter | null = null;
let sg: Intl.Segmenter | null = null;

function getSegmenter(granularity?: string) {
  if (granularity === 'grapheme') {
    if (sg) {
      return sg;
    }
    return sg = new Intl.Segmenter([], { granularity: 'grapheme' });
  }
  if (sw) {
    return sw;
  }
  return sw = new Intl.Segmenter([], { granularity: 'word' });
}

export const defaultSegmentText: SegmentText = (text: string, granularity?: string) => {
  const seg = getSegmenter(granularity);
  return Array.from(seg.segment(text)).map(item => ({
    segment: item.segment,
    index: item.index,
    isWordLike: !!item.isWordLike,
  }));
}