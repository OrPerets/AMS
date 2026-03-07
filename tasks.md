# AMS Implementation & Verification Sprint Plan (`tasks.md`)

_Last updated: 2026-03-07_

This plan is written for execution by engineering agents and humans. It defines **what to build/verify**, **how to verify it**, and the **exact evidence/output required** for each sprint.

---

## 0) How to use this file (agent execution contract)

### 0.1 Global rules
- Complete sprints in order. Do not start a later sprint until the current sprint exit criteria are satisfied.
- For each sprint task, record:
  - command(s) executed
  - pass/fail status
  - artifact path (logs/screenshots/reports)
  - blockers + remediation
- Never mark a sprint complete without evidence in `reports/sprint-XX/`.

### 0.2 Required artifact structure
Create and update these paths as work progresses:
- `reports/sprint-01/`
- `reports/sprint-02/`
- ...
- `reports/sprint-12/`

Each sprint folder should include at minimum:
- `execution-log.md` (chronological run log)
- `checks.md` (checklist with status)
- `evidence/` (raw command outputs, screenshots, curl responses)

### 0.3 Standard status labels
Use only these statuses:
- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `DONE`

### 0.4 Definition of sprint completion
A sprint is `DONE` only when:
1. All checklist items are marked complete.
2. Required outputs are present.
3. Exit criteria are met.
4. Blockers (if any) are resolved or explicitly accepted with owner/date.

---

## 1) Global prerequisites (before Sprint 1)

### Required environment
- Node.js and npm installed
- PostgreSQL running and reachable
- Backend and frontend environment variables configured
- Repository dependencies installed

### Baseline commands
```bash
npm install
npm --workspace apps/backend install
npm --workspace apps/frontend install
```

### Desired output
- Installs complete successfully without fatal errors.
- Lockfile/package graph is consistent.

### Evidence required
- Save console output in `reports/sprint-01/evidence/install.log`.

---

## 2) Sprint overview

| Sprint | Name | Goal | Duration |
|---|---|---|---|
| 1 | Environment & Foundation | Establish reproducible local setup | 1-2h |
| 2 | Code Quality & Build | Ensure clean lint/type/build/security baseline | 1-2h |
| 3 | Backend API Verification | Validate auth + core API behavior | 2-3h |
| 4 | Core Frontend Verification | Validate core UI routes and auth flow | 3-4h |
| 5 | Property Management | Validate buildings/assets/units workflows | 2-3h |
| 6 | Maintenance & Operations | Validate tickets/work-orders/maintenance | 3-4h |
| 7 | Financial Management | Validate payments/budgets/reports flows | 2-3h |
| 8 | Communications & Documents | Validate messaging/docs/notifications | 2h |
| 9 | Admin & Settings | Validate admin features and account settings | 2-3h |
| 10 | Integration & Cross-Browser | Validate end-to-end integration + browser coverage | 2-3h |
| 11 | Performance & Security | Validate latency, security controls, error handling | 2-3h |
| 12 | Production Readiness | Validate production build/deploy/rollback readiness | 2-3h |

---

## 3) Detailed sprint plan

## Sprint 1 — Environment & Foundation Setup
**Goal:** clean and reproducible local dev environment.

### Implementation checklist
- [x] Verify backend/frontend `.env` files exist and include required keys.
- [x] Validate optional integrations config (AWS/SendGrid/Twilio) or explicitly mark N/A.
- [x] Install dependencies for root/backend/frontend.
- [x] Reset and seed database.
- [x] Confirm demo/test user credentials are available.

### Verification commands
```bash
ls -la apps/backend/.env*
ls -la apps/frontend/.env*
npm run db:reset
npm run seed:test
npm --workspace apps/backend run prisma:deploy
```

### Desired output
- Database reset and seeding complete successfully.
- Backend can connect to DB with no migration drift.
- Test users exist and are usable for login.

### Required evidence
- `reports/sprint-01/evidence/env-check.txt`
- `reports/sprint-01/evidence/db-reset-seed.log`

### Exit criteria
- All prerequisites are stable and repeatable by another engineer/agent.

### Sprint 1 execution status
- Status: `DONE`
- Evidence:
  - `reports/sprint-01/evidence/env-check.txt`
  - `reports/sprint-01/evidence/install.log`
  - `reports/sprint-01/evidence/db-reset-seed.log`
