# Deployment Manifests

This folder contains production deployment scaffolding:

- `docker-compose.production.yml` for containerized single-host deployment
- `deploy/k8s/*` for Kubernetes deployment

## Health Checks

- API readiness: `/api/v1/health/ready`
- API liveness: `/api/v1/health/live`
- API metrics: `/api/v1/health/metrics`

## Quick K8s Apply Order

1. `namespace.yaml`
2. `configmap.yaml`
3. `secret.example.yaml` (copy to real secret file and replace values)
4. `api-deployment.yaml`, `api-service.yaml`
5. `web-deployment.yaml`, `web-service.yaml`
6. `admin-deployment.yaml`, `admin-service.yaml`
7. `ingress.yaml`

