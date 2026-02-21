# Adirai Connect (Monorepo)

Step 1 scaffold for:
- `apps/api` (Express + TypeScript + Mongo starter)
- `apps/web` (React + TypeScript starter)
- `apps/admin` (React + TypeScript starter)
- `apps/mobile` (Expo React Native baseline)

## Quick Start

1. Copy env:
   - `cp .env.example .env` (or duplicate manually on Windows)
2. Start Mongo:
   - `docker compose up -d`
3. Install deps:
   - `pnpm install`
4. Run apps:
   - `pnpm dev:api`
   - `pnpm dev:web`
   - `pnpm dev:admin`
   - `pnpm dev:mobile`

## Notes

- Auth module includes skeleton endpoints for OTP/password and SSO onboarding.
- Step 2 auth endpoint details and samples: `apps/api/AUTH_API.md`.
- Step 3 admin endpoint details and samples: `apps/api/ADMIN_API.md`.
- Step 4 community endpoint details and samples: `apps/api/COMMUNITY_API.md`.
- Step 6 hardening notes: `apps/api/HARDENING.md`.
- Step 7/8/9 mobile setup and session hardening notes: `apps/mobile/MOBILE_SETUP.md`.
- Step 10 release/deploy pipeline notes: `RELEASE.md`.
- Step 11-21 changelog: `CHANGELOG_STEP11_21.md`.
- Step 11-21 migration guide: `MIGRATION_STEP11_21.md`.
- Step 23 production readiness checklist: `PRODUCTION_READINESS.md`.
- Step 24 final release bundle: `RELEASE_BUNDLE_STEP24.md`.
- Step 11 observability/reliability notes: `apps/api/OBSERVABILITY.md`.
- Step 13 performance/indexing/profiling notes: `apps/api/PERFORMANCE.md`.
- Step 14 maintenance/retention jobs notes: `apps/api/MAINTENANCE.md`.
- Step 15 background write queue notes: `apps/api/BACKGROUND_JOBS.md`.
- Step 16 idempotency/retry safety notes: `apps/api/IDEMPOTENCY.md`.
- Step 18 integration tests: `apps/api/src/integration/api.integration.test.ts`.
- Step 19 auth guard integration tests: `apps/api/src/integration/auth-guard.integration.test.ts`.
- Step 20 controller integration tests: `apps/api/src/integration/controllers.integration.test.ts`.
- Step 21 failure-mode integration tests: `apps/api/src/integration/failure-modes.integration.test.ts`.
- Swagger endpoint: `/docs` (when enabled).
- Seed script file is present in `apps/api/scripts/seed.ts`.
- React Native app is planned later; API includes `deviceType`, `appVersion`, session fields for mobile readiness.
