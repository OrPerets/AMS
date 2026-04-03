# Mobile Interaction QA Checklist Template

- Sprint:
- Route:
- Role:
- Device + OS:
- Browser:
- Locale/Direction (LTR/RTL):
- Reduced motion setting:

## Gesture Integrity
- [ ] Swipe does not block vertical scroll.
- [ ] Swipe threshold feedback fires once per crossing.
- [ ] Cancelled swipe preserves tap behavior.
- [ ] Drawer drag does not hijack inner scroll.
- [ ] Pull-to-refresh does not trigger on normal page drag.

## Commit / Undo
- [ ] Commit visually confirms state change.
- [ ] Optimistic removal updates row/list counts.
- [ ] Undo restores row position/state.
- [ ] No duplicate API call on repeat gesture.

## Live/Realtime
- [ ] Event-driven badges and counters update once.
- [ ] No duplicate pulse when local + global listeners run.
- [ ] Refresh merge does not overshoot counters.

## Accessibility / Motion
- [ ] Reduced-motion fallback is active and understandable.
- [ ] Focus/keyboard interaction still works after gestures.
- [ ] Contrast remains compliant in action states.

## Evidence
- [ ] Short video captured.
- [ ] Regression diff reviewed against baseline.
- [ ] Issues logged with reproduction steps.
