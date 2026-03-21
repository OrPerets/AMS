# Sprint Definition of Done

Use this checklist before closing any UI sprint.

- Scope is mapped to concrete files, components, and acceptance criteria.
- New UI uses shared primitives and semantic tokens only.
- Loading, empty, error, and success states are implemented.
- Keyboard navigation and focus-visible behavior are verified.
- Touch targets meet the mobile target size rule for coarse pointers.
- RTL layout is verified for icon placement, padding, and alignment.
- Any table or dense list has a defined mobile strategy.
- Status badges and labels are user-readable and semantically styled.
- Screenshots or equivalent visual evidence are captured.
- Regression notes, KPI impact, and remaining risks are documented.

Hard stop rules:

- No new raw HTML form controls on app pages unless wrapped immediately afterward into a shared primitive.
- No new hardcoded grayscale or brand colors on product pages.
- No new text-only loading placeholders on page entry states.
- No silent failures where the user receives no visible feedback.
