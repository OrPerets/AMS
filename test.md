# Payments Testing Guide

This guide explains what variables/keys you need, where to set them, and how to run end-to-end payment flow tests (create invoice → initiate payment → confirm → receipt → refund) in this repo.

## 1) Environment variables

- Backend (`apps/backend/.env`):
  - `DATABASE_URL` — PostgreSQL connection string (required).
  - `JWT_SECRET` — JWT access secret (required for auth).
  - `JWT_REFRESH_SECRET` — JWT refresh secret (required for auth).
  - `CORS_ORIGIN` — comma-separated list of allowed origins (e.g. `http://localhost:3001`).
  - Optional integrations used elsewhere:
    - `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
    - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
    - `S3_BUCKET` (for ticket photos)

- Frontend (`apps/frontend/.env.local`):
  - `NEXT_PUBLIC_API_BASE` — base URL of backend (default used in next.config.js is `http://localhost:3000`). Set explicitly for clarity, e.g. `http://localhost:3000`.

Notes:
- Frontend uses Next.js rewrites to proxy `/api/v1/*` and `/auth/*` to `NEXT_PUBLIC_API_BASE`.
- The backend expects valid JWT secrets at startup.

## 2) Install, build, and run

From repo root:

```bash
# 1) Install deps (root, backend, frontend)
yarn install

# 2) Prepare database and generate client
cd apps/backend
cp .env.example .env  # if you have one; otherwise create .env and fill vars
# Ensure DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN are set
npm run prisma:deploy

# 3) (optional) Seed demo data
npm run prisma:seed

# 4) Start backend (http://localhost:3000)
npm run start:dev
```

In a new terminal:

```bash
cd apps/frontend
# Ensure .env.local has NEXT_PUBLIC_API_BASE=http://localhost:3000
npm run dev  # frontend at http://localhost:3001
```

## 3) Demo users (from seed)

- Master: `master@demo.com` / `master123`
- Admins: `amit.magen@demo.com`, `or.peretz@demo.com` / `password123`
- PM: `maya@demo.com` / `password123`
- Resident: `client@demo.com` / `password123`
- Tech: `tech1@demo.com`, `tech2@demo.com`, `tech3@demo.com` / `password123`

## 4) Payment flow (sandbox Tranzila stub)

The implementation uses a Tranzila sandbox-style provider with simplified behavior:
- Initiating payment creates a PaymentIntent and returns a placeholder hosted URL and/or client secret.
- Confirming marks the invoice as paid and generates a receipt PDF.
- Webhooks endpoint accepts generic payloads for local testing.

### Backend endpoints (all under `api/v1`)
- `POST /invoices` (roles: ADMIN/PM/ACCOUNTANT)
  - Body: `{ residentId: number; items: { description?: string; quantity?: number; unitPrice?: number }[]; amount?: number }`
- `GET /invoices/unpaid` (roles: ADMIN/PM/ACCOUNTANT)
- `POST /invoices/:id/pay` (role: RESIDENT)
- `POST /invoices/:id/confirm` (roles: ADMIN/PM/ACCOUNTANT)
- `GET /invoices/:id/receipt` (roles: ADMIN/PM/ACCOUNTANT/RESIDENT)
- `POST /payments/intents` Body: `{ invoiceId: number }` (roles: RESIDENT/ADMIN/PM/ACCOUNTANT)
- `POST /payments/intents/:id/confirm` (roles: RESIDENT/ADMIN/PM/ACCOUNTANT)
- `POST /payments/:id/refund` Body: `{ amount?: number }` (roles: ADMIN/PM/ACCOUNTANT)
- `POST /payments/webhook` (Public) — accepts `{ invoiceId, status: 'paid' }` for local testing

Auth endpoints:
- `POST /auth/login` { email, password }
- `POST /auth/refresh` (with Bearer refresh token)

### Frontend pages
- `http://localhost:3001/payments` — unpaid invoices list, actions to pay and view receipts.

## 5) End-to-end test scenarios

Prereq: Login in the frontend with a seeded user.
- For creating invoices: use ADMIN/PM/ACCOUNTANT.
- For paying invoices: use RESIDENT.

A) Create an invoice (as Admin/PM/Accountant)
1. Go to Payments page → Create Invoice section.
2. Enter residentId, add items (description, quantity, unitPrice).
3. Click "צור חשבונית".
4. Verify it appears under unpaid list (`GET /api/v1/invoices/unpaid`).

B) Initiate payment (as Resident)
1. Login as `client@demo.com`.
2. On Payments page, click "שלם עכשיו" for an unpaid invoice.
3. Backend creates PaymentIntent and returns a sandbox URL/clientSecret.
4. In this stubbed flow, the UI immediately shows success and opens the receipt after confirmation step below.

C) Confirm payment
- Option 1: As Accountant/Admin, call `POST /api/v1/invoices/:id/confirm`.
- Option 2: Send webhook: `POST /api/v1/payments/webhook` with `{ "invoiceId": <id>, "status": "paid" }`.
- Verify invoice status changes to PAID and a receipt is available.

D) View receipt
- Click "קבלה" in the table or open `GET /api/v1/invoices/:id/receipt`.
- Expect inline PDF.

E) Refund (Admin/PM/Accountant)
- `POST /api/v1/payments/:paymentIntentId/refund` with optional `{ amount }`.
- Confirms refund and records ledger entry; invoice set back to UNPAID when applicable.

## 6) What to provide to run tests

- Backend `.env` contents:
  - `DATABASE_URL=<your local Postgres URL>`
  - `JWT_SECRET=<dev secret>`
  - `JWT_REFRESH_SECRET=<dev refresh secret>`
  - `CORS_ORIGIN=http://localhost:3001`
  - (Optional) `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `TWILIO_*`, `S3_BUCKET`

- Frontend `.env.local`:
  - `NEXT_PUBLIC_API_BASE=http://localhost:3000`

- Confirmation of ports:
  - Backend on 3000, Frontend on 3001 (per package scripts).

- Test accounts to use (or confirm you ran `npm run prisma:seed`).

## 7) Notes and caveats

- Provider is a sandbox stub (`TranzilaProvider` / `TranzilaService`); no live keys required.
- For production integrations, you will need real provider credentials and secure webhook verification.
- If you change ports, update `NEXT_PUBLIC_API_BASE` and `CORS_ORIGIN` accordingly.
- If you see 401s in frontend, ensure login tokens exist and JWT secrets are set in backend.
