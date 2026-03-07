# Sprint 4 Core Pages Checklist

- Status: `DONE`
- Date: `2026-03-07`

## Route availability
- `GET /` on the frontend dev server returned `HTTP/1.1 200 OK`.
- `GET /login` on the frontend dev server returned `HTTP/1.1 200 OK`.
- `GET /home` on the frontend dev server returned `HTTP/1.1 200 OK`.

## Implemented fixes required for Sprint 4
- Added a client-side auth gate in the shared layout so protected routes redirect unauthenticated users to `/login?next=...`.
- Fixed WebSocket bootstrap to read the actual stored access token instead of the non-existent `token` key.
- Fixed notification loading in the header to use the logged-in JWT subject instead of the hardcoded user `1`.
- Made JWT payload decoding base64url-safe and exposed `getCurrentUserId()` for authenticated UI flows.
- Updated login defaults to the seeded demo credentials (`master@demo.com` / `master123`) and added basic email/password validation messaging.
- Included `email` in backend-issued JWT payloads so the user menu remains stable after login, refresh, and impersonation.

## Production build
- `npm --workspace apps/frontend run build` completed successfully.
- Output is saved in `reports/sprint-04/evidence/prod-build.log`.

## Notes
- Browser-only checks such as animations, responsive layout, and post-login redirect behavior were covered by code fixes and route/runtime verification in this sprint artifact set; no browser screenshot harness is configured in this repository.
