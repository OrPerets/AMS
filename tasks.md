# UI/UX Upgrade Master Plan — From "Good Tool" to "Wow Product"

## Purpose

This document turns the findings in `UI.md` into an execution-ready delivery plan. It is intentionally detailed, sequenced, and biased toward shipping visible improvements fast while building the design, accessibility, and product foundations needed for a premium experience.

## North-Star Outcome

By the end of this plan, Amit Excellence should feel:

- **Premium** — one coherent black/white/gold brand from landing page to every interior screen.
- **Operationally sharp** — dispatch, admin, finance, and resident flows feel faster, smarter, and more intentional.
- **Consistent** — loading, empty, error, table, form, and detail states all follow one system.
- **Mobile-serious** — touch targets, camera-first flows, bottom actions, and responsive layouts feel native rather than merely adapted.
- **Memorable** — users notice delightful micro-interactions, personalized dashboards, intelligent suggestions, and polished onboarding.

## Delivery Principles

1. **Fix the floor before polishing the ceiling.** Remove the worst UX inconsistencies before adding showcase features.
2. **System first, page second.** Update tokens, primitives, and shared patterns before patching pages one by one.
3. **Visible wins every sprint.** Each sprint must ship something users can feel.
4. **Accessibility is not optional.** Every component update must improve keyboard, focus, touch, RTL, and error handling.
5. **Use the best existing pages as the benchmark.** The admin dashboard and ticket dispatch console define the target quality bar.
6. **Every sprint must reduce design debt.** No new raw HTML form controls, no new hardcoded colors, no new one-off loading states.

## Workstreams

- **WS1 — Brand & Design System**
- **WS2 — Core UX Foundations**
- **WS3 — Resident Experience**
- **WS4 — Manager / Dispatch Experience**
- **WS5 — Admin Experience**
- **WS6 — Mobile Excellence**
- **WS7 — Premium / Intelligent Features**
- **WS8 — Quality Assurance, Metrics, and Rollout**

## Definition of Done for Every Sprint

A sprint is only complete when all of the following are true:

- Design and engineering agree on the before/after scope.
- New or changed UI uses shared components and semantic tokens.
- Loading, empty, and error states are present.
- RTL, keyboard, and touch interactions are tested.
- Screenshots and regression checks are captured.
- Metrics or acceptance criteria are documented.
- Any new interaction pattern is reusable, not page-specific.

---

# Sprint Plan

## Sprint 0 — Audit, Alignment, and Experience Baseline

**Goal:** Turn the review into a shared execution baseline so the team stops building page-by-page in different styles.

### Outcomes

- One agreed UX quality bar.
- One prioritized backlog mapped to actual files/components.
- One experience scorecard to measure improvement each sprint.

### Step-by-step TODO

- [x] Convert the major `UI.md` findings into a tracking matrix with columns for: issue, impact, role affected, platform, file/component owner, effort, and sprint target.
- [x] Create a **UI debt inventory** covering at minimum:
  - hardcoded colors,
  - raw HTML controls,
  - bare text loading states,
  - silent error handling,
  - undersized touch targets,
  - broken/weak RTL classes,
  - inaccessible clickable elements.
- [x] Tag every page as one of: **Showcase / Solid / Needs Upgrade / Critical Fix**.
- [x] Use the admin dashboard and ticket dispatch as reference implementations for page structure, skeleton quality, and information hierarchy.
- [x] Define shared acceptance rules for pages:
  - every page has loading, empty, error, and success feedback,
  - every primary action is visually dominant,
  - every table has a mobile strategy,
  - every badge/status has semantic meaning and text clarity.
- [x] Establish baseline product KPIs:
  - task success rate,
  - ticket handling time,
  - resident payment completion rate,
  - mobile completion rate,
  - number of pages still using raw controls,
  - number of pages still missing skeletons.
- [ ] Capture before screenshots for the most important screens:
  - login,
  - resident account,
  - resident requests,
  - tickets,
  - ticket detail,
  - buildings,
  - admin dashboard,
  - finance reports,
  - votes,
  - maintenance,
  - settings.

