# Shadcn/UI Exploration — Mobile "Wow" Refinements

Date: 2026-03-29
Scope: AMS mobile-first interaction pass (motions, animations, charts, and "live" behavior)

## Why this pass

`ui.shadcn.com` patterns can be layered on top of AMS's existing motion system without introducing a second interaction language. AMS already has shared easing, spring, and duration tokens plus feature-flagged mobile choreography, so the recommendation is to **compose** shadcn primitives with existing tokens/flags rather than replace current behavior.

## What to borrow from shadcn/ui (high signal)

1. **Chart scaffolding (`ChartContainer`, themed tokens, tooltip wrappers)**
   - Use shadcn chart wrappers so Recharts visuals stay consistent in light/dark and role-specific themes.
   - Keep `accessibilityLayer` turned on in all chart surfaces.

2. **Drawer-first interaction model for mobile actions**
   - Shift destructive/secondary action clusters into bottom drawers for thumb ergonomics.
   - Keep quick actions in-card, move deep controls to drawer body.

3. **Skeleton + progressive reveal choreography**
   - Replace static loading states with staged skeleton-to-content transitions.
   - Add brief success micro-affirmations after async actions (e.g., resolve ticket, upload attachment).

4. **Sonner toast lifecycles for async feedback**
   - Prefer pending → success/error promise toasts over abrupt state swaps.
   - Add contextual action affordances (undo/open/details) where recovery is possible.

5. **Carousel/peek rails for horizontal mobile summaries**
   - Use swipeable summary rails for alerts/tasks with clear snap and pagination cues.

## Recommended mobile refinements for AMS

## 1) Motion: establish "hero + utility" rhythm per screen

- **Hero animation budget (first 600ms):** only top module gets emphasized reveal.
- **Utility animation budget:** all remaining elements use faster, lower-distance transitions.
- Reuse `MOBILE_MOTION_PRESET.routeEnter` for screen entry and `sectionEnter` for subsequent cards.
- Keep new durations inside existing token ranges (`fast`/`moderate`/`standard`) to avoid drift.

Implementation note:
- Continue sourcing transition values from `apps/frontend/lib/motion-tokens.ts`.

## 2) Animation: spring-based list reordering and optimistic inserts

- For new live items (work-order updates, announcements), animate insertion with:
  - initial: slight y-offset + 0.98 scale
  - animate: y=0 + scale=1 with `MOTION_SPRING.layout`
- For dismiss/resolve actions, keep current swipe semantics and add a short collapse tail.
- Preserve reduced-motion behavior by degrading to opacity-only transitions.

Implementation note:
- Guard choreography behind `mobile-interactions-live-choreography`.

## 3) Charts: mobile readability before density

- For dashboard cards under ~360px width:
  - hide non-essential grid lines,
  - abbreviate x-axis labels,
  - limit simultaneous series to 2 (primary + comparator),
  - move secondary metrics into legend chips below chart.
- Add soft chart entrance animation (path draw/fade) only once per mount.
- Use chart tooltips with large touch targets and sticky behavior on tap.

Implementation note:
- Standardize chart wrappers in `components/ui/chart` usage and enforce accessible layer.

## 4) "Live" surfaces: make state feel streaming, not refreshing

- Add a **Live pulse badge** only when data is actively updating, not permanently.
- Use subtle diff highlighting for changed values (background tint decay 1.2-1.8s).
- Introduce "last updated" relative timestamp that flips to absolute on long press.
- For feed cards, animate only changed row(s), not whole list rerenders.

Implementation note:
- Reuse `MOBILE_MOTION_PRESET.liveBadge` and existing mobile interaction flags.

## 5) Async delight: convert waits into visible progress narratives

- Replace generic spinners with one of:
  - skeleton for unknown duration,
  - progress bar for measurable steps,
  - toast promise for action completion lifecycle.
- Add "safe interruption" affordance when operation is cancellable.
- For uploads/sync, keep progress state inline in the owning card + mirrored toast.

## 6) Gesture polish: one-handed confidence

- Preserve existing swipe thresholds and add haptic-like visual confirmation band at commit distance.
- Use peek drawers for heavy forms on mobile instead of full-page route jumps.
- Ensure every gesture has an explicit visible fallback control (button/menu) for discoverability/accessibility.

## 7) Wow moments (low-risk, high-impact)

1. **Metric flip animation** for KPI deltas (number tween + color accent flash).
2. **Live timeline sparkline** in cards that have frequent status transitions.
3. **Contextual confetti-lite** (single burst, no particles after 700ms) only for rare wins (e.g., monthly close completed).
4. **AI-style "thinking" shimmer** for generated summaries while response streams.

## Suggested rollout (feature-flagged)

- **Phase 1 (1 sprint):** chart wrappers + skeleton/sonner lifecycle standardization.
- **Phase 2 (1 sprint):** live diff highlighting + insertion choreography.
- **Phase 3 (1 sprint):** gesture polish + 1-2 wow moments behind role-scoped flags.

Use existing gate model in `apps/frontend/lib/mobile-interaction-flags.ts` and add any new flags in the same pattern.

## Success metrics to validate "wow" without regressions

- Time-to-first-meaningful-interaction (mobile) stays flat or improves.
- Dashboard chart interaction rate (tooltip opens / session) increases.
- Undo usage after swipe resolve remains available and reliable.
- Perceived performance score in in-app pulse survey improves.
- No increase in motion-related accessibility complaints.

## Practical next tasks

1. Create a shared `MobileChartCard` primitive with touch-friendly tooltip defaults.
2. Introduce `LiveDiffValue` component for numeric and status transitions.
3. Refactor top 3 loading-heavy screens to skeleton + promise-toast lifecycle.
4. Add one role-specific wow pattern (PM dashboard metric flip) and monitor.
