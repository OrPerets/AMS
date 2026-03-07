# Sprint 12 Rollback Plan

## Current validation status

- Application rollback procedure: PARTIALLY VALIDATED
- Database migration rollback procedure: NOT VALIDATED
- Backup readiness: NOT VALIDATED

## What is available in the repo

- Docker Compose production manifest: `docker-compose.prod.yml`
- Production env template: `production.env.example`
- Backend migration command: `npm --workspace apps/backend run prisma:deploy`
- Frontend standalone runtime artifact after build: `.next/standalone/apps/frontend/server.js`

## Safe rollback procedure

1. Stop traffic to the new deployment or remove it from the load balancer.
2. Redeploy the previously known-good backend and frontend images or revert the git revision used to build them.
3. Restore the previous production environment values if they changed with the release.
4. Restart services and verify:
   - `GET /health`
   - frontend `GET /`
   - authenticated `GET /api/v1/buildings`
5. Re-enable traffic only after smoke checks succeed.

## Database rollback requirement

- `prisma migrate deploy` is forward-only in this repo.
- Any release that includes schema changes must be gated by a restorable database backup taken immediately before deployment.
- If a schema migration causes a production issue, the safe rollback path is:
  1. stop writes,
  2. restore the pre-deploy database backup,
  3. redeploy the previous application version,
  4. rerun smoke checks.

## Gaps blocking sign-off

- No repository-backed `pg_dump`, snapshot, or restore script exists.
- No documented storage backup verification exists for uploaded files under `/app/uploads`.
- README only provides a policy-level note (`Regular backups`) rather than an executable runbook.
- Because no actual backup artifact or restore rehearsal was available in this session, backup readiness cannot be marked done.
