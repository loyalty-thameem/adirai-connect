# Changelog (Step 11 -> Step 21)

## Scope

This changelog summarizes production-impacting backend changes delivered from Step 11 through Step 21.

## Step 11: Observability and Reliability

- Added request context IDs (`x-request-id`) and response correlation for errors.
- Added runtime request metrics and Prometheus metrics endpoint.
- Added graceful shutdown flow for API and database disconnect.

## Step 12: Type Safety Baseline

- Resolved strict TypeScript errors across auth/admin/community controllers.
- Normalized update patterns for nested model fields.
- Stabilized API typecheck pipeline.

## Step 13: Query Performance

- Added targeted compound Mongo indexes for high-frequency filters and sort paths.
- Added optional Mongo slow-query profiling (`DB_QUERY_PROFILING_ENABLED`, `DB_SLOW_QUERY_MS`).

## Step 14: Maintenance and Retention

- Added in-process scheduled cleanup jobs.
- Added retention policies for auth artifacts, telemetry, signals, logs, and resolved security events.
- Exposed maintenance state in health metrics.

## Step 15: Background Write Queue

- Added bounded in-memory write queue for non-critical writes:
  - audit logs
  - login audit events
  - mobile telemetry
- Added periodic batch flush and graceful drain during shutdown.
- Added queue observability in health metrics.

## Step 16: Idempotency and Retry Safety

- Added optional idempotency middleware for mutating endpoints using `x-idempotency-key`.
- Added replay support for successful duplicate requests.
- Added in-progress duplicate protection and idempotency stats in health metrics.

## Step 17: Idempotency Tests

- Added middleware-level tests for:
  - replay behavior
  - in-progress conflict behavior
  - invalid key rejection

## Step 18: API Integration Tests

- Added integration tests for:
  - health metrics endpoint shape
  - Prometheus metrics endpoint content
  - end-to-end idempotency replay flow

## Step 19: Auth Guard Integration Tests

- Added integration tests for:
  - `requireAuth` token enforcement
  - `requireRoles` role gating behavior

## Step 20: Controller Integration Tests

- Added controller-level tests with model mocks for:
  - community post creation flows
  - admin user listing pagination response

## Step 21: Failure-Mode Tests

- Added failure tests for:
  - queue overflow/drop tracking
  - queue flush failure tracking
  - idempotency cache eviction behavior
  - maintenance cleanup error propagation