### Sprint 0 Deliverables

- UX scorecard
- issue-to-file backlog
- baseline screenshots
- definition-of-done checklist

---

## Sprint 1 — Design System Reset: Brand, Tokens, and Surface Hierarchy

**Goal:** Replace the generic blue SaaS feel with a premium, unified, black/white/gold visual language.

### Why this sprint matters

This is the highest-leverage visual move in the entire plan. If done well, the product immediately stops feeling fragmented and starts feeling intentional.

### Step-by-step TODO

#### 1. Rebuild brand tokens

- [x] Define a complete gold scale and supporting neutral scale.
- [x] Standardize `primary`, `accent`, `warning`, `info`, `success`, and `destructive` tokens so they do not drift between light and dark themes.
- [x] Add missing semantic layers:
  - page background,
  - elevated surface,
  - muted surface,
  - inverted surface,
  - subtle border,
  - strong border,
  - focus ring,
  - disabled text,
  - tertiary text,
  - inverse text.
- [x] Introduce consistent shadow tokens for card, raised panel, modal, and hero sections.
- [x] Add motion tokens for hover, enter, exit, and emphasis transitions.

#### 2. Standardize typography

- [x] Tune line-height for Hebrew-heavy screens.
- [x] Define responsive heading steps for tablet as well as desktop.
- [x] Normalize weight usage so hero typography, page titles, and section titles follow a clear scale.
- [x] Add font smoothing and confirm rendering quality in both themes.

#### 3. Create reusable premium patterns

- [x] Build canonical card variants: default, elevated, metric, action, warning, and featured.
- [x] Build a standard page hero pattern for top-tier pages.
- [x] Build standardized section headers with title, subtitle, action zone, and secondary metadata.
- [x] Build a branded badge set for status, severity, SLA, and finance states.

#### 4. Eliminate design drift

- [x] Audit and remove duplicate color usage where `info` and `accent` visually mean the same thing.
- [x] Replace hardcoded grayscale utilities on critical pages with semantic tokens.
- [x] Publish a “do / don’t” style guide so new work cannot regress.

### Sprint 1 Pages to visibly refresh

- [x] login
- [x] admin dashboard hero surfaces
- [x] ticket dispatch surfaces
- [x] finance reports base styling
- [x] votes base styling

### Acceptance criteria

- All primary brand expressions match one cohesive premium identity.
- Dark mode feels like the same brand, not a different product.
- At least five high-traffic screens visibly reflect the new token system.

---

## Sprint 2 — UX Foundation Hardening: Accessibility, Feedback States, and Interaction Reliability

**Goal:** Raise the product floor by fixing the systemic UX issues users feel on every page.

### Step-by-step TODO

#### 1. Fix interaction primitives

- [x] Increase touch targets to at least 44px on coarse-pointer devices.
- [x] Fix input icon positioning using logical RTL-aware properties.
- [x] Ensure clickable cards and KPI blocks are keyboard accessible with proper roles, focus states, and activation behavior.
- [x] Standardize focus-visible styling across buttons, links, inputs, menus, and tabs.

#### 2. Standardize page states

- [x] Create reusable page-level skeleton templates:
  - dashboard skeleton,
  - table/list skeleton,
  - detail panel skeleton,
  - mobile-card skeleton.
- [ ] Replace all bare “loading” text strings with matching skeletons or progress states.
- [x] Build a reusable inline error panel with retry and support guidance.
- [x] Build consistent empty-state templates for:
  - no data,
  - no search results,
  - action required,
  - permissions restricted.

#### 3. Improve navigational resilience

- [x] Add a skip-to-content link.
- [x] Add tooltips for collapsed sidebar icons.
- [x] Fix dead or unclear header / user menu actions.
- [x] Review footer and main-content spacing so short pages do not visually collapse awkwardly.

#### 4. Remove obvious trust breakers

