# Sprint 11 Execution Log

## Scope
- Sprint objective: confirm latency, resilience, and security baseline.
- In-scope code paths:
  - `apps/backend/src/main.ts`
  - `apps/backend/src/common/api-exception.filter.ts`
  - `apps/backend/src/uploads/upload.utils.ts`
  - `apps/backend/src/documents/document.controller.ts`
  - `apps/frontend/lib/auth.ts`
  - `apps/frontend/components/Layout.tsx`
  - `apps/frontend/pages/404.tsx`
  - `apps/frontend/pages/_error.tsx`

## Commands run
1. `npm --workspace apps/backend run build`
2. `npm --workspace apps/frontend run build`
3. `npm --workspace apps/backend run start:prod`
4. `npm --workspace apps/frontend run start:prod`
5. `curl -s -o /dev/null -w @reports/sprint-11/evidence/curl-format.txt http://localhost:3000/health`
6. `curl -s -o /dev/null -w @reports/sprint-11/evidence/curl-format.txt http://localhost:3001/`
7. `curl -s -o /dev/null -w @reports/sprint-11/evidence/curl-format.txt -H "Authorization: Bearer <admin>" http://localhost:3000/api/v1/dashboard`
8. `curl -s -i http://localhost:3000/api/v1/dashboard`
9. `curl -s -i -H "Authorization: Bearer <pm>" http://localhost:3000/users`
10. `curl -s -i -X POST http://localhost:3000/auth/login -H 'Content-Type: application/json' -d '{"email":"master@demo.com","password":"master123","unexpected":true}'`
11. `curl -s -i -X POST http://localhost:3000/api/v1/documents/upload -H "Authorization: Bearer <admin>" -F "name=malware" -F "file=@bad.exe;type=application/x-msdownload"`
12. `curl -s -i http://localhost:3000/api/v1/not-a-route`
13. `curl -s -i http://localhost:3001/this-route-does-not-exist`
14. `rg -n "dangerouslySetInnerHTML" apps/frontend`

## Results
- Passed:
  - Backend now enforces non-whitelisted-field rejection and returns normalized JSON error payloads, including upload and unknown-route failures.
  - Backend responses include hardened security headers and no longer expose Express `X-Powered-By`.
  - Upload validation now checks both MIME family and file extension before persistence.
  - Frontend auth state now treats expired JWTs as invalid instead of trusting token presence.
  - Custom `404` and `_error` pages render as public routes and provide recovery actions.
  - Observed latency stayed well within Sprint 11 targets: health `~1ms`, landing page `~20ms`, dashboard API `~27ms`.
- Failed:
  - Initial verification used `MASTER` for the dashboard and `pm@demo.com` for the PM role, which did not match the local seeded role surface. Verification was rerun with `or.peretz@demo.com` and `maya@demo.com`.
  - Initial custom 404 verification rendered the layout loading state because `/404` was not treated as a public route. `apps/frontend/components/Layout.tsx` was updated and verification was repeated.
- Blocked:
  - No browser automation/device matrix was used for Sprint 11; frontend network and error handling were verified through production HTML responses plus direct code-path review.

## Artifacts
- `reports/sprint-11/evidence/performance.txt`
- `reports/sprint-11/evidence/security-checklist.md`
- `reports/sprint-11/evidence/error-handling.md`
- `reports/sprint-11/checks.md`

## Decision
- Status: DONE
- Owner: Codex
- Date: 2026-03-07 12:37:00 IST
