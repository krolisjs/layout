import type { ComputedStyle } from './style';
import { getMetricizeFont } from './text';

export function getMbpH(res: ComputedStyle) {
  return getMbpLeft(res) + getMbpRight(res);
}

export function getMbpLeft(res: ComputedStyle) {
  return res.marginLeft + res.borderLeftWidth + res.paddingLeft;
}

export function getMbpRight(res: ComputedStyle) {
  return res.marginRight + res.borderRightWidth + res.paddingRight;
}

export function getMbpV(res: ComputedStyle) {
  return getMbpTop(res) + getMbpBottom(res);
}

export function getMbpTop(res: ComputedStyle) {
  return res.marginTop + res.borderTopWidth + res.paddingTop;
}

export function getMbpBottom(res: ComputedStyle) {
  return res.marginBottom + res.borderBottomWidth + res.paddingBottom;
}

export function calNormalLineHeight(fontFamily: string, fontSize: number) {
  const metricizeFont = getMetricizeFont();
  if (!metricizeFont) {
    throw new Error('Text must be passed to the metricizeFont method.');
  }
  const m = metricizeFont(fontFamily);
  return fontSize * m.lgr;
}

export function calBaseline(fontFamily: string, fontSize: number, lineHeight: number) {
  const normal = calNormalLineHeight(fontFamily, fontSize);
  const metricizeFont = getMetricizeFont();
  const m = metricizeFont!(fontFamily);
  return (lineHeight - normal) * 0.5 + fontSize * m.blr;
}
