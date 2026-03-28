# Sprint 1 — Swipe-To-Resolve Product/UX Spec

Date: 2026-03-28

## First-release row types
- [x] Resident requests
- [x] Tech jobs
- [x] Tickets dispatch rows
- [x] Priority inbox items

## Per-tone behavior
- **warning:** softer confirmation haptic at threshold and commit.
- **danger:** stronger resistance semantics + warning haptic at commit threshold.
- **success:** lighter completion haptic and faster settle.

## Undo copy by action type
- Resident request: "הבקשה סומנה לטיפול" + action "בטל"
- Tech jobs: "המשימה הועברה לביצוע" + action "בטל"
- Tickets dispatch: "הקריאה סומנה לטיפול" + action "בטל"
- Priority inbox: "הפריט הועבר לטיפול" + action "בטל"

## Analytics contract
- `interaction_started`
- `interaction_threshold_reached`
- `interaction_committed`
- `interaction_undone`
- `interaction_cancelled`

All events include route and surface context fields for downstream analysis.
