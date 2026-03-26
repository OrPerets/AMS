# Ownership Map — Large Files & Critical Flows (Sprint 0)

**Date:** 2026-03-26  
**Purpose:** Clarify accountability and refactor sequencing for high-risk areas.

## Largest application-level frontend files (non-node_modules)
| File | Approx size | Suggested owner | Risk summary |
|---|---:|---|---|
| `apps/frontend/lib/i18n.ts` | 83.7 KB | Frontend Platform | Cross-cutting locale risk; broad blast radius.
| `apps/frontend/pages/payments.tsx` | 52.0 KB | Finance Experience Squad | Mixed finance workflows in one page.
| `apps/frontend/pages/payments/resident.tsx` | 50.3 KB | Resident Experience Squad | Resident payment flow complexity.
| `apps/frontend/pages/resident/requests.tsx` | 48.8 KB | Resident Experience Squad | Request lifecycle density.
| `apps/frontend/pages/home.tsx` | 39.7 KB | Role Shell Team | Orchestration hotspot across roles.
| `apps/frontend/components/tickets/dispatch/DispatchWorkspace.tsx` | 37.4 KB | Operations/Tickets Squad | Operational decision surface complexity.
| `apps/frontend/pages/buildings.tsx` | 36.2 KB | Portfolio Squad | Page-level hierarchy inconsistency.
| `apps/frontend/pages/maintenance/index.tsx` | 32.1 KB | Operations Squad | Mixed planning/execution concerns.
| `apps/frontend/pages/resident/account.tsx` | 27.9 KB | Resident Experience Squad | High-traffic account management surface.
| `apps/frontend/pages/settings.tsx` | 27.8 KB | Frontend Platform | Shared settings with role-specific branches.

## Critical flow ownership
| Flow | Frontend owner | Backend owner | QA owner |
|---|---|---|---|
| Login → role resolve → `/home` | Frontend Platform | Auth/API Team | Core Journey QA |
| Home → ticket action | Role Shell Team | Tickets/API Team | Operations QA |
| Home → maintenance/calendar action | Operations Squad | Maintenance/API Team | Operations QA |
| Resident request create/track | Resident Experience Squad | Resident/API Team | Resident QA |
| Payments collection/exception | Finance Experience Squad | Billing/API Team | Finance QA |

## Coordination protocol
1. Any file above 25 KB touched in Sprint 1+ requires explicit owner review.
2. Home/routing/auth changes require joint review from Frontend Platform + Role Shell Team.
3. Critical flow changes require QA scenario update in same pull request.
