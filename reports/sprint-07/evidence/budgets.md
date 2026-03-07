# Sprint 7 Budgets Evidence

- Verified budget summary endpoint for seeded demo building `79`.
- Verified summary now returns variance, utilization, and alert level for each budget.
- Verified frontend supports create, edit, pending-expense review, and budget-vs-actual charting.

## API check

`GET /api/v1/budgets/building/79/summary`

Key response fields observed:

- `budgets[0].name: "Operating Budget 2026"`
- `budgets[0].amount: 50000`
- `budgets[0].actualSpent: 5000`
- `budgets[0].variance: 45000`
- `budgets[0].utilization: 10`
- `budgets[0].alertLevel: "normal"`
- `totals.planned: 50000`
- `totals.actual: 5000`

## Result

- Budget creation and editing are wired to real API endpoints.
- Budget tracking is available through totals and utilization.
- Alerts are surfaced from utilization thresholds.
- Budget-vs-actual reporting is available in the budgets UI.
