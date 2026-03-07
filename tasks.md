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
- [ ] Verify backend/frontend `.env` files exist and include required keys.
- [ ] Validate optional integrations config (AWS/SendGrid/Twilio) or explicitly mark N/A.
- [ ] Install dependencies for root/backend/frontend.
- [ ] Reset and seed database.
- [ ] Confirm demo/test user credentials are available.

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

---

## Sprint 2 — Code Quality & Build Verification
**Goal:** enforce compile/lint/security baseline.

### Implementation checklist
- [ ] Backend build passes.
- [ ] Frontend build passes.
- [ ] ESLint passes for backend/frontend.
- [ ] Security audits executed and triaged.

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

---

## Sprint 3 — Backend API Verification
**Goal:** verify API correctness, auth, and DB behavior.

### Implementation checklist
- [ ] Start backend server and confirm health.
- [ ] Validate login and token refresh.
- [ ] Validate protected endpoints with Bearer token.
- [ ] Validate expected status codes (200/401/403/404/500 behavior).
- [ ] Validate CRUD + constraints + transactions.

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

---

## Sprint 4 — Core Frontend Pages Verification
**Goal:** validate primary UI routes and authentication UX.

### Implementation checklist
- [ ] Start frontend dev server and verify boot health.
- [ ] Validate `/` landing page visuals/responsiveness.
- [ ] Validate `/login` form validation and redirect behavior.
- [ ] Validate `/home` widgets/nav/user menu/role-based sections.
- [ ] Validate frontend production build and runtime.

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

---

## Sprint 5 — Property Management Features
**Goal:** validate property, asset, and unit workflows end-to-end.

### Implementation checklist
- [ ] Buildings list/search/filter/create/edit/details/delete.
- [ ] Assets list/details/create/edit/depreciation/search/location updates.
- [ ] Units listing/details/management/asset assignment from buildings.

### Desired output
- CRUD and list interactions behave correctly with persisted data.
- Entity relationships (building ↔ units ↔ assets) are consistent.

### Required evidence
- `reports/sprint-05/evidence/buildings.md`
- `reports/sprint-05/evidence/assets.md`
- `reports/sprint-05/evidence/units.md`

### Exit criteria
- Property management functionality is functionally complete.

---

## Sprint 6 — Maintenance & Operations Features
**Goal:** validate operations lifecycle across tickets, work orders, maintenance.

### Implementation checklist
- [ ] Tickets flow: list/create/assign/update/comments/uploads.
- [ ] Work orders: status/cost/photos/approval/reporting.
- [ ] Maintenance: scheduling/records/reports/verification/notifications.

### Desired output
- Ticket → work order → maintenance lifecycle is coherent.
- File upload and status transitions enforce business rules.

### Required evidence
- `reports/sprint-06/evidence/tickets.md`
- `reports/sprint-06/evidence/work-orders.md`
- `reports/sprint-06/evidence/maintenance.md`

### Exit criteria
- Core operations workflows pass all functional checks.

---

## Sprint 7 — Financial Management Features
**Goal:** validate payment processing and financial visibility.

### Implementation checklist
- [ ] Payments: list/process/receipts/history/status.
- [ ] Budgets: create/edit/tracking/alerts/budget-vs-actual.
- [ ] Financial reports: generation/charts/exports/date filters/analytics.

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
- [ ] Communications list/create/history/threading/bulk (if implemented).
- [ ] Documents upload/download/search/categories/permissions/versioning.
- [ ] Notifications list/realtime/preferences/mark-read/filtering.

### Desired output
- Users can communicate, manage documents, and receive notifications reliably.

### Required evidence
- `reports/sprint-08/evidence/communications.md`
- `reports/sprint-08/evidence/documents.md`
- `reports/sprint-08/evidence/notifications.md`

### Exit criteria
- Communication and documentation stack is verified.

---

## Sprint 9 — Admin Functions & Settings
**Goal:** validate admin operations and user account controls.

### Implementation checklist
- [ ] Admin dashboard stats/navigation/user management.
- [ ] Admin notifications and templates.
- [ ] Unpaid invoice handling and payment tracking.
- [ ] User settings/profile/password/preferences.
- [ ] Support/privacy/terms/tech-jobs pages.

### Desired output
- Admin tools and user settings behave with proper authorization.

### Required evidence
- `reports/sprint-09/evidence/admin-dashboard.md`
- `reports/sprint-09/evidence/admin-notifications.md`
- `reports/sprint-09/evidence/settings-and-legal.md`

### Exit criteria
- Admin and user-account features are production-usable.

---

## Sprint 10 — Integration & Cross-Browser Testing
**Goal:** verify full-stack integration and browser compatibility.

### Implementation checklist
- [ ] Validate frontend↔backend API integration and auth flow.
- [ ] Validate file upload pipeline end-to-end.
- [ ] Validate Chrome/Firefox/Safari/Edge + mobile browsers.
- [ ] Validate responsive behavior and touch usability.

### Desired output
- Same critical flows work consistently across supported browsers/devices.

### Required evidence
- `reports/sprint-10/evidence/integration.md`
- `reports/sprint-10/evidence/cross-browser-matrix.md`
- `reports/sprint-10/evidence/mobile-responsiveness.md`

### Exit criteria
- Supported platform matrix is verified with no critical gaps.

---

## Sprint 11 — Performance & Security Testing
**Goal:** confirm latency, resilience, and security baseline.

### Implementation checklist
- [ ] Measure landing/dashboard/API response times.
- [ ] Validate authz boundaries, token behavior, input validation.
- [ ] Validate XSS/SQLi/file upload protections.
- [ ] Validate user-friendly handling of network/validation/404/backend failures.

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

---

## Sprint 12 — Production Deployment Verification
**Goal:** confirm production readiness, release safety, and rollback capability.

### Implementation checklist
- [ ] Validate production backend/frontend builds and startup.
- [ ] Validate production environment config and external integrations.
- [ ] Complete pre-deployment checklist and migration readiness.
- [ ] Run post-deployment smoke checks.
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

---

## 4) Overall release gate (all sprints complete)

Release is approved only when all are true:
- [ ] All 12 sprint exit criteria are marked `DONE`.
- [ ] No unresolved `BLOCKED` item remains.
- [ ] Critical/severity-1 defects are zero.
- [ ] Build/lint/test/security checks are passing in CI.
- [ ] Production deployment and rollback runbooks are validated.

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

