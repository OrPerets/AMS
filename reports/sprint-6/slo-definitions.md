# SLO Definitions — Role Home Screen Endpoints

**Date:** 2026-03-26  
**Sprint:** 6 — API Contract, Data Quality, and Reliability

---

## Overview

These SLOs define response time thresholds for endpoints consumed by role home screens.
Violations are tracked via `SloTrackingInterceptor` and exposed at `GET /health/slo`.

## Endpoint SLOs

| Endpoint | p95 (ms) | p99 (ms) | Warning (ms) | Used By |
|----------|----------|----------|-------------|---------|
| `GET /api/v1/dashboard/overview` | 800 | 1500 | 3000 | Admin home |
| `GET /api/v1/tickets` | 400 | 800 | 1500 | Admin, PM home |
| `GET /api/v1/buildings` | 300 | 600 | 1000 | PM home |
| `GET /api/v1/work-orders` | 300 | 600 | 1000 | Tech home |
| `GET /api/v1/invoices` | 500 | 1000 | 2000 | Accountant home |
| `GET /api/v1/invoices/collections/summary` | 600 | 1200 | 2000 | Accountant home |
| `GET /api/v1/budgets` | 300 | 600 | 1000 | Accountant home |
| `GET /api/v1/operations/calendar` | 500 | 1000 | 2000 | Admin, PM, Accountant home |
| `GET /api/v1/notifications/user/:id` | 200 | 500 | 1000 | Tech home |
| `GET /api/v1/maintenance/exceptions` | 400 | 800 | 1500 | Admin home |
| `GET /api/v1/communications/resident-requests` | 400 | 800 | 1500 | PM home |

## Default SLO (all other endpoints)

| p95 | p99 | Warning |
|-----|-----|---------|
| 500ms | 1000ms | 2000ms |

## Monitoring

- The `SloTrackingInterceptor` records timing for every request.
- Metrics are accessible via `GET /health/slo` (no auth required).
- Violations are logged at `WARN` level when exceeding the warning threshold.
- In-memory storage retains the last 1000 request durations per endpoint.

## Alerting Recommendations

- **p95 > threshold for 5 consecutive minutes:** Trigger investigation
- **p99 > threshold for 2 consecutive minutes:** Alert on-call
- **Warning threshold exceeded:** Log and track as incident candidate
- **>10 violations in 1 hour:** Trigger degradation review

## Degradation Strategy

When SLOs are breached, the frontend resilience layer (`shared/api/resilience.ts`) provides:

1. **Graceful fallback:** `resilientFetch()` returns cached/default data on 5xx errors
2. **Parallel degradation:** `resilientFetchAll()` fetches multiple endpoints with per-endpoint fallbacks
3. **Retry with backoff:** `fetchWithRetry()` retries transient failures with exponential backoff

This ensures role home screens remain usable even when individual backend services are slow or unavailable.
