# Dispatch Data Flow

## Scope

The manager dispatch workspace is split into reusable modules:

- `DispatchToolbar`: search, macro filters, summary, command/help entry points.
- `DispatchSavedViews`: persisted presets and reset flow.
- `DispatchQueueTabs`: queue-level focus.
- `DispatchResultsList`: visible work queue and bulk selection.
- `DispatchDetailPanel`: selected ticket context.
- `DispatchActionRail`: quick-edit, assignment, supplier routing, and workload balancing.
- `DispatchDialogs`: command palette, help, saved-view naming, and ticket creation.

## Event Model

1. `DispatchWorkspace` owns canonical state for filters, selection, dialogs, quick actions, and async resources.
2. Filter changes update the `filters` object only. A single effect persists filters to local storage and reloads `/api/v1/tickets?view=dispatch...`.
3. Ticket selection is independent from bulk selection:
   - `selectedTicketId` drives the detail panel and action rail.
   - `selectedIds` drives bulk actions.
4. Ticket-side actions never mutate local copies optimistically. They call backend endpoints and then reload the dispatch payload, which keeps queue counts, workload, SLA summary, and detail state consistent.
5. Presets are local-only:
   - built-ins come from `storage.ts`
   - custom presets are stored in local storage
   - the last-used preset id is persisted separately from the actual filters
6. Keyboard shortcuts are resolved centrally in `DispatchWorkspace` so modules remain presentational.

## Safety Rules

- All bulk actions fan out to the existing single-ticket endpoints, so no hidden bulk-only behavior is introduced.
- Supplier assignment reuses the existing `PATCH /api/v1/tickets/:id/assign` contract with `supplierId`.
- Workload cues are read-only UI signals derived from backend dispatch aggregates; they do not change routing automatically.
