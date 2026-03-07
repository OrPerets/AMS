# Sprint 3 API Endpoint Evidence

## Authentication and status-code checks

| Check | Method | Path | Auth Context | HTTP | Artifact |
|---|---|---|---|---|---|
| Health | `GET` | `/health` | public | `200` | `reports/sprint-03/evidence/health.json` |
| Valid login | `POST` | `/auth/login` | `master@demo.com` | `201` | `reports/sprint-03/evidence/auth-login.json` |
| Invalid login | `POST` | `/auth/login` | bad password | `401` | `reports/sprint-03/evidence/auth-login-invalid.json` |
| Refresh token | `POST` | `/auth/refresh` | Bearer refresh token | `201` | `reports/sprint-03/evidence/auth-refresh.json` |
| Unauthenticated protected route | `GET` | `/users` | none | `401` | `reports/sprint-03/evidence/users-unauth.json` |
| Forbidden protected route | `GET` | `/users` | PM token | `403` | `reports/sprint-03/evidence/users-forbidden-pm.json` |
| Unknown route | `GET` | `/api/v1/does-not-exist` | ADMIN token | `404` | `reports/sprint-03/evidence/route-404.json` |
| Constraint failure | `POST` | `/api/v1/units` | ADMIN token | `500` | `reports/sprint-03/evidence/unit-invalid-building.json` |

## Endpoint sweep

| Endpoint | Method | Auth | HTTP | Artifact | Notes |
|---|---|---|---|---|---|
| `/api/v1/buildings` | `GET` | public | `200` | `reports/sprint-03/evidence/buildings.json` | This route is public in the current backend implementation. |
| `/users` | `GET` | ADMIN token | `200` | `reports/sprint-03/evidence/users.json` | Admin-only route. |
| `/api/v1/tickets` | `GET` | ADMIN token | `200` | `reports/sprint-03/evidence/tickets.json` | Protected route. |
| `/api/v1/work-orders` | `GET` | ADMIN token | `200` | `reports/sprint-03/evidence/work-orders.json` | Protected route. |
| `/api/v1/maintenance` | `GET` | ADMIN token | `200` | `reports/sprint-03/evidence/maintenance.json` | Protected route. |
| `/api/v1/budgets` | `GET` | ADMIN token | `200` | `reports/sprint-03/evidence/budgets.json` | Protected route. |
| `/api/v1/communications` | `GET` | ADMIN token | `200` | `reports/sprint-03/evidence/communications.json` | Protected route. |
| `/api/v1/documents` | `GET` | ADMIN token | `200` | `reports/sprint-03/evidence/documents.json` | Protected route. |
| `/api/v1/notifications/user/21` | `GET` | ADMIN token | `200` | `reports/sprint-03/evidence/notifications-user-21.json` | Protected route. |
| `/api/v1/dashboard` | `GET` | ADMIN token | `200` | `reports/sprint-03/evidence/dashboard.json` | Protected route. |

## CRUD, constraints, and transactions

| Check | Method | Path | HTTP | Artifact | Notes |
|---|---|---|---|---|---|
| Create asset | `POST` | `/api/v1/assets` | `201` | `reports/sprint-03/evidence/asset-create.json` | Temporary verification asset created in building `1`. |
| Read asset | `GET` | `/api/v1/assets/4` | `200` | `reports/sprint-03/evidence/asset-get.json` | Asset was retrievable immediately after creation. |
| Update asset location | `PATCH` | `/api/v1/assets/4/location` | `200` | `reports/sprint-03/evidence/asset-location.json` | Transaction updated the asset and inserted a location-history row. |
| Delete asset | `DELETE` | `/api/v1/assets/4` | `200` | `reports/sprint-03/evidence/asset-delete.json` | Temporary verification asset cleaned up successfully. |
| Read deleted asset | `GET` | `/api/v1/assets/4` | `200` | `reports/sprint-03/evidence/asset-post-delete.json` | Current behavior is empty `200` response instead of `404`; noted but not blocking Sprint 3. |
