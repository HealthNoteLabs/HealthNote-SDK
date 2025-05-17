import { TimeSeriesPoint } from '../types.js';
import { mean, std } from './stats.js';

export type RollingStat = 'mean' | 'min' | 'max' | 'std';

/**
 * Generic rolling window helper – returns a new series with the statistic applied.
 * For indexes that don't have enough preceding values, `value` is NaN.
 */
export function rollingStatistic(
  series: TimeSeriesPoint[],
  window: number,
  stat: RollingStat
): TimeSeriesPoint[] {
  if (window <= 1) return [...series];
  const out: TimeSeriesPoint[] = [];
  const buffer: number[] = [];
  for (const point of series) {
    buffer.push(point.value);
    if (buffer.length > window) buffer.shift();
    let val = NaN;
    if (buffer.length === window) {
      switch (stat) {
        case 'mean':
          val = mean(buffer);
          break;
        case 'min':
          val = Math.min(...buffer);
          break;
        case 'max':
          val = Math.max(...buffer);
          break;
        case 'std':
          val = std(buffer);
          break;
      }
    }
    out.push({ ...point, value: val });
  }
  return out;
}

export interface Anomaly {
  point: TimeSeriesPoint;
  zScore: number;
}

/**
 * Simple z-score based anomaly detection over a rolling window.
 * Flags a point as anomaly if |z| >= threshold.
 */
export function rollingZScoreAnomalies(
  series: TimeSeriesPoint[],
  window: number,
  threshold = 3
): Anomaly[] {
  if (window < 2) return [];
  const anomalies: Anomaly[] = [];
  const buffer: number[] = [];
  for (let i = 0; i < series.length; i++) {
    const v = series[i].value;
    buffer.push(v);
    if (buffer.length > window) buffer.shift();
    if (buffer.length < window) continue; // not enough history

    const m = mean(buffer);
    const s = std(buffer);
    if (s === 0) continue;
    const z = (v - m) / s;
    if (Math.abs(z) >= threshold) {
      anomalies.push({ point: series[i], zScore: z });
    }
  }
  return anomalies;
} 