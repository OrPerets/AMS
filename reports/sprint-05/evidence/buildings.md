# Sprint 5 Buildings Evidence

## Commands

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"or.peretz@demo.com","password":"password123"}'

curl -s -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/buildings
```

## Observed result

- Authenticated buildings listing returned persisted building records.
- Sample records included building metadata required by the Sprint 5 screens, including `name`, `address`, `floors`, `totalUnits`, `managerName`, and contact fields.
- Frontend routes verified in the production build:
  - `/buildings`
  - `/buildings/[id]`
  - `/buildings/[id]/edit`
  - `/buildings/new`

## Example payload excerpt

```json
[
  {
    "id": 1,
    "name": "אפרים קישון 5, הרצליה",
    "address": "אפרים קישון 5, הרצליה",
    "floors": 4,
    "totalUnits": 8
  },
  {
    "id": 2,
    "name": "אמה טאובר 9, הרצליה",
    "address": "אמה טאובר 9, הרצליה",
    "floors": 5,
    "totalUnits": 10
  }
]
```

## Notes

- Building detail now hydrates units safely even if the detail and unit calls resolve in different orders.
- The empty-state action on the building detail page now links to `/units/new?buildingId=<id>` so unit management can start directly from the building workflow.
