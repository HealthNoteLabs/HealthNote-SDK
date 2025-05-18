import {
  barChartSVG,
  lineChartSVG
} from "./chunk-FJTTLFWT.mjs";

// src/loaders/jsonLoader.ts
import { readFile } from "fs/promises";
async function loadEventsFromFile(path2) {
  const data = await readFile(path2, "utf8");
  const trimmed = data.trim();
  if (!trimmed)
    return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed))
      return parsed;
    return [parsed];
  } catch {
    return trimmed.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  }
}

// src/loaders/csvLoader.ts
import { readFile as readFile2 } from "fs/promises";
import { parse } from "csv-parse/sync";
async function loadEventsFromCSV(path2, opts = {}) {
  const input = await readFile2(path2, "utf8");
  const records = parse(input, {
    columns: true,
    skip_empty_lines: true,
    delimiter: opts.delimiter ?? ","
  });
  const events = records.map((row) => {
    const tags = [];
    if (row.unit)
      tags.push(["unit", row.unit]);
    if (row.timestamp)
      tags.push(["timestamp", row.timestamp]);
    if (row.encrypted === "true" || row.encrypted === true) {
      tags.push(["encryption_algo", "nip44"]);
    }
    return {
      id: row.id,
      kind: Number(row.kind),
      content: String(row.value),
      tags,
      created_at: Number(row.created_at)
    };
  });
  return events;
}

// src/transforms/timeSeries.ts
function toTimeSeries(events, options = {}) {
  const { metricKind = 1351 } = options;
  const filtered = events.filter((e) => e.kind === metricKind);
  return filtered.map((ev) => {
    const tags = ev.tags ?? [];
    const timestampTag = tags.find((t) => t[0] === "timestamp");
    const iso = timestampTag ? timestampTag[1] : new Date(ev.created_at * 1e3).toISOString();
    const date = iso.slice(0, 10);
    const encrypted = !!tags.find((t) => t[0] === "encryption_algo");
    const valueNum = Number(ev.content);
    return {
      date,
      value: isNaN(valueNum) ? 0 : valueNum,
      source: timestampTag ? "timestamp_tag" : "created_at",
      encrypted
    };
  });
}

