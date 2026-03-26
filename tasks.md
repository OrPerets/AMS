# AMS Multi-Role UX Recovery & Architecture Hardening Plan

**Date:** 2026-03-26  
**Owner:** Product + Frontend + Backend + QA + DevOps  
**Scope:** Resident, PM, Admin, Tech, Accountant, Master impersonation, shared platform foundations

---

## 1) Detailed Problem Description

### 1.1 Business Problem
Resident mobile UX is comparatively clear, but PM/Admin/Tech flows still feel fragmented and “messy,” causing users to:
- Need extra taps to reach their daily job-to-be-done.
- See inconsistent layouts and navigation patterns across modules.
- Lose confidence because page structure and action hierarchy change from screen to screen.
- Depend on memory/training instead of UI clarity.

This creates direct risk in support load, onboarding time, operational delays, and role-based adoption.

### 1.2 Product/UX Findings From Current Repo
The current codebase already contains strong mobile intent (role-aware home blueprints, role selection page, mobile nav model, and mobile redesign spec), but execution is uneven:

1. **Large “orchestrator” files indicate mixed concerns and hard maintenance:**
   - `home.tsx` is very large and combines role routing, data fetching, fallback, and view assembly.
   - `resident/account.tsx`, `settings.tsx`, and `navigation.ts` are also large and likely carry both domain and UI logic.
2. **Role model and route ownership are distributed across multiple places:**
   - Auth normalization/routing and navigation behavior are split between auth lib, navigation lib, and role entry screens.
3. **Non-resident experience quality depends on module-by-module implementation maturity:**
   - Core role homes are structured, but downstream pages still vary in clarity and density.
4. **Scale risk is visible in breadth:**
   - 75 frontend pages, 133 frontend components, and 26 backend modules require stronger guardrails for consistency.

### 1.3 Root Causes (Likely)
- No single enforced “mobile role shell contract” for every role/page.
- Repeated role and navigation logic in several layers.
- Historical feature additions without consistent UX acceptance gates.
- Gaps between design spec and implementation verification at page level.
- Missing architectural fitness checks (complexity, boundaries, ownership).

### 1.4 Desired End State
- Any role opens the app and immediately understands: **Where am I, what needs attention now, what is next.**
- Every role follows one consistent mobile shell language with role-specific content (not role-specific layout chaos).
- Codebase has clear boundaries, shared primitives, and test guardrails that prevent regression.
- New features can be added fast without reintroducing UI inconsistency or architectural drift.

---

## 2) Instructions to Refine Everything Deeply

## 2.1 Non-Negotiable Product Principles
1. **Action-first mobile:** first viewport must expose top role action, not decorative content.
2. **One role, one mental model:** different data, same interaction grammar.
3. **Consistency > novelty:** shared patterns across PM/Admin/Tech unless a true role constraint requires divergence.
4. **Task completion over navigation exploration:** reduce “portal pages” and dead-end hops.
5. **Progressive disclosure:** show essentials first; advanced surfaces in drill-down layers.

## 2.2 Non-Negotiable Engineering Principles
1. **Single source of truth** for role normalization, role capabilities, and default routing.
2. **Separation of concerns:** page orchestration, data adapters, and presentational components must be split.
3. **Module boundaries:** each domain owns API types, data mapping, and UI composition contracts.
4. **Typed contracts first:** role/home/page DTOs validated at boundaries.
5. **Observability by default:** instrument role funnel, action taps, time-to-first-action, and navigation churn.

## 2.3 Deep Refactor Tracks (Run in Parallel With UX Work)

### Track A — UX System Unification
- Create a formal **Role Mobile Shell Specification** (header, status strip, primary action, 2x2 quick actions, inbox/queue preview, bottom nav behavior).
- Convert all non-resident role homes to this shell contract.
- Define page-level density rules (max section count before fold, card spacing, list affordance).
- Standardize empty/loading/error states across modules.

### Track B — Routing & Role Governance
- Centralize route decisions behind one resolver:
  - role normalization
  - impersonation precedence
  - default entry route
  - workspace entry route
- Remove duplicate redirect logic from multiple pages once resolver is adopted.
- Add guard pages for unsupported role/capability states.

### Track C — Information Architecture & Navigation
- Freeze role-specific tab model and “More” budgets (max item counts, max groups).
- Remove redundant route duplication (tab + More duplicates).
- Introduce usage-based progressive disclosure for low-value links.
- Enforce naming consistency (same feature must not have multiple labels across role surfaces).

### Track D — Frontend Code Structure Hardening
- Split large files into:
  - page controller/hook
  - role-specific adapter
  - pure presentational component tree
- Establish folder convention per domain:
  - `features/<domain>/api`
  - `features/<domain>/model`
  - `features/<domain>/ui`
  - `features/<domain>/tests`
- Extract repeated utilities (formatting, status mapping, route labels) to shared typed packages.

