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
