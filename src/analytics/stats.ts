import { TimeSeriesPoint } from '../types.js';

/**
 * Compute the arithmetic mean of an array. Returns 0 for empty input.
 */
export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Compute the sample standard deviation. Returns 0 for <2 values.
 */
export function std(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Align two time-series by date (ISO string) and return pairs of numeric values.
 * Non-matching dates are ignored.
 */
function alignSeries(a: TimeSeriesPoint[], b: TimeSeriesPoint[]): Array<[number, number]> {
  const mapA = new Map<string, number>();
  for (const p of a) mapA.set(p.date, p.value);
  const pairs: Array<[number, number]> = [];
  for (const p of b) {
    const vA = mapA.get(p.date);
    if (vA !== undefined) pairs.push([vA, p.value]);
  }
  return pairs;
}

/**
 * Pearson correlation coefficient between two time-series.
 * Only overlapping dates are considered. Returns 0 if <2 overlap.
 */
export function pearsonR(a: TimeSeriesPoint[], b: TimeSeriesPoint[]): number {
  const pairs = alignSeries(a, b);
  if (pairs.length < 2) return 0;
  const xs = pairs.map((p) => p[0]);
  const ys = pairs.map((p) => p[1]);
  const mx = mean(xs);
  const my = mean(ys);
  const sx = std(xs);
  const sy = std(ys);
  if (sx === 0 || sy === 0) return 0;
  let num = 0;
  for (let i = 0; i < pairs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
  }
  return num / ((pairs.length - 1) * sx * sy);
}

/**
 * Simple moving average (SMA). Window size is number of samples.
 * Returns a new series (same length as input) with undefined values until enough samples.
 */
export function movingAverage(series: TimeSeriesPoint[], window: number): TimeSeriesPoint[] {
  if (window <= 1) return [...series];
  const out: TimeSeriesPoint[] = [];
  const buffer: number[] = [];
  for (const point of series) {
    buffer.push(point.value);
    if (buffer.length > window) buffer.shift();
    const avg = buffer.length === window ? mean(buffer) : NaN;
    out.push({ ...point, value: avg });
  }
  return out;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r: number; // correlation coefficient
}

/**
 * Ordinary least squares linear regression on a time-series where x = incrementing index.
 * Returns slope, intercept, and r (Pearson corr). Ignores NaN values.
 */
export function linearRegression(series: TimeSeriesPoint[]): RegressionResult {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < series.length; i++) {
    const v = series[i].value;
    if (!Number.isNaN(v)) {
      xs.push(i);
      ys.push(v);
    }
  }
  if (xs.length < 2) return { slope: 0, intercept: ys[0] ?? 0, r: 0 };
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  // compute r using existing pearson formula
  const r = pearsonR(
    xs.map((x, idx) => ({ date: String(x), value: x } as TimeSeriesPoint)),
    ys.map((y, idx) => ({ date: String(idx), value: y } as TimeSeriesPoint))
  );
  return { slope, intercept, r };
} 