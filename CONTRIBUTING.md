# Contributing to AMS

## Development Conventions

### Branch Naming
- `feature/<description>` — new features
- `fix/<description>` — bug fixes
- `refactor/<description>` — structural improvements
- `chore/<description>` — tooling, CI, dependencies

### Commit Messages
Use clear, descriptive messages:
```
<type>: <short description>

[optional body with context]
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`

---

## Frontend Architecture

### Feature Folder Convention

All new domain code goes into `apps/frontend/features/<domain>/`:

```
features/<domain>/
  api/        # Data fetching, response adapters
  model/      # Types, enums, status mappers, validation
  ui/         # Presentational React components
  hooks/      # Domain-specific React hooks
  tests/      # Unit + integration tests
  index.ts    # Public API barrel (ONLY file other features may import)
```

### Import Rules

1. **Features MUST NOT deep-import from other features.** Import through the feature's `index.ts` barrel only.
2. **Features CAN import from `shared/`** freely.
3. **`shared/` MUST NOT import from any feature.**
4. **Pages remain thin orchestrators** — import from the feature's public API, compose the view. Target: <80 LOC per page file.

### Shared Layer

Cross-domain utilities live in `apps/frontend/shared/`:

```
shared/
  ui/         # Design system primitives
  domain/     # Cross-domain enums, status types, formatters
  api/        # authFetch wrappers, response envelope types
  hooks/      # Generic hooks (useDebounce, useFocusTrap, etc.)
  constants/  # App-wide constants
```

### File Guidelines

| Type | Max LOC | Naming |
|------|---------|--------|
| Page (pages/*.tsx) | ~80 | `kebab-case.tsx` |
| Component | ~300 | `PascalCase.tsx` |
| Hook | ~200 | `use-name.ts` |
| Barrel | Exports only | `index.ts` |

### Adding a New Feature

1. Run `node scripts/migrate-to-features.mjs scaffold <domain>`
2. Add types to `model/types.ts`
3. Add data fetching to `api/`
4. Add hooks/controllers to `hooks/`
5. Add UI components to `ui/`
6. Export public API in `index.ts`
7. Write tests in `tests/`

---

## Backend Architecture

### Module Convention

Each domain module follows:
```
src/<domain>/
  <domain>.module.ts
  <domain>.controller.ts
  <domain>.service.ts
  dto/              # Request/response DTOs with class-validator
```

### API Contract Rules

1. All list endpoints return `{ items: T[], meta: { total } }` or a typed array.
2. All error responses follow the standard envelope: `{ statusCode, error, message, timestamp, path }`.
3. Pagination uses `?page=N&limit=N` query params with `PaginatedResponse<T>` shape.
4. Status enums are defined in Prisma schema and re-exported as typed constants.
5. New endpoints require contract tests in `*.spec.ts`.

### Response Envelope Standard

```typescript
// Success (list)
{ items: T[], meta: { total: number, page?: number, limit?: number, totalPages?: number } }

// Success (single)
{ data: T }

// Error
{ statusCode: number, error: string, message: string | string[], timestamp: string, path: string }
```

---

## PR Checklist

Before submitting a PR, verify:

- [ ] Code follows the feature folder convention (no new files in flat `components/` or `lib/` for domain logic)
- [ ] No cross-feature deep imports (run `node scripts/verify-feature-boundaries.mjs`)
- [ ] New domain enums/status mappers added to `shared/domain/` if used across features
- [ ] Page files remain thin orchestrators (<80 LOC target)
- [ ] New API endpoints follow the response envelope standard
- [ ] Contract tests added for new/modified backend endpoints
- [ ] No net increase in duplicated role/routing logic
- [ ] TypeScript compiles without new errors in changed files
- [ ] Existing tests still pass

---

## Running Checks

```bash
# Verify feature architecture boundaries
node scripts/verify-feature-boundaries.mjs

# Audit files for migration candidates
node scripts/migrate-to-features.mjs audit

# Run backend tests
cd apps/backend && npm test

# Run frontend E2E tests
cd apps/frontend && npm run test:e2e
```
