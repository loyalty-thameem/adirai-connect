# Hardening Notes (Step 6)

## Security Controls Added

- Global request audit logging for all mutating requests (`POST/PATCH/PUT/DELETE`).
- Route-level rate limiting:
  - `/api/v1/auth`: 80 req/min per IP+device
  - `/api/v1/admin`: 200 req/min per IP+device
  - `/api/v1/community`: 240 req/min per IP+device
- Feed anti-manipulation:
  - Unique urgent/important vote per user per post
  - Self-vote block
  - 20 urgent/important actions/hour per user
  - 60 urgent/important actions/hour per IP+device
  - Rejected attempts stored with reason

## Performance Controls Added

- Feed response cache with 30-second TTL by area.
- Cache invalidation on post creation/reaction/urgent/important mutations.

## Privacy Controls Added

- User profile stores:
  - `privacy.termsAcceptedAt`
  - `privacy.privacyAcceptedAt`
  - `privacy.dataProcessingConsentAt`
  - `privacy.marketingOptIn`
- Endpoint: `PATCH /api/v1/auth/privacy/consent`

## Audit Visibility

- Security dashboard includes latest audit entries.
- New endpoint: `GET /api/v1/admin/security/audit-logs`

## Tests Added

- `src/modules/community/feed-ranking.test.ts`
- Run with:
  - `pnpm --filter @adirai/api test`

