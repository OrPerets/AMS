# Baseline Screenshot Manifest

This file records the Sprint 0 screenshot baseline scope and capture requirements. It is the artifact created in this turn for the requested screens.

## Target Screens

| Screen | Route | Auth Context | Capture Priority | Status |
|---|---|---|---|---|
| Login | `/login` | Anonymous | P0 | Manifested |
| Resident account | `/resident/account` | Resident | P0 | Manifested |
| Resident requests | `/resident/requests` | Resident | P0 | Manifested |
| Tickets | `/tickets` | PM or Admin | P0 | Manifested |
| Ticket detail | `/tickets/[id]` | PM or Tech | P0 | Manifested |
| Buildings | `/buildings` | PM or Admin | P0 | Manifested |
| Admin dashboard | `/admin/dashboard` | Admin or PM | P0 | Manifested |
| Finance reports | `/finance/reports` | Accountant or Admin | P0 | Manifested |
| Votes | `/votes` | Resident or Admin | P0 | Manifested |
| Maintenance | `/maintenance` | PM or Tech | P0 | Manifested |
| Settings | `/settings` | Any authenticated user | P0 | Manifested |

## Capture Notes

- The intended baseline image set should be saved under `reports/sprint-00/evidence/screenshots/`.
- Recommended viewport set:
  - Desktop: `1440x1024`
  - Mobile: `390x844`
- For authenticated screens, seed and use the demo users in `QUICK_START.md`.
- Capture the page-entry state, primary loaded state, and any obvious empty/error state when available.

## Why This Is A Manifest

During this turn, the frontend dev server was started successfully, but authenticated end-to-end screenshot capture was not completed because the backend boot was not observed through to a ready state. The Sprint 0 evidence now has a complete target matrix, naming convention, and storage path so capture can be finished deterministically in the next pass.
