# Route/Role Matrix (Sprint 0)

**Date:** 2026-03-26  
**Sources:** `apps/frontend/lib/navigation.ts`, `apps/frontend/lib/auth.ts`, `apps/frontend/pages/home.tsx`, `apps/frontend/pages/role-selection.tsx`.

## Entry and capability matrix (baseline)
| Role | Normalized aliases (current) | Default entry route | Mobile primary tabs (current model) | Risks observed |
|---|---|---|---|---|
| ADMIN | ADMIN, ADMINISTRATOR, SYSTEM_ADMIN | `/home` | Home, Tickets, Dashboard, Operations | Duplicate operational routes across tabs/more groups.
| PM | PM, MANAGER, PROPERTY_MANAGER | `/home` | Home, Tickets, Dashboard, Operations | PM mirrors Admin heavily; capability boundaries not explicit.
| TECH | TECH, TECHNICIAN, WORKER | `/home` | Home, Jobs/Tickets, Schedule, More | Potential mismatch between queue-first workflow and shared labels.
| RESIDENT | RESIDENT, TENANT | `/home` | Home, Requests, Payments, Account | Best clarity baseline, but some account stack depth remains high.
| ACCOUNTANT | ACCOUNTANT, ACCOUNTING | `/home` | Home, Payments, Reports, More | Finance naming inconsistency across sections.
| MASTER | MASTER, SUPER_ADMIN | `/home` | Home, Oversight, Admin tools, More | Impersonation path precedence requires explicit resolver contract.

## Primary actions baseline (current expected)
| Role | Top task | Primary action target |
|---|---|---|
| ADMIN | Resolve operations blocker | Open urgent ticket queue (`/tickets`). |
| PM | Coordinate property operations | Open operations calendar or active tickets. |
| TECH | Execute assigned work | Open jobs queue (`/tech/jobs` or `/tickets` depending on config). |
| RESIDENT | Submit/track requests | Create/view resident requests. |
| ACCOUNTANT | Process payment workflow | Open payment collections and exceptions. |
| MASTER | Cross-workspace supervision | Open oversight/dashboard and impersonation path. |

## Dead-route / ambiguity candidates
1. Duplicate feature exposure between mobile primary and More groups (e.g., operations-related links).
2. Multiple labels for similar destinations (dashboard/reporting contexts).
3. Role fallback handling split across auth and page layers.

## Sprint 1 handoff notes
- Convert matrix into executable fixtures for resolver tests.
- Attach telemetry IDs for entry-route decision and unsupported-role states.
