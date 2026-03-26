# UX Audit Board (Sprint 0)

**Date:** 2026-03-26  
**Scope:** Multi-role mobile first-view and navigation clarity  
**Method:** Repository walkthrough + role-home screenshot evidence + route inspection.

## Severity rubric
- **S1 (Critical):** blocks first meaningful action in first viewport.
- **S2 (High):** slows first action by introducing route or hierarchy ambiguity.
- **S3 (Medium):** inconsistent but recoverable via user effort.
- **S4 (Low):** polish issue with low task-completion impact.

## Evidence set
- Existing screenshot set in `reports/mobile-role-gallery` was reused for role-home first-view assessment.
- High-use pages were selected from role homes and nav primary destinations.

## Top 20 pages by usage proxy and clarity status
| # | Page/Route | Primary roles | Severity | First-view clarity blocker |
|---|---|---|---|---|
| 1 | `/home` | All | S2 | Role-specific content clear, but shell contract differs by role.
| 2 | `/tickets` | PM/Admin/Tech | S1 | Dense action field and competing paths to same intent.
| 3 | `/maintenance` | PM/Admin/Tech | S2 | First viewport emphasizes overview over immediate next action.
| 4 | `/operations/calendar` | PM/Admin | S2 | Calendar controls dominate action stack.
| 5 | `/buildings` | PM/Admin | S2 | Context and next action mixed in same hierarchy layer.
| 6 | `/assets` | PM/Admin | S2 | High cognitive load from parallel cards and filters.
| 7 | `/communications` | PM/Admin | S2 | Message types and destinations not clearly separated.
| 8 | `/notifications` | All | S3 | Inconsistent categorization across roles.
| 9 | `/settings` | All | S3 | Large surface without clear quick-task lanes.
| 10 | `/resident/account` | Resident | S2 | Good structure, but long vertical stack delays key actions.
| 11 | `/payments` | PM/Admin/Accountant | S2 | Collection vs analytics intent not immediately distinct.
| 12 | `/payments/resident` | Resident | S3 | Multi-card density before primary action.
| 13 | `/finance/budgets` | PM/Admin/Accountant | S3 | Terminology and targets vary by context.
| 14 | `/finance/reports` | PM/Admin/Accountant | S3 | Exploration-oriented entry increases taps to routine tasks.
| 15 | `/documents` | PM/Admin | S3 | Upload and retrieval actions compete visually.
| 16 | `/vendors` | PM/Admin | S3 | Contact and contract management mixed.
| 17 | `/contracts` | PM/Admin | S3 | Missing prioritized workflow entry points.
| 18 | `/tech/jobs` | Tech | S2 | Operational queue and detail pathways overloaded.
| 19 | `/admin/dashboard` | Admin/PM | S3 | KPI-heavy first viewport hides operational next step.
| 20 | `/gardens` | PM/Tech | S2 | Role-specific entry flow differs from platform shell.

## Screenshot annotation index
- PM home: `reports/mobile-role-gallery/pm-home-mobile.png` (quick actions visible, but action hierarchy differs from Admin/Tech).
- Admin home: `reports/mobile-role-gallery/admin-home-mobile.png` (good KPI surfacing, primary action discoverability can be improved).
- Tech home: `reports/mobile-role-gallery/tech-home-mobile.png` (queue-oriented, needs shell parity with PM/Admin).
- Master home: `reports/mobile-role-gallery/master-home-mobile.png` (cross-role affordances, but unique framing risks inconsistency).
- Resident account: `reports/mobile-role-gallery/resident-account-mobile.png` (closest to desired clarity baseline).

## Key bottlenecks captured
1. Role-home shell divergence for PM/Admin/Tech and Master.
2. Multiple modules prioritize summary over immediate action in first viewport.
3. Shared pages have inconsistent filter/action bar patterns.
4. Navigation labels and destinations overlap between top-level and “More” surfaces.
