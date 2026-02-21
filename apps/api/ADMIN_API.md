# Admin API (Step 3)

Base URL: `http://localhost:4000/api/v1/admin`

All endpoints require:
- `Authorization: Bearer <admin_access_token>`
- role: `super_admin` / `admin` / `moderator`

## Dashboard

- `GET /dashboard/analytics`
- `GET /dashboard/security`
- `GET /security/audit-logs?method=POST&statusCode=429`

`/dashboard/analytics` now includes mobile metrics:
- `mobile.dailyActiveUsers`
- `mobile.avgSessionMinutes`
- `mobile.topScreens`

## User Control

- `GET /users?q=&role=&status=&area=&page=1&pageSize=20`
- `GET /users/:userId`
- `GET /users/:userId/insights`
- `PATCH /users/:userId/status`
- `PATCH /users/:userId/verify`
- `POST /users/:userId/force-logout`
- `POST /users/:userId/reset-password`
- `DELETE /users/:userId` (soft delete)
- `DELETE /users/:userId/permanent` (admin/super_admin)

Status update example:

```json
{
  "status": "suspended",
  "suspendedUntil": "2026-03-01T10:00:00.000Z"
}
```

## Complaints

- `GET /complaints`
- `PATCH /complaints/:complaintId`

```json
{
  "status": "in_progress",
  "assignedDepartment": "Water Department",
  "note": "Field team assigned"
}
```

## Moderation

- `GET /moderation/flags`
- `POST /moderation/flags`
- `PATCH /moderation/flags/:flagId`
- `GET /moderation/settings`
- `PATCH /moderation/settings`
- `POST /moderation/keywords`

Create flag example:

```json
{
  "targetType": "post",
  "targetId": "POST_123",
  "reason": "Abusive language",
  "severity": "high",
  "aiToxicityScore": 0.91,
  "fakeNewsScore": 0.22
}
```

## Messaging

- `POST /messaging/personal`
- `POST /messaging/bulk`
- `POST /messaging/broadcast`
- `GET /messaging/campaigns`

Broadcast example:

```json
{
  "channels": ["in_app", "whatsapp"],
  "title": "Emergency Alert",
  "body": "Heavy rain expected. Stay safe.",
  "area": "Adirai East",
  "activeOnly": true,
  "verifiedOnly": false
}
```

## Groups

- `GET /groups`
- `PATCH /groups/:groupId/state`
- `DELETE /groups/:groupId`

## Mobile Config

- `GET /mobile/config`
- `PATCH /mobile/config` (admin/super_admin)

```json
{
  "minAndroidVersion": "1.0.2",
  "minIosVersion": "1.0.1",
  "maintenanceMode": false,
  "forceUpdate": false,
  "pushEnabled": true,
  "apiTimeoutMs": 12000,
  "releaseChannel": "production",
  "featureFlags": {
    "chatEnabled": true,
    "marketplaceEnabled": false,
    "pollsEnabled": true,
    "groupsEnabled": true
  }
}
```
