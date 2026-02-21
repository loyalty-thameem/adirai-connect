# Auth API (Step 2)

Base URL: `http://localhost:4000/api/v1/auth`

## 1) Register

`POST /register`

```json
{
  "name": "Demo User",
  "mobile": "9000000002",
  "area": "Adirai East",
  "language": "ta",
  "password": "StrongPass#123"
}
```

## 2) OTP Login

1. `POST /otp/request`
```json
{
  "mobile": "9000000002",
  "purpose": "login"
}
```
2. `POST /otp/verify`
```json
{
  "mobile": "9000000002",
  "otp": "123456",
  "purpose": "login"
}
```

## 3) Password Login

`POST /login/password`

```json
{
  "mobile": "9000000002",
  "password": "StrongPass#123"
}
```

## 4) OAuth Login Bridge (Google/Microsoft)

`POST /login/oauth`

```json
{
  "provider": "google",
  "providerId": "google-sub-123",
  "email": "user@example.com",
  "emailVerified": true,
  "name": "OAuth User",
  "area": "Adirai",
  "language": "en"
}
```

## 5) Token Refresh

`POST /token/refresh`

```json
{
  "refreshToken": "<refresh_token>"
}
```

## 6) Logout

`POST /logout` with `Authorization: Bearer <access_token>`

```json
{
  "refreshToken": "<optional_refresh_token>"
}
```

## 7) Forgot + Reset Password

1. `POST /password/forgot`
```json
{
  "mobile": "9000000002"
}
```
2. `POST /otp/verify` with purpose `password_reset`
```json
{
  "mobile": "9000000002",
  "otp": "123456",
  "purpose": "password_reset"
}
```
3. `POST /password/reset`
```json
{
  "resetToken": "<token_from_otp_verify>",
  "newPassword": "NewStrongPass#123"
}
```

## 8) Session History

- `GET /sessions/me` (user history)
- `GET /sessions/user/:userId` (admin/moderator)
- `POST /sessions/force-logout` (admin/super_admin)

```json
{
  "userId": "<target_user_id>"
}
```

## 9) Privacy Consent

`PATCH /privacy/consent` with `Authorization: Bearer <access_token>`

```json
{
  "termsAccepted": true,
  "privacyAccepted": true,
  "dataProcessingAccepted": true,
  "marketingOptIn": false
}
```

## cURL Smoke Tests

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Demo User\",\"mobile\":\"9000000002\",\"area\":\"Adirai East\",\"language\":\"ta\",\"password\":\"StrongPass#123\"}"
```

```bash
curl -X POST http://localhost:4000/api/v1/auth/login/password \
  -H "Content-Type: application/json" \
  -H "x-device-id: web-chrome-1" \
  -H "x-device-type: web" \
  -d "{\"mobile\":\"9000000002\",\"password\":\"StrongPass#123\"}"
```
