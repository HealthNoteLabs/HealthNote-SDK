"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/charts/svg.ts
var svg_exports = {};
__export(svg_exports, {
  barChartSVG: () => barChartSVG,
  lineChartSVG: () => lineChartSVG
});
function sanitizeSeries(series) {
  return series.filter((p) => Number.isFinite(p.value));
}
function lineChartSVG(series, opts = {}) {
  const options = { ...DEFAULT_OPTS, ...opts };
  const data = sanitizeSeries(series);
  if (!data.length)
    return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  const { width, height, stroke } = options;
  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));
  const yScale = (v) => {
    if (maxVal === minVal)
      return height / 2;
    return height - (v - minVal) / (maxVal - minVal) * (height - 20) - 10;
  };
  const xScale = (i) => {
    return i / (data.length - 1) * (width - 20) + 10;
  };
  let path2 = "";
  data.forEach((d, i) => {
    const x = xScale(i);
    const y = yScale(d.value);
    path2 += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <path d="${path2}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
function barChartSVG(series, opts = {}) {
  const options = { ...DEFAULT_OPTS, ...opts };
  const data = sanitizeSeries(series);
  if (!data.length)
    return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  const { width, height, fill } = options;
  const barWidth = Math.max(2, Math.floor((width - 20) / data.length));
  const minVal = 0;
  const maxVal = Math.max(...data.map((d) => d.value));
  const yScale = (v) => maxVal === 0 ? 0 : (v - minVal) / (maxVal - minVal) * (height - 20);
  let rects = "";
  data.forEach((d, i) => {
    const x = 10 + i * barWidth + 2;
    const barH = yScale(d.value);
    const y = height - barH - 10;
    rects += `<rect x="${x}" y="${y}" width="${barWidth - 4}" height="${barH}" fill="${fill !== "none" ? fill : "#007aff"}" />`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${rects}
  </svg>`;
}
var DEFAULT_OPTS;
var init_svg = __esm({
  "src/charts/svg.ts"() {
    "use strict";
    DEFAULT_OPTS = {
      width: 320,
      height: 180,
      stroke: "#007aff",
      fill: "none"
    };
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  BarChart: () => BarChart,
  LineChart: () => LineChart,
  barChartSVG: () => barChartSVG,
  groupByBucket: () => groupByBucket,
  lineChartSVG: () => lineChartSVG,
  linearRegression: () => linearRegression,
  loadEventsFromCSV: () => loadEventsFromCSV,
  loadEventsFromFile: () => loadEventsFromFile,
  mean: () => mean,
  movingAverage: () => movingAverage,
  pearsonR: () => pearsonR,
  renderBarChartSecure: () => renderBarChartSecure,
  renderLineChartSecure: () => renderLineChartSecure,
  rollingStatistic: () => rollingStatistic,
  rollingZScoreAnomalies: () => rollingZScoreAnomalies,
  std: () => std,
  toTimeSeries: () => toTimeSeries,
  validateEvent: () => validateEvent,
  version: () => version
});
module.exports = __toCommonJS(src_exports);

// src/loaders/jsonLoader.ts
var import_promises = require("fs/promises");
async function loadEventsFromFile(path2) {
  const data = await (0, import_promises.readFile)(path2, "utf8");
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
var import_promises2 = require("fs/promises");
var import_sync = require("csv-parse/sync");
async function loadEventsFromCSV(path2, opts = {}) {
  const input = await (0, import_promises2.readFile)(path2, "utf8");
  const records = (0, import_sync.parse)(input, {
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
var import_ajv = __toESM(require("ajv"));
var import_path = __toESM(require("path"));
var import_fs = require("fs");
var ajv = new import_ajv.default({ allErrors: true });
var cache = /* @__PURE__ */ new Map();
function loadSchemaForKind(kind) {
  if (cache.has(kind))
    return cache.get(kind);
  const schemaPath = import_path.default.resolve(process.cwd(), "packages", "analytics-sdk", "schemas", `${kind}.schema.json`);
  if (!(0, import_fs.existsSync)(schemaPath)) {
    cache.set(kind, null);
    return null;
  }
  const raw = (0, import_fs.readFileSync)(schemaPath, "utf8");
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

// src/index.ts
init_svg();

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
      const { lineChartSVG: lineChartSVG2 } = await Promise.resolve().then(() => (init_svg(), svg_exports));
      return lineChartSVG2(series, opts);
    }
    const { barChartSVG: barChartSVG2 } = await Promise.resolve().then(() => (init_svg(), svg_exports));
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
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var LineChart = ({ series, options = {}, className }) => {
  const [svg, setSvg] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    let cancelled = false;
    renderLineChartSecure(series, options).then((out) => {
      if (!cancelled)
        setSvg(out);
    });
    return () => {
      cancelled = true;
    };
  }, [series, JSON.stringify(options)]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className, dangerouslySetInnerHTML: { __html: svg } });
};

// src/react/BarChart.tsx
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
var BarChart = ({ series, options = {}, className }) => {
  const [svg, setSvg] = (0, import_react2.useState)("");
  (0, import_react2.useEffect)(() => {
    let cancelled = false;
    renderBarChartSecure(series, options).then((out) => {
      if (!cancelled)
        setSvg(out);
    });
    return () => {
      cancelled = true;
    };
  }, [series, JSON.stringify(options)]);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className, dangerouslySetInnerHTML: { __html: svg } });
};

// src/index.ts
var version = "0.0.1";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
//# sourceMappingURL=index.js.map