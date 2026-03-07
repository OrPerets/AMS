# Work Orders Evidence

## Commands
- `npm --workspace apps/backend run build`
- `npm --workspace apps/frontend run build`

## Implemented
- Work-order photo updates now accept multipart uploads through `FilesInterceptor('photos')`.
- Uploaded work-order images are stored through the existing `PhotoService` and merged into the order photo list.
- Frontend approval now uses the authenticated user id instead of a hardcoded approver.
- Work-order detail page compiles and remains wired to live status, cost, photo, and approval endpoints.

## Verification
- Backend build passed with the new controller/service wiring.
- Frontend build passed with `/work-orders/[id]` included in the generated routes.
