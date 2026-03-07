# Sprint 8 Communications Evidence

- Page: `/communications`
- Verified capabilities:
  - Loads communications from the live backend shape instead of the old placeholder model.
  - Supports scoped history views: all messages, inbox, and outbox.
  - Supports direct thread retrieval through `/api/v1/communications/conversation/:user1Id/:user2Id`.
  - Supports direct message creation plus bulk announcement creation for all residents or a selected building.
  - Supports client-side search/filter across subject, content, sender, recipient, and building metadata.

- Implementation notes:
  - Removed hardcoded sender ids and now use the authenticated JWT `sub`.
  - Added thread candidate discovery from live inbox/outbox traffic.
  - Preserved building and unit targeting through the existing backend DTO.

- Verification:
  - `npm --workspace apps/frontend run build` passed on March 7, 2026.
  - `npm --workspace apps/backend run build` passed on March 7, 2026.