### Track E — Backend/API Contract Consistency
- Audit role-sensitive endpoints for payload shape consistency.
- Introduce explicit DTO versioning where unstable.
- Ensure list/filter/pagination contracts are uniform across major modules.
- Add contract tests for frontend-critical endpoints used by mobile homes.

### Track F — Quality, Performance, Accessibility
- Add mandatory QA matrix for: role × theme × direction × breakpoint.
- Enforce performance budgets (first contentful action card visible fast on mid-range devices).
- Enforce accessibility checks (focus, contrast, target size, RTL mirroring).
- Expand E2E to cover first-action path for every role.

---

## 3) Sprint Plan With Detailed Todo Lists

## Sprint 0 — Baseline, Evidence, and Alignment (1 week)
**Goal:** Lock scope with measurable baseline and ownership map.

### Todo
- [x] Create current-state UX audit board (all roles, top 20 pages by traffic/use).
- [x] Capture screenshots and annotate “clarity blockers” (first viewport + navigation + action discoverability).
- [x] Build route/role matrix (entry route, allowed tabs, primary actions, dead routes).
- [x] Define top KPIs and baseline collection:
  - time to first meaningful action
  - taps to top action
  - abandoned navigation rate
  - support tickets by role/page confusion
- [x] Produce ownership map for large files and critical flows.
- [x] Freeze a “no new UI patterns without review” temporary rule.

### Deliverables
- [x] UX audit report with severity tags.
- [x] Role journey map with bottlenecks.
- [x] Baseline dashboard (analytics + QA findings).

### Sprint 0 Artifacts
- `reports/sprint-0/ux-audit-board.md`
- `reports/sprint-0/route-role-matrix.md`
- `reports/sprint-0/baseline-kpi-dashboard.md`
- `reports/sprint-0/ownership-map.md`
- `reports/sprint-0/temporary-ui-pattern-freeze.md`

---

## Sprint 1 — Role Governance + Routing Consolidation (1–1.5 weeks)
**Goal:** Remove routing ambiguity and role inconsistency at the foundation.

### Todo
- [x] Build `role-capabilities` model (single place for role abilities).
- [x] Build `route-resolver` module for all post-login/default/workspace logic.
- [x] Move duplicate role checks from pages to resolver-driven hooks.
- [x] Define unsupported role UI state and telemetry event.
- [x] Add unit tests for role normalization, impersonation, and destination outputs.
- [x] Add integration tests for login → destination by role.

### Exit Criteria
- Zero conflicting role redirects.
- 100% role route decisions test-covered.
- No page with custom ad-hoc role fallback logic.

---

## Sprint 2 — Mobile Shell Standardization for PM/Admin/Tech (2 weeks)
**Goal:** Match non-resident clarity to resident-level quality using one unified shell.

### Todo
- [x] Create shell primitives with strict API (status strip, primary card, quick actions, inbox slice).
- [x] Refactor PM home to strict shell contract.
- [x] Refactor Admin home to strict shell contract.
- [x] Refactor Tech home to strict shell contract.
- [x] Align microcopy tone: short, task-oriented, no marketing style on work surfaces.
- [x] Enforce first-viewport rule in automated visual checks.
- [x] Add analytics events for top-card impression and first action click.

### Exit Criteria
- All three roles pass same shell checklist.
- First action visible above fold on common mobile widths.
- No role-specific visual “one-off” components without documented exception.

---

## Sprint 3 — Page Cleanup Wave (High-Use Modules) (2 weeks)
**Goal:** Clean the highest-friction pages beyond home.

### Prioritized Modules
1. Tickets
2. Buildings/Assets
3. Maintenance/Operations Calendar
4. Notifications/Settings
5. Gardens entry surfaces for PM/Tech

### Todo
- [x] Apply section hierarchy template to each high-use page.
- [x] Replace oversized headers/hero blocks with compact context headers.
- [x] Normalize filters/search/action bar pattern.
- [x] Normalize list item structure (status, urgency, owner, due indicator).
- [x] Add empty/loading/error consistency kit.
- [x] Remove duplicate action CTAs competing for primary intent.

### Exit Criteria
- [x] Top 15 non-resident pages use shared mobile layout patterns.
- [x] Scroll depth before first interaction reduced materially.
- [x] QA score for clarity improved to target threshold.

---

## Sprint 4 — Navigation IA Hardening (1 week)
**Goal:** Make navigation predictable and role-appropriate.

### Todo
- [x] Finalize role tab bars (4 + More where applicable).
- [x] Enforce “More” cap rules (max groups/items).
- [x] Remove duplicate entries between tabs and More.
- [x] Add “recently used” smart shortcuts with expiry window.
- [x] Add telemetry for misclick loops and back-and-forth churn.
- [x] Validate label consistency across all locales/directions.

### Exit Criteria
- [x] Navigation model validated for each role.
- [x] Reduced navigation churn in telemetry.
- [x] No orphaned routes from role menus.

---