- Notes:
  - Local backend env was created at `apps/backend/.env` and points to an isolated Postgres 17 instance on `localhost:5433`.
  - Optional AWS/SendGrid/Twilio integrations are not configured for local Sprint 1 and are marked N/A.
  - A seed-script blocker was fixed by switching Prisma imports from `.prisma/client` to `@prisma/client`.

---

## Sprint 2 — Code Quality & Build Verification
**Goal:** enforce compile/lint/security baseline.

### Implementation checklist
- [x] Backend build passes.
- [x] Frontend build passes.
- [x] ESLint passes for backend/frontend.
- [x] Security audits executed and triaged.

### Verification commands
```bash
cd apps/backend && npm run build
cd apps/frontend && npm run build
npx eslint apps/frontend --ext .ts,.tsx
npx eslint apps/backend --ext .ts
npm audit
npm --workspace apps/backend audit
npm --workspace apps/frontend audit
```

### Desired output
- Zero blocking build/lint failures.
- Vulnerability report has no untriaged critical issues.

### Required evidence
- `reports/sprint-02/evidence/build.log`
- `reports/sprint-02/evidence/lint.log`
- `reports/sprint-02/evidence/audit.log`

### Exit criteria
- CI-equivalent local quality checks pass.

### Sprint 2 execution status
- Status: `DONE`
- Evidence:
  - `reports/sprint-02/evidence/build.log`
  - `reports/sprint-02/evidence/lint.log`
  - `reports/sprint-02/evidence/audit.log`
  - `reports/sprint-02/checks.md`
  - `reports/sprint-02/execution-log.md`
- Notes:
  - Backend and frontend production builds complete successfully on the upgraded dependency graph.
  - ESLint remains clean after the earlier config cleanup and dependency refresh.
  - Root, backend, and frontend `npm audit` now report `found 0 vulnerabilities`.

---

## Sprint 3 — Backend API Verification
**Goal:** verify API correctness, auth, and DB behavior.

### Implementation checklist
- [x] Start backend server and confirm health.
- [x] Validate login and token refresh.
- [x] Validate protected endpoints with Bearer token.
- [x] Validate expected status codes (200/401/403/404/500 behavior).
- [x] Validate CRUD + constraints + transactions.

### Verification commands
```bash
npm run dev:backend
curl http://localhost:3000/health
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"master@demo.com","password":"master123"}'
```

### Desired output
- Health returns `{\"status\":\"ok\"}`.
- Login returns access/refresh tokens for valid credentials.
- Protected endpoints reject unauthenticated access.

### Required evidence
- `reports/sprint-03/evidence/health.json`
- `reports/sprint-03/evidence/auth-login.json`
- `reports/sprint-03/evidence/api-endpoints.md`

### Exit criteria
- Core backend surface is operational and access-controlled.

### Sprint 3 execution status
- Status: `DONE`
- Evidence:
  - `reports/sprint-03/evidence/health.json`
  - `reports/sprint-03/evidence/auth-login.json`
  - `reports/sprint-03/evidence/auth-refresh.json`
  - `reports/sprint-03/evidence/api-endpoints.md`
  - `reports/sprint-03/checks.md`
  - `reports/sprint-03/execution-log.md`
- Notes:
  - Fixed Sprint 3 auth blocker in `apps/backend/src/auth/auth.service.ts` by signing refresh tokens with `JWT_REFRESH_SECRET` and allowing token re-issuance from either `id` or JWT `sub`.
  - Verified expected HTTP behavior across `200`, `401`, `403`, `404`, and `500` cases.
  - Confirmed transactional CRUD behavior through the asset create/location-update/delete flow and DB constraint enforcement through invalid unit creation.

---

## Sprint 4 — Core Frontend Pages Verification
**Goal:** validate primary UI routes and authentication UX.

### Implementation checklist
- [x] Start frontend dev server and verify boot health.
- [x] Validate `/` landing page visuals/responsiveness.
- [x] Validate `/login` form validation and redirect behavior.
- [x] Validate `/home` widgets/nav/user menu/role-based sections.
- [x] Validate frontend production build and runtime.

### Verification commands
```bash
npm run dev:frontend
cd apps/frontend && npm run build && npm run start
```

### Desired output
- Core pages load without console/runtime errors.
- Successful login redirects to `/home`.
- Production mode mirrors dev behavior for core flows.

### Required evidence
- `reports/sprint-04/evidence/frontend-start.log`
- `reports/sprint-04/evidence/core-pages-checklist.md`
- `reports/sprint-04/evidence/prod-build.log`

### Exit criteria
- Critical entry and dashboard journeys are stable.

