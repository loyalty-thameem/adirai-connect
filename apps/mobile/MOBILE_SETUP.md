# Mobile Setup (Step 7 Baseline)

This folder is an Expo/React Native baseline scaffold for the Adirai Connect mobile app.

## Purpose

- Keep mobile app development isolated from web/admin.
- Consume same backend contracts (`/api/v1/auth`, `/api/v1/community`).
- Respect admin-controlled mobile config for versioning and maintenance mode.

## Current Integration (Step 8)

1. Login screen with password and OTP modes
2. Feed screen (list + create + like/comment/urgent actions)
3. Complaints screen (submit + track own complaints)
4. Settings screen with live runtime config + logout
5. Telemetry events sent to backend:
   - `session_start`
   - `session_end`
   - `screen_view`
   - `action`

## Commands (once dependencies are installed)

- `pnpm --filter @adirai/mobile dev`
- `pnpm --filter @adirai/mobile android`