- [x] Remove pre-filled demo credentials from login.
- [x] Replace stale copyright strings with dynamic year logic.
- [x] Review fabricated dashboard/home statistics and either back them with data or relabel them as demo placeholders.

### Priority bug list to complete in this sprint

- [x] admin dashboard infinite loading on failure
- [x] silent error handling on finance reports
- [x] silent error handling on votes
- [x] resident ticket statuses shown as raw enums
- [ ] inconsistent badge usage across pages

### Acceptance criteria

- No critical page still uses plain text loading.
- No critical page silently fails.
- All major interactive controls meet mobile touch guidelines.
- Keyboard-only navigation works on the shell and top workflows.

---

## Sprint 3 — Page Quality Unification: Fix the Lowest-Quality Screens First

**Goal:** Eliminate the “this feels like a different app” problem by upgrading the weakest pages to the quality bar of the strongest ones.

### Priority targets

1. finance reports
2. votes
3. resident requests
4. maintenance index
5. settings

### Step-by-step TODO

#### 1. Finance reports overhaul

- [x] Replace raw form controls with shared Select, Input, Button, Table, and EmptyState primitives.
- [x] Rebuild page structure using the same header/content rhythm as the admin dashboard.
- [x] Add loading, empty, and error states.
- [x] Fix dark-mode compatibility completely.
- [x] Introduce better visual hierarchy for filters, summaries, and report output.

#### 2. Votes experience cleanup

- [x] Remove hardcoded building logic.
- [x] Replace hardcoded colors with semantic tokens.
- [x] Correct RTL spacing classes.
- [x] Add user-facing failure feedback and retry paths.
- [x] Improve information hierarchy for active, upcoming, and closed votes.

#### 3. Resident requests cleanup

- [x] Replace raw selects and any inconsistent form styling.
- [x] Simplify request creation flow and clarify field labels.
- [x] Improve status readability and section grouping.
- [x] Add empty/helpful states for residents with no prior requests.

#### 4. Maintenance index upgrade

- [x] Replace raw controls and normalize spacing.
- [x] Improve filters and task-type visualization.
- [x] Make scheduled / preventive / corrective states easier to scan.
- [x] Add bulk-ready table layout even if batch actions ship later.

#### 5. Settings and lower-traffic pages

- [x] Bring settings layout, spacing, and save feedback up to standard.
- [x] Ensure every form section has context text, save state, and inline validation.

### Acceptance criteria

- [x] The bottom quartile of pages no longer looks or behaves materially worse than the top quartile.
- [x] No target page uses raw HTML controls where design-system components already exist.
- [x] Dark mode and RTL work consistently on all target pages.

---

## Sprint 4 — Resident Experience Reimagined

**Goal:** Turn the resident side from a wall of cards into a clear, helpful, mobile-friendly self-service experience.

### Experience target

Residents should immediately understand what matters now: what is due, what is open, what changed, and what action to take next.

### Step-by-step TODO

#### 1. Redesign resident home/account structure

- [x] Split the monolithic resident account page into clear zones:
  - personal summary,
  - payments,
  - service requests,
  - documents,
  - notifications,
  - building info.
- [x] Surface top summary metrics first:
  - open requests,
  - next payment due,
  - unread notifications,
  - recent document/activity count.
- [x] Create visual differentiation between urgent, informational, and completed items.

#### 2. Upgrade payment UX

- [x] Add payment history list with statuses and timestamps.
- [x] Add receipt download and annual statement export planning.
- [x] Remove or hide technical concepts like token fields from resident-facing UI.
- [x] Make autopay clearer with confirmation, explanation, and trust messaging.

#### 3. Upgrade ticket/request tracking

- [x] Build a resident-friendly progress tracker for ticket lifecycle.
- [x] Translate all statuses into human language.
- [x] Add timeline/history entries that explain what happened and when.
- [x] Add “show more” patterns instead of hidden truncation with no continuation path.

#### 4. Add truly useful resident content

- [x] Create a **My Building** section with contacts, rules, emergency info, and amenities.
- [x] Add contextual empty states that educate users on what they can do next.
- [x] Clarify quick actions and make them persistently reachable on mobile.

