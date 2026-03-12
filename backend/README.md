# HisaabSay Go backend

This is a small Go REST API for the app, with:

- SQLite persistence (file DB)
- JWT Bearer auth (token returned on OTP verify)
- Per-user data (scoped by phone/user)

## Requirements

- Go 1.22+ installed

## Run

From the repo root:

```bash
cd backend
go mod tidy
go run .
```

Server runs on `:8080`.

## Environment variables

- `DB_PATH` (default: `hisaabsay.db`)
- `JWT_SECRET` (default: `dev_secret_change_me`) **change this in production**

Example:

```bash
DB_PATH="./data.db" JWT_SECRET="super-secret" go run .
```

## Auth flow

1) `POST /auth/send-otp` with `{ "phone": "+92..." }`
2) `POST /auth/verify-otp` with `{ "phone": "+92...", "otp": "123456" }`

Response:

```json
{ "token": "...", "profile": { "name": "", "phone": "+92...", "currency": "PKR", "notificationsEnabled": true } }
```

Use the token for all other endpoints:

`Authorization: Bearer <token>`

