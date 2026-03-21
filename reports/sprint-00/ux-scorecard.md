# Sprint 0 UX Scorecard

## Quality Bar

### Reference Implementations

Use these pages as the bar for page structure, skeleton quality, and information hierarchy:

- `apps/frontend/pages/admin/dashboard.tsx`
- `apps/frontend/pages/tickets.tsx`

Why these pages are the benchmark:

- They ship a clear hero or top summary zone.
- Their information hierarchy is explicit instead of flat.
- They use visual grouping and progressive disclosure well.
- The admin dashboard already matches its loading skeleton to the final layout.
- The ticket dispatch page already demonstrates queue-first workflow design.

## Shared Acceptance Rules

Every page should pass all of the following:

1. It has explicit loading, empty, error, and success feedback.
2. It uses shared UI primitives and semantic tokens, not raw controls or one-off grayscale classes.
3. Its primary action is visually dominant and reachable on mobile.
4. Any table has a mobile fallback strategy such as cards, stacked rows, or a reduced column view.
5. Status and badge treatments are semantic, translatable, and understandable without internal enum knowledge.
6. Interactive cards, rows, and KPI blocks are keyboard reachable and show focus-visible styles.
7. RTL layout uses logical properties where interaction or icon placement matters.
8. Failures are visible to the user and provide a retry or next step.

## Baseline KPI Tracker

| KPI | Sprint 0 Baseline | Source / Rule |
|---|---:|---|
| Task success rate | TBD | Requires analytics instrumentation; define events before Sprint 2. |
| Ticket handling time | TBD | Requires operational telemetry from ticket lifecycle timestamps. |
| Resident payment completion rate | TBD | Requires payment funnel instrumentation. |
| Mobile completion rate | TBD | Requires client analytics by viewport/device class. |
| Files still using raw controls | 14 | `rg` audit across pages/components outside `components/ui`. |
| Pages/components still missing skeleton-quality loading states | 14 | `rg` audit for bare loading text. |
| Files with hardcoded color drift | 29 | `rg` audit for slate/gray/blue/amber/etc classes. |
| Files with weak console-only error handling in user flows | 29 | `rg` audit for `console.error` / `console.warn`. |
| Files with RTL-unsafe physical positioning | 10 | `rg` audit for `left-*` / `right-*` classes. |
| Files with probable touch-target issues | Systemic | Base `Button`, `Input`, and `Select` default to `h-10`; `icon-sm` and pagination controls reach `32px`. |

## Experience Scoring Rubric

Use this scorecard at the end of every sprint. Score each dimension from `1` to `5`.

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| Brand cohesion | Fragmented and generic | Mostly aligned with some drift | One clear premium visual identity |
| State quality | Missing or text-only states | States exist but vary page to page | Reusable, polished, and consistent |
| Accessibility | Keyboard/RTL/touch gaps are common | Major flows mostly work | Accessibility feels designed-in |
| Mobile quality | Desktop-first adaptation | Good on key flows only | Native-feeling mobile patterns |
| Workflow sharpness | Functional but slow | Reasonable flow and hierarchy | Fast, intentional, and role-aware |
| Trust and clarity | Internal labels leak through | Mostly clear with some rough edges | User language, clear status, strong confidence |

## Priority Baseline Risks

- Finance reports remain the clearest design-system regression.
- Resident account is central but still uses bare loading and weak hierarchy.
- Votes remain a prototype-quality experience because of hardcoded building context and weak feedback.
- Touch-target debt exists in shared primitives, so it affects nearly every role.
- RTL regressions are still possible because icon placement often uses physical left/right classes.
