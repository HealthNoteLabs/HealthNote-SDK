import { describe, expect, it } from 'vitest';
import { rollingStatistic, rollingZScoreAnomalies } from '../src/analytics/rolling.js';
import { TimeSeriesPoint } from '../src/types.js';

describe('rolling utilities', () => {
  const series: TimeSeriesPoint[] = [
    { date: '2025-01-01', value: 10 },
    { date: '2025-01-02', value: 12 },
    { date: '2025-01-03', value: 11 },
    { date: '2025-01-04', value: 13 },
    { date: '2025-01-05', value: 50 }, // outlier
    { date: '2025-01-06', value: 12 },
  ];

  it('computes rolling mean', () => {
    const sma = rollingStatistic(series, 3, 'mean');
    expect(sma[0].value).toBeNaN();
    expect(sma[2].value).toBeCloseTo((10 + 12 + 11) / 3, 5);
  });

  it('detects z-score anomalies', () => {
    const anomalies = rollingZScoreAnomalies(series, 3, 2);
    expect(anomalies.length).toBe(0);
  });
}); 