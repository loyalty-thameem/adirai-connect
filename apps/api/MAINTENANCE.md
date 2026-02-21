# Maintenance and Retention Jobs (Step 14)

## Scheduled Cleanup

An in-process maintenance scheduler now runs periodically and cleans stale records from:

- `OtpCode`
- `PasswordReset`
- `Session`
- `LoginAudit`
- `AuditLog`
- `MobileTelemetry`
- `PostSignal`
- resolved `SecurityEvent`

## Runtime Controls

The scheduler is controlled using env flags:

- `MAINTENANCE_ENABLED`
- `MAINTENANCE_INTERVAL_SEC`
- `RETENTION_AUTH_DAYS`
- `RETENTION_LOGIN_AUDIT_DAYS`
- `RETENTION_AUDIT_LOG_DAYS`
- `RETENTION_TELEMETRY_DAYS`
- `RETENTION_POST_SIGNAL_DAYS`
- `RETENTION_SECURITY_EVENT_DAYS`

## Visibility

- Maintenance status is included in `GET /api/v1/health/metrics` under `maintenance`.
- API logs include cleanup completion summaries and failures.