// src/transforms/groupByBucket.ts
function bucketKey(dateIso, bucket) {
  if (bucket === "day")
    return dateIso;
  const [year, month, day] = dateIso.split("-").map(Number);
  if (bucket === "week") {
    const date = new Date(Date.UTC(year, month - 1, day));
    const firstDay = new Date(date);
    firstDay.setUTCDate(date.getUTCDate() - date.getUTCDay());
    return firstDay.toISOString().slice(0, 10);
  }
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}`;
}
function groupByBucket(series, opts) {
  const { bucket, aggregate } = opts;
  const map = /* @__PURE__ */ new Map();
  for (const p of series) {
    const key = bucketKey(p.date, bucket);
    let bucketPoint = map.get(key);
    if (!bucketPoint) {
      bucketPoint = {
        date: key,
        value: 0,
        count: 0,
        min: p.value,
        max: p.value,
        source: p.source,
        encrypted: p.encrypted
      };
      map.set(key, bucketPoint);
    }
    bucketPoint.count += 1;
    bucketPoint.min = Math.min(bucketPoint.min, p.value);
    bucketPoint.max = Math.max(bucketPoint.max, p.value);
    bucketPoint.value += p.value;
  }
  const out = [];
  map.forEach((bp) => {
    switch (aggregate) {
      case "avg":
        bp.value = bp.value / bp.count;
        break;
      case "sum":
        break;
      case "min":
        bp.value = bp.min;
        break;
      case "max":
        bp.value = bp.max;
        break;
      case "count":
        bp.value = bp.count;
        break;
    }
    out.push(bp);
  });
  return out.sort((a, b) => a.date < b.date ? -1 : 1);
}

// src/validator/validateEvent.ts
import Ajv from "ajv";
import path from "path";
import { readFileSync, existsSync } from "fs";
var ajv = new Ajv({ allErrors: true });
var cache = /* @__PURE__ */ new Map();
function loadSchemaForKind(kind) {
  if (cache.has(kind))
    return cache.get(kind);
  const schemaPath = path.resolve(process.cwd(), "packages", "analytics-sdk", "schemas", `${kind}.schema.json`);
  if (!existsSync(schemaPath)) {
    cache.set(kind, null);
    return null;
  }
  const raw = readFileSync(schemaPath, "utf8");
  const schemaJson = JSON.parse(raw);
  const validate = ajv.compile(schemaJson);
  cache.set(kind, validate);
  return validate;
}
function validateEvent(ev) {
  const validate = loadSchemaForKind(ev.kind);
  if (!validate)
    return { valid: true };
  const ok = validate(ev);
  return { valid: !!ok, errors: validate.errors };
}

// src/analytics/stats.ts
function mean(values) {
  if (!values.length)
    return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
function std(values) {
  if (values.length < 2)
    return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}
function alignSeries(a, b) {
  const mapA = /* @__PURE__ */ new Map();
  for (const p of a)
    mapA.set(p.date, p.value);
  const pairs = [];
  for (const p of b) {
    const vA = mapA.get(p.date);
    if (vA !== void 0)
      pairs.push([vA, p.value]);
  }
  return pairs;
}
function pearsonR(a, b) {
  const pairs = alignSeries(a, b);
  if (pairs.length < 2)
    return 0;
  const xs = pairs.map((p) => p[0]);
  const ys = pairs.map((p) => p[1]);
  const mx = mean(xs);
  const my = mean(ys);
  const sx = std(xs);
  const sy = std(ys);
  if (sx === 0 || sy === 0)
    return 0;
  let num = 0;
  for (let i = 0; i < pairs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
  }
  return num / ((pairs.length - 1) * sx * sy);
}
function movingAverage(series, window) {
  if (window <= 1)
    return [...series];
  const out = [];
  const buffer = [];
  for (const point of series) {
    buffer.push(point.value);
    if (buffer.length > window)
      buffer.shift();
    const avg = buffer.length === window ? mean(buffer) : NaN;
    out.push({ ...point, value: avg });
  }
  return out;
}
function linearRegression(series) {
  const xs = [];
  const ys = [];
  for (let i = 0; i < series.length; i++) {
    const v = series[i].value;
    if (!Number.isNaN(v)) {
      xs.push(i);
      ys.push(v);
    }
  }
  if (xs.length < 2)
    return { slope: 0, intercept: ys[0] ?? 0, r: 0 };
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
  const r = pearsonR(
    xs.map((x, idx) => ({ date: String(x), value: x })),
    ys.map((y, idx) => ({ date: String(idx), value: y }))
  );
  return { slope, intercept, r };
}

// src/analytics/rolling.ts
function rollingStatistic(series, window, stat) {
  if (window <= 1)
    return [...series];
  const out = [];
  const buffer = [];
  for (const point of series) {
    buffer.push(point.value);
    if (buffer.length > window)
      buffer.shift();
    let val = NaN;
    if (buffer.length === window) {
      switch (stat) {
        case "mean":
          val = mean(buffer);
          break;
        case "min":
          val = Math.min(...buffer);
          break;
        case "max":
          val = Math.max(...buffer);
          break;
        case "std":
          val = std(buffer);
          break;
      }
    }
    out.push({ ...point, value: val });
  }
  return out;
}
function rollingZScoreAnomalies(series, window, threshold = 3) {
  if (window < 2)
    return [];
  const anomalies = [];
  const buffer = [];
  for (let i = 0; i < series.length; i++) {
    const v = series[i].value;
    buffer.push(v);
    if (buffer.length > window)
      buffer.shift();
    if (buffer.length < window)
      continue;
    const m = mean(buffer);
    const s = std(buffer);
    if (s === 0)
      continue;
    const z = (v - m) / s;
    if (Math.abs(z) >= threshold) {
      anomalies.push({ point: series[i], zScore: z });
    }
  }
  return anomalies;
}

// src/secure/renderWorker.ts
function createChartWorker() {
  if (typeof Worker === "undefined")
    return null;
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
  const blob = new Blob([workerSrc], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}
async function runInWorker(kind, series, opts = {}) {
  const worker = createChartWorker();
  if (!worker) {
    if (kind === "line") {
      const { lineChartSVG: lineChartSVG2 } = await import("./svg-J5MQADMU.mjs");
      return lineChartSVG2(series, opts);
    }
    const { barChartSVG: barChartSVG2 } = await import("./svg-J5MQADMU.mjs");
    return barChartSVG2(series, opts);
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error("Chart worker timeout"));
    }, 1e4);
    worker.onmessage = (ev) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(ev.data.svg);
    };
    worker.onerror = (err) => {
      clearTimeout(timer);
      worker.terminate();
      reject(err);
    };
    worker.postMessage({ kind, series, opts });
  });
}
function renderLineChartSecure(series, opts = {}) {
  return runInWorker("line", series, opts);
}
function renderBarChartSecure(series, opts = {}) {
  return runInWorker("bar", series, opts);
}

// src/react/LineChart.tsx
import { useEffect, useState } from "react";
import { jsx } from "react/jsx-runtime";
var LineChart = ({ series, options = {}, className }) => {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let cancelled = false;
    renderLineChartSecure(series, options).then((out) => {
      if (!cancelled)
        setSvg(out);
    });
    return () => {
      cancelled = true;
    };
  }, [series, JSON.stringify(options)]);
  return /* @__PURE__ */ jsx("div", { className, dangerouslySetInnerHTML: { __html: svg } });
};

// src/react/BarChart.tsx
import { useEffect as useEffect2, useState as useState2 } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var BarChart = ({ series, options = {}, className }) => {
  const [svg, setSvg] = useState2("");
  useEffect2(() => {
    let cancelled = false;
    renderBarChartSecure(series, options).then((out) => {
      if (!cancelled)
        setSvg(out);
    });
    return () => {
      cancelled = true;
    };
  }, [series, JSON.stringify(options)]);
  return /* @__PURE__ */ jsx2("div", { className, dangerouslySetInnerHTML: { __html: svg } });
};

// src/index.ts
var version = "0.0.1";
export {
  BarChart,
  LineChart,
  barChartSVG,
  groupByBucket,
  lineChartSVG,
  linearRegression,
  loadEventsFromCSV,
  loadEventsFromFile,
  mean,
  movingAverage,
  pearsonR,
  renderBarChartSecure,
  renderLineChartSecure,
  rollingStatistic,
  rollingZScoreAnomalies,
  std,
  toTimeSeries,
  validateEvent,
  version
};
//# sourceMappingURL=index.mjs.map