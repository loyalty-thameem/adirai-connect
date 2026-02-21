# Idempotency and Retry Safety (Step 16)

## Request Support

Mutating API requests (`POST`, `PUT`, `PATCH`, `DELETE`) now support optional idempotency via:

- request header: `x-idempotency-key`

When the same request is retried with the same key (within TTL), API returns the cached original response and sets:

- response header: `x-idempotency-replay: true`

## Behavior

- Keys are scoped by route + method + request body + caller scope.
- In-progress duplicate calls return HTTP `409`.
- Responses with `5xx` are not cached (so clients can retry).
- Missing key keeps existing behavior unchanged.

## Runtime Controls

- `IDEMPOTENCY_ENABLED`
- `IDEMPOTENCY_TTL_SEC`
- `IDEMPOTENCY_MAX_ENTRIES`

## Visibility

- Idempotency stats are included in `GET /api/v1/health/metrics` under `idempotency`.
