# Sprint 1 Do / Don't Guide

## Do

- Use semantic tokens such as `bg-background`, `bg-muted`, `border-subtle-border`, `text-muted-foreground`, and `text-primary` instead of hardcoded slate/gray values.
- Prefer shared primitives: `Card` variants, `Button`, `Input`, `Select`, `StatusBadge`, `PageHero`, and `SectionHeader`.
- Keep premium surfaces warm and high-contrast: black, off-white, gold, with restrained success/info/destructive accents.
- Reserve hero gradients for page entry surfaces and major dashboards only.
- Use display typography for page titles and section titles, with Heebo for interface text.

## Don't

- Do not introduce new navy/cyan gradients for primary brand expression.
- Do not add raw HTML `input`, `select`, or one-off badges on upgraded pages.
- Do not use hardcoded grayscale utilities such as `text-gray-*`, `bg-slate-*`, or `border-gray-*` on refreshed screens unless there is a strong exception.
- Do not mix multiple competing accent colors in the same card or hero.
- Do not create page-specific hero layouts when `PageHero` and `SectionHeader` can cover the pattern.
