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

## Health and Monitoring Hooks

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `GET /api/v1/health/metrics`