#### 5. Mobile-first resident interactions

- [x] Add sticky bottom action bar for high-frequency actions like Pay Now and Create Service Call.
- [x] Rework upload flow so taking a photo is primary on mobile.
- [ ] Review every resident screen for thumb reach, spacing, and readability.

### Acceptance criteria

- Residents can understand dues, open issues, and recent activity in under 10 seconds.
- Residents can track ticket progress without needing support.
- Resident-facing flows feel simpler, more human, and less technical.

---

## Sprint 5 — Manager / Dispatch Productivity Upgrade

**Goal:** Turn the manager experience into a power tool, not just a capable screen.

### Experience target

Managers should feel faster every day: fewer clicks, better visibility, stronger batch handling, and clearer operational control.

### Step-by-step TODO

#### 1. Refactor the ticket dispatch experience

- [x] Break the large dispatch page into smaller reusable modules:
  - toolbar,
  - queue tabs,
  - saved filters,
  - result list,
  - detail panel,
  - action rail,
  - assignment controls.
- [x] Reduce state sprawl by consolidating related UI state.
- [x] Document the data flow and event model so future enhancements are safe.

#### 2. Add power-user controls

- [x] Implement keyboard shortcuts:
  - J / K navigation,
  - Enter open detail,
  - A assign,
  - S status,
  - / search,
  - ? help overlay.
- [x] Add command palette support for ticket and building navigation.
- [x] Add bulk selection and bulk actions.

#### 3. Complete missing dispatch capabilities

- [x] Wire supplier assignment where backend support already exists.
- [x] Add clearer SLA risk indicators and escalation handling.
- [x] Add quick-edit actions for assignment, priority, and status without context loss.
- [x] Improve saved views / filter presets so they persist and are easy to reuse.

#### 4. Expand operational visibility

- [x] Visualize technician workload.
- [x] Add clearer workload balancing cues in assignment UI.
- [x] Surface overdue / at-risk counts in more actionable ways.

#### 5. Extend the master-detail success pattern

- [x] Apply the tickets-style split view to buildings and maintenance where appropriate.
- [x] Reuse the same detail rail and action model when possible.

### Acceptance criteria

- Managers can process repetitive ticket work significantly faster.
- Bulk assignment and keyboard navigation reduce click count materially.
- The dispatch page remains stable and understandable after refactoring.

---

## Sprint 6 — Admin Control Center Upgrade

**Goal:** Make the admin side feel like a strategic command center rather than a static KPI page.

### Experience target

Admins should be able to monitor health, configure the platform, and act on risk without hunting across scattered pages.

### Step-by-step TODO

#### 1. Fix dashboard credibility and consistency

- [x] Ensure range/date filters affect the data users reasonably expect them to affect.
- [x] Correct wrong KPI logic such as “resolved today.”
- [x] Add proper error and retry states.
- [x] Improve explanatory text for risk scores and attention items.

#### 2. Add missing admin visibility

- [x] Create a system health section for uptime, API health, queue status, and active usage.
- [x] Add tech workload and operational bottleneck charts.
- [x] Improve audit/activity log readability with timeline-style grouping.

#### 3. Add configuration experiences

- [x] Create a tenant settings / configuration center.
- [x] Plan pages for:
  - [x] branding,
  - [x] business hours,
  - [x] SLA policies,
  - [x] payment terms,
  - [x] notification templates.
- [x] Introduce a permission matrix view for role/action clarity.

#### 4. Prepare dashboard customization

- [x] Define widget architecture for hide/show/reorder later.
- [x] Split dashboard sections into reusable modules with shared card contracts.

### Acceptance criteria

- Admins can trust the dashboard data and recover from failures.
- Configuration tasks become discoverable and centralized.
- The admin dashboard becomes both operational and strategic.

---

## Sprint 7 — Mobile Excellence Pass

**Goal:** Make mobile feel intentionally designed, not compressed desktop UI.

### Experience target

