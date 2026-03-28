# AMS Mobile Interaction Elevation Plan

**Date:** 2026-03-28  
**Branch Target:** `dev`  
**Primary Goal:** Upgrade the mobile product feel from "solid utility app" to "fast, tactile, premium operational tool" without breaking role-specific workflows.

## Scope

This plan covers the mobile web experience in `apps/frontend`, with emphasis on these existing interaction systems:

- Shared route transitions from home and navigation surfaces
- Bottom sheets and row action sheets
- Swipe actions and long-press affordances
- Pull-to-refresh behavior
- Real-time websocket-driven UI updates

## Instructions To All Contributors

### Product
- [ ] Treat every sprint as a behavior sprint, not just a styling sprint.
- [ ] For every feature, write the user intent in one sentence: "what the user is trying to do with one thumb under time pressure."
- [ ] Reject any motion that adds delay without improving orientation, feedback, or confidence.
- [ ] Prioritize the top 5 role-critical routes: `/home`, `/tickets`, `/notifications`, `/payments`, `/resident/requests`, `/tech/jobs`.
- [ ] Define success metrics before implementation begins for each sprint.

### UX / Design
- [ ] Produce motion specs as state diagrams, not static screenshots only.
- [ ] For each interaction, define: resting state, engaged state, committed state, exit state, reduced-motion fallback.
- [ ] Keep one motion language across all roles.
- [ ] Use depth, elasticity, and continuity sparingly; avoid ornamental choreography.
- [ ] Validate all flows in RTL and on narrow mobile widths first.

### Frontend
- [ ] Reuse the existing primitives before adding new abstractions.
- [ ] Centralize new motion constants in `apps/frontend/lib/motion-tokens.ts`.
- [ ] Gate all advanced motion with reduced-motion checks.
- [ ] Prefer optimistic UI with undo over modal confirmations on mobile.
- [ ] Keep feature flags around every new behavior until Sprint 6 exit criteria are met.

### Backend
- [ ] Support optimistic UI with idempotent endpoints where actions can be undone.
- [ ] Expose stable deltas for refresh/live-update surfaces when possible.
- [ ] Keep event payloads minimal, typed, and predictable for websocket consumers.

### QA
- [ ] Verify all new interactions on touch devices, not mouse emulation only.
- [ ] Test gesture conflicts: scroll vs swipe, swipe vs tap, drawer drag vs inner scroll, pull-to-refresh vs page drag.
- [ ] Record short videos of each golden path for regression comparison.

### Analytics / Data
- [ ] Add event coverage for start, commit, cancel, undo, and error states.
- [ ] Report behavior quality, not just click volume.
- [ ] Track whether interactions reduce time-to-action and backtrack churn.

### DevOps / Release
- [ ] Roll out behind flags by route cluster.
- [ ] Do not enable globally until mobile QA passes on iPhone Safari and Android Chrome.
- [ ] Monitor runtime errors, route-change failures, and gesture-related abandonment after release.

---

## Existing Code Hotspots

- Route continuity: `apps/frontend/lib/route-transition-contract.ts`
- App-level transition wrapper: `apps/frontend/pages/_app.tsx`
- Home CTA + shared layout entry points: `apps/frontend/components/ui/primary-action-card.tsx`
- Home quick action grid: `apps/frontend/components/ui/mobile-action-hub.tsx`
- Bottom dock + more drawer: `apps/frontend/components/layout/MobileBottomNav.tsx`
- Shared drawer primitive: `apps/frontend/components/ui/ams-drawer.tsx`
- Row action sheet: `apps/frontend/components/ui/mobile-row-actions-sheet.tsx`
- Swipe card primitive: `apps/frontend/components/ui/mobile-swipe-action-card.tsx`
- Priority inbox cards: `apps/frontend/components/ui/mobile-priority-inbox.tsx`
- Pull-to-refresh hook: `apps/frontend/hooks/use-pull-to-refresh.ts`
- Pull indicator: `apps/frontend/components/ui/pull-to-refresh-indicator.tsx`
- Live update entry point: `apps/frontend/components/Layout.tsx`
- KPI animation surface: `apps/frontend/components/ui/compact-status-strip.tsx`

---

## Program Guardrails

