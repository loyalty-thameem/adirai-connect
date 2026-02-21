import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPrometheusMetrics,
  getRuntimeMetricsSnapshot,
  markRequestEnd,
  markRequestStart,
  markUnhandledError,
} from './metrics.js';

test('runtime metrics collect request and error counters', async () => {
  const start = markRequestStart();
  await new Promise((resolve) => setTimeout(resolve, 2));
  markRequestEnd(200, start);
  markUnhandledError();

  const snapshot = getRuntimeMetricsSnapshot();
  assert.equal(snapshot.responsesByBucket['2xx'] >= 1, true);
  assert.equal(snapshot.unhandledErrors >= 1, true);
  assert.equal(snapshot.requestsTotal >= 1, true);
  assert.equal(snapshot.latencyMs.max > 0, true);
});

test('prometheus output includes core metrics', () => {
  const output = getPrometheusMetrics('adirai-api');
  assert.equal(output.includes('adirai_http_requests_total'), true);
  assert.equal(output.includes('adirai_http_latency_avg_ms'), true);
});