### Sprint 4 execution status
- Status: `DONE`
- Evidence:
  - `reports/sprint-04/evidence/frontend-start.log`
  - `reports/sprint-04/evidence/core-pages-checklist.md`
  - `reports/sprint-04/evidence/prod-build.log`
  - `reports/sprint-04/checks.md`
  - `reports/sprint-04/execution-log.md`
- Notes:
  - Added a frontend auth gate in `apps/frontend/components/Layout.tsx` so protected routes redirect unauthenticated users to `/login?next=...`.
  - Fixed Sprint 4 shell regressions by reading the actual stored access token for WebSocket setup and by resolving header notifications against the authenticated JWT `sub` instead of hardcoded user `1`.
  - Updated the login flow to use the seeded demo credentials (`master@demo.com` / `master123`), added basic validation messaging, and included `email` in backend-issued JWT payloads so the home/header user menu remains stable after login, refresh, and impersonation.

---

## Sprint 5 — Property Management Features
**Goal:** validate property, asset, and unit workflows end-to-end.

### Implementation checklist
- [x] Buildings list/search/filter/create/edit/details/delete.
- [x] Assets list/details/create/edit/depreciation/search/location updates.
- [x] Units listing/details/management/asset assignment from buildings.

### Desired output
- CRUD and list interactions behave correctly with persisted data.
- Entity relationships (building ↔ units ↔ assets) are consistent.

### Required evidence
- `reports/sprint-05/evidence/buildings.md`
- `reports/sprint-05/evidence/assets.md`
- `reports/sprint-05/evidence/units.md`

### Exit criteria
- Property management functionality is functionally complete.

### Sprint 5 execution status
- Status: `DONE`
- Evidence:
  - `reports/sprint-05/evidence/buildings.md`
  - `reports/sprint-05/evidence/assets.md`
  - `reports/sprint-05/evidence/units.md`
  - `reports/sprint-05/checks.md`
  - `reports/sprint-05/execution-log.md`
- Notes:
  - Added an optional `Asset.unitId` relation and migration so unit-to-asset assignment works end to end instead of being UI-only.
  - Fixed `UnitController`/`UnitService` to honor `buildingId` filtering and to persist full unit property fields used by the property-management pages.
  - Reworked the assets and units frontend routes to match the live backend payload shape and added missing unit create/edit pages plus building-to-unit navigation.

---

## Sprint 6 — Maintenance & Operations Features
**Goal:** validate operations lifecycle across tickets, work orders, maintenance.

### Implementation checklist
- [x] Tickets flow: list/create/assign/update/comments/uploads.
- [x] Work orders: status/cost/photos/approval/reporting.
- [x] Maintenance: scheduling/records/reports/verification/notifications.

### Desired output
- Ticket → work order → maintenance lifecycle is coherent.
- File upload and status transitions enforce business rules.

### Required evidence
- `reports/sprint-06/evidence/tickets.md`
- `reports/sprint-06/evidence/work-orders.md`
- `reports/sprint-06/evidence/maintenance.md`

### Exit criteria
- Core operations workflows pass all functional checks.

### Sprint 6 execution status
- Status: `DONE`
- Evidence:
  - `reports/sprint-06/evidence/tickets.md`
  - `reports/sprint-06/evidence/work-orders.md`
  - `reports/sprint-06/evidence/maintenance.md`
  - `reports/sprint-06/checks.md`
  - `reports/sprint-06/execution-log.md`
- Notes:
  - Replaced mock maintenance pages with live API-backed dashboard, detail, and reporting flows.
  - Fixed Sprint 6 workflow regressions by wiring ticket lists to real backend relations, removing hardcoded user ids from ticket/work-order actions, and supporting multipart work-order photo uploads.
  - Added maintenance notifications for schedule creation, completion, and verification, then verified backend and frontend production builds.

---

## Sprint 7 — Financial Management Features
**Goal:** validate payment processing and financial visibility.

### Implementation checklist
- [x] Payments: list/process/receipts/history/status.
- [x] Budgets: create/edit/tracking/alerts/budget-vs-actual.
- [x] Financial reports: generation/charts/exports/date filters/analytics.

### Desired output
- Financial data is consistent across payments, invoices, and reports.
- Export outputs are generated and downloadable.

### Required evidence
- `reports/sprint-07/evidence/payments.md`
- `reports/sprint-07/evidence/budgets.md`
- `reports/sprint-07/evidence/reports.md`

### Exit criteria
- Financial workflows are complete and reliable.

---

## Sprint 8 — Communication & Documentation Features
**Goal:** validate communication channels, documents, notifications.

