# Performance and Query Profiling (Step 13)

## Database Indexing

Compound indexes were added for high-frequency API filters and sorts:

- Feed and post ranking queries (`Post`).
- Urgent/important anti-manipulation checks (`PostSignal`).
- Session history and active-session queries (`Session`).
- Login and security audit analytics (`LoginAudit`, `AuditLog`).
- Complaint listing and user complaint history (`Complaint`).
- Mobile telemetry analytics windows (`MobileTelemetry`).
- Suggestions and active-user sorting (`User`).

## Slow Query Profiling

Optional Mongo command profiling is available through env flags:

- `DB_QUERY_PROFILING_ENABLED` (`true`/`false`)
- `DB_SLOW_QUERY_MS` (threshold in milliseconds)

When enabled, slow commands are logged in API output as:

- `[db][slow] command=<name> durationMs=<ms> db=<database>`
