import React, { useEffect, useState } from 'react';
import type { TimeSeriesPoint } from '../types.js';
import type { ChartOptions } from '../charts/svg.js';
import { renderLineChartSecure } from '../secure/renderWorker.js';

export interface LineChartProps {
  series: TimeSeriesPoint[];
  options?: ChartOptions;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ series, options = {}, className }: LineChartProps) => {
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    renderLineChartSecure(series, options).then((out) => {
      if (!cancelled) setSvg(out);
    });
    return () => {
      cancelled = true;
    };
  }, [series, JSON.stringify(options)]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}; 