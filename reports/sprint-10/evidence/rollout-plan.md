# Sprint 10 Rollout Plan

## Release Order

1. Ship the shared UI foundations first.
2. Ship higher-risk workflow changes to internal users next.
3. Expand to the broader tenant population after the internal pass is quiet.

## Flag / Gate Guidance

- Keep high-risk dispatch behavior behind a release toggle if:
  - triage recommendations change assignment decisions,
  - bulk actions affect live ticket ownership,
  - mobile navigation changes are still producing support noise.
- Lower-risk presentation changes can ship directly once the sprint QA suite stays green.

## Internal Rollout Slice

- PM/Admin first:
  - admin dashboard
  - dispatch workspace
  - finance reports
  - maintenance
- Resident follow-up slice:
  - resident account
  - resident requests
  - votes

## Exit Criteria Before Broad Release

- `npm run test:sprint-10` remains green.
- No blocking regressions in internal PM/Admin usage.
- No unresolved mobile shell or ticket-workspace defects.
- Tier-1 screenshot review is accepted.
