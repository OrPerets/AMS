# AMS Enterprise Delivery Plan (`tasks.md`)

_Last reviewed: 2026-03-07_

## 1) Executive answer: is the architecture/implementation currently good?

**Short answer: partially.**

The current implementation has **strong functional breadth** (many business modules exist), but it is **not yet enterprise-grade** in architecture quality and delivery reliability.

### What is good already
- Clear monorepo split between backend (`NestJS + Prisma + PostgreSQL`) and frontend (`Next.js + TypeScript`).
- Rich domain coverage: assets, buildings, tickets, maintenance, work orders, payments, budgets, documents, admin.
- Role model exists and is used in both backend and frontend.
- Basic operational tooling exists (Makefile, Docker artifacts, migrations/seeds).

### What is not good enough yet (enterprise perspective)
1. **Quality gates are not trustworthy** (frontend build/test/lint issues observed).
2. **Architecture boundaries are weak** (module-per-feature exists, but domain contracts and platform concerns are not fully standardized).
3. **UI has hardcoded identity and demo fallbacks** in business flows.
4. **Payments integration is still placeholder/sandbox-like** in key provider path.
5. **No robust E2E and contract-test safety net** for critical journeys.
6. **Infra/DevOps maturity is limited** (CI mostly Docker build/push, no full promotion gates).
7. **Security and observability are below enterprise baseline** (audit trail/rate limit/metrics/SLO maturity gaps).

---

## 2) Repo overview and current state

## What exists
- **Monorepo** with npm workspaces:
  - `apps/backend` → NestJS API, Prisma ORM, PostgreSQL
  - `apps/frontend` → Next.js (pages router), TypeScript
- **Backend modules/controllers** include:
  - auth, users, buildings/units, assets, tickets, work-orders, maintenance
  - payments/invoices, budgets, reports, documents, communications, notifications
  - admin, dashboard, schedules, votes, websocket
- **Frontend routes** include:
  - core operations (`/home`, `/tickets`, `/maintenance`, `/work-orders`, `/buildings`, `/assets`)
  - financial and admin (`/payments`, `/finance/*`, `/admin/*`)
  - communications/docs/notifications (`/communications`, `/documents`, `/notifications`)

## Main product goal
Deliver a **multi-role enterprise property/asset management platform** for operations, resident service, maintenance lifecycle, and financial governance with production-grade reliability and security.

---

## 3) Current risk map (what works vs what is missing)

## Likely working / implemented
- Core domain endpoints/pages exist for most business functions.
- Auth flow endpoints and role guard structure are present.
- Data model is broad and supports multi-role business entities.

## Missing or weak for enterprise readiness
1. **Build & test stability**
   - Frontend production build is brittle.
   - Backend tests are too limited and not consistently green.
2. **Product correctness risk**
   - Hardcoded user IDs and mock fallbacks can produce wrong behavior in production.
3. **Financial integrity risk**
   - Payment provider path requires real production hardening (idempotency/webhook verification/reconciliation).
4. **Contract drift risk**
   - Frontend and backend enum/DTO assumptions can diverge without typed contract enforcement.
5. **Security/compliance gaps**
   - Missing complete audit log strategy and enforcement guardrails.
6. **Operational risk**
   - Missing strong observability, SLO-driven alerting, and automated deployment safety gates.

---

## 4) Architecture improvements recommended

## A. Software architecture refinements
- [ ] Introduce **explicit layered boundaries** in backend modules:
  - Controller (transport) → Application Service (use-case) → Domain logic → Repository/Prisma adapter.
- [ ] Add **domain contracts package** (shared DTO/Zod/OpenAPI-generated types) to eliminate frontend/backend drift.
- [ ] Standardize **error envelope** and domain error codes across all APIs.
- [ ] Introduce **idempotency abstraction** for financial/state-transition operations.
- [ ] Add **outbox pattern** for important cross-boundary events (payments, notifications, audit events).

## B. Frontend architecture refinements
- [ ] Migrate API access to a typed API client layer (no ad-hoc endpoint string usage per page).
- [ ] Centralize auth/session identity context (remove hardcoded user IDs everywhere).
- [ ] Split heavy page logic into feature modules/hooks (state + query + command separation).
- [ ] Add standardized error/loading/empty/offline UI primitives and enforce usage.
- [ ] Evaluate move from Pages Router to App Router only if team capacity supports it (not mandatory now).

## C. Data architecture refinements
- [ ] Add migration quality policy (forward + rollback tested in CI/staging).
- [ ] Add DB index review for large-list endpoints (tickets, work-orders, docs, notifications, financial reports).
- [ ] Enforce stricter DB constraints for financial invariants and status transitions.
- [ ] Add archival/retention strategy for historical records and file metadata.

## D. Security architecture refinements
- [ ] Add centralized audit trail service for sensitive actions.
- [ ] Add rate limiting and abuse protection for auth and write-heavy endpoints.
- [ ] Add secure file pipeline (content type/size validation, malware scan, quarantine).
- [ ] Harden JWT strategy (rotation, revocation semantics, compromised token response plan).

---

## 5) Infrastructure and platform improvements recommended

