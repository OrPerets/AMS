# Quarterly Refactor Budget & Ownership

**Sprint:** 8 (Ongoing)  
**Date:** 2026-03-26  
**Review Cadence:** Quarterly

---

## Purpose

Allocate dedicated engineering capacity for architecture maintenance, preventing drift and ensuring the codebase remains healthy as features grow.

---

## Budget Allocation

### Per Quarter

| Category | Budget (% of sprint capacity) | Owner |
|----------|-------------------------------|-------|
| **Architecture debt** | 10% | Frontend Lead |
| **Performance optimization** | 5% | Frontend Lead |
| **Accessibility maintenance** | 5% | UX Lead + Frontend |
| **Test infrastructure** | 5% | QA Lead |
| **Documentation updates** | 2% | Rotating |
| **Total reserved** | **27%** | |

### Budget Rules

1. Refactor budget is **non-negotiable** — feature work cannot consume this allocation
2. Unused budget rolls over to next quarter (max 1 quarter rollover)
3. Budget can be increased but never decreased without VP approval
4. Emergency architecture fixes draw from the refactor budget first

---

## Ownership Map

### Domain Owners

| Domain | Primary Owner | Backup Owner |
|--------|--------------|--------------|
| **Role Shell / Home** | Frontend Lead | Senior FE Dev |
| **Navigation / Routing** | Frontend Lead | Senior FE Dev |
| **Tickets Module** | FE Dev A | Frontend Lead |
| **Maintenance Module** | FE Dev B | FE Dev A |
| **Finance / Payments** | FE Dev C | FE Dev B |
| **Gardens Module** | FE Dev A | FE Dev C |
| **Resident Module** | FE Dev B | FE Dev A |
| **Settings / Notifications** | FE Dev C | FE Dev B |
| **Shared Primitives** | Frontend Lead | Senior FE Dev |
| **API Contracts / Backend** | Backend Lead | Senior BE Dev |
| **Test Infrastructure** | QA Lead | Frontend Lead |
| **CI / DevOps** | DevOps Lead | Backend Lead |

### Ownership Rules

1. Each domain has exactly one primary owner who is accountable for code quality
2. Backup owner takes over during absences
3. Cross-domain changes require both domain owners to review
4. Ownership transfers require handoff meeting + documentation update

---

## Quarterly Review Process

### Review Meeting (60 min, quarterly)

#### Agenda

1. **Architecture Dashboard Review** (15 min)
   - Run `node scripts/architecture-dashboard.mjs`
   - Review file complexity trends
   - Check boundary violation history
   - Review large file inventory

2. **Debt Inventory** (15 min)
   - List known architecture debts by domain
   - Prioritize by impact × effort
   - Assign to upcoming quarter budget

3. **Performance Trends** (10 min)
   - Review performance budget history
   - Check bundle size trends
   - Identify optimization opportunities

4. **Test Coverage Review** (10 min)
   - E2E coverage by role and feature
   - Contract test coverage
   - Visual regression baseline currency

5. **Budget Planning** (10 min)
   - Allocate next quarter's refactor budget
   - Assign specific tasks to owners
   - Set measurable outcomes

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Architecture dashboard status | `healthy` | `node scripts/architecture-dashboard.mjs` |
| Feature boundary violations | 0 | `node scripts/verify-feature-boundaries.mjs` |
| Files > 400 lines | < 10 | Architecture dashboard |
| Performance budget violations | 0 | `node scripts/check-performance-budgets.mjs` |
| a11y critical/serious violations | 0 | Sprint 7 axe-core tests |
| UX debt items (open) | < 15 | Triage board |
| Average file size (frontend) | Trend ↓ | Architecture dashboard |

---

## Governance Escalation

1. Dashboard status `unhealthy` for 2 consecutive quarters → mandatory refactor sprint
2. Boundary violations detected in production → immediate fix required
3. Performance budget exceeded → feature freeze until resolved
4. a11y critical violations → emergency fix within 48h

---

## Tooling

| Tool | Purpose | Command |
|------|---------|---------|
| Architecture Dashboard | Complexity & boundary check | `node scripts/architecture-dashboard.mjs` |
| Feature Boundaries | Import rule enforcement | `node scripts/verify-feature-boundaries.mjs` |
| Performance Budgets | Bundle size check | `node scripts/check-performance-budgets.mjs` |
| E2E Sprint 7 Suite | Quality gates | `npm --workspace apps/frontend run test:e2e:sprint-7` |
| E2E Sprint 8 Suite | Rollout verification | `npm --workspace apps/frontend run test:e2e:sprint-8` |
