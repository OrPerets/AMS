# Sprint 3 Checks

Status: `DONE`

| Item | Status | Evidence | Notes |
|---|---|---|---|
| Start backend server and confirm health | DONE | `reports/sprint-03/evidence/health.json` | Backend started on port `3000`; `/health` returned `{"status":"ok"}` with HTTP `200`. |
| Validate login and token refresh | DONE | `reports/sprint-03/evidence/auth-login.json`, `reports/sprint-03/evidence/auth-refresh.json` | Valid logins returned access/refresh tokens with HTTP `201`. Refresh now succeeds after fixing token signing in `apps/backend/src/auth/auth.service.ts`. Invalid login still returns HTTP `401`. |
| Validate protected endpoints with Bearer token | DONE | `reports/sprint-03/evidence/api-endpoints.md` | Authenticated GET checks for `/users`, `/api/v1/tickets`, `/api/v1/work-orders`, `/api/v1/maintenance`, `/api/v1/budgets`, `/api/v1/communications`, `/api/v1/documents`, `/api/v1/notifications/user/21`, and `/api/v1/dashboard` all returned HTTP `200`. |
| Validate expected status codes (200/401/403/404/500 behavior) | DONE | `reports/sprint-03/evidence/api-endpoints.md` | Observed `200` for healthy/authenticated paths, `401` for unauthenticated `/users`, `403` for PM access to admin-only `/users`, `404` for `/api/v1/does-not-exist`, and `500` for invalid FK unit creation against a missing building. |
| Validate CRUD + constraints + transactions | DONE | `reports/sprint-03/evidence/asset-create.json`, `reports/sprint-03/evidence/asset-location.json`, `reports/sprint-03/evidence/asset-delete.json`, `reports/sprint-03/evidence/unit-invalid-building.json` | Created an asset, verified retrieval, updated location through the transactional asset-location flow, and deleted it successfully. Invalid unit creation against `buildingId=999999` confirmed DB constraint enforcement. |
| Sprint 3 exit criteria satisfied | DONE | `reports/sprint-03/evidence/health.json`, `reports/sprint-03/evidence/auth-login.json`, `reports/sprint-03/evidence/auth-refresh.json`, `reports/sprint-03/evidence/api-endpoints.md` | Core backend routes are operational and access-controlled. |
