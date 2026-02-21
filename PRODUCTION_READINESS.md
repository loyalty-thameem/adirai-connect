# Production Readiness Checklist (Step 23)

## Security

- [ ] Verify strong secrets for:
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
- [ ] Confirm `SWAGGER_ENABLED=false` in production.
- [ ] Confirm production CORS origins are restricted to trusted domains.
- [ ] Confirm idempotency, queue, and maintenance toggles are explicitly set in production env.
- [ ] Validate admin role assignment and least-privilege access controls.

## Reliability

- [ ] Confirm graceful shutdown works during rolling deploy.
- [ ] Confirm maintenance jobs run and report status in `/api/v1/health/metrics`.
- [ ] Confirm background queue drains on shutdown and does not accumulate drops/failures.
- [ ] Confirm idempotency replay behavior on client retries.

## Performance

- [ ] Ensure new indexes are created and available in MongoDB.
- [ ] Monitor API latency after enabling background queue/idempotency.
- [ ] Enable slow query profiling only when needed.
- [ ] Tune:
  - `DB_SLOW_QUERY_MS`
  - `BACKGROUND_QUEUE_BATCH_SIZE`
  - `BACKGROUND_QUEUE_MAX_SIZE`

## SLO and Alerting

- [ ] Define service SLO targets:
  - availability target
  - p95/p99 latency targets
  - error-rate threshold
- [ ] Create alerts for:
  - readiness failures (`/health/ready`)
  - high 5xx rate
  - idempotency conflict spike
  - queue drops/failures increase
  - maintenance failures
  - DB slow-query spikes

## Observability

- [ ] Confirm `GET /api/v1/health/metrics` includes:
  - `runtime`
  - `idempotency`
  - `queue`
  - `maintenance`
- [ ] Confirm Prometheus scrape on `/api/v1/health/metrics/prometheus`.
- [ ] Confirm log retention and searchable request correlation via `x-request-id`.

## Release Execution

- [ ] Run before release:
  - `pnpm --filter @adirai/api typecheck`
  - `pnpm --filter @adirai/api test`
- [ ] Tag release only after checks and rollout plan sign-off.
- [ ] Perform canary/staged rollout and validate health + metrics before full traffic.
