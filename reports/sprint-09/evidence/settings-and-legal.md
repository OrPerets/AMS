# Sprint 9 Settings And Legal Evidence

- Date: 2026-03-07
- Scope: `/settings`, `/support`, `/privacy`, `/terms`, `/tech/jobs`

## Commands

```bash
curl http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer MASTER_TOKEN"
curl -X PATCH http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer MASTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone":"050-0000000","notificationPreferences":{"email":true,"sms":false,"push":true}}'
curl -X POST http://localhost:3000/api/v1/support \
  -H "Content-Type: application/json" \
  -d '{"name":"Sprint 9 QA","email":"qa@example.com","subject":"Support smoke test","category":"BUG","urgency":"LOW","message":"Verifying support submission for Sprint 9."}'
```

## Results

- `GET /api/v1/users/profile` returned the authenticated user profile for the seeded `MASTER` user.
- `PATCH /api/v1/users/profile` persisted:
  - `phone = "050-0000000"`
  - `notificationPreferences.sms = false`
- Public support submission succeeded with `{"ok":true,"recipients":3}`.
- Frontend production build included:
  - `/settings`
  - `/support`
  - `/privacy`
  - `/terms`
  - `/tech/jobs`

## UI Coverage

- `/settings`
  - Added live profile form, password change form, and notification-preference toggles.
- `/support`
  - Added public support form with category and urgency that creates admin-facing support notifications.
- `/privacy` and `/terms`
  - Replaced placeholders with structured policy/terms content.
- `/tech/jobs`
  - Retained live job board behavior already present and verified it still builds after Sprint 9 changes.

## Re-Verification On 2026-03-08

- `GET /api/v1/users/profile` returned `200` for authenticated users, and `PATCH /api/v1/users/profile` still persisted profile and notification-preference changes.
- Password validation remained enforced:
  - short password change request returned `400`
  - valid password change returned `201`
  - password was restored to the seeded credential after the smoke test
- Public support submission still succeeded with `201`, while missing required fields returned `400`.
- Frontend route checks returned `200` for `/support`, `/privacy`, `/terms`, `/settings`, and `/tech/jobs`.
- Fixed `/tech/jobs` during verification: the page was hardcoded to `supplierId=1`, which hid real assigned work orders in the seed data. The page now loads tech-visible work orders and filters them by the logged-in technician via `ticket.assignedToId`.
- After the fix, the live dataset contained one job assigned to `tech1@demo.com`, so the page now has real data to display instead of an incorrect empty state.
