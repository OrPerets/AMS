# Tickets Evidence

## Commands
- `npm --workspace apps/backend run build`
- `npm --workspace apps/frontend run build`

## Implemented
- Backend ticket list now returns related unit, building, assignee, and comments so the frontend can render real ticket data.
- Multipart ticket creation now works with numeric DTO validation by enabling request transformation in the global validation pipe.
- Ticket list and ticket detail assignment actions now use the authenticated user id instead of a hardcoded `1`.
- Ticket detail now falls back to the first comment when no explicit description exists.

## Verification
- Backend build passed.
- Frontend build passed.
- `/tickets` and `/tickets/[id]` compile in production build output.