- [ ] No new easing curves outside `motion-tokens.ts`.
- [ ] No screen-specific gesture logic if the primitive can own it.
- [ ] No "surprise" navigation after gesture commit; every destructive or stateful gesture must show visible confirmation.
- [ ] No interaction launches without reduced-motion behavior defined.
- [ ] No sprint closes until analytics events and QA cases exist for the new behavior.

---

## Sprint 0 — Alignment, Instrumentation, and Feature Flags

**Goal:** Create the execution rails before changing behavior.

### Product / UX
- [x] Write one-page behavior briefs for:
  - [x] Card-to-screen morph
  - [x] Peek/snap drawers
  - [x] Swipe commit with undo
  - [x] Elastic refresh canopy
  - [x] Live event choreography
- [x] Define success criteria for each feature:
  - [x] perceived speed
  - [x] task completion speed
  - [x] reduced accidental navigation
  - [x] reduced backtracking
- [x] Approve one shared motion language for all five features.

### Frontend
- [x] Add feature flags in `apps/frontend/lib/feature-flags.ts` for each interaction family.
- [x] Normalize motion constants in `apps/frontend/lib/motion-tokens.ts`.
- [x] Add a lightweight UI event bus for frontend-only interaction reactions if existing analytics/event plumbing is insufficient.
- [x] Audit current reduced-motion coverage and fill obvious gaps.

### Analytics
- [ ] Define event names for gesture lifecycle:
  - [x] `interaction_started`
  - [x] `interaction_threshold_reached`
  - [x] `interaction_committed`
  - [x] `interaction_undone`
  - [x] `interaction_cancelled`
- [x] Add route-level context fields: role, pathname, source surface, destination surface.

### QA
- [x] Build a mobile interaction checklist template for every sprint.
- [x] Capture baseline videos for current `/home`, `/tickets`, `/notifications`, `/payments/resident`, `/resident/requests`, `/tech/jobs`.

### Exit Criteria
- [x] All five features have flags.
- [x] All five features have analytics contracts.
- [x] Motion language and QA checklist approved.

---

## Sprint 1 — Swipe-To-Resolve With Collapse And Undo

**Goal:** Make swipe actions feel decisive, safe, and rewarding.

### Product / UX
- [x] Define which row types support swipe on first release:
  - [x] resident requests
  - [x] tech jobs
  - [x] tickets dispatch rows
  - [x] priority inbox items
- [x] Define per-tone behavior:
  - [x] warning = softer confirmation
  - [x] danger = stronger resistance + warning haptic
  - [x] success = lighter completion
- [x] Specify undo copy per action type.

### Frontend
- [ ] Extend `apps/frontend/components/ui/mobile-swipe-action-card.tsx` to support:
  - [x] post-commit locked state
  - [x] commit flash/tint state
  - [x] collapse-out animation
  - [x] optional optimistic removal callback
  - [x] undo timeout hook
- [ ] Extend `apps/frontend/components/ui/mobile-priority-inbox.tsx` to animate:
  - [x] committed card exit
  - [x] list reflow spring
  - [x] restored card re-entry after undo
- [x] Integrate undo toast using existing toast system.
- [x] Preserve tap behavior when swipe is cancelled.
- [x] Ensure RTL swipe direction rules remain correct.

### Backend
- [ ] Confirm all committed swipe actions are idempotent.
- [ ] Support rollback or no-op replay where undo restores frontend state before server confirmation.

### Analytics
- [x] Track swipe start, reveal threshold, commit, undo, and cancel.
- [x] Track false positives where swipe is started but cancelled frequently.

### QA
- [ ] Verify swipe does not break vertical scrolling.
- [ ] Verify undo restores row and local counts.
- [ ] Verify no duplicate API call on repeated gesture.
- [ ] Verify behavior on low-end mobile frame rates.

### Exit Criteria
- [ ] Swipe commit visually removes the row.
- [ ] Undo restores state reliably.
- [ ] No gesture regression on scroll-heavy pages.

---

## Sprint 2 — Live Event Choreography

**Goal:** Turn websocket events into coordinated, product-wide feedback instead of isolated toasts.

### Product / UX
- [ ] Define event choreography for:
  - [ ] new ticket
  - [ ] ticket update
  - [ ] new notification
