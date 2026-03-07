# Sprint 7 Financial Reports Evidence

- Verified monthly and yearly financial report endpoints.
- Verified financial analytics endpoints for summary, cash flow, variance, and forecast.
- Verified downloadable export generation for yearly CSV and monthly PDF.

## API checks

### Monthly report

`GET /api/v1/reports/financial/monthly?year=2026&month=2&buildingId=79`

Key response fields observed:

- `totalExpenses: 5000`
- `totalIncome: 650`
- `balance: -4350`
- expense categories: `MAINTENANCE`, `UTILITIES`
- income source: `RENT_AND_FEES`

### Yearly export

`GET /api/v1/reports/financial/export/yearly?format=csv&year=2026&buildingId=79`

Observed:

- `HTTP/1.1 200 OK`
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="yearly.csv"`

### Monthly PDF export

`GET /api/v1/reports/financial/export/monthly?format=pdf&year=2026&month=2&buildingId=79`

Observed:

- `HTTP/1.1 200 OK`
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="monthly.pdf"`

## Result

- Reports generate from live finance data.
- Charts/date filtering are backed by monthly/yearly endpoints.
- Export outputs are generated and downloadable.
- Analytics is available on `/finance/analytics`.
