# Mobile Setup (Step 7 Baseline)

This folder is an Expo/React Native baseline scaffold for the Adirai Connect mobile app.

## Purpose

- Keep mobile app development isolated from web/admin.
- Consume same backend contracts (`/api/v1/auth`, `/api/v1/community`).
- Respect admin-controlled mobile config for versioning and maintenance mode.

## Planned Next Integration

1. OTP + OAuth login screens
2. Feed list + create post
3. Complaint tracker + emergency contacts
4. Push notifications (FCM)

## Commands (once dependencies are installed)

- `pnpm --filter @adirai/mobile dev`
- `pnpm --filter @adirai/mobile android`

