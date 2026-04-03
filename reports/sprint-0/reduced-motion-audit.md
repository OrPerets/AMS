# Sprint 0 Reduced-Motion Audit

Date: 2026-03-28

## Audited Surfaces
- `apps/frontend/components/ui/mobile-swipe-action-card.tsx`
- `apps/frontend/components/ui/mobile-priority-inbox.tsx`
- `apps/frontend/hooks/use-pull-to-refresh.ts`

## Findings
- Swipe cards already gate spring transitions through `useReducedMotion`.
- Priority inbox swipe path already avoids drag animation when reduced motion is enabled.
- Pull-to-refresh flow preserves functional refresh semantics without requiring kinetic effects.

## Gaps Addressed in Sprint 0
- Centralized interaction thresholds in motion tokens for consistent reduced-motion fallback behavior.
- Added lifecycle instrumentation so reduced-motion paths are still measurable (start/commit/cancel/undo).

## Remaining Follow-ups
- Add a dedicated reduced-motion visual regression suite for top 6 mobile routes.
- Verify all drawer/sheet interactions use a shared reduced-motion contract.
