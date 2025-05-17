import { describe, expect, it } from 'vitest';
import { pearsonR, linearRegression } from '../src/analytics/stats.js';
import { TimeSeriesPoint } from '../src/types.js';

describe('analytics stats', () => {
  it('computes Pearson correlation for aligned series', () => {
    const a: TimeSeriesPoint[] = [
      { date: '2025-01-01', value: 1 },
      { date: '2025-01-02', value: 2 },
      { date: '2025-01-03', value: 3 },
    ];
    const b: TimeSeriesPoint[] = [
      { date: '2025-01-01', value: 1 },
      { date: '2025-01-02', value: 4 },
      { date: '2025-01-03', value: 9 },
    ];
    const r = pearsonR(a, b);
    // Values are perfectly correlated quadratically but Pearson captures monotonic linear correlation; expect high but not 1.
    expect(r).toBeGreaterThan(0.9);
  });

  it('performs linear regression', () => {
    const series: TimeSeriesPoint[] = [
      { date: '2025-01-01', value: 10 },
      { date: '2025-01-02', value: 12 },
      { date: '2025-01-03', value: 14 },
    ];
    const { slope, intercept } = linearRegression(series);
    expect(slope).toBeCloseTo(2, 5);
    // intercept ~10 when index 0 corresponds to x=0
    expect(intercept).toBeCloseTo(10, 5);
  });
}); 