# Sprint 10 Integration Evidence

## Summary

The Sprint 10 smoke verifier ran against the local frontend on `http://127.0.0.1:3001` and backend on `http://127.0.0.1:3000`. It confirmed that the frontend rewrite layer, backend auth guards, token refresh, CORS, and upload endpoints operate together as a single end-to-end path.

Raw machine-readable output: `reports/sprint-10/evidence/integration-results.json`

## Verified checks

| Check | Result | Evidence |
|---|---|---|
| Backend CORS preflight allows frontend origin and auth headers | PASS | `cors-preflight` |
| Frontend `/auth/login` rewrite returns JWT pair for admin, resident, and tech users | PASS | `login-admin`, `login-resident`, `login-tech` |
| Protected dashboard route rejects anonymous requests | PASS | `dashboard-unauthorized` (`401`) |
| Protected dashboard route succeeds through frontend rewrite with admin token | PASS | `dashboard-authorized` (`200`) |
| Refresh token flow succeeds through frontend rewrite | PASS | `refresh-token` (`201`) |
| Document upload through frontend rewrite persists file and metadata | PASS | `document-upload` (`201`) |
| Uploaded document is retrievable from backend static `/uploads` mount | PASS | `document-upload-fetch` (`200`) |
| Resident ticket creation accepts image upload end to end | PASS | `ticket-create-with-photo` (`201`) |
| Uploaded ticket photo is retrievable from `/uploads` | PASS | `ticket-photo-fetch` (`200`) |
| Tech work-order photo update accepts image upload end to end | PASS | `work-order-photo-upload` (`200`) |
| Uploaded work-order photo is retrievable from `/uploads` | PASS | `work-order-photo-fetch` (`200`) |

## Implementation notes

- Ticket and work-order uploads now use a shared backend image-upload policy.
- Document uploads now use a shared document-upload policy plus an explicit missing-file guard.
- `PhotoService` now falls back to local disk storage when S3 is unavailable, which makes local verification deterministic and keeps returned URLs resolvable in development.
