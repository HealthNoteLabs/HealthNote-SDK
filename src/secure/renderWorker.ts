import type { TimeSeriesPoint } from '../types.js';
import type { ChartOptions } from '../charts/svg.js';

declare const Worker: any;
declare const Blob: any;
declare const URL: any;

/**
 * Spawn a Web Worker that contains an isolated copy of the tiny SVG chart renderers.
 * The main thread sends { kind:"line"|"bar", series, opts } and receives { svg }.
 * If the environment has no Worker support (e.g., Node.js), falls back to synchronous render.
 */
function createChartWorker(): Worker | null {
  // Guard for environments without Worker (Node, older browsers)
  if (typeof Worker === 'undefined') return null as any;

  const workerSrc = `
    self.addEventListener('message', (ev) => {
      const { kind, series, opts } = ev.data;

      function lineChartSVG(series, opts = {}) {
        const DEFAULT = { width: 320, height: 180, stroke: '#007aff', fill: 'none' };
        const { width, height, stroke } = Object.assign({}, DEFAULT, opts);
        const data = series.filter(p => Number.isFinite(p.value));
        if (!data.length) {
          self.postMessage({ svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' });
          return;
        }
        const minVal = Math.min.apply(null, data.map(d => d.value));
        const maxVal = Math.max.apply(null, data.map(d => d.value));
        const yScale = v => maxVal === minVal ? height/2 : height - ((v - minVal)/(maxVal - minVal))*(height-20)-10;
        const xScale = i => (i/(data.length-1))*(width-20)+10;
        var path='';
        data.forEach(function(d,i){ var x=xScale(i); var y=yScale(d.value); path += (i===0?'M':' L')+x+','+y; });
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><path d="'+path+'" fill="none" stroke="'+stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        self.postMessage({ svg: svg });
      }

      function barChartSVG(series, opts = {}) {
        const DEFAULT = { width: 320, height: 180, stroke: '#007aff', fill: '#007aff' };
        const { width, height, fill } = Object.assign({}, DEFAULT, opts);
        const data = series.filter(p => Number.isFinite(p.value));
        if (!data.length) {
          self.postMessage({ svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' });
          return;
        }
        const barWidth = Math.max(2, Math.floor((width-20)/data.length));
        const maxVal = Math.max.apply(null, data.map(d => d.value));
        const yScale = v => maxVal===0?0:(v/maxVal)*(height-20);
        var rects='';
        data.forEach(function(d,i){ var x=10+i*barWidth+2; var barH=yScale(d.value); var y=height-barH-10; rects += '<rect x="'+x+'" y="'+y+'" width="'+(barWidth-4)+'" height="'+barH+'" fill="'+fill+'" />'; });
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'">'+rects+'</svg>';
        self.postMessage({ svg: svg });
      }

      if (kind === 'line') lineChartSVG(series, opts);
      else barChartSVG(series, opts);
    });
  `;

  const blob = new Blob([workerSrc], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

async function runInWorker(kind: 'line' | 'bar', series: TimeSeriesPoint[], opts: ChartOptions = {}): Promise<string> {
  const worker = createChartWorker();
  if (!worker) {
    // Fallback to synchronous execution (import inline functions)
    if (kind === 'line') {
      // dynamic import to avoid circular
      const { lineChartSVG } = await import('../charts/svg.js');
      return lineChartSVG(series, opts);
    }
    const { barChartSVG } = await import('../charts/svg.js');
    return barChartSVG(series, opts);
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error('Chart worker timeout'));
    }, 10_000);

    worker.onmessage = (ev) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(ev.data.svg as string);
    };
    worker.onerror = (err) => {
      clearTimeout(timer);
      worker.terminate();
      reject(err);
    };
    worker.postMessage({ kind, series, opts });
  });
}

export function renderLineChartSecure(series: TimeSeriesPoint[], opts: ChartOptions = {}): Promise<string> {
  return runInWorker('line', series, opts);
}

export function renderBarChartSecure(series: TimeSeriesPoint[], opts: ChartOptions = {}): Promise<string> {
  return runInWorker('bar', series, opts);
} 