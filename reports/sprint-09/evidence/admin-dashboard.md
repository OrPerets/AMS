# Sprint 9 Admin Dashboard Evidence

- Date: 2026-03-07
- Scope: `/admin/dashboard`, `/admin/overview`, admin-only authorization, user-management visibility

## Commands

```bash
npm --workspace apps/backend run build
npm --workspace apps/frontend run build
npm run dev:backend
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"master@demo.com","password":"master123"}'
curl -X POST http://localhost:3000/admin/impersonate \
  -H "Authorization: Bearer MASTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"ADMIN","tenantId":1,"reason":"Sprint 9 smoke test"}'
curl http://localhost:3000/admin/overview -H "Authorization: Bearer ADMIN_TOKEN"
```

## Results

- Backend build passed after adding `/admin/overview`.
- Frontend build passed with `/admin/dashboard` in the static route list.
- `MASTER` login remained restricted from admin-only actions until impersonated to `ADMIN`, confirming role boundaries.
- `GET /admin/overview` returned live data:
  - `stats.totalUsers = 9`
  - `stats.totalBuildings = 78`
  - `stats.openTickets = 2`
  - `stats.unpaidInvoices = 1`
  - `stats.activeTechs = 3`
- `roleCounts` returned populated counts for `ADMIN`, `PM`, `TECH`, `RESIDENT`, `ACCOUNTANT`, `MASTER`.
- Navigation shortcuts returned `/admin/notifications`, `/admin/unpaid-invoices`, `/settings`.

## Implementation Notes

- Replaced mock-heavy admin dashboard behavior with a single overview payload from the backend.
- Added recent user summaries, health indicators, role distribution, and impersonation-event feed.
- Added quick role-switch actions on the dashboard using the existing impersonation flow.

## Fixes Captured During Verification

- Fixed `GET /api/v1/invoices/unpaid` hanging because the controller mixed `@Res()` with a normal return path. The endpoint now uses `@Res({ passthrough: true })` and returns JSON correctly for non-CSV requests.

## Re-Verification On 2026-03-08

- Re-ran the dashboard smoke test against the live AMS stack on `http://localhost:3002` with the frontend on `http://localhost:3001` because port `3000` was occupied by an unrelated local app.
- `GET /admin/overview` returned `200` for `ADMIN` and `403` for `RESIDENT`, confirming admin-only access still holds.
- Current live overview snapshot returned:
  - `stats.totalUsers = 9`
  - `stats.totalBuildings = 78`
  - `stats.openTickets = 6`
  - `stats.unpaidInvoices = 1`
  - `stats.activeTechs = 3`
- `GET /api/v1/dashboard/overview` returned `200` with populated building filters, KPI cards, collections summary, maintenance summary, and recent notifications used by `/admin/dashboard`.
- Frontend route checks returned `200` for `/admin/dashboard` and the page compiled successfully in Next dev without runtime build errors.
