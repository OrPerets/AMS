# Sprint 12 Post-Deploy Smoke

Date: 2026-03-07 12:40:54 IST

## Startup summary

- Backend build: PASS
- Frontend build: PASS
- Backend production startup: PASS on `http://localhost:3000`
- Frontend production startup: PASS on `http://localhost:3001`
- Prisma deploy: PASS (`No pending migrations to apply.`)

## HTTP smoke results

| Target | Result | Evidence |
| --- | --- | --- |
| `GET /health` | `200 OK` | `reports/sprint-12/evidence/health.http` |
| `GET /` | `200 OK` | `reports/sprint-12/evidence/frontend-root.http` |
| `GET /login` | `200 OK` | `reports/sprint-12/evidence/frontend-login.http` |
| `POST /auth/login` (`master@demo.com`) | token issued | `reports/sprint-12/evidence/auth-login.json` |
| `GET /api/v1/buildings` (`MASTER`) | `200 OK` | `reports/sprint-12/evidence/buildings.http` |
| `GET /api/v1/dashboard` (`ADMIN`) | `200 OK` | `reports/sprint-12/evidence/dashboard-admin.http` |
| `GET /api/v1/dashboard` (`MASTER`) | `403 Forbidden` | `reports/sprint-12/evidence/dashboard.http` |

## Timing snapshot

- `GET /health`: `0.021664s`
- `GET /`: `0.013511s`
- `GET /login`: `0.001851s`

## Operational findings

- Backend startup logged that SendGrid is disabled in the current environment: `SENDGRID_API_KEY not set or invalid; email sending disabled.`
- Frontend startup originally emitted a Next.js warning because the package script used `next start` with standalone output. Sprint 12 corrected the script to launch `node .next/standalone/apps/frontend/server.js`, and the rerun started cleanly.
- The smoke checks validate local production-mode behavior, not a remote deployment target.
