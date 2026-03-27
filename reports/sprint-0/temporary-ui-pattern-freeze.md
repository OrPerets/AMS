# Temporary Rule: No New UI Patterns Without Review (Sprint 0)

**Effective date:** 2026-03-26  
**Duration:** Until Sprint 2 shell standardization exit criteria are met.

## Rule
No new mobile UI pattern may be introduced for PM/Admin/Tech flows without explicit UX + Frontend Platform review.

## Applies to
- New layout skeletons.
- New card types for top-level role-home surfaces.
- New navigation affordances or entry widgets.
- New empty/loading/error presentation pattern.

## Approval checklist
- Existing shared pattern cannot satisfy requirement.
- Accessibility impact reviewed.
- Telemetry impact defined.
- Screenshot evidence attached for role(s) and mobile viewport.
- Follow-up task added for pattern library formalization.

## Enforcement
- Pull requests adding a new pattern without checklist completion are blocked.
- QA flags unapproved patterns as release-blocking for impacted role flows.
