import { describe, expect, it } from 'vitest';
import { lineChartSVG, barChartSVG } from '../src/charts/svg.js';
import { TimeSeriesPoint } from '../src/types.js';

describe('SVG charts', () => {
  const series: TimeSeriesPoint[] = [
    { date: 'A', value: 1 },
    { date: 'B', value: 3 },
    { date: 'C', value: 2 },
  ];

  it('creates line chart SVG', () => {
    const svg = lineChartSVG(series);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.includes('<path')).toBe(true);
  });

  it('creates bar chart SVG', () => {
    const svg = barChartSVG(series);
    expect(svg.includes('<rect')).toBe(true);
  });
}); 