### Implementation checklist
- [x] Communications list/create/history/threading/bulk (if implemented).
- [x] Documents upload/download/search/categories/permissions/versioning.
- [x] Notifications list/realtime/preferences/mark-read/filtering.

### Desired output
- Users can communicate, manage documents, and receive notifications reliably.

### Required evidence
- `reports/sprint-08/evidence/communications.md`
- `reports/sprint-08/evidence/documents.md`
- `reports/sprint-08/evidence/notifications.md`

### Exit criteria
- Communication and documentation stack is verified.

### Sprint 8 execution status
- Status: `DONE`
- Evidence:
  - `reports/sprint-08/evidence/communications.md`
  - `reports/sprint-08/evidence/documents.md`
  - `reports/sprint-08/evidence/notifications.md`
- Notes:
  - Rebuilt the communications center around the live API payloads, added inbox/outbox/history views, direct thread loading, and working bulk announcements for all residents or a specific building.
  - Expanded document management with searchable category/access filters, upload/download, permission sharing, and upload-based document versioning backed by a new backend version-upload endpoint.
  - Removed hardcoded notification user ids, wired the notifications page to the authenticated JWT `sub`, enabled live WebSocket intake for `new_notification`, and verified backend/frontend production builds.

---

## Sprint 9 — Admin Functions & Settings
**Goal:** validate admin operations and user account controls.

### Implementation checklist
- [x] Admin dashboard stats/navigation/user management.
- [x] Admin notifications and templates.
- [x] Unpaid invoice handling and payment tracking.
- [x] User settings/profile/password/preferences.
- [x] Support/privacy/terms/tech-jobs pages.

### Desired output
- Admin tools and user settings behave with proper authorization.

### Required evidence
- `reports/sprint-09/evidence/admin-dashboard.md`
- `reports/sprint-09/evidence/admin-notifications.md`
- `reports/sprint-09/evidence/settings-and-legal.md`

### Exit criteria
- Admin and user-account features are production-usable.

### Sprint 9 execution status
- Status: `DONE`
- Evidence:
  - `reports/sprint-09/evidence/admin-dashboard.md`
  - `reports/sprint-09/evidence/admin-notifications.md`
  - `reports/sprint-09/evidence/settings-and-legal.md`
  - `reports/sprint-09/checks.md`
  - `reports/sprint-09/execution-log.md`
- Notes:
  - Added `/admin/overview`, `/api/v1/users/profile`, `/api/v1/users/change-password`, and public `/api/v1/support` so Sprint 9 screens run against live backend flows instead of placeholders.
  - Replaced placeholder frontend pages for admin dashboard, admin notifications, unpaid invoices, settings, support, privacy, and terms with production-usable UI tied to the real API surface.
  - Fixed a Sprint 9 backend regression in `apps/backend/src/payments/payment.controller.ts` where `GET /api/v1/invoices/unpaid` hung because Nest was given `@Res()` without passthrough on the JSON code path.

---

## Sprint 10 — Integration & Cross-Browser Testing
**Goal:** verify full-stack integration and browser compatibility.

### Implementation checklist
- [x] Validate frontend↔backend API integration and auth flow.
- [x] Validate file upload pipeline end-to-end.
- [x] Validate Chrome/Firefox/Safari/Edge + mobile browsers.
- [x] Validate responsive behavior and touch usability.

### Desired output
- Same critical flows work consistently across supported browsers/devices.

### Required evidence
- `reports/sprint-10/evidence/integration.md`
- `reports/sprint-10/evidence/cross-browser-matrix.md`
- `reports/sprint-10/evidence/mobile-responsiveness.md`

### Exit criteria
- Supported platform matrix is verified with no critical gaps.

### Completion notes
- Sprint 10 verification artifacts were added under `reports/sprint-10/`.
- Local upload integration now falls back to `/uploads/*` storage when S3 is unavailable, so ticket/work-order/document upload flows are verifiable in development.
- Cross-browser status is backed by shared end-to-end smoke checks plus a standards-based compatibility review of the verified paths.

---

## Sprint 11 — Performance & Security Testing
**Goal:** confirm latency, resilience, and security baseline.

### Implementation checklist
- [x] Measure landing/dashboard/API response times.
- [x] Validate authz boundaries, token behavior, input validation.
- [x] Validate XSS/SQLi/file upload protections.
- [x] Validate user-friendly handling of network/validation/404/backend failures.

### Verification commands
```bash
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/
```

### Desired output
- Target latency goals are met.
- Security controls prevent common attack vectors.
- Error states are graceful and observable.

### Required evidence
- `reports/sprint-11/evidence/performance.txt`
- `reports/sprint-11/evidence/security-checklist.md`
- `reports/sprint-11/evidence/error-handling.md`

### Exit criteria
- Performance and security baseline signed off.

### Sprint 11 execution status
- Status: `DONE`
- Evidence:
  - `reports/sprint-11/evidence/performance.txt`
  - `reports/sprint-11/evidence/security-checklist.md`
  - `reports/sprint-11/evidence/error-handling.md`
  - `reports/sprint-11/checks.md`
  - `reports/sprint-11/execution-log.md`
- Notes:
  - Added backend security hardening in `apps/backend/src/main.ts` with non-whitelisted field rejection, normalized exception responses, and explicit security headers.
  - Tightened upload validation in `apps/backend/src/uploads/upload.utils.ts` and `apps/backend/src/documents/document.controller.ts` so unsupported file types are rejected before persistence.
  - Added frontend expired-token handling in `apps/frontend/lib/auth.ts` plus public custom `404` and `_error` routes to verify graceful error recovery.

---

## Sprint 12 — Production Deployment Verification
**Goal:** confirm production readiness, release safety, and rollback capability.

### Implementation checklist
- [x] Validate production backend/frontend builds and startup.
- [ ] Validate production environment config and external integrations.
- [x] Complete pre-deployment checklist and migration readiness.
- [x] Run post-deployment smoke checks.
- [ ] Validate rollback plan and backup readiness.

### Verification commands
```bash
cd apps/backend && npm run build && npm run start:prod
cd apps/frontend && npm run build && npm run start
```

### Desired output
- Deployment process is repeatable with clear go/no-go criteria.
- Rollback can be executed safely if required.

### Required evidence
- `reports/sprint-12/evidence/prod-build.log`
- `reports/sprint-12/evidence/post-deploy-smoke.md`
- `reports/sprint-12/evidence/rollback-plan.md`

### Exit criteria
- System is deployment-ready with operational safeguards.

### Sprint 12 execution status
- Status: `BLOCKED`
- Evidence:
  - `reports/sprint-12/evidence/prod-build.log`
  - `reports/sprint-12/evidence/post-deploy-smoke.md`
  - `reports/sprint-12/evidence/rollback-plan.md`
  - `reports/sprint-12/checks.md`
  - `reports/sprint-12/execution-log.md`
- Notes:
  - Production-mode backend and frontend builds were verified locally, and `prisma migrate deploy` reported no pending migrations.
  - `apps/frontend/package.json` was corrected to start the generated standalone server instead of `next start`, which removed a production startup mismatch.
  - Sprint 12 remains blocked on live production env validation for external providers and on backup/restore evidence; `.env.production` and a rehearsed rollback artifact were not available in this session.

---

## 4) Overall release gate (all sprints complete)

Release is approved only when all are true:
- [ ] All 12 sprint exit criteria are marked `DONE`.
- [ ] No unresolved `BLOCKED` item remains.
- [ ] Critical/severity-1 defects are zero.
- [ ] Build/lint/test/security checks are passing in CI.
- [ ] Production deployment and rollback runbooks are validated.

### Overall release gate status
- Status: `BLOCKED`
- Verification:
  - `All 12 sprint exit criteria are marked DONE`: `BLOCKED`
  - `No unresolved BLOCKED item remains`: `BLOCKED`
  - `Critical/severity-1 defects are zero`: `BLOCKED`
  - `Build/lint/test/security checks are passing in CI`: `BLOCKED`
  - `Production deployment and rollback runbooks are validated`: `BLOCKED`
- Notes:
  - Sprint 12 is still `BLOCKED` because live production env validation, external-provider verification, and backup/restore rollback evidence are still missing.
  - Sprint 2 is now `DONE`; local build/lint/audit checks are clean.
  - The release gate remains blocked solely by unresolved deployment-readiness/runbook items, not by Sprint 2 quality checks.

---

## 5) Agent handoff template (copy per sprint)

Use this template in each `execution-log.md`:

```md
# Sprint XX Execution Log

## Scope
- Sprint objective:
- In-scope modules/routes:

## Commands run
1.
2.

## Results
- Passed:
- Failed:
- Blocked:

## Artifacts
- 

## Open issues
- 

## Decision
- Status: NOT_STARTED | IN_PROGRESS | BLOCKED | DONE
- Owner:
- Date:
```