- [ ] Map each event to affected surfaces:
  - [ ] bottom nav badge
  - [ ] compact KPI strip
  - [ ] priority inbox / notifications list
  - [ ] page-local list or counter
- [ ] Decide where sound/haptic is allowed and where it must remain silent.

### Frontend
- [ ] Refactor websocket listeners in `apps/frontend/components/Layout.tsx` to emit structured UI interaction events.
- [ ] Add coordinated reactions to:
  - [ ] `apps/frontend/components/layout/MobileBottomNav.tsx`
  - [ ] `apps/frontend/components/ui/compact-status-strip.tsx`
  - [ ] `apps/frontend/components/ui/mobile-priority-inbox.tsx`
  - [ ] relevant page-local counters and lists
- [ ] Reuse `useAnimatedNumber` for count deltas.
- [ ] Animate inserted list items from the top with short spring motion.
- [ ] Add subtle attention states that decay automatically after a few seconds.

### Backend
- [ ] Audit websocket payload consistency for ticket and notification events.
- [ ] Include enough metadata to identify route destination and urgency.

### Analytics
- [ ] Track event receipt to visible reaction time.
- [ ] Track whether users navigate into the highlighted module after a live event.

### QA
- [ ] Verify no double reactions when page-level and global listeners both receive the same event.
- [ ] Verify stale counters cannot overshoot when refresh lands after websocket update.
- [ ] Verify animation remains understandable during rapid bursts.

### Exit Criteria
- [ ] A single live event updates at least three surfaces coherently.
- [ ] No duplicate pulses or duplicate increments.
- [ ] Users can still act immediately without waiting for motion to finish.

---

## Sprint 3 — Card-To-Screen Morph

**Goal:** Make navigation from mobile home and primary entry points feel spatial and premium.

### Product / UX
- [ ] Finalize the morph routes for first release:
  - [ ] home -> tickets
  - [ ] home -> notifications
  - [ ] home -> payments
  - [ ] home -> resident requests
  - [ ] home -> tech jobs
- [ ] Specify source and destination states:
  - [ ] source pressed
  - [ ] shell expansion
  - [ ] destination header settle
  - [ ] content reveal
- [ ] Define fallback when route has no matching shared destination.

### Frontend
- [ ] Extend `apps/frontend/lib/route-transition-contract.ts` with shared container/surface tokens.
- [ ] Update:
  - [ ] `apps/frontend/components/ui/primary-action-card.tsx`
  - [ ] `apps/frontend/components/ui/mobile-action-hub.tsx`
  - [ ] destination headers/toolbars on matching pages
- [ ] Tune `_app.tsx` route wrapper so page content reveal waits slightly for the morph.
- [ ] Ensure active bottom-nav state settles after the destination header lands, not before.
- [ ] Preserve reduced-motion fallback as a simpler opacity/translate transition.

### QA
- [ ] Verify morph continuity on slow navigation and fast cached navigation.
- [ ] Verify no flash when source and destination load at different times.
- [ ] Verify morph still works in RTL.

### Analytics
- [ ] Track morph-enabled route usage vs non-morph fallback.
- [ ] Measure back navigation within 5 seconds as a proxy for disorientation.

### Exit Criteria
- [ ] Shared morph works on at least 3 high-traffic routes.
- [ ] No broken transitions on unsupported routes.
- [ ] Reduced-motion behavior is stable.

---

## Sprint 4 — Peek/Then/Snap Drawers

**Goal:** Make bottom sheets feel native, layered, and easier to use one-handed.

### Product / UX
- [ ] Define which drawers get snap behavior first:
  - [ ] row action sheet
  - [ ] ticket quick view
  - [ ] payments detail sheet
  - [ ] resident requests detail
- [ ] Define snap points per use case:
  - [ ] peek
  - [ ] half
  - [ ] full
- [ ] Define what content is visible at peek height.

### Frontend
- [ ] Upgrade `apps/frontend/components/ui/ams-drawer.tsx` to support:
  - [ ] drag-to-resize
  - [ ] snap points
  - [ ] velocity-based dismissal
  - [ ] remembered snap point per drawer key
  - [ ] content scroll handoff
- [ ] Update `apps/frontend/components/ui/mobile-row-actions-sheet.tsx` to take advantage of peek mode.
- [ ] Add subtle background scale/backdrop response behind open sheets.
- [ ] Ensure focus management remains correct after adding drag behavior.

