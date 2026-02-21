type StatusBucket = '1xx' | '2xx' | '3xx' | '4xx' | '5xx';

type RuntimeMetricsState = {
  startedAt: number;
  requestsTotal: number;
  inFlight: number;
  responsesByBucket: Record<StatusBucket, number>;
  responsesByCode: Record<string, number>;
  unhandledErrors: number;
  totalDurationMs: number;
  maxDurationMs: number;
};

const runtimeMetricsState: RuntimeMetricsState = {
  startedAt: Date.now(),
  requestsTotal: 0,
  inFlight: 0,
  responsesByBucket: {
    '1xx': 0,
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0,
  },
  responsesByCode: {},
  unhandledErrors: 0,
  totalDurationMs: 0,
  maxDurationMs: 0,
};

function toBucket(statusCode: number): StatusBucket {
  if (statusCode < 200) return '1xx';
  if (statusCode < 300) return '2xx';
  if (statusCode < 400) return '3xx';
  if (statusCode < 500) return '4xx';
  return '5xx';
}

export function markRequestStart(): bigint {
  runtimeMetricsState.requestsTotal += 1;
  runtimeMetricsState.inFlight += 1;
  return process.hrtime.bigint();
}

export function markRequestEnd(statusCode: number, startedAtNs: bigint): number {
  const elapsedNs = process.hrtime.bigint() - startedAtNs;
  const durationMs = Number(elapsedNs) / 1_000_000;
  runtimeMetricsState.inFlight = Math.max(0, runtimeMetricsState.inFlight - 1);
  runtimeMetricsState.responsesByBucket[toBucket(statusCode)] += 1;
  runtimeMetricsState.responsesByCode[String(statusCode)] =
    (runtimeMetricsState.responsesByCode[String(statusCode)] ?? 0) + 1;
  runtimeMetricsState.totalDurationMs += durationMs;
  runtimeMetricsState.maxDurationMs = Math.max(runtimeMetricsState.maxDurationMs, durationMs);
  return durationMs;
}

export function markUnhandledError(): void {
  runtimeMetricsState.unhandledErrors += 1;
}

export function getRuntimeMetricsSnapshot(): {
  startedAt: string;
  uptimeSec: number;
  requestsTotal: number;
  inFlight: number;
  unhandledErrors: number;
  responsesByBucket: Record<StatusBucket, number>;
  responsesByCode: Record<string, number>;
  latencyMs: {
    avg: number;
    max: number;
  };
} {
  const avgLatency =
    runtimeMetricsState.requestsTotal > 0
      ? runtimeMetricsState.totalDurationMs / runtimeMetricsState.requestsTotal
      : 0;

  return {
    startedAt: new Date(runtimeMetricsState.startedAt).toISOString(),
    uptimeSec: Math.round((Date.now() - runtimeMetricsState.startedAt) / 1000),
    requestsTotal: runtimeMetricsState.requestsTotal,
    inFlight: runtimeMetricsState.inFlight,
    unhandledErrors: runtimeMetricsState.unhandledErrors,
    responsesByBucket: { ...runtimeMetricsState.responsesByBucket },
    responsesByCode: { ...runtimeMetricsState.responsesByCode },
    latencyMs: {
      avg: Number(avgLatency.toFixed(3)),
      max: Number(runtimeMetricsState.maxDurationMs.toFixed(3)),
    },
  };
}

export function getPrometheusMetrics(serviceName: string): string {
  const snapshot = getRuntimeMetricsSnapshot();
  const lines = [
    '# HELP adirai_uptime_seconds Process uptime in seconds',
    '# TYPE adirai_uptime_seconds gauge',
    `adirai_uptime_seconds{service="${serviceName}"} ${snapshot.uptimeSec}`,
    '# HELP adirai_http_requests_total Total HTTP requests',
    '# TYPE adirai_http_requests_total counter',
    `adirai_http_requests_total{service="${serviceName}"} ${snapshot.requestsTotal}`,
    '# HELP adirai_http_requests_in_flight Current in-flight requests',
    '# TYPE adirai_http_requests_in_flight gauge',
    `adirai_http_requests_in_flight{service="${serviceName}"} ${snapshot.inFlight}`,
    '# HELP adirai_http_unhandled_errors_total Unhandled application errors',
    '# TYPE adirai_http_unhandled_errors_total counter',
    `adirai_http_unhandled_errors_total{service="${serviceName}"} ${snapshot.unhandledErrors}`,
    '# HELP adirai_http_latency_avg_ms Average HTTP request latency in ms',
    '# TYPE adirai_http_latency_avg_ms gauge',
    `adirai_http_latency_avg_ms{service="${serviceName}"} ${snapshot.latencyMs.avg}`,
    '# HELP adirai_http_latency_max_ms Max HTTP request latency in ms',
    '# TYPE adirai_http_latency_max_ms gauge',
    `adirai_http_latency_max_ms{service="${serviceName}"} ${snapshot.latencyMs.max}`,
  ];

  for (const [bucket, total] of Object.entries(snapshot.responsesByBucket)) {
    lines.push(
      '# HELP adirai_http_responses_bucket_total Responses by status bucket',
      '# TYPE adirai_http_responses_bucket_total counter',
      `adirai_http_responses_bucket_total{service="${serviceName}",bucket="${bucket}"} ${total}`,
    );
  }

  for (const [status, total] of Object.entries(snapshot.responsesByCode)) {
    lines.push(
      '# HELP adirai_http_responses_status_total Responses by status code',
      '# TYPE adirai_http_responses_status_total counter',
      `adirai_http_responses_status_total{service="${serviceName}",status="${status}"} ${total}`,
    );
  }

  return lines.join('\n');
}
