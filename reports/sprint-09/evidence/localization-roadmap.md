# Sprint 09 Localization Roadmap

## Implemented in this pass

- Shared locale metadata and translation dictionaries now live in `apps/frontend/lib/i18n.ts`.
- The shell, login, settings, notifications, support, privacy, and terms pages now use the shared translation layer.
- Shared formatters now default to the active locale for dates, date-times, numbers, and currency.
- Trust-sensitive copy was revised to explain notification permissions, support routing, payment history clarity, and legal/privacy intent in friendlier language.

## Current language scope

- Hebrew (`he`) is the default locale.
- English (`en`) is available through the existing locale toggle and the login screen switcher.

## Path for additional languages

1. Add the new locale code and metadata to `apps/frontend/lib/i18n.ts`.
2. Extend the translation dictionary with the same keys already used by the shell and migrated pages.
3. Migrate remaining hardcoded pages in priority order:
   - resident account and requests
   - finance reports and budgets
   - buildings and assets
   - maintenance and tickets
4. Replace remaining hardcoded enum labels with locale-aware helpers so backend status values never leak directly to end users.
5. Add locale-aware QA checks for screenshots, RTL/LTR direction, and date/currency formatting in E2E coverage.
