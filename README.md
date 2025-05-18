# HealthNote SDK (MVP)

A tiny TypeScript helper library for reading NIP-101h health events and turning them into charts, correlations and trends—without exposing raw plaintext outside your app's secure context.

```bash
npm install health-note  # local path while developing
```

## Quick start

```ts
import {
  loadEventsFromFile,
  toTimeSeries,
  groupByBucket,
  pearsonR,
  lineChartSVG,
} from 'health-note';

// 1. Load encrypted (or plaintext) NIP-101h events from disk
const events = await loadEventsFromFile('weight.ndjson');

// 2. Convert to tidy daily series (kind 1351 = Weight)
const series = toTimeSeries(events);

// 3. Bucket by month and take average weight
const monthly = groupByBucket(series, { bucket: 'month', aggregate: 'avg' });

// 4. Render a quick SVG
const svg = lineChartSVG(monthly, { width: 600, height: 300 });
console.log(svg); // → <svg …/>

// 5. Correlate steps and calories
const steps = toTimeSeries(events, { metricKind: 1359 });
const calories = toTimeSeries(events, { metricKind: 2357 });
console.log('Correlation:', pearsonR(steps, calories));
```

## Currently supported

| Feature | API |
|---------|-----|
| JSON/CSV loaders | `loadEventsFrom*` |
| Event validation against JSON Schemas | `validateEvent` |
| Time-series transform | `toTimeSeries` |
| Bucket & aggregate | `groupByBucket` |
| Rolling stats | `rollingStatistic` |
| Trend & correlation | `movingAverage`, `linearRegression`, `pearsonR` |
| Anomaly detection | `rollingZScoreAnomalies` |
| SVG charts (no deps) | `lineChartSVG`, `barChartSVG` |

> NOTE This is a minimal, **MVP-grade** toolkit to unblock early adopters. More transports, metrics, and richer chart components will land in future releases. 