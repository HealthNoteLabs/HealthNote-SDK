import { TimeSeriesPoint } from '../types.js';

export interface ChartOptions {
  width?: number; // px
  height?: number; // px
  stroke?: string; // CSS color for line/bar
  fill?: string; // bar fill or line area fill
}

const DEFAULT_OPTS: Required<ChartOptions> = {
  width: 320,
  height: 180,
  stroke: '#007aff',
  fill: 'none',
};

function sanitizeSeries(series: TimeSeriesPoint[]): TimeSeriesPoint[] {
  return series.filter((p) => Number.isFinite(p.value));
}

export function lineChartSVG(series: TimeSeriesPoint[], opts: ChartOptions = {}): string {
  const options: Required<ChartOptions> = { ...DEFAULT_OPTS, ...opts } as any;
  const data = sanitizeSeries(series);
  if (!data.length) return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  const { width, height, stroke } = options;

  // Compute scales
  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));
  const yScale = (v: number) => {
    if (maxVal === minVal) return height / 2;
    return height - ((v - minVal) / (maxVal - minVal)) * (height - 20) - 10; // padding 10px
  };
  const xScale = (i: number) => {
    return (i / (data.length - 1)) * (width - 20) + 10; // padding
  };

  // Build path
  let path = '';
  data.forEach((d, i) => {
    const x = xScale(i);
    const y = yScale(d.value);
    path += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <path d="${path}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function barChartSVG(series: TimeSeriesPoint[], opts: ChartOptions = {}): string {
  const options: Required<ChartOptions> = { ...DEFAULT_OPTS, ...opts } as any;
  const data = sanitizeSeries(series);
  if (!data.length) return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  const { width, height, fill } = options;
  const barWidth = Math.max(2, Math.floor((width - 20) / data.length));

  const minVal = 0; // bars start at 0 baseline
  const maxVal = Math.max(...data.map((d) => d.value));
  const yScale = (v: number) => (maxVal === 0 ? 0 : ((v - minVal) / (maxVal - minVal)) * (height - 20));

  let rects = '';
  data.forEach((d, i) => {
    const x = 10 + i * barWidth + 2; // 2px gap
    const barH = yScale(d.value);
    const y = height - barH - 10; // padding bottom 10
    rects += `<rect x="${x}" y="${y}" width="${barWidth - 4}" height="${barH}" fill="${fill !== 'none' ? fill : '#007aff'}" />`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${rects}
  </svg>`;
} 