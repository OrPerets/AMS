# Sprint 5 Assets Evidence

## Commands

```bash
curl -s -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/assets

curl -s -X POST http://localhost:3000/api/v1/assets \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"buildingId":1,"unitId":2,"name":"QA Assigned Water Meter","category":"GENERAL","location":"Unit QA-501 utility closet","status":"ACTIVE","quantity":1,"value":450}'
```

## Observed result

- Assets list endpoint returned records with nested `building` and optional `unit` data after the Sprint 5 mapping fix.
- The frontend assets page now filters on real backend data instead of placeholder building options.
- The create/edit forms now support optional `unitId` assignment and use category values that match the Prisma enum.
- Asset detail continues to show depreciation and now also shows the assigned unit when present.

## Example payload excerpt

```json
{
  "id": 5,
  "buildingId": 1,
  "unitId": 2,
  "name": "QA Assigned Water Meter",
  "category": "GENERAL",
  "location": "Unit QA-501 utility closet",
  "status": "ACTIVE",
  "building": {
    "id": 1,
    "name": "אפרים קישון 5, הרצליה"
  },
  "unit": {
    "id": 2,
    "number": "QA-501"
  }
}
```

## Notes

- Prisma migration `20260307123000_add_asset_unit_assignment` added optional `Asset.unitId`.
- Backend `findAll`, `findOne`, and create/update flows now include the unit relation so the frontend can render and edit assignments consistently.
- Temporary QA verification records were removed after the API check completed.