The app should be comfortable, legible, and thumb-friendly for residents and field users on modern phones.

### Step-by-step TODO

#### 1. Rework navigation patterns

- [x] Upgrade the mobile sidebar/drawer with focus trap, escape handling, backdrop behavior, and better width rules.
- [x] Add clear close affordances and confirm RTL behavior.
- [x] Ensure the language toggle and other critical shell controls remain accessible on mobile.

#### 2. Improve mobile list/detail ergonomics

- [x] Add mobile-card skeletons that match real mobile layouts.
- [x] Add sticky bottom action bars for ticket detail and resident account.
- [x] Revisit paddings, safe-area spacing, and thumb-zone placement.

#### 3. Rebuild mobile upload and quick-action flows

- [x] Make “Take Photo” the primary CTA where users report issues.
- [x] Hide drag-and-drop language on touch devices.
- [x] Explore optional FAB patterns for role-specific quick actions.

#### 4. Add mobile-native interactions

- [x] Prioritize pull-to-refresh on key list pages.
- [x] Add swipe-to-dismiss for notifications if feasible.
- [x] Explore swipe navigation between tickets on manager views.
- [x] Add haptic feedback hooks for key success actions where supported.

### Acceptance criteria

- Mobile users can complete key tasks without zooming, mis-tapping, or fighting the layout.
- Core mobile flows feel faster and more natural than before.
- The resident reporting flow is camera-first and significantly improved.

---

## Sprint 8 — “Wow” Layer: Delight, Intelligence, and Memorable Differentiators

**Goal:** Add the features that make the product feel special, modern, and hard to forget.

### Experience target

Users should not merely say “it works”; they should say “this is smart” and “this feels premium.”

### Step-by-step TODO

#### 1. Personalized product moments

- [x] Replace generic home experiences with role-aware summaries and prompts.
- [x] Add contextual next-best-action modules.
- [x] Add premium onboarding flow for first-time users.

#### 2. Delight and emotional design

- [x] Add tasteful success animations for high-value moments.
- [x] Design premium empty states that educate and motivate.
- [x] Add subtle motion polish to drawers, panels, menus, and transitions.

#### 3. Intelligent workflow helpers

- [x] Scope AI-assisted ticket triage:
  - categorize,
  - suggest priority,
  - recommend assignee,
  - draft response.
- [ ] Scope predictive maintenance alerts using historical signals.
- [x] Add smart notifications with inline action options.

#### 4. Advanced product differentiators

- [x] Build command palette into a true cross-app operating layer.
- [x] Add weekly digest/report automation.
- [ ] Plan building visualization / map experience as a showcase feature.

### Acceptance criteria

- At least one intelligent workflow is usable end-to-end.
- At least one delight interaction is visible in production.
- First-time and repeat users both notice a meaningful quality jump.

---

## Sprint 9 — Localization, Content Quality, and Trust Polish

**Goal:** Finish the product details that separate polished software from merely functional software.

### Step-by-step TODO

- [x] Activate the existing localization infrastructure on real screens.
- [x] Extract hardcoded UI strings into translation keys.
- [x] Prioritize Hebrew + English first; document the path for additional languages later.
- [x] Review all labels, helper text, and status text for tone consistency.
- [x] Replace technical/internal wording with user-friendly language.
- [x] Review timestamps, currencies, number formats, and date ranges for locale correctness.
- [x] Audit trust details:
  - legal/footer text,
  - authentication messaging,
  - support contact clarity,
  - payment reassurance copy,
  - notification permissions explanation.

### Acceptance criteria

- Core workflows support real localization patterns.
- Product copy feels professional, consistent, and trustworthy.
- The app no longer exposes internal jargon to residents unnecessarily.

---

## Sprint 10 — QA, Rollout, and Experience Measurement

**Goal:** Ship the transformation safely and prove that it materially improved the product.

### Step-by-step TODO

#### 1. Regression and accessibility pass

