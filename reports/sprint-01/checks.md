# Sprint 1 Checks

Status: `DONE`

| Item | Status | Evidence | Notes |
|---|---|---|---|
| Verify backend/frontend `.env` files exist and include required keys | DONE | `reports/sprint-01/evidence/env-check.txt` | Backend `.env` created for local Postgres on port `5433`. |
| Validate optional integrations config or mark N/A | DONE | `reports/sprint-01/evidence/env-check.txt` | AWS/SendGrid/Twilio are not configured for local Sprint 1 and are marked N/A. |
| Install dependencies for root/backend/frontend | DONE | `reports/sprint-01/evidence/install.log` | Installs completed successfully; audit warnings remain for later security triage. |
| Reset and seed database | DONE | `reports/sprint-01/evidence/db-reset-seed.log` | Reset, seed, and `prisma:deploy` all completed successfully on local Postgres `localhost:5433`. |
| Confirm demo/test user credentials are available | DONE | `reports/sprint-01/evidence/db-reset-seed.log` | Verified seeded demo users including `master@demo.com / master123`. |
