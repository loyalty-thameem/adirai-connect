# Release Bundle (Step 24)

## Included Scope

This bundle includes backend/platform work from Step 11 through Step 23:

- observability and runtime metrics
- strict typing stabilization
- DB indexing and optional slow-query profiling
- scheduled maintenance and retention cleanup
- background queued batched writes
- idempotency for retry-safe mutations
- middleware/controller/integration/failure-mode test expansions
- changelog, migration guide, and production-readiness checklist

## Reference Documents

- `CHANGELOG_STEP11_21.md`
- `MIGRATION_STEP11_21.md`
- `PRODUCTION_READINESS.md`
- `apps/api/OBSERVABILITY.md`
- `apps/api/PERFORMANCE.md`
- `apps/api/MAINTENANCE.md`
- `apps/api/BACKGROUND_JOBS.md`
- `apps/api/IDEMPOTENCY.md`

## Environment Delta (Apply Before Deploy)

- `DB_QUERY_PROFILING_ENABLED`
- `DB_SLOW_QUERY_MS`
- `MAINTENANCE_ENABLED`
- `MAINTENANCE_INTERVAL_SEC`
- `RETENTION_AUTH_DAYS`
- `RETENTION_LOGIN_AUDIT_DAYS`
- `RETENTION_AUDIT_LOG_DAYS`
- `RETENTION_TELEMETRY_DAYS`
- `RETENTION_POST_SIGNAL_DAYS`
- `RETENTION_SECURITY_EVENT_DAYS`
- `BACKGROUND_QUEUE_ENABLED`
- `BACKGROUND_QUEUE_FLUSH_INTERVAL_MS`
- `BACKGROUND_QUEUE_BATCH_SIZE`
- `BACKGROUND_QUEUE_MAX_SIZE`
- `IDEMPOTENCY_ENABLED`
- `IDEMPOTENCY_TTL_SEC`
- `IDEMPOTENCY_MAX_ENTRIES`

## Pre-Release Verification

Run:

```bash
pnpm --filter @adirai/api typecheck
pnpm --filter @adirai/api test
```

Expected:

- typecheck passes
- test suite passes (22 tests)

## Runtime Verification After Deploy

Check:

- `GET /api/v1/health/ready`
- `GET /api/v1/health/metrics`
- `GET /api/v1/health/metrics/prometheus`

Confirm `health/metrics` contains:

- `runtime`
- `idempotency`
- `queue`
- `maintenance`

## Rollout Sequence

1. Deploy with all new env keys present.
2. Verify readiness and metrics endpoints.
3. Observe queue/idempotency/maintenance counters under normal traffic.
4. Continue canary -> full rollout.

## Fast Rollback Levers (No Code Revert)

Set and redeploy:

- `IDEMPOTENCY_ENABLED=false`
- `BACKGROUND_QUEUE_ENABLED=false`
- `MAINTENANCE_ENABLED=false`
- `DB_QUERY_PROFILING_ENABLED=false`
