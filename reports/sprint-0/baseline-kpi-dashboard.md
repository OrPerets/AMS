# Baseline KPI Dashboard Definition (Sprint 0)

**Date:** 2026-03-26  
**Goal:** Establish measurable pre-refactor baseline for UX clarity and navigation efficiency.

## KPI definitions
| KPI | Definition | Event inputs | Baseline target in Sprint 0 |
|---|---|---|---|
| Time to first meaningful action (TTFMA) | Time from route render to first high-value action click | `screen_view`, `first_action_click` | Instrumented and captured for all six roles |
| Taps to top action | Count of taps before first high-value action | `tap`, `first_action_click` | Baseline percentile per role established |
| Abandoned navigation rate | Session enters >2 navigation hops without action completion | `nav_transition`, `action_complete` | Baseline by top 20 routes established |
| Support tickets: role/page confusion | Weekly support tickets tagged with UX confusion taxonomy | Support tags + route metadata | Initial weekly rate recorded |

## Collection plan
1. Add route metadata and role context to all `screen_view` events.
2. Define role-specific “top action” event maps.
3. Enable QA-assisted synthetic runs (role × top tasks) to seed initial data.
4. Pull prior-week support tags and map to route clusters.

## Baseline table template
| Role | Median TTFMA | P75 taps to top action | Abandonment rate | Weekly confusion tickets |
|---|---:|---:|---:|---:|
| ADMIN | TBD | TBD | TBD | TBD |
| PM | TBD | TBD | TBD | TBD |
| TECH | TBD | TBD | TBD | TBD |
| RESIDENT | TBD | TBD | TBD | TBD |
| ACCOUNTANT | TBD | TBD | TBD | TBD |
| MASTER | TBD | TBD | TBD | TBD |

## QA matrix baseline checkpoints
- Role × Theme (light/dark)
- Role × Direction (LTR/RTL)
- Role × Breakpoint (mobile common widths)

## Ownership
- Product analytics: KPI definitions + dashboard publication.
- Frontend: event emission consistency.
- QA: synthetic-path baseline runbook.
- Support ops: taxonomy and weekly confusion trend.
