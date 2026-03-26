# Release Checklist — UX + Architecture Sign-Off

**Sprint:** 7+  
**Date:** 2026-03-26  
**Scope:** All role-facing pages (PM, Admin, Tech, Resident, Master)

---

## Pre-Release Gates

All gates must pass before any production merge.

### 1. UX Sign-Off

- [ ] All role home screens pass Mobile Shell Specification checklist
- [ ] First-viewport action card visible on 390×844 (iPhone) viewport
- [ ] No role-specific visual one-off without documented exception
- [ ] Microcopy reviewed: short, task-oriented, no marketing language on work surfaces
- [ ] Empty/loading/error states verified for all critical pages
- [ ] Screenshot evidence captured for: login, role-selection, each role home, top 3 pages per role

### 2. Accessibility Sign-Off

- [ ] axe-core audit passes (0 critical/serious WCAG 2.1 AA violations) on all audit target pages
- [ ] Contrast check passes in both light and dark themes
- [ ] Focus order is logical on settings, forms, and dialogs
- [ ] Touch target sizes meet WCAG 2.2 AA minimum (24×24 CSS px) on mobile viewport
- [ ] Skip-to-content link present and functional
- [ ] Command palette accessible via keyboard (Ctrl+K)

### 3. Performance Sign-Off

- [ ] DOMContentLoaded < 3000ms on key pages (mocked API, Playwright budget test)
- [ ] Time-to-interaction < 5000ms on key pages
- [ ] DOM node count < 3000 per page
- [ ] JS heap < 50MB on dashboard load
- [ ] API call count per page load ≤ 15

### 4. RTL + Dark Mode Sign-Off

- [ ] All 8 gate target pages render without horizontal overflow in all 4 variants (rtl-light, rtl-dark, ltr-light, ltr-dark)
- [ ] `dir` attribute correct on `<html>` for both RTL and LTR
- [ ] Dark mode class/data-theme applied correctly
- [ ] Theme switch does not cause layout drift > 50px
- [ ] Text alignment follows direction

### 5. Visual Regression Sign-Off

- [ ] Baseline screenshots generated for all 11 key pages + login
- [ ] maxDiffPixelRatio threshold: 2% (0.02)
- [ ] Any screenshot diff reviewed and approved by UX owner

### 6. Architecture Sign-Off

- [ ] Feature boundary check passes: `node scripts/verify-feature-boundaries.mjs`
- [ ] No cross-feature deep imports (barrel-only rule enforced)
- [ ] Shared layer does not import from features
- [ ] All feature folders have index.ts barrel
- [ ] Architecture dashboard complexity within threshold

### 7. Test Coverage Sign-Off

- [ ] E2E role × top-task matrix covers PM, Admin, Tech, Resident, Master
- [ ] All qa-sprint-7-* test suites pass in CI
- [ ] Backend contract tests pass: `cd apps/backend && npm test`
- [ ] Feature flag rollout tests pass (Sprint 8)

---

## Approvals

| Role | Name | Date | Signature |
|------|------|------|-----------|
| UX Lead | | | |
| Frontend Lead | | | |
| Backend Lead | | | |
| QA Lead | | | |
| Product Owner | | | |

---

## Post-Release Monitoring

- [ ] KPI dashboard reviewed 24h after rollout
- [ ] Alert thresholds active for error rate, response time, adoption metrics
- [ ] Rollback plan documented and tested
- [ ] Feature flags ready for progressive rollout

---

## Notes

- This checklist must be completed for every production release touching role-facing UX
- Any gate failure requires documented exception approval from Product Owner + UX Lead
- Evidence artifacts stored under `reports/sprint-7/evidence/`
