# Sprint 6 — API Response Shape Audit Report

**Date:** 2026-03-26  
**Scope:** Mobile-critical backend endpoints  

---

## Executive Summary

The backend exposes ~100+ endpoints across 10 mobile-critical modules. Response shapes are **inconsistent**: some return raw Prisma models, others use ad-hoc mapped objects, and several mix shapes within the same endpoint (e.g., tickets GET returns an array or a dispatch envelope depending on query params).

### Key Findings

| Issue | Severity | Affected Modules |
|-------|----------|-----------------|
| No standard list envelope (`{ items, meta }`) | High | Tickets, Buildings, Maintenance, Communications, Budgets |
| Same endpoint returns different shapes by query param | High | Tickets (array vs dispatch object) |
| Void responses on POST mutations | Medium | Notifications (notifyBuilding, notifyTenants) |
| Mixed mapped vs raw Prisma on same entity | Medium | Payments (mapInvoice vs raw Invoice) |
| No pagination support on list endpoints | Medium | All modules (only tickets has optional `limit`) |
| CSV/PDF variants on JSON endpoints | Low | Payments, Budgets, Dashboard |
| Non-serializable return values | High | Notifications (subscribe returns callback) |

---

## Module-by-Module Findings

### Dashboard (`api/v1/dashboard/*`)
- **Pattern:** Custom aggregate objects (not Prisma)
- **Issues:** Export endpoint returns CSV (not JSON) — needs separate content negotiation
- **Recommendation:** Stable; document schemas as-is

### Tickets (`api/v1/tickets`)
- **Pattern:** Mixed — array vs dispatch envelope on same GET endpoint
- **Issues:** `view=dispatch` returns `{ items, queueCounts, summary, filterOptions, workload, riskSummary, meta }` while default returns `Ticket[]`
- **Recommendation:** Split into separate endpoints or always return wrapped shape

### Buildings (`api/v1/buildings/*`)
- **Pattern:** Mostly raw Prisma with varying include depths
- **Issues:** `details` vs `overview` vs bare GET return different shapes for same building
- **Recommendation:** Standardize include depth per endpoint; document

### Maintenance (`api/v1/maintenance/*`)
- **Pattern:** Prisma schedules + custom aggregates for exceptions
- **Issues:** `exceptions` and `cost-projection` are bespoke objects
- **Recommendation:** Document; consider extracting to separate reporting endpoints

### Payments (`api/v1/invoices/*`, `api/v1/payments/*`)
- **Pattern:** Lowest consistency — `mapInvoice` vs raw Prisma vs `{ ok: true }` vs PDF
- **Issues:** `confirmPayment` returns raw Prisma Invoice, most others use `mapInvoice`
- **Recommendation:** Standardize all invoice responses through `mapInvoice`; add typed response DTOs

### Notifications (`api/v1/notifications/*`)
- **Pattern:** Inconsistent — void, User, Notification, callback
- **Issues:** `notifyBuilding`/`notifyTenants` return void; subscribe returns non-serializable callback
- **Recommendation:** All mutations should return `{ ok: true }` or the created resource

### Work Orders (`api/v1/work-orders/*`)
- **Pattern:** Consistent Prisma models
- **Issues:** Report wraps with extra metadata
- **Recommendation:** Good as-is; document report shape

### Operations (`api/v1/operations/calendar`)
- **Pattern:** `{ items, summary }` — already follows good convention
- **Recommendation:** Use as reference pattern for other list endpoints

### Communications (`api/v1/communications/*`)
- **Pattern:** Prisma arrays for most, custom aggregates for history/resident-requests
- **Issues:** Announcements history and resident-requests use grouped shapes
- **Recommendation:** Document; keep aggregated shapes for report-style endpoints

### Budgets (`api/v1/budgets/*`)
- **Pattern:** Mostly Prisma with computed fields on summaries
- **Issues:** Building summary adds `utilization`, `alertLevel` not present on base model
- **Recommendation:** Document computed fields; consider response DTO

---

## Standardization Targets

### 1. List Response Envelope
All list endpoints should return:
```json
{
  "items": [...],
  "meta": {
    "total": 42
  }
}
```

### 2. Paginated Response Envelope
Endpoints supporting pagination should return:
```json
{
  "items": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### 3. Error Response Envelope (already implemented)
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "timestamp": "2026-03-26T00:00:00.000Z",
  "path": "/api/v1/tickets"
}
```

### 4. Mutation Response
Mutations should return the created/updated resource or:
```json
{
  "ok": true
}
```

---

## Priority Actions

1. **Add `PaginationQueryDto` and `PaginatedResponseDto`** to backend common layer
2. **Add `ApiListResponse` and `ApiSingleResponse` wrapper types**
3. **Add contract snapshot tests** for mobile-critical endpoints
4. **Standardize status enums** with translation mapping
5. **Add response timing/SLO tracking** for home screen endpoints
