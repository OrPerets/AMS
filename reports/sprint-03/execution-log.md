# Sprint 3 Execution Log

Status: `DONE`

## 2026-03-07

1. Read Sprint 3 requirements from `tasks.md` and confirmed the required evidence outputs under `reports/sprint-03/evidence/`.
2. Started the backend with `npm run dev:backend` and confirmed the Nest app booted successfully on `0.0.0.0:3000`.
3. Captured `/health` output in `reports/sprint-03/evidence/health.json`; response was HTTP `200` with `{"status":"ok"}`.
4. Exercised authentication flows:
   - Valid login for `master@demo.com / master123`
   - Valid login for `or.peretz@demo.com / password123`
   - Valid login for `maya@demo.com / password123`
   - Valid login for `client@demo.com / password123`
   - Invalid login for `master@demo.com / wrong-password`
5. Found a Sprint 3 blocker: `/auth/refresh` returned HTTP `401` even when using the refresh token from `/auth/login`.
6. Traced the auth defect to `apps/backend/src/auth/auth.service.ts`:
   - refresh tokens were being signed with the access-token secret
   - refresh re-login expected `user.id`, but JWT refresh payload exposes `sub`
7. Fixed `apps/backend/src/auth/auth.service.ts` so access tokens are signed with `JWT_SECRET`, refresh tokens are signed with `JWT_REFRESH_SECRET`, and token re-issuance accepts either `id` or `sub`.
8. Restarted the backend and reran the auth checks. `/auth/refresh` now returns HTTP `201` and fresh tokens.
9. Verified status-code behavior:
   - `401` on unauthenticated `GET /users`
   - `403` on PM token access to admin-only `GET /users`
   - `404` on `GET /api/v1/does-not-exist`
   - `500` on invalid `POST /api/v1/units` with nonexistent `buildingId=999999`
10. Ran an authenticated endpoint sweep and captured raw responses for:
   - `/api/v1/buildings`
   - `/users`
   - `/api/v1/tickets`
   - `/api/v1/work-orders`
   - `/api/v1/maintenance`
   - `/api/v1/budgets`
   - `/api/v1/communications`
   - `/api/v1/documents`
   - `/api/v1/notifications/user/21`
   - `/api/v1/dashboard`
11. Exercised a transactional CRUD path on assets:
   - created a temporary asset in building `1`
   - fetched it successfully
   - updated its location and confirmed `locationHistory` recorded both the initial and updated location
   - deleted the temporary asset successfully
12. Marked Sprint 3 `DONE`. Remaining note: after deletion, `GET /api/v1/assets/:id` returns HTTP `200` with an empty body instead of a `404`, which is not blocking this sprint because the checklist did not require deleted-resource semantics.
