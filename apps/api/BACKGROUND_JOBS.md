# Background Write Queue (Step 15)

## Purpose

Reduce request-path latency by buffering non-critical writes and flushing in batches.

Queued writes:

- request audit logs (`AuditLog`)
- auth login audit entries (`LoginAudit`)
- mobile telemetry events (`MobileTelemetry`)

## Behavior

- Bounded in-memory queues with configurable max size.
- Periodic batch flush using `insertMany`.
- Overflow protection: when full, new items are dropped and counted.
- Graceful shutdown drains pending queue items before process exit.

## Env Controls

- `BACKGROUND_QUEUE_ENABLED`
- `BACKGROUND_QUEUE_FLUSH_INTERVAL_MS`
- `BACKGROUND_QUEUE_BATCH_SIZE`
- `BACKGROUND_QUEUE_MAX_SIZE`

## Visibility

- Queue stats are included in `GET /api/v1/health/metrics` under `queue`.
