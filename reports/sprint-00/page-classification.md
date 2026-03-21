# Sprint 0 Page Classification

Classification key:

- `Showcase`: already close to the target quality bar.
- `Solid`: functional and mostly coherent, but not a benchmark yet.
- `Needs Upgrade`: usable but clearly below the target experience.
- `Critical Fix`: experience debt is severe enough that it undermines trust or consistency.

| Route File | Primary Role | Tag | Reason |
|---|---|---|---|
| `apps/frontend/pages/index.tsx` | Marketing | Showcase | Strong premium landing expression and branded atmosphere. |
| `apps/frontend/pages/login.tsx` | All | Needs Upgrade | Clean structure, but demo credentials and stale footer reduce trust. |
| `apps/frontend/pages/home.tsx` | All | Needs Upgrade | Role hub is useful but still relies on bare loading and click-heavy cards. |
| `apps/frontend/pages/role-selection.tsx` | MASTER | Solid | Clear choice flow, but still uses decorative color drift and click-card affordances. |
| `apps/frontend/pages/settings.tsx` | All | Solid | Functional profile/settings flow with feedback, but not visually elevated. |
| `apps/frontend/pages/support.tsx` | All | Solid | Acceptable supporting page, not currently a design-debt hotspot. |
| `apps/frontend/pages/privacy.tsx` | All | Solid | Static/legal content with low UX risk. |
| `apps/frontend/pages/terms.tsx` | All | Solid | Static/legal content with low UX risk. |
| `apps/frontend/pages/404.tsx` | All | Solid | Basic but serviceable error page. |
| `apps/frontend/pages/_error.tsx` | All | Solid | Basic but serviceable error page. |
| `apps/frontend/pages/admin/dashboard.tsx` | Admin, PM | Showcase | Best current benchmark for hierarchy, editorial layout, and skeleton parity. |
| `apps/frontend/pages/admin/activity.tsx` | Admin | Solid | Useful operational page; needs only system-level polish. |
| `apps/frontend/pages/admin/approvals.tsx` | Admin | Needs Upgrade | Raw filter controls and limited state quality hold it back. |
| `apps/frontend/pages/admin/data-quality.tsx` | Admin | Solid | Clear purpose, but not yet polished enough to be a reference page. |
| `apps/frontend/pages/admin/notifications.tsx` | Admin | Solid | Functional and action-oriented, though not visually distinctive. |
| `apps/frontend/pages/admin/security.tsx` | Admin | Solid | Operationally clear, but still depends on generic patterns. |
| `apps/frontend/pages/admin/unpaid-invoices.tsx` | Admin | Needs Upgrade | Raw inputs and dense tables need stronger system styling. |
| `apps/frontend/pages/assets.tsx` | PM, Admin | Solid | Core list flow is coherent, but color drift and custom controls remain. |
| `apps/frontend/pages/assets/[id].tsx` | PM, Admin | Solid | Detailed and useful; could improve interaction density and consistency. |
| `apps/frontend/pages/assets/[id]/edit.tsx` | PM, Admin | Solid | Typical edit form without major red flags. |
| `apps/frontend/pages/assets/new.tsx` | PM, Admin | Solid | Typical create form; acceptable foundation. |
| `apps/frontend/pages/buildings.tsx` | PM, Admin | Showcase | Strongest non-dashboard information architecture after tickets. |
| `apps/frontend/pages/buildings/[id].tsx` | PM, Admin | Solid | Rich detail page, but clickable rows and supporting states need work. |
| `apps/frontend/pages/buildings/[id]/edit.tsx` | PM, Admin | Solid | Straightforward edit page with manageable debt. |
| `apps/frontend/pages/buildings/new.tsx` | PM, Admin | Solid | Functional create flow with moderate polish needs. |
| `apps/frontend/pages/communications.tsx` | PM, Admin | Solid | Strong split-view behavior; still needs shared state polish. |
| `apps/frontend/pages/communications/announcements.tsx` | PM, Admin | Needs Upgrade | Raw selects and mixed form patterns weaken the composer. |
| `apps/frontend/pages/contracts.tsx` | PM, Admin | Needs Upgrade | Raw controls and generic layout reduce trust in an approval-heavy workflow. |
| `apps/frontend/pages/create-call.tsx` | Resident | Needs Upgrade | Important mobile flow still uses raw controls and weak loading states. |
| `apps/frontend/pages/documents.tsx` | Resident, PM | Solid | Good structure and state handling overall. |
| `apps/frontend/pages/finance/analytics.tsx` | Accountant, Admin | Solid | Supporting analytics view with less debt than reports. |
| `apps/frontend/pages/finance/budgets.tsx` | Accountant, Admin | Needs Upgrade | Mixed controls and warning-color drift make the page inconsistent. |
| `apps/frontend/pages/finance/reports.tsx` | Accountant, Admin | Critical Fix | Raw HTML controls, hardcoded grays, and silent failures make it feel off-brand. |
| `apps/frontend/pages/maintenance/index.tsx` | PM, Tech | Needs Upgrade | Core workflow still relies on raw selects and text-only loading. |
| `apps/frontend/pages/maintenance/[id].tsx` | PM, Tech | Needs Upgrade | Detail view still falls back to bare loading and generic structure. |
| `apps/frontend/pages/maintenance/reports.tsx` | PM, Tech | Needs Upgrade | Same foundation issues as maintenance index. |
| `apps/frontend/pages/maya-dashboard.tsx` | PM | Needs Upgrade | Duplicate logic and visual drift make it weaker than the admin dashboard. |
| `apps/frontend/pages/notifications.tsx` | All | Solid | Good utility page, but dense small actions hurt mobile quality. |
| `apps/frontend/pages/operations/calendar.tsx` | PM | Needs Upgrade | Useful concept, but raw filters and unclear value presentation. |
| `apps/frontend/pages/payments.tsx` | Resident, Accountant | Needs Upgrade | Powerful but dense; raw controls and mobile action density need cleanup. |
| `apps/frontend/pages/resident/account.tsx` | Resident | Critical Fix | High-value daily page still has flat hierarchy, bare loading, and confusing payment UX. |
| `apps/frontend/pages/resident/requests.tsx` | Resident | Needs Upgrade | Raw selects and limited state polish on an important self-service flow. |
| `apps/frontend/pages/schedules/index.tsx` | PM, Tech | Needs Upgrade | Text-only loading and click-card patterns keep it below standard. |
| `apps/frontend/pages/schedules/[id].tsx` | PM, Tech | Needs Upgrade | Same state-quality issues as index. |
| `apps/frontend/pages/schedules/create.tsx` | PM, Tech | Solid | Functional create flow; mostly needs system-level polish. |
| `apps/frontend/pages/tech/jobs.tsx` | Tech | Showcase | Strong task-centric workflow and quality of feedback. |
| `apps/frontend/pages/tickets.tsx` | PM, Admin | Showcase | Best workflow page in the product. |
| `apps/frontend/pages/tickets/[id].tsx` | PM, Tech | Needs Upgrade | Falls behind the dispatch console in state quality and action ergonomics. |
| `apps/frontend/pages/units/[id].tsx` | PM, Admin | Solid | Detailed but not yet elevated. |
| `apps/frontend/pages/units/[id]/edit.tsx` | PM, Admin | Solid | Standard edit flow. |
| `apps/frontend/pages/units/new.tsx` | PM, Admin | Solid | Standard create flow. |
| `apps/frontend/pages/vendors.tsx` | PM, Admin | Solid | Functional management page with acceptable state handling. |
| `apps/frontend/pages/votes/index.tsx` | Resident, Admin | Critical Fix | Hardcoded building context, bare loading, and click-only cards. |
| `apps/frontend/pages/votes/[id].tsx` | Resident, Admin | Needs Upgrade | Ad hoc styling and weak consistency with the rest of the product. |
| `apps/frontend/pages/votes/create.tsx` | Admin, PM | Solid | Serviceable creator flow, but still tied to the weaker vote system. |
| `apps/frontend/pages/work-orders/[id].tsx` | PM, Tech | Needs Upgrade | Bare loading and smaller action affordances on an operational detail page. |
| `apps/frontend/pages/work-orders/reports.tsx` | PM, Admin | Solid | Reporting page is usable, though badge semantics still drift. |

## Summary

| Tag | Count |
|---|---:|
| Showcase | 6 |
| Solid | 25 |
| Needs Upgrade | 20 |
| Critical Fix | 4 |

The current product already has credible reference pages. The main challenge is not capability; it is consistency.
