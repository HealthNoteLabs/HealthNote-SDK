import React, { useEffect, useState } from 'react';
import type { TimeSeriesPoint } from '../types.js';
import type { ChartOptions } from '../charts/svg.js';
import { renderBarChartSecure } from '../secure/renderWorker.js';

export interface BarChartProps {
  series: TimeSeriesPoint[];
  options?: ChartOptions;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ series, options = {}, className }: BarChartProps) => {
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    renderBarChartSecure(series, options).then((out) => {
      if (!cancelled) setSvg(out);
    });
    return () => {
      cancelled = true;
    };
  }, [series, JSON.stringify(options)]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}; 