## CI/CD
- [ ] CI must run: install → lint → typecheck → unit/integration tests → backend build → frontend build → E2E smoke.
- [ ] Enforce PR protection: cannot merge unless pipeline is green.
- [ ] Add dependency/security scanning (SCA), SAST, and license compliance checks.
- [ ] Add staged promotion pipeline (dev → staging → prod) with manual approval gates.

## Runtime/deployment
- [ ] Use separate env configs + secret manager (not env files in deployment workflow).
- [ ] Introduce canary or blue/green deployments with automated rollback triggers.
- [ ] Add health/readiness checks plus startup probes for all services.
- [ ] Add background worker/scheduler runtime separation if recurring jobs grow.

## Observability
- [ ] Structured JSON logs with request IDs and correlation IDs.
- [ ] Metrics dashboards: p50/p95 latency, error rate, queue lag, payment/webhook success rates.
- [ ] Tracing across frontend → backend → DB/provider paths.
- [ ] Alerting policy aligned to SLOs with on-call ownership.

---

## 6) Framework/tooling recommendations

### Keep (good fit)
- NestJS + Prisma + PostgreSQL (good velocity and maintainability).
- Next.js + TypeScript (good enterprise web platform).

### Add/upgrade
- [ ] Add **contract-first API tooling** (OpenAPI generation and typed client).
- [ ] Add **test stack**:
  - backend integration tests (Jest + test DB)
  - frontend unit/component tests (Vitest/Jest + Testing Library)
  - Playwright E2E for role-based business journeys
- [ ] Add **quality scripts** in root package (`verify`, `verify:ci`, `verify:e2e-smoke`).
- [ ] Add **API and architecture docs** (ADR records for major decisions).

---

## 7) Sprint backlog (updated)

## Sprint 0 — Stabilize build and quality gates (blocker sprint)
- [ ] Fix frontend production build issues and enforce strict type checks.
- [ ] Make backend tests green and increase baseline test reliability.
- [ ] Fix lint pipeline determinism in local + CI.
- [ ] Add root `verify` command and CI-required branch protection.

## Sprint 1 — Architecture baseline and contracts
- [ ] Define backend layering standard and apply to high-risk modules first (payments, auth, tickets).
- [ ] Create shared typed contract package (DTO/enums/error contracts).
- [ ] Standardize response/error envelope and pagination model.

## Sprint 2 — Identity and authorization correctness
- [ ] Remove hardcoded IDs and derive identity from validated session/token.
- [ ] Build role-access matrix tests for all protected endpoints/pages.
- [ ] Harden impersonation and refresh token flows.

## Sprint 3 — Remove demo behavior from production paths
- [ ] Remove mock fallbacks from production pages.
- [ ] Introduce explicit offline/retry UX and operational error messaging.
- [ ] Add feature flags for incomplete modules.

## Sprint 4 — Financial architecture hardening
- [ ] Production-grade payment provider integration + webhook verification.
- [ ] Idempotency for payment intent/create/confirm/refund paths.
- [ ] Ledger consistency checks and reconciliation reporting.
- [ ] Recurring billing robustness + failure replay strategy.

## Sprint 5 — Files, documents, and communications security
- [ ] Secure upload/download pipeline with malware scanning.
- [ ] Permission and data retention policies enforced and tested.
- [ ] Communication/audit traceability for enterprise compliance.

## Sprint 6 — End-to-end automation
- [ ] Add API integration tests for all critical modules.
- [ ] Add frontend component tests for core forms/workflows.
- [ ] Add Playwright suite for top business journeys by role.

## Sprint 7 — Security and compliance baseline
- [ ] Security headers, rate limits, abuse defenses.
- [ ] SAST/SCA/license checks in CI.
- [ ] Sensitive-action audit trails and data governance controls.

## Sprint 8 — Observability + reliability engineering
- [ ] Logs, metrics, traces, dashboards, SLOs.
- [ ] Alerting and on-call runbooks.
- [ ] Failure-injection drills and recovery validation.

## Sprint 9 — Deployment governance
- [ ] Staging gates, canary/blue-green, rollback automation.
- [ ] Migration safety and rollback tested per release.
- [ ] Release checklist with technical + product sign-off.

## Sprint 10 — Performance and scalability
- [ ] API/query optimization for high-volume modules.
- [ ] Frontend performance budgets and bundle optimization.
- [ ] Mobile/responsive quality pass for all critical flows.

## Sprint 11 — UAT + production readiness
- [ ] Role-based UAT scripts and acceptance evidence.
- [ ] Pen-test and final security remediation.
- [ ] DR drill, hypercare plan, and go-live decision meeting.

---

## 8) Immediate actions (next 7 days)
- [ ] Close Sprint 0 fully before adding new features.
- [ ] Remove hardcoded notification user IDs and wire real identity context.
- [ ] Disable production mock fallbacks in payments/budgets/buildings.
- [ ] Define payment state machine and align DB/API/UI semantics.
- [ ] Turn CI into a mandatory gate for merge.

---

## 9) Enterprise Definition of Done
A feature/release is done only when:
- [ ] Functional acceptance criteria pass
- [ ] Unit + integration + E2E checks pass
- [ ] Security and authorization checks pass
- [ ] Observability instrumentation is included
- [ ] API/docs/runbooks are updated
- [ ] Rollback path is tested
- [ ] Product + Engineering + Ops sign-off completed
