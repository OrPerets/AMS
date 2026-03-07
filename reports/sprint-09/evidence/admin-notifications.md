# Sprint 9 Admin Notifications Evidence

- Date: 2026-03-07
- Scope: `/admin/notifications`, notification templates, unpaid-invoice tracking

## Commands

```bash
curl http://localhost:3000/api/v1/invoices/unpaid \
  -H "Authorization: Bearer ADMIN_TOKEN"
curl -X POST http://localhost:3000/api/v1/notifications/user/1 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template":"ANNOUNCEMENT","params":{"title":"Sprint 9","message":"Admin notification smoke test"}}'
curl http://localhost:3000/admin/overview \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Results

- `/api/v1/invoices/unpaid` returned live mapped invoice data after the controller fix.
- Smoke response included one overdue invoice with:
  - `residentName = "client@demo.com"`
  - `amount = 430`
  - `status = "OVERDUE"`
  - `type = "UTILITIES"`
- Admin notification send request succeeded under an impersonated `ADMIN` token.
- Notification delivery fell back to console email logging because `SENDGRID_API_KEY` is intentionally absent in local dev.
- `/admin/overview` remained healthy after notification creation and exposed the recent notification feed used by the admin page.

## UI Coverage

- `/admin/notifications`
  - Added target selection: user, building, all tenants.
  - Added reusable templates: `ANNOUNCEMENT`, `PAYMENT_DUE`, `EMERGENCY_ALERT`, `WORK_ORDER_ASSIGNED`.
  - Added dynamic parameter fields and recent-delivery feed.
- `/admin/unpaid-invoices`
  - Added live table with resident name, amount, due date, payment tracking, CSV export, and batch settle action.
