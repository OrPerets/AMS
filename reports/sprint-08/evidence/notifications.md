# Sprint 8 Notifications Evidence

- Page: `/notifications`
- Verified capabilities:
  - Loads notification list for the authenticated user via JWT-derived user id.
  - Supports search, type filtering, read/unread filtering, single mark-read, and mark-all-read.
  - Loads and updates notification preferences through `/api/v1/notifications/user/:id/preferences`.
  - Subscribes to real-time `new_notification` socket events and prepends incoming notifications in the UI.
  - Exposes connection status for the live notification channel.

- Backend support:
  - Added default preference keys for `workOrderUpdates` and `general` to match the UI controls.
  - Existing WebSocket notification broadcast path remains the source for real-time delivery.

- Verification:
  - `npm --workspace apps/frontend run build` passed on March 7, 2026.
  - `npm --workspace apps/backend run build` passed on March 7, 2026.
