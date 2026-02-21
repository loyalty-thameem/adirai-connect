# Release Pipeline (Step 10)

## Branch and Tag Model

- `main`: integration branch with CI checks
- version tags: `vX.Y.Z` trigger release workflow and container publish

## CI Workflows

- `.github/workflows/ci.yml`
  - install
  - lint
  - typecheck
  - API tests
  - docker build smoke for api/web/admin

- `.github/workflows/release.yml`
  - runs on version tags
  - builds/pushes images to GHCR
  - validates Kubernetes manifests

## Environment Split

- Root:
  - `.env.development.example`
  - `.env.staging.example`
  - `.env.production.example`
- App-level templates exist for `api`, `web`, `admin`, `mobile`.

## Deployment Targets

- Docker compose production: `docker-compose.production.yml`
- Kubernetes manifests: `deploy/k8s/*.yaml`
- Step 11-21 changelog: `CHANGELOG_STEP11_21.md`
- Step 11-21 migration guide: `MIGRATION_STEP11_21.md`
- Step 23 production readiness checklist: `PRODUCTION_READINESS.md`
- Step 24 final release bundle: `RELEASE_BUNDLE_STEP24.md`

## Health and Monitoring Hooks

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `GET /api/v1/health/metrics`
- `GET /api/v1/health/metrics/prometheus` (Step 11)
- optional DB slow-query logs via `DB_QUERY_PROFILING_ENABLED` + `DB_SLOW_QUERY_MS` (Step 13)
- scheduled maintenance cleanup via `MAINTENANCE_*` and `RETENTION_*` envs (Step 14)
- background queued batched writes via `BACKGROUND_QUEUE_*` envs (Step 15)
- idempotent retry support via `x-idempotency-key` and `IDEMPOTENCY_*` envs (Step 16)
