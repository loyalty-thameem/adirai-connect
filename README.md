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
- Swagger endpoint: `/docs` (when enabled).
- Seed script file is present in `apps/api/scripts/seed.ts`.
- React Native app is planned later; API includes `deviceType`, `appVersion`, session fields for mobile readiness.
