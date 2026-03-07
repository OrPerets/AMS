# Sprint 5 Units Evidence

## Commands

```bash
curl -s -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/v1/units?buildingId=1"

curl -s -X POST http://localhost:3000/api/v1/units \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"number":"QA-501","buildingId":1,"floor":5,"area":88.5,"bedrooms":3,"bathrooms":2,"parkingSpaces":1}'

curl -s -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/units/2
```

## Observed result

- `GET /api/v1/units?buildingId=1` now returns building-scoped results instead of the full unit table.
- Unit create/update now persist the extended property fields used by the UI: `area`, `floor`, `bedrooms`, `bathrooms`, and `parkingSpaces`.
- Unit detail returns the related building, resident emails, and assigned assets.
- Frontend routes verified in the production build:
  - `/units/[id]`
  - `/units/[id]/edit`
  - `/units/new`

## Example payload excerpt

```json
{
  "id": 2,
  "number": "QA-501",
  "building": "אפרים קישון 5, הרצליה",
  "assets": [
    {
      "id": 5,
      "name": "QA Assigned Water Meter",
      "unitId": 2
    }
  ]
}
```

## Notes

- The frontend now has real create/edit pages for unit management.
- Unit detail exposes a direct action to assign a new asset via `/assets/new?buildingId=<buildingId>&unitId=<unitId>`.
- Temporary QA verification records were removed after the API check completed.
