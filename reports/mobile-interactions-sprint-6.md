# Sprint 6 — Mobile Interaction Hardening Notes

Date: 2026-03-28

## Final interaction flags (independent kill switches)

- `mobile-interactions-card-morph`
- `mobile-interactions-peek-drawers`
- `mobile-interactions-swipe-undo`
- `mobile-interactions-elastic-refresh`
- `mobile-interactions-live-choreography`

Implementation is centralized through `apps/frontend/lib/mobile-interaction-flags.ts` and consumed directly by the relevant interaction primitives.

## Motion token source of truth

All shared interaction timing, easing, spring, and threshold constants remain centralized in:

- `apps/frontend/lib/motion-tokens.ts`

No sprint-6 interaction additions introduced extra ad-hoc easing curves or duplicated thresholds.

## Regression shield coverage

Playwright regression shield suite added:

- `apps/frontend/e2e/qa-sprint-6-regression-shields.spec.ts`

This suite verifies:

1. Sprint 1 swipe/undo and Sprint 5 pull-canopy source contracts are still present.
2. Each interaction family remains wired to an independent feature flag.
3. Mobile interaction flag evaluation honors authenticated/unauthenticated snapshots.

