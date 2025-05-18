import { ErrorObject } from 'ajv';
import React from 'react';

interface NostrEvent {
    id?: string;
    kind: number;
    content: string;
    tags?: Array<[string, ...string[]]>;
    created_at: number;
}
interface TimeSeriesPoint {
    date: string;
    value: number;
    source?: 'created_at' | 'timestamp_tag';
    encrypted?: boolean;
}

/**
 * Load NIP-101h events from a JSON file. The file can contain:
 *   • A single Nostr event object
 *   • An array of events
 *   • Newline-delimited JSON (each line one event)
 */
declare function loadEventsFromFile(path: string): Promise<NostrEvent[]>;

interface CSVLoaderOptions {
    delimiter?: string;
}
/**
 * Load events from a CSV file that follows the column convention:
 * id,kind,created_at,timestamp,unit,value,encrypted
 */
declare function loadEventsFromCSV(path: string, opts?: CSVLoaderOptions): Promise<NostrEvent[]>;

interface TimeSeriesOptions {
    metricKind?: number;
}
/**
 * Convert NIP-101h events into tidy time-series (long) format.
 * Currently supports **weight** (kind 1351) only.
 */
declare function toTimeSeries(events: NostrEvent[], options?: TimeSeriesOptions): TimeSeriesPoint[];

type Bucket = 'day' | 'week' | 'month';
type Aggregate = 'avg' | 'sum' | 'min' | 'max' | 'count';
interface GroupByBucketOptions {
    bucket: Bucket;
    aggregate: Aggregate;
}
interface BucketPoint extends TimeSeriesPoint {
    count: number;
    min: number;
    max: number;
}
declare function groupByBucket(series: TimeSeriesPoint[], opts: GroupByBucketOptions): BucketPoint[];

interface ValidationResult {
    valid: boolean;
    errors?: ErrorObject[] | null;
}
declare function validateEvent(ev: NostrEvent): ValidationResult;

/**
 * Compute the arithmetic mean of an array. Returns 0 for empty input.
 */
declare function mean(values: number[]): number;
/**
 * Compute the sample standard deviation. Returns 0 for <2 values.
 */
declare function std(values: number[]): number;
/**
 * Pearson correlation coefficient between two time-series.
 * Only overlapping dates are considered. Returns 0 if <2 overlap.
 */
declare function pearsonR(a: TimeSeriesPoint[], b: TimeSeriesPoint[]): number;
/**
 * Simple moving average (SMA). Window size is number of samples.
 * Returns a new series (same length as input) with undefined values until enough samples.
 */
declare function movingAverage(series: TimeSeriesPoint[], window: number): TimeSeriesPoint[];
interface RegressionResult {
    slope: number;
    intercept: number;
    r: number;
}
/**
 * Ordinary least squares linear regression on a time-series where x = incrementing index.
 * Returns slope, intercept, and r (Pearson corr). Ignores NaN values.
 */
declare function linearRegression(series: TimeSeriesPoint[]): RegressionResult;

type RollingStat = 'mean' | 'min' | 'max' | 'std';
/**
 * Generic rolling window helper – returns a new series with the statistic applied.
 * For indexes that don't have enough preceding values, `value` is NaN.
 */
declare function rollingStatistic(series: TimeSeriesPoint[], window: number, stat: RollingStat): TimeSeriesPoint[];
interface Anomaly {
    point: TimeSeriesPoint;
    zScore: number;
}
/**
 * Simple z-score based anomaly detection over a rolling window.
 * Flags a point as anomaly if |z| >= threshold.
 */
declare function rollingZScoreAnomalies(series: TimeSeriesPoint[], window: number, threshold?: number): Anomaly[];

interface ChartOptions {
    width?: number;
    height?: number;
    stroke?: string;
    fill?: string;
}
declare function lineChartSVG(series: TimeSeriesPoint[], opts?: ChartOptions): string;
declare function barChartSVG(series: TimeSeriesPoint[], opts?: ChartOptions): string;

declare function renderLineChartSecure(series: TimeSeriesPoint[], opts?: ChartOptions): Promise<string>;
declare function renderBarChartSecure(series: TimeSeriesPoint[], opts?: ChartOptions): Promise<string>;

interface LineChartProps {
    series: TimeSeriesPoint[];
    options?: ChartOptions;
    className?: string;
}
declare const LineChart: React.FC<LineChartProps>;

interface BarChartProps {
    series: TimeSeriesPoint[];
    options?: ChartOptions;
    className?: string;
}
declare const BarChart: React.FC<BarChartProps>;

declare const version = "0.0.1";

export { type Anomaly, BarChart, type ChartOptions, LineChart, type NostrEvent, type RegressionResult, type RollingStat, type TimeSeriesPoint, barChartSVG, groupByBucket, lineChartSVG, linearRegression, loadEventsFromCSV, loadEventsFromFile, mean, movingAverage, pearsonR, renderBarChartSecure, renderLineChartSecure, rollingStatistic, rollingZScoreAnomalies, std, toTimeSeries, validateEvent, version };
