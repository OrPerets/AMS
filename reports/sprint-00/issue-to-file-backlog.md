# Sprint 0 Issue-to-File Backlog

## Tracking Matrix

| Issue | Impact | Role Affected | Platform | File / Component Owner | Effort | Sprint Target |
|---|---|---|---|---|---|---|
| Finance reports uses raw controls and non-semantic gray palette | High | Accountant, Admin, PM | Desktop + Mobile | `apps/frontend/pages/finance/reports.tsx` | M | Sprint 1 |
| Resident account enters with bare text loading and flat card hierarchy | High | Resident | Desktop + Mobile | `apps/frontend/pages/resident/account.tsx` | M | Sprint 2 |
| Votes page hardcodes building context and lacks resilient feedback | High | Resident, Admin | Desktop + Mobile | `apps/frontend/pages/votes/index.tsx` | M | Sprint 2 |
| Vote detail uses ad hoc badge colors and interaction patterns | Medium | Resident | Desktop + Mobile | `apps/frontend/pages/votes/[id].tsx` | M | Sprint 2 |
| Login page ships prefilled demo credentials and static copyright year | High | All | Desktop + Mobile | `apps/frontend/pages/login.tsx` | S | Sprint 2 |
| Shared input component uses physical left/right icon positioning | High | All | Mobile + RTL | `apps/frontend/components/ui/input.tsx` | S | Sprint 2 |
| Shared button/input/select default sizes undershoot coarse-pointer target | High | All | Mobile | `apps/frontend/components/ui/button.tsx`, `apps/frontend/components/ui/input.tsx`, `apps/frontend/components/ui/select.tsx` | M | Sprint 2 |
| Data table pagination and small action buttons remain undersized | High | Admin, PM, Accountant | Mobile | `apps/frontend/components/ui/data-table.tsx` | M | Sprint 2 |
| File upload is still drag-and-drop centric on touch screens | Medium | Resident, PM | Mobile | `apps/frontend/components/ui/file-upload.tsx` | M | Sprint 2 |
| Notification center uses many small filter/action buttons | Medium | All | Mobile | `apps/frontend/components/ui/notification-center.tsx` | S | Sprint 2 |
| Maintenance pages still use raw selects and bare loading | High | PM, Tech | Desktop + Mobile | `apps/frontend/pages/maintenance/index.tsx`, `apps/frontend/pages/maintenance/reports.tsx`, `apps/frontend/pages/maintenance/[id].tsx` | M | Sprint 2 |
| Schedule pages still fall back to text-only loading states | Medium | PM, Tech | Desktop + Mobile | `apps/frontend/pages/schedules/index.tsx`, `apps/frontend/pages/schedules/[id].tsx` | S | Sprint 2 |
| Ticket detail still uses bare loading and small action buttons | Medium | PM, Tech | Desktop + Mobile | `apps/frontend/pages/tickets/[id].tsx` | S | Sprint 2 |
| Resident requests still use raw select controls | Medium | Resident | Mobile | `apps/frontend/pages/resident/requests.tsx` | M | Sprint 2 |
| Payments page still mixes raw select controls with dense actions | Medium | Resident, Accountant | Desktop + Mobile | `apps/frontend/pages/payments.tsx` | M | Sprint 2 |
| Announcement composer still uses raw select controls | Medium | PM, Admin | Desktop + Mobile | `apps/frontend/pages/communications/announcements.tsx` | M | Sprint 2 |
| Contracts page still uses raw select controls | Medium | PM, Admin | Desktop + Mobile | `apps/frontend/pages/contracts.tsx` | S | Sprint 2 |
| Admin approvals page still uses raw select filters | Low | Admin | Desktop + Mobile | `apps/frontend/pages/admin/approvals.tsx` | S | Sprint 2 |
| Hardcoded color drift remains on dashboard, tickets, votes, finance charts, maintenance widgets | High | All | Desktop + Mobile | `apps/frontend/pages/admin/dashboard.tsx`, `apps/frontend/pages/tickets.tsx`, `apps/frontend/pages/votes/*`, `apps/frontend/components/finance/*`, `apps/frontend/components/maintenance/*` | L | Sprint 1 |
| Several interactive cards rely on click-only affordances without explicit keyboard semantics | Medium | All | Desktop | `apps/frontend/pages/votes/index.tsx`, `apps/frontend/pages/buildings/[id].tsx`, `apps/frontend/pages/schedules/index.tsx`, `apps/frontend/pages/home.tsx`, `apps/frontend/components/ui/kpi-card.tsx` | M | Sprint 2 |
| Header/sidebar controls include 32px to 36px hotspots | Medium | All | Mobile | `apps/frontend/components/layout/Header.tsx`, `apps/frontend/components/layout/UserMenu.tsx`, `apps/frontend/components/layout/Sidebar.tsx` | M | Sprint 2 |
| Weak console-only error handling still appears in finance, votes, schedules, create-call, and admin sections | High | All | Desktop + Mobile | `apps/frontend/pages/finance/reports.tsx`, `apps/frontend/pages/votes/*`, `apps/frontend/pages/schedules/*`, `apps/frontend/pages/create-call.tsx`, `apps/frontend/pages/admin/*` | M | Sprint 2 |
| Shared semantic badge system is inconsistent across work orders, schedules, assets, and votes | Medium | All | Desktop + Mobile | `apps/frontend/components/ui/asset-card.tsx`, `apps/frontend/components/ui/maintenance-calendar.tsx`, `apps/frontend/pages/work-orders/reports.tsx`, `apps/frontend/pages/schedules/*`, `apps/frontend/pages/votes/*` | M | Sprint 1 |

