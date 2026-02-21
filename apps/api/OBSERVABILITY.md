# Observability and Reliability (Step 11)

## Runtime Instrumentation

- Global request IDs for all requests via `x-request-id` header propagation.
- In-process HTTP metrics:
  - total requests
  - in-flight requests
  - response totals by bucket and status code
  - avg/max request latency
  - unhandled error counter

## Health Endpoints

- `GET /api/v1/health/metrics` now includes runtime counters in `runtime`.
- `GET /api/v1/health/metrics/prometheus` exposes Prometheus-compatible text output.

## Error Traceability

- Error responses now include `requestId` for incident correlation.

## Graceful Shutdown

- API process handles `SIGINT` and `SIGTERM`.
- Shutdown flow:
  - stop accepting new HTTP connections
  - close MongoDB connection
  - exit cleanly
