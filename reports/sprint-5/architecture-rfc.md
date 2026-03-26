# RFC: Target Frontend Architecture — Feature Folders, Boundaries & Dependency Rules

**Status:** Accepted  
**Date:** 2026-03-26  
**Owner:** Frontend Architecture  
**Sprint:** 5 — Codebase Restructure for Scale & Maintainability

---

## 1. Problem Statement

The current frontend codebase follows a **page-centric** layout:

```
apps/frontend/
  pages/          # ~75 route files mixing orchestration, data fetching, and view logic
  components/     # ~133 components in flat/shallow groupings
  lib/            # Cross-cutting utilities, role logic, navigation (some files >600 LOC)
  hooks/          # Thin wrappers, formatting, UI helpers
```

This structure leads to:
- **Large orchestrator pages** (`home.tsx` ~877 LOC, `payments.tsx`, `settings.tsx`) that combine role routing, API calls, state management, and view assembly.
- **Unclear ownership** — it is not obvious which team/domain owns a component or utility.
- **Hidden coupling** — `components/tickets/dispatch/` imports from `lib/`, `components/home/`, and `components/ui/` with no enforcement.
- **Difficult feature development** — adding a new domain requires touching multiple unrelated directories.

## 2. Target Architecture

### 2.1 Feature Folder Convention

Every business domain gets a self-contained folder under `features/`:

```
apps/frontend/features/
  <domain>/
    api/            # Data fetching, authFetch wrappers, response type adapters
    model/          # Domain types, enums, status mappers, validation schemas
    ui/             # Presentational React components (pure, no data fetching)
    hooks/          # Domain-specific React hooks (controllers, state machines)
    index.ts        # Public API barrel — the ONLY file other features may import
    tests/          # Unit + integration tests for this domain
```

### 2.2 Domain Inventory

| Domain | Source (current) | Feature Folder |
|--------|-----------------|----------------|
| Tickets | `pages/tickets.tsx`, `components/tickets/dispatch/` | `features/tickets/` |
| Buildings | `pages/buildings.tsx`, `components/buildings/` | `features/buildings/` |
| Maintenance | `pages/maintenance/`, `components/maintenance/` | `features/maintenance/` |
| Payments | `pages/payments.tsx`, `pages/payments/`, `components/finance/` | `features/payments/` |
| Home (role shells) | `pages/home.tsx`, `components/home/` | `features/home/` |
| Notifications | `pages/notifications.tsx`, `components/layout/` (bell) | `features/notifications/` |
| Gardens | `gardens/`, `components/gardens/` | `features/gardens/` |
| Admin | `pages/admin/`, `components/admin/` | `features/admin/` |
| Resident | `pages/resident/`, `components/resident/` | `features/resident/` |
| Communications | `pages/communications*` | `features/communications/` |
| Settings | `pages/settings.tsx` | `features/settings/` |

### 2.3 Shared Layer

```
apps/frontend/shared/
  ui/              # Design system primitives (button, dialog, card, etc.)
  domain/          # Cross-domain enums, status types, formatters
  api/             # authFetch, response envelope types, error handling
  hooks/           # Generic hooks (useDebounce, useFocusTrap, etc.)
  constants/       # App-wide constants
```

### 2.4 Dependency Rules

1. **Features MUST NOT import from other features** except through the feature's `index.ts` barrel export.
2. **Features CAN import from `shared/`** freely.
3. **`shared/` MUST NOT import from any feature.**
4. **Pages remain thin orchestrators** — a page file in `pages/` imports from the corresponding feature's public API and composes the view. Max ~50 LOC per page file.
5. **`lib/` is frozen** for new additions; existing utilities migrate to `shared/` or the appropriate feature over time.

### 2.5 Enforcement

- ESLint `no-restricted-imports` rules block cross-feature imports.
- A CI verification script validates the dependency graph on every PR.
- The `index.ts` barrel pattern is mandatory — direct deep imports into a feature are lint errors.

## 3. Migration Strategy

### Phase 1: Scaffold + Shared Extraction (Sprint 5)
- Create `features/` and `shared/` directories.
- Extract shared domain enums and status mappers to `shared/domain/`.
- Move design system primitives already in `components/ui/` to `shared/ui/` (re-export for backward compatibility).
- Split `home.tsx` into `features/home/` as the reference migration.

### Phase 2: Feature-by-Feature Migration (Sprint 5–7)
- Migrate one domain at a time, starting with `tickets` (highest coupling, highest value).
- Each migration creates the feature folder, moves code, updates imports, and adds barrel exports.
- Old locations get re-export stubs during transition (removed once all consumers update).

### Phase 3: Boundary Lock (Sprint 7+)
- Remove all re-export stubs.
- Enable strict lint boundary rules (error, not warn).
- Add architecture fitness tests to CI.

## 4. File Size Guidelines

| Metric | Target | Current Worst |
|--------|--------|---------------|
| Page file (pages/*.tsx) | < 80 LOC | ~877 LOC (home.tsx) |
| Component file | < 300 LOC | ~500+ LOC (DispatchWorkspace) |
| Hook/controller | < 200 LOC | ~400 LOC (embedded in pages) |
| Barrel index.ts | Exports only, no logic | N/A |

## 5. Naming Conventions

- **Files:** `kebab-case.ts` / `kebab-case.tsx`
- **Components:** `PascalCase` export matching file name
- **Hooks:** `use-<name>.ts` with `useName` export
- **Types:** Co-located in the file that defines them, or in `model/types.ts` if shared across the feature
- **Tests:** `<file>.test.ts` or `<file>.test.tsx` in `tests/` subdirectory

## 6. Decision Record

| Decision | Rationale |
|----------|-----------|
| Feature folders over module packages | Monorepo packages add build complexity; folders with lint rules achieve the same isolation |
| Barrel exports | Explicit public API surface without package.json overhead |
| `shared/` over `@app/common` | Simpler import paths, no workspace package configuration needed |
| Pages stay in `pages/` | Next.js Pages Router requires this; pages become thin wrappers |
| Gradual migration with re-exports | Zero-downtime migration; no big-bang refactor risk |
