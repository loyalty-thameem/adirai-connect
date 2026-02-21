# Migration Guide (Step 11 -> Step 21)

## 1. Compatibility

- API routes remain backward compatible.
- New behavior is mostly additive and controlled via env flags.
- Idempotency is opt-in via request header (`x-idempotency-key`).

## 2. Required Environment Review

Compare and apply new env variables from updated templates:

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

## 3. Deployment Order

1. Deploy code with env variables set to safe defaults.
2. Validate health endpoints:
   - `/api/v1/health/ready`
   - `/api/v1/health/metrics`
   - `/api/v1/health/metrics/prometheus`
3. Enable profiling/maintenance/queue/idempotency progressively if needed.
4. Monitor runtime sections in health metrics:
   - `runtime`
   - `idempotency`
   - `queue`
   - `maintenance`

## 4. Database and Performance Notes

- New schema indexes are defined in model files and apply through normal Mongo index build behavior.
- If index build latency is a concern, deploy in low-traffic window.

## 5. Operational Rollback Strategy

- Disable new behaviors quickly by env toggles:
  - set `IDEMPOTENCY_ENABLED=false`
  - set `BACKGROUND_QUEUE_ENABLED=false`
  - set `MAINTENANCE_ENABLED=false`
  - set `DB_QUERY_PROFILING_ENABLED=false`
- Re-deploy with toggles without reverting application code.

## 6. Verification Checklist

- `pnpm --filter @adirai/api typecheck`
- `pnpm --filter @adirai/api test`
- Confirm no unexpected growth in queue drop/failure counters.
- Confirm cleanup job executes and logs summary entries.