## UI Debt Inventory

### Baseline Counts

| Debt Type | Baseline | Notes |
|---|---:|---|
| Hardcoded color drift files | 29 | Includes dashboard, votes, finance charts, maintenance widgets, and notification surfaces. |
| Raw control files | 14 | Mostly `select`, some `input`, and a few plain `button` usages outside shared UI primitives. |
| Bare loading state files | 14 | Primarily page-entry states returning `טוען...` or equivalent. |
| Weak console-only error files | 29 | User-facing flows still log to console without strong inline recovery. |
| RTL-unsafe physical positioning files | 10 | Shared input plus several page-level search and action affordances. |
| Probable clickable accessibility risk files | 20 | Cards/rows/containers advertise clickability without a consistent keyboard contract. |
| Shared touch-target debt | Systemic | `h-10` defaults mean 40px controls; `icon-sm` and table pagination reach 32px. |

### Raw HTML Controls

Target files:

- `apps/frontend/pages/admin/approvals.tsx`
- `apps/frontend/pages/admin/unpaid-invoices.tsx`
- `apps/frontend/pages/communications/announcements.tsx`
- `apps/frontend/pages/contracts.tsx`
- `apps/frontend/pages/create-call.tsx`
- `apps/frontend/pages/finance/budgets.tsx`
- `apps/frontend/pages/finance/reports.tsx`
- `apps/frontend/pages/maintenance/index.tsx`
- `apps/frontend/pages/maintenance/reports.tsx`
- `apps/frontend/pages/operations/calendar.tsx`
- `apps/frontend/pages/payments.tsx`
- `apps/frontend/pages/resident/requests.tsx`
- `apps/frontend/pages/tickets.tsx`
- `apps/frontend/pages/votes/[id].tsx`

### Bare Loading States

Target pages:

- `apps/frontend/pages/create-call.tsx`
- `apps/frontend/pages/finance/reports.tsx`
- `apps/frontend/pages/home.tsx`
- `apps/frontend/pages/maintenance/[id].tsx`
- `apps/frontend/pages/maintenance/index.tsx`
- `apps/frontend/pages/maintenance/reports.tsx`
- `apps/frontend/pages/payments.tsx`
- `apps/frontend/pages/resident/account.tsx`
- `apps/frontend/pages/schedules/[id].tsx`
- `apps/frontend/pages/schedules/index.tsx`
- `apps/frontend/pages/tickets/[id].tsx`
- `apps/frontend/pages/votes/[id].tsx`
- `apps/frontend/pages/votes/index.tsx`
- `apps/frontend/pages/work-orders/[id].tsx`

### RTL / Logical Property Fixes

Highest-priority files:

- `apps/frontend/components/ui/input.tsx`
- `apps/frontend/pages/assets.tsx`
- `apps/frontend/pages/create-call.tsx`
- `apps/frontend/pages/documents.tsx`

### Clickability / Accessibility Risks

Highest-priority files:

- `apps/frontend/pages/votes/index.tsx`
- `apps/frontend/pages/buildings/[id].tsx`
- `apps/frontend/pages/schedules/index.tsx`
- `apps/frontend/pages/home.tsx`
- `apps/frontend/components/ui/kpi-card.tsx`
- `apps/frontend/components/maintenance/maintenance-task-table.tsx`

### Reference Notes

- Treat `apps/frontend/pages/admin/dashboard.tsx` as the benchmark for dashboard skeleton quality.
- Treat `apps/frontend/pages/tickets.tsx` as the benchmark for workflow-oriented hierarchy and master-detail composition.
