# Sprint 12 Execution Log

## Scope
- Sprint objective: confirm production readiness, release safety, and rollback capability.
- In-scope code paths:
  - `apps/frontend/package.json`
  - `apps/frontend/next.config.js`
  - `apps/backend/package.json`
  - `apps/backend/prisma/migrations/*`
  - `docker-compose.prod.yml`
  - `README.md`

## Commands run
1. `npm --workspace apps/backend run build:prod`
2. `npm --workspace apps/frontend run build`
3. `NODE_ENV=production npm --workspace apps/backend run start:prod`
4. `PORT=3001 NODE_ENV=production npm --workspace apps/frontend run start:prod`
5. `npm --workspace apps/backend run prisma:deploy`
6. `curl -i http://localhost:3000/health`
7. `curl -i http://localhost:3001/`
8. `curl -i http://localhost:3001/login`
9. `curl -X POST http://localhost:3000/auth/login -H 'Content-Type: application/json' -d '{"email":"master@demo.com","password":"master123"}'`
10. `curl -i -H "Authorization: Bearer <admin>" http://localhost:3000/api/v1/dashboard`
11. `curl -i -H "Authorization: Bearer <master>" http://localhost:3000/api/v1/buildings`
12. `rg -n "backup|rollback|restore|pg_dump|snapshot" README.md QUICK_START.md Makefile docker-compose.prod.yml apps scripts`

## Results
- Passed:
  - Backend production build completed and booted successfully on port `3000`.
  - Frontend production build completed successfully and now boots through the generated standalone server on port `3001`.
  - `prisma migrate deploy` reported `No pending migrations to apply.` against the current PostgreSQL target.
  - Smoke checks succeeded for backend health, frontend root/login, authenticated buildings API, and authenticated admin dashboard API.
- Failed:
  - Initial frontend production start used `next start` even though the app is built with `output: 'standalone'`; this was corrected in `apps/frontend/package.json` and verified again.
  - Initial dashboard smoke used a `MASTER` token and returned `403`; verification was rerun with `or.peretz@demo.com` (`ADMIN`) and passed.
- Blocked:
  - A real production `.env.production` file was not available, so only required-key presence in `production.env.example` could be checked.
  - External integrations were not validated end to end because AWS/SendGrid/Twilio credentials are not configured in the local production-mode environment.
  - Backup/restore readiness could not be signed off because the repo does not contain a backup script, restore script, or database snapshot runbook.

## Artifacts
- `reports/sprint-12/evidence/prod-build.log`
- `reports/sprint-12/evidence/post-deploy-smoke.md`
- `reports/sprint-12/evidence/rollback-plan.md`
- `reports/sprint-12/checks.md`

## Decision
- Status: BLOCKED
- Owner: Codex
- Date: 2026-03-07 12:40:54 IST
