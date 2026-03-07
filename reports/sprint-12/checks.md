# Sprint 12 Checks

- Status: BLOCKED
- Production backend build/startup in `NODE_ENV=production`: PASS
- Production frontend build/startup via standalone server: PASS
- Prisma migration deploy readiness on the target database: PASS
- Post-deployment smoke checks for `/health`, `/`, `/login`, `/api/v1/buildings`, `/api/v1/dashboard`: PASS
- Production environment completeness and external integrations: BLOCKED
- Rollback and backup readiness: BLOCKED

## Blocking Notes

- `.env.production` was not present, so only template-level validation was possible for production variables.
- Optional external providers are not configured in the local production-mode run. Backend startup explicitly logged `SENDGRID_API_KEY not set or invalid; email sending disabled.`
- The frontend package scripts were misaligned with `output: 'standalone'`; Sprint 12 corrected `apps/frontend/package.json` to start `node .next/standalone/apps/frontend/server.js`.
- No repo-backed database backup, restore, or rollback automation exists. README guidance only states that regular backups should exist.
