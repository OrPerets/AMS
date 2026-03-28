# Sprint 0 Behavior Briefs

Date: 2026-03-28
Owner: Frontend + UX

## Shared Success Criteria (All Features)
- **Perceived speed:** Users report the app feels faster because interactions respond within 100ms to intent.
- **Task completion speed:** Median time-to-primary-action drops by at least 10% on mobile routes.
- **Reduced accidental navigation:** Misnavigation/back-button recovery rate decreases by at least 15%.
- **Reduced backtracking:** Route churn loops (`A -> B -> A -> B`) decrease by at least 20%.

## Shared Motion Language (Approved for Sprint 0)
- One-thumb-first interactions.
- Motion must communicate state change, never decorate.
- Reduced-motion fallback required for every animation path.
- Elasticity only at intent boundaries (pull, threshold, release).
- Continuity over flourish: short settle, no long choreographies.

## 1) Card-to-Screen Morph
**User intent:** Open a destination from home quickly while keeping orientation.

States:
- Resting: Card visible and tappable.
- Engaged: Pressed state and elevation lock.
- Committed: Shell expansion into destination container.
- Exit: Destination header settle and content reveal.
- Reduced motion: opacity + short translate only.

## 2) Peek/Snap Drawers
**User intent:** Peek extra controls without losing page context.

States:
- Resting: Drawer closed, handle visible.
- Engaged: Drag/peek with resistance.
- Committed: Snap to defined breakpoint.
- Exit: Collapse to origin point.
- Reduced motion: immediate snap with fade.

## 3) Swipe Commit with Undo
**User intent:** Resolve or triage list rows confidently in one gesture.

States:
- Resting: Row neutral.
- Engaged: Reveal action as threshold is crossed.
- Committed: Flash + collapse-out with undo window.
- Exit: Row removed from flow; list reflow spring.
- Reduced motion: no spring; direct remove/restore.

## 4) Elastic Refresh Canopy
**User intent:** Refresh stale content without hunting for controls.

States:
- Resting: Content scroll.
- Engaged: Pull distance mapped to canopy progress.
- Committed: Refresh trigger and loading state.
- Exit: Canopy retract + updated content settle.
- Reduced motion: static indicator without elastic scale.

## 5) Live Event Choreography
**User intent:** Notice new urgent work and act immediately.

States:
- Resting: Baseline counters/lists.
- Engaged: Event received and routed to impacted surfaces.
- Committed: Badge/KPI/list pulse and count update.
- Exit: Attention state decays automatically.
- Reduced motion: color/emphasis only.