## Sprint 5 — Codebase Restructure for Scale & Maintainability (2 weeks)
**Goal:** Convert fragile page-centric structure into maintainable feature architecture.

### Todo
- [x] Define target frontend architecture RFC (feature folders + boundaries + dependency rules).
- [x] Split large files into controller/hook + UI components + adapters.
- [x] Introduce lint boundaries (no cross-feature imports outside public API).
- [x] Add shared domain enums/status mappers with typed exports.
- [x] Add codemods/scripts for safe migrations.
- [x] Document contribution conventions and PR checklist.

### Exit Criteria
- [x] Largest risky pages reduced in complexity and size.
- [x] Clear import boundaries enforced in CI.
- [x] New feature development path documented and adopted.

### Sprint 5 Artifacts
- `reports/sprint-5/architecture-rfc.md`
- `apps/frontend/features/` (11 domain feature folders)
- `apps/frontend/shared/domain/` (typed enums + status mappers)
- `apps/frontend/shared/api/` (fetch helpers + response types)
- `scripts/migrate-to-features.mjs` (scaffold, audit, validate)
- `scripts/verify-feature-boundaries.mjs` (CI boundary checker)
- `CONTRIBUTING.md` (conventions + PR checklist)
- `eslint.config.mjs` (feature boundary lint rules)

---

## Sprint 6 — API Contract, Data Quality, and Reliability (1.5 weeks)
**Goal:** Ensure frontend clarity is backed by stable, predictable backend contracts.

### Todo
- [x] Audit endpoint response shape consistency for mobile critical flows.
- [x] Introduce API schema tests (snapshot or contract-driven).
- [x] Standardize pagination/meta patterns.
- [x] Standardize server-side status enums and translation mapping.
- [x] Add resilience behavior for partial failures (graceful fallback modules).
- [x] Add SLOs for key endpoints used on role home screens.

### Exit Criteria
- [x] Contract diffs detected automatically in CI.
- [x] Fewer frontend defensive branches for shape mismatch.
- [x] Improved reliability metrics on critical dashboards.

### Sprint 6 Artifacts
- `reports/sprint-6/api-audit-report.md`
- `reports/sprint-6/slo-definitions.md`
- `apps/backend/src/common/dto/pagination.dto.ts` (PaginationQueryDto)
- `apps/backend/src/common/dto/api-response.dto.ts` (PaginatedResponseDto, ListResponseDto)
- `apps/backend/src/common/dto/status-enums.ts` (all domain status maps + translations)
- `apps/backend/src/common/slo-tracking.interceptor.ts` (SLO tracking + metrics)
- `apps/backend/src/common/__tests__/` (37 contract + snapshot tests)
- `apps/frontend/shared/api/resilience.ts` (resilientFetch, resilientFetchAll, fetchWithRetry)

---

## Sprint 7 — Test Matrix, Accessibility, and Performance Budget (1 week)
**Goal:** Prevent regression and certify multi-role mobile quality.

### Todo
- [ ] Expand E2E suite by role × top tasks.
- [ ] Add visual regression snapshots for key pages per role.
- [ ] Run accessibility audits (contrast, focus order, labels, hit targets).
- [ ] Add performance checks (bundle/page interaction budgets).
- [ ] Add RTL + dark mode verification gates.
- [ ] Add release checklist requiring UX + architecture sign-off.

### Exit Criteria
- CI blocks merges on major UX regressions.
- Accessibility threshold met on high-use pages.
- Performance budgets enforced.

---

## Sprint 8 — Rollout, Monitoring, and Continuous Governance (ongoing)
**Goal:** Release safely and keep quality high as product evolves.

### Todo
- [ ] Progressive rollout by role (feature flags).
- [ ] Monitor KPI changes weekly with alert thresholds.
- [ ] Run weekly “UX debt triage” with engineering and product.
- [ ] Keep architecture dashboard (complexity, file size, boundary violations).
- [ ] Establish quarterly refactor budget and ownership.

### Exit Criteria
- Stable improvement in role adoption and task completion speed.
- Declining support issues tied to UI confusion.
- Architecture debt remains within agreed threshold.

---

## Implementation Governance Checklist (Apply Every Sprint)
- [ ] Every task maps to measurable KPI or reliability metric.
- [ ] Every UX change has screenshot evidence and role-specific acceptance criteria.
- [ ] Every structural refactor has boundary tests and migration notes.
- [ ] No merge without QA matrix pass for impacted roles.
- [ ] No net increase in duplicated role/routing logic.

---

## Definition of Done (Program-Level)
This initiative is done only when:
1. PM/Admin/Tech mobile journeys are as clear and fast as resident journeys.
2. Role-based UI is consistent in shell, hierarchy, and interaction grammar.
3. Routing and role capability logic is centralized and fully tested.
4. Large fragile files are decomposed and governed by feature boundaries.
5. CI enforces UX, accessibility, performance, and architectural guardrails.
6. Post-release metrics confirm sustained usability and maintenance improvements.