### QA
- [ ] Verify inner list scroll does not fight drawer drag.
- [ ] Verify close button, backdrop tap, and downward drag all work consistently.
- [ ] Verify keyboard focus remains trapped correctly on supported devices.

### Analytics
- [ ] Track snap point usage: peek only, expanded, dismissed.
- [ ] Track if users complete primary actions more often from peek state.

### Exit Criteria
- [ ] At least two drawer types support snap points without gesture conflict.
- [ ] Drag interactions feel stable on iOS Safari.

---

## Sprint 5 — Elastic Refresh Canopy

**Goal:** Turn pull-to-refresh into a branded, informative motion pattern.

### Product / UX
- [ ] Define refresh visuals for:
  - [ ] notifications
  - [ ] resident requests
  - [ ] tickets dispatch
- [ ] Define completion states:
  - [ ] no changes
  - [ ] new items added
  - [ ] existing items updated
- [ ] Approve max visual displacement so the gesture stays useful, not theatrical.

### Frontend
- [ ] Use `pullDistance` from `apps/frontend/hooks/use-pull-to-refresh.ts` to animate top-of-page surfaces, not only the indicator chip.
- [ ] Extend `apps/frontend/components/ui/pull-to-refresh-indicator.tsx` with richer delta presentation.
- [ ] Add page-level canopy transforms to the affected screens.
- [ ] Reuse the same threshold presets, but allow route-specific visual tuning.
- [ ] Ensure refresh completion resets gracefully after interrupted pulls.

### Backend
- [ ] Where feasible, return compact delta metadata to support "what changed" messaging.

### QA
- [ ] Verify canopy motion does not cause layout jump.
- [ ] Verify gesture does not trigger when scroll position is not at top.
- [ ] Verify completion chip text matches real delta counts.

### Analytics
- [ ] Track refresh completion rate and immediate follow-up interactions.
- [ ] Track repeated pull attempts within short windows as a possible signal of mistrust or slowness.

### Exit Criteria
- [ ] At least three pages use the canopy pattern.
- [ ] Completion state communicates useful change, not just "updated."

---

## Sprint 6 — Hardening, Rollout, and Regression Shields

**Goal:** Release safely and lock in the new interaction quality.

### Frontend
- [ ] Remove dead code paths from superseded gesture experiments.
- [ ] Consolidate final motion constants and docs.
- [ ] Ensure each feature can be independently disabled by flag.

### QA
- [ ] Add or update Playwright coverage for:
  - [ ] swipe commit and undo
  - [ ] live event visual reaction
  - [ ] route morph continuity
  - [ ] drawer snap interactions
  - [ ] pull-to-refresh canopy
- [ ] Run full mobile matrix:
  - [ ] iPhone Safari
  - [ ] Android Chrome
  - [ ] RTL
  - [ ] dark mode
  - [ ] reduced motion

### Analytics / Product
- [ ] Compare pre/post for:
  - [ ] time to first action
  - [ ] backtrack churn
  - [ ] unread-notification open rate
  - [ ] swipe completion rate
  - [ ] home-to-module navigation speed
- [ ] Decide which flags graduate and which need another sprint.

### DevOps
- [ ] Progressive rollout on `dev` first, then production by route cluster.
- [ ] Watch for:
  - [ ] route transition errors
  - [ ] gesture-related JS errors
  - [ ] unexpected bounce/scroll lock issues
  - [ ] mobile CLS increases

### Exit Criteria
- [ ] All five interaction families are either released or explicitly deferred with rationale.
- [ ] No critical mobile regression remains open.
- [ ] The team has golden-path videos and test coverage for the new interaction system.

---

## Definition Of Done

This program is complete only when all of the following are true:

- [ ] Mobile navigation feels continuous, not page-jumpy.
- [ ] Swipe actions feel decisive and reversible.
- [ ] Bottom sheets feel native and layered.
- [ ] Pull-to-refresh feels branded and informative.
- [ ] Live events update the UI coherently, not as isolated alerts.
- [ ] All behaviors are measurable, tested, and reduced-motion safe.

---

## Immediate Next Step

- [ ] Start Sprint 0 and do not open implementation PRs until flags, analytics contracts, and the motion language are approved.