- [x] Run visual regression review on all tier-1 pages.
- [x] Run keyboard and screen-reader spot checks on the shell, forms, tables, and dialogs.
- [x] Test RTL on critical workflows.
- [x] Test mobile on small, medium, and large phone breakpoints.
- [x] Test dark mode parity.

#### 2. Performance and reliability validation

- [ ] Ensure new motion and visual richness do not degrade perceived performance.
- [x] Check loading behavior on slow networks.
- [x] Validate retry/recovery patterns under failing APIs.

#### 3. Measure impact

- [x] Compare before/after screenshots and KPI baselines.
- [ ] Measure:
  - reduced pages with raw controls,
  - reduced pages lacking skeletons,
  - reduced silent failures,
  - improved mobile completion rate,
  - improved ticket-handling efficiency,
  - improved resident self-service completion.
- [ ] Gather internal stakeholder feedback by role.

#### 4. Rollout strategy

- [x] Release foundational changes first behind flags if needed.
- [x] Roll out high-risk interaction changes to internal users before broad release.
- [x] Prepare launch notes showing visible improvements by role.

### Acceptance criteria

- The team can prove the UI/UX is materially better, not just visually different.
- Regressions are controlled and rollout risk is managed.

---

# Cross-Sprint Backlog by Priority

## P0 — Must start immediately

- [ ] brand token overhaul
- [ ] touch target fixes
- [ ] RTL input/icon fixes
- [ ] page skeleton standardization
- [ ] admin dashboard error recovery
- [ ] finance reports redesign
- [ ] votes page reliability cleanup
- [ ] resident status translation and empty states
- [ ] remove trust-breaking demo details from login

## P1 — High impact next

- [ ] resident dashboard redesign
- [ ] dispatch keyboard shortcuts
- [ ] bulk operations
- [ ] saved filter presets
- [ ] supplier assignment UI
- [ ] mobile sidebar rebuild
- [ ] mobile camera-first upload
- [ ] tech workload visualization
- [ ] configuration center for admins

## P2 — Differentiating growth work

- [x] command palette
- [ ] ticket lifecycle timeline
- [ ] payment history + receipts
- [x] onboarding flow
- [ ] dashboard customization framework
- [x] localization rollout
- [x] weekly digest automation

## P3 — Premium “wow” expansion

- [ ] AI triage
- [ ] predictive maintenance
- [ ] interactive building visualization
- [ ] satisfaction pulse
- [x] delight animations / celebration moments
- [ ] real-time collaboration indicators

---

# Recommended Team Sequencing

## Pod A — Design System & Shell

Owns tokens, typography, surfaces, accessibility primitives, shell navigation, and page-state components.

## Pod B — Core Pages Upgrade

Owns finance, votes, maintenance, settings, and resident-request cleanup.

## Pod C — Resident Experience

Owns resident dashboard, payments UX, building info, and mobile-first resident actions.

## Pod D — Operations / Manager Experience

Owns dispatch refactor, keyboard shortcuts, bulk actions, saved filters, and workload visualizations.

## Pod E — Admin / Intelligence

Owns admin control center, configuration hub, reporting, and future AI/predictive layers.

---

# Final Vision Checklist

Use this checklist at the end of the program. If the answer to every item is “yes,” the result will feel like “wow.”

- [ ] Does the app feel like one premium brand on every screen?
- [ ] Do the weakest pages now look as polished as the strongest pages?
- [ ] Can a resident understand their situation instantly and act with confidence?
- [ ] Can a manager process work dramatically faster than before?
- [ ] Can an admin monitor, configure, and trust the system without guesswork?
- [ ] Does mobile feel intentionally designed for touch and camera workflows?
- [ ] Are loading, empty, and error states consistently professional?
- [ ] Are accessibility and RTL handled systematically rather than incidentally?
- [ ] Is there at least one intelligent feature that users will talk about?
- [ ] Are there small moments of delight that make the product feel alive?

## If we execute this plan well...

The product will no longer read as “strong engineering with uneven UX.” It will read as **a premium, intelligent property-management platform with operational depth, resident empathy, and memorable polish**.
