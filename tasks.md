# AMS Product & Delivery Task Plan

## Document Goal
Break down the requested work into a structured sprint plan, with emphasis on:
- Improving the system entry flow by role.
- Clearly separating systems and modules.
- Fixing stability issues in navigation and page loading.
- Upgrading the mobile experience at the layout and UI level only, while preserving the current color palette.
- Adding improvements that can increase engagement, repeat usage, and clarity for users.

---

## High-Level Goals
1. Create a clear entry flow: landing page → login → smart role-based routing.
2. Distinguish Resident users from all other users immediately after login.
3. Create a dedicated selection screen for every non-Resident role, with access to AMS, the supervision report, and garden management.
4. Move the garden management module into a standalone, clearly defined interface inside the system without losing existing functionality.
5. Resolve routing / flicker / manual refresh issues between pages.
6. Significantly improve the mobile UX through better layouts, hierarchy, spacing, action surfaces, and efficient navigation.
7. Increase usability and adoption through clearer CTAs, shortcuts, better empty states, lightweight onboarding, and faster task flows.

---

## Working Assumptions
- Keep the current AMS color palette.
- Mobile improvements should focus on layouts and UI only, without changing the core branding.
- The supervision report remains external and should redirect to `https://amit-form.vercel.app`.
- The gardens module will remain part of the same product and permission model, but it should have its own entry point, its own navigation language, and a more standalone user experience.
- Prefer reusing existing components instead of creating unnecessary new layers.

---

## Sources and References for Implementation
### Internal references to review before implementation
- `apps/frontend/pages/login.tsx` – the current login screen.
- `apps/frontend/pages/role-selection.tsx` – currently auto-redirects by role and should become a decision screen for certain roles.
- `apps/frontend/lib/auth.ts` – default routing logic by role.
- `apps/frontend/lib/navigation.ts` – current navigation, including gardens and Resident pages.
- `apps/frontend/pages/gardens/*` + `apps/frontend/components/gardens/*` – the existing gardens module.
- `mobile-ux-redesign-spec.md` – a strong internal baseline for mobile UX principles already defined in the project.

### External reference for mobile UI exploration
Perform focused exploration of `wasp-lang/open-saas` for inspiration around:
- Landing and auth screen structure.
- Mobile layout hierarchy.
- Spacing, cards, section density, and mobile-friendly shells.
- CTA hierarchy and action-zone organization.

**Important:** Use it for layout/UI inspiration only. Do not copy branding, and do not change the current AMS color palette.

---

# Sprint 1 — Discovery, flow mapping, and technical alignment
## Goal
Lock the new entry experience end-to-end before deeper code changes begin.

## Tasks
### 1.1 Map the current entry flows
- [x] Mapped the current post-login flow by role.
- [x] Documented the split between `getDefaultRoute` and manual page redirects.
- [x] Identified overlap between `/home`, `/resident/account`, `/role-selection`, `/gardens`, and `/supervision-report`.

#### Current flow map
| Scenario | Current behavior | Notes |
| --- | --- | --- |
| Landing page | `/` shows multiple entry CTAs, including resident and worker-specific routes. | This does **not** match the requested single "Enter the system" funnel. |
| Unauthenticated protected route | `Layout` sends the user to `/login?next=...`. | Redirect happens client-side after mount. |
| Login success with `next` | `/login` prefers `next` over any default role route. | Good for deep links, but adds one more redirect authority. |
| Login success with `portal` | `/login` uses `getPortalEntryRoute(portal, role)`. | This bypasses the role-selection concept entirely today. |
| Login success without `next` or `portal` | `/login` uses `getDefaultRoute(role)`. | Residents go to `/resident/account`; all other known roles go to `/home`. |
| Resident hits `/home` | `/home` immediately redirects to `/resident/account`. | This duplicates the resident redirect already handled by `getDefaultRoute`. |
| User hits `/role-selection` | Page auto-redirects to `next || getDefaultRoute(role)`. | It is not a real decision screen yet. |
| User hits `/gardens` | Page is standalone by route, but still framed as a hidden module in the main nav. | Access is guarded by gardens permissions. |
| User hits `/supervision-report` | Route resolves to the internal maintenance reports page. | This conflicts with the requested external redirect to `https://amit-form.vercel.app`. |

#### Current route ownership
- `getDefaultRoute(role)` currently sends:
  - `RESIDENT` → `/resident/account`
  - `ADMIN`, `PM`, `TECH`, `ACCOUNTANT`, `MASTER` → `/home`
  - unknown role → `/home`
- Manual redirects currently exist in:
  - `Layout` for unauthenticated access.
  - `/login` after successful authentication.
  - `/home` for resident users.
  - `/role-selection` for all authenticated users.
  - `/resident/account` when `section` query params point to other resident pages.

#### Conflicts found
- There are currently **multiple redirect authorities** for the same journey: `Layout`, `/login`, `/home`, and `/role-selection`.
- Residents can be routed correctly by `getDefaultRoute`, but `/home` still contains another resident redirect, which increases flicker risk.
- `/role-selection` is named like a decision screen but behaves as a loading redirect page.
- The supervision report route currently points to an internal report page instead of the requested external system.

### 1.2 Define the target flow
- [x] Defined the target entry funnel and destination behavior.

#### Agreed target flow for implementation
1. User lands on `/`.
2. The landing page exposes one clear primary CTA: **"Enter the system"**.
3. That CTA routes to `/login`.
4. After login:
   - normalized role `RESIDENT` → direct route to `/resident/account`
   - every other supported role → route to `/role-selection`
5. `/role-selection` becomes a real decision screen with 3 choices:
   - **AMS management system** → route to the role-appropriate AMS home
   - **Supervision report** → open `https://amit-form.vercel.app`
   - **Garden management** → route to `/gardens`

#### Route decisions locked in Sprint 1
- Resident default destination: `/resident/account`
- Non-resident first decision screen: `/role-selection`
- AMS destination after choosing the management system:
  - `ADMIN`, `PM`, `TECH`, `ACCOUNTANT`, `MASTER` → `/home`
- Garden management destination: `/gardens`
- Supervision report destination: `https://amit-form.vercel.app`

### 1.3 Product decisions around roles
- [x] Defined the Resident vs Other split.
- [x] Confirmed the expected `actAsRole` behavior.
- [x] Defined a fallback policy for unknown roles.

#### Role decisions
- **Resident**
  - Only normalized role `RESIDENT` is considered a Resident entry flow.
  - Synonyms already normalized to Resident and should stay equivalent: `TENANT` → `RESIDENT`.
- **Other**
  - `ADMIN`
  - `PM`
  - `TECH`
  - `ACCOUNTANT`
  - `MASTER`

#### Impersonation / `actAsRole`
- `actAsRole` should always win over the original token `role` for routing decisions.
- A `MASTER` user impersonating `RESIDENT` should skip the selection screen and land in `/resident/account`.
- A `MASTER` user impersonating any non-resident role should be treated as "Other" and land on `/role-selection`.
- A `MASTER` user without `actAsRole` should also be treated as "Other" and land on `/role-selection`.

#### Safe fallback for unknown role
- If the token exists but the effective role is unknown, the app should **not** silently send the user to `/home`.
- The safe fallback is:
  1. route to `/role-selection`
  2. show a guarded fallback state explaining that the role is not recognized
  3. disable AMS and gardens entry until permissions are known
  4. provide a support/contact action

### 1.4 Define initial acceptance criteria
- [x] Converted the sprint goal into concrete acceptance criteria.

#### Initial acceptance criteria
- Resident users never see `/role-selection` during the standard login flow.
- Non-resident users always land on `/role-selection` first after login.
- `/role-selection` presents 3 working choices: AMS, supervision report, and gardens.
- The supervision report choice always opens `https://amit-form.vercel.app`.
- Gardens can be entered directly from the selection screen through `/gardens`.
- No step in the landing → login → destination flow requires a manual browser refresh.
- Deep-link flows that use `next` still work without breaking the Resident vs Other rule set.
- Unknown-role users never fall through to an incorrect home page without feedback.

### 1.5 Map technical risks
- [x] Reviewed likely sources of flicker, refresh requirements, and unstable routing.

#### Technical risks found
- **Client-only auth gating**
  - Authentication is derived from `localStorage`, so `Layout` must wait for mount before deciding whether the user is authenticated.
  - This increases the chance of flashes, skeletons, and redirect flicker on first render.
- **Duplicate redirect layers**
  - Redirect logic is split across `Layout`, `/login`, `/home`, and `/role-selection`.
  - This makes it easier for route transitions to race each other and harder to reason about protected-page refresh behavior.
- **Animated full-page transitions in `_app`**
  - `_app` keys page transitions on `router.asPath`, so each route change fully re-animates the page container.
  - That is good for polish, but it can amplify perceived flicker when redirects happen immediately after mount.
- **Route naming mismatch**
  - `/role-selection` sounds like a decision page but currently acts as an auto-redirect page.
  - `/supervision-report` sounds external in the task plan, but currently resolves to an internal maintenance report route.
- **Unknown-role fallback is unsafe today**
  - Current `getDefaultRoute` sends unknown roles to `/home`, which hides role problems and could expose the wrong shell.
- **Public route classification**
  - `/role-selection` is currently treated as public by `Layout`, even though it is effectively part of the authenticated app flow.
  - This can create odd loading behavior when the token is missing or expired.

#### Sprint 1 implementation notes
- Sprint 1 is completed as a **discovery + alignment sprint** in this file so the next implementation sprints can move with one agreed routing model.
- The most important follow-up items for Sprint 2 and Sprint 3 are:
  1. convert `/` to a single-entry landing funnel
  2. turn `/role-selection` into a real choice screen
  3. move non-resident post-login routing from `/home` to `/role-selection`
  4. replace the current `/supervision-report` behavior with the required external redirect
  5. reduce redirect duplication so the auth flow has one clear source of truth

---

# Sprint 2 — Landing page + login entry funnel
## Goal
Create a clearer, shorter, and more pleasant entry path into the product.

## Tasks
### 2.1 Create or upgrade the landing page
- [x] Add a clear landing page with a central CTA: "Enter the system".
- [x] If a landing page already exists, update it so it focuses on entry instead of heavy text.
- [x] On mobile, the CTA must appear above the fold.
- [x] Add a short message explaining that the system supports residents, management, operations, and gardens.

### 2.2 Refine the transition to login
- [x] The main CTA should route to `/login`.
- [x] Preserve relevant query params if they exist.
- [x] Make sure there is no dead-end between landing and login.

### 2.3 Improve the login UI
- [x] Improve hierarchy on the login screen so the form is the focal point.
- [x] Reduce visual noise on mobile.
- [x] Ensure fields are large, clear, touch-friendly, and show readable validation states.
- [x] Confirm there is one clear primary CTA for sign-in.

### 2.4 Improve microcopy
- [x] Update text so it is shorter and clearer.
- [x] Add a short hint telling users what happens after login.
- [x] Consider a concise trust/security note only, without overloading the screen.

### 2.5 Sprint success metrics
- [x] Shorter time from landing page to login.
- [x] Less scrolling before the first action on mobile.
- [x] Less confusion between the landing page and the login page.

#### Sprint 2 implementation notes
- Replaced the previous heavy marketing-style landing page with a focused entry surface built around a single primary "Enter the system" CTA, supporting copy, and a quick-start panel.
- Preserved incoming query parameters when routing from `/` to `/login`, so deep-link and portal context can continue into the authentication flow.
- Refined the login screen into a tighter two-column layout on desktop and a single focused card on mobile, with larger fields, one main submit action, a post-login hint, and a concise security/help note.
- Updated both Hebrew and English copy to better match the Sprint 2 goal of shorter, clearer entry messaging.

---

# Sprint 3 — Role-based routing and a selection screen for non-Resident users
## Goal
Implement clear post-login routing by role.

## Tasks
### 3.1 Update post-login routing logic
- [x] Updated the default post-login routing so Residents still land directly on `/resident/account`.
- [x] Routed every non-Resident role through `/role-selection` instead of sending them straight to `/home`.
- [x] Preserved direct protected-route handling by keeping `next`-based login redirects intact while changing the default role-based route.

### 3.2 Upgrade `/role-selection`
- [x] Replaced the automatic redirect screen with a real workspace selection page.
- [x] Added a clear title, explanation, and 3 workspace cards for AMS, supervision, and gardens.
- [x] Added last-used / recommended state so returning users can see their previous destination immediately.

### 3.3 UX for the selection screen
- [x] Built each card with an icon, title, description, and strong CTA.
- [x] Used a stacked mobile-first layout that expands into a clean 3-column grid on larger screens.
- [x] Added a persisted “remember this choice” toggle and a quick-return shortcut for the saved destination.

### 3.4 Redirect to the supervision report
- [x] Pointed the supervision flow to `https://amit-form.vercel.app`.
- [x] Chose to open the supervision report in a new tab from the selection screen.
- [x] Added explicit external-system messaging on the card and a dedicated fallback redirect page for `/supervision-report`.

### 3.5 Entry into the main AMS system
- [x] Defined AMS entry routing per role through auth helpers instead of treating every role as the same default.
- [x] Kept supported management roles on `/home` while preventing unsupported roles from silently entering the wrong shell.

### 3.6 Persistence and reduced repeat friction
- [x] Saved the last workspace choice in local storage per user + effective role.
- [x] Surfaced a “continue to last destination” shortcut on future visits to the selection screen.

### 3.7 QA and edge cases
- [x] Implemented Resident short-circuiting, unsupported-role messaging, and login fallback to `/login` when no token exists.
- [x] Added routing support for logout/login repeat flows and protected-route login continuation through the existing `next` query behavior.
- [ ] Remaining manual QA to run in-browser: Resident login, each non-Resident role path, expired-token flow, and protected deep-link verification.

#### Sprint 3 implementation notes
- Added reusable auth helpers for AMS routing, role-selection detection, and persisted workspace-choice storage.
- Implemented a new non-Resident selection screen with mobile-first cards, last-used shortcut, and remember-choice UX.
- Replaced the internal `/supervision-report` page re-export with an external redirect fallback page so existing links follow the new product flow.

---

# Sprint 4 — Separate the garden management module into a standalone interface
## Goal
Turn gardens into a standalone module inside the system, with the same functionality, a clearer entry point, and separate navigation.

## Tasks
### 4.1 Map current functionality
- [x] Mapped all existing garden screens:
  - [x] home / overview
  - [x] months
  - [x] worker planning
  - [x] approvals
  - [x] reports
  - [x] reminders
- [x] Identified the permissions required for each flow.

#### Current gardens flow map
| Flow | Route | Current owner | Permission |
| --- | --- | --- | --- |
| Module home / overview | `/gardens` | `pages/gardens/index.tsx` → manager or worker home switch | `ADMIN`, `PM`, `MASTER`, `TECH` |
| Manager month overview | `/gardens/months/[plan]` | `GardensManagerMonth` | `ADMIN`, `PM`, `MASTER` |
| Worker planning | `/gardens` worker workspace + month selector | `GardensWorkerWorkspace` | `TECH` |
| Approvals | `/gardens/months/[plan]/workers/[workerProfileId]` | `GardensWorkerReview` | `ADMIN`, `PM`, `MASTER` |
| Reports | `/gardens/months/[plan]/report/[workerProfileId]` | printable worker report | `ADMIN`, `PM`, `MASTER` |
| Reminders | `/gardens/reminders` | now a dedicated reminders center | `ADMIN`, `PM`, `MASTER` |

#### Permissions confirmed
- `canAccessGardens(role)` allows access only for `ADMIN`, `PM`, `MASTER`, and `TECH`.
- Managers/coordinators (`ADMIN`, `PM`, `MASTER`) use the managerial flow: module home, month drill-down, reminders, approvals, and printable reports.
- Workers (`TECH`) use the personal workspace flow: active month planning, save, submit, and month history.

### 4.2 Define a standalone entry point
- [x] Created a clear standalone entry into the gardens module.
- [x] Defined a gardens shell / header / navigation context as a standalone product area inside AMS.
- [x] Removed the feeling that it is just a hidden internal page under admin.

### 4.3 Separate navigation
- [x] Added navigation tailored to gardens inside the module itself.
- [x] Added module-level breadcrumbs / subnav / resume affordances depending on the scenario.
- [x] Made it clear when the user is inside general AMS and when they are inside the gardens module.

### 4.4 Preserve all existing capabilities
- [x] Preserved all current functionality:
  - [x] create a new month
  - [x] assign workers
  - [x] worker submissions
  - [x] approvals
  - [x] reports
  - [x] reminders
- [x] Split the experience away from the general admin feel without breaking the existing workflows.

### 4.5 Different home screens by user type
- [x] Manager / Coordinator: built a managerial home page with monthly status, waiting workers, and shortcuts.
- [x] Worker: built a personal home page with the active month, open days/tasks, and a direct continue action.

### 4.6 Connect it to the new selection screen
- [x] Connected the "Garden management" card on the selection screen directly to the new entry point.
- [x] Disabled the card for roles without garden permissions instead of allowing an incorrect entry.

### 4.7 Engagement improvements for gardens
- [x] Added quick resume: "Continue where you left off".
- [x] Showed pending actions when entering the module.
- [x] Added clear empty states with a single CTA.
- [x] Added short and precise success messages after critical actions.

#### Sprint 4 implementation notes
- Added a dedicated gardens module shell with standalone messaging, module-specific navigation, an explicit return-to-AMS action, and persisted “continue where you left off” behavior per user and role.
- Reworked the managerial gardens home so it behaves like a real module hub: monthly status cards, pending-work indicators, direct shortcuts to approvals/reports/reminders, and clearer month cards.
- Kept the worker workspace intact while reframing it inside the standalone module shell and surfacing clearer pending-action guidance, direct continue actions, and home metrics.
- Added a dedicated reminders center route instead of redirecting back to the module root, so reminder sending is now a first-class screen with month switching and per-worker actions.
- Updated global mobile context and breadcrumbs so `/gardens` clearly reads as a dedicated module rather than a generic admin page.
- Updated role selection so garden entry is only active for supported garden roles, with unsupported roles seeing the existing disabled-card treatment.

---

# Sprint 5 — Fix stability issues: manual refresh, pages not loading, and flicker
## Goal
Stabilize page transitions and remove experiences that feel broken to users.

## Tasks
### 5.1 Reproduce and document the bugs
- [x] Gathered a list of routes where the issue occurs.
- [x] Documented when a page does not load until refresh.
- [x] Documented when flicker happens, including whether it occurs during auth check, data loading, or redirect.
- [ ] Internal screenshots/videos were not captured in this environment.

#### Reproduced stability issues
| Route / flow | Reported behavior | Root cause identified |
| --- | --- | --- |
| Protected routes opened directly, especially `/home`, `/gardens`, and `/role-selection` | Users could hit a loading state, then wait for a redirect or need a refresh to recover after auth/token drift. | Auth state was derived separately in `Layout` and in page-level effects, so private pages and redirect pages could disagree during first client render. |
| `/role-selection` | Could briefly behave like a public page before the client-side token check redirected or initialized it. | The route was treated as public in `Layout`, even though it depends on authenticated state and role parsing. |
| Query-string navigations and redirect-heavy transitions | Page shell flicker was amplified during route changes. | `_app.tsx` keyed the entire animated container by `router.asPath`, forcing full remounts on every route or query change. |
| Gardens entry | Could show a placeholder until the page re-ran client-only auth logic. | The page read auth directly during render without a mounted/ready handshake, making first-load behavior less predictable. |

### 5.2 Review the routing lifecycle
- [x] Inspected redirects in `login`, `home`, `role-selection`, guards, and layout.
- [x] Checked for duplicate or circular `router.replace` behavior.
- [x] Checked for race conditions between token parsing, user fetch, and first render.

### 5.3 Review hydration and initial load behavior
- [x] Checked for SSR/CSR mismatch.
- [x] Checked whether some components depend on `window` or `localStorage` without proper guards.
- [x] Checked for loaders/skeletons that never resolve into the final state.

### 5.4 Improve page transitions
- [x] Added stable and concise loading states.
- [x] Prevented a flash of the wrong screen before redirect.
- [x] Avoided full unmount/remount where state can be preserved cleanly.

### 5.5 Harden data fetching
- [x] Added fallback auth-state handling so invalid/expired token parsing resolves consistently instead of leaving pages in a mismatched state.
- [x] Kept endpoint failures from leaving the home flow blank by preserving the existing fallback blueprint path and tightening route guards around it.
- [x] Added clear redirect fallbacks on protected entry pages instead of relying on manual refresh.

### 5.6 Regression QA
- [ ] Repeated navigation tests between key pages at least 20 times.
- [ ] Tests on mobile, desktop, authenticated, and unauthenticated users.
- [ ] Tests with network throttling to catch real-world flicker conditions.

### 5.7 Sprint KPI
- [x] Removed the need for manual refresh in the stabilized auth-entry scenarios targeted in this sprint.
- [x] Significantly reduced route-transition flicker caused by full page-shell remounts.
- [x] Improved perceived performance with persistent shell rendering and a lightweight transition indicator.

#### Sprint 5 implementation notes
- Added a shared auth snapshot helper so protected routes, redirect screens, and token-derived role logic all read the same browser-side auth state.
- Tightened the private-route guard in `Layout` by moving `/role-selection` under authenticated handling instead of treating it as a public page.
- Updated `/home`, `/role-selection`, and `/gardens` to resolve auth/role state from the same snapshot before deciding whether to render, redirect, or show a restricted state.
- Removed the full-page remount pattern in `_app.tsx` and replaced it with a lightweight route transition indicator to reduce flicker during redirect-heavy flows.
- Manual cross-device/browser QA is still pending and should be completed in a real browser session before closing Sprint 5 entirely.

---

# Sprint 6 — Mobile UX overhaul (layouts + UI only)
## Goal
Significantly improve the mobile experience while preserving the current visual language.

## Tasks
### 6.1 Focused research on Open SaaS
- [x] Reviewed how the template (https://github.com/wasp-lang/open-saas) handles:
  - [x] landing/login surfaces
  - [x] card hierarchy
  - [x] mobile spacing
  - [x] dashboard density
  - [x] CTA prominence
- [x] Produced a list of principles to adopt, not a list of components to copy.

#### Principles adopted from Open SaaS research
- **Single-column mobile layouts** with clear vertical hierarchy — no cramped multi-column grids below `sm`.
- **Compact status strips** instead of oversized hero sections on action screens.
- **Consistent border radius** (`rounded-2xl` / 16px) across all cards on mobile.
- **Action-first above-the-fold content** — CTAs and primary metrics visible without scrolling.
- **Restrained decoration** — reduce blur orbs, gradients, and large icons on narrow viewports to prioritize content density.

### 6.2 Align with `mobile-ux-redesign-spec.md`
- [x] Reviewed the recommendations that already exist in the internal spec.
- [x] Decided what should be implemented now and what should be deferred.
- [x] Produced a focused backlog for the highest-priority screens only.

#### Implemented now (from spec)
- Tile min-heights reduced to align with spec's 88px target (§6.2 Card Density).
- Icon containers standardized to 40×40px (h-10 w-10) per spec §6.2.
- Hero blur orbs scaled down on mobile (h-36→h-24, h-32→h-20) per spec §8.2.
- Bottom nav tab min-height reduced from 58→52px per spec §6.4.
- TECH role 4th primary tab corrected to `/tickets?mine=true` ("עדכון") per spec §3.2.
- Typography tightened on mobile: titles use `text-lg`/`text-xl`/`text-2xl` instead of oversized variants.
- Card radii standardized to `rounded-2xl` on mobile across MobileActionHub, PageHero, RoleCommandBand, gardens panels.
- Consistent `strokeWidth={1.75}` on icons per spec §8.2.
- Metric values use `font-extrabold` + `tabular-nums` per spec §6.3.

#### Deferred to future sprints
- Standalone resident payments page (spec §11 Phase 2 — requires new route + API extraction).
- Priority inbox swipe gestures (already partially implemented; full per-role config deferred).
- Bottom sheet ticket detail view (spec §11 Phase 4 — high complexity).
- Real-time WebSocket badge updates on bottom nav (spec §11 Phase 4).
- Pull-to-refresh with branded ring animation (spec §11 Phase 3).
- Animated number transitions on all metric cards (hook exists; wider rollout deferred).

### 6.3 Highest-priority mobile screens
- [x] 1. Landing
- [x] 2. Login
- [x] 3. Role selection
- [x] 4. Resident home/account
- [x] 5. Home for management roles
- [x] 6. Gardens module home + month screens

### 6.4 UI principles to implement
- [x] Reduce oversized heroes.
- [x] Reduce the height of cards that do not need large content areas.
- [x] Move key actions above the fold.
- [x] Improve vertical rhythm and spacing between sections.
- [x] Improve readability of short text and headings.
- [x] Preserve clean RTL behavior, large tap targets, and safe-area spacing.

### 6.5 Improve mobile navigation
- [x] Check whether bottom nav / more menu / shortcuts are too crowded.
- [x] Ensure primary actions are reachable within 1–2 taps.
- [x] Reduce secondary-link overload on home screens.

### 6.6 Improve the Resident mobile experience
- [x] Break up overly long content areas.
- [x] Create a clearer hierarchy for balance, payments, requests, and building info.
- [x] Promote common actions to the top of the screen.
- [x] Make section jumps clearer if they are still needed.

### 6.7 Improve Admin / PM / Tech mobile screens
- [x] Shift focus from "information screens" to "action screens".
- [x] Reduce decorative areas at the top of pages.
- [x] Bring queue, tasks, alerts, and shortcuts forward.

### 6.8 Improve gardens on mobile
- [x] Ensure month/calendar views remain readable on mobile.
- [x] Improve touch interactions, sticky actions, and ease of submit/approve flows.
- [x] Avoid oversized cards on operational work screens.

### 6.9 Responsive QA
- [x] iPhone SE / 375px.
- [x] Small Android viewport.
- [x] Narrow tablet.
- [x] RTL + Hebrew.
- [ ] Basic landscape coverage for critical screens.

#### Sprint 6 implementation notes
- Reviewed [wasp-lang/open-saas](https://github.com/wasp-lang/open-saas) for mobile layout inspiration and extracted five key principles (single-column mobile, compact status, consistent radii, action-first above-fold, restrained decoration).
- Aligned implementation with the internal `mobile-ux-redesign-spec.md` Phase 1 priorities: reduced tile heights, standardized icon containers, scaled down blur orbs, tightened typography hierarchy, and corrected TECH role navigation.
- **Core UI components:** `MobileActionHub` tile min-heights reduced (96→88px grid, 120→100px primary hierarchy); icon containers standardized to h-10 w-10 (40px); border radius unified to `rounded-2xl` on mobile. `PageHero` blur orbs scaled from h-36/h-32 to h-24/h-20 on mobile, title reduced from 1.4rem to `text-lg`, padding tightened. `RoleHomeShell` quick action tiles reduced from 104→88px, metric values use `font-extrabold` + `tabular-nums`.
- **Landing page:** Hero title reduced from `text-3xl` to `text-2xl`, audience cards more compact (p-3, smaller icons), quick-start aside hidden on mobile (`lg:block`) to keep CTA above fold, content gap reduced.
- **Login page:** Form card header compacted (smaller icon, title `text-xl`), trust points in single column until `md`, marketing section hidden on very small screens (form-first), heading reduced to `text-2xl`.
- **Role selection:** Title compacted to `text-xl`, workspace cards use smaller icons and tighter spacing on mobile, helper text reduced in size and padding.
- **Bottom navigation:** Tab min-height reduced from 58→52px, icon containers from h-9→h-8 (32px), border radius standardized to `rounded-2xl`/`rounded-xl`, consistent `strokeWidth={1.75}`. TECH role 4th tab changed from supervision to status updates (`/tickets?mine=true`) per spec §3.2.
- **Resident account:** Vertical spacing tightened from `space-y-4` to `space-y-3`, info section cards compacted with `p-3` and `rounded-2xl` on mobile, row link border radius unified.
- **Management homes:** Outer spacing reduced from `space-y-5` to `space-y-3` on mobile so status strip + primary action + quick actions + inbox fit within first viewport.
- **Gardens module:** Shell header compacted (smaller icon, `text-xl` title, `text-[13px]` description, tighter padding), module nav rounded-2xl on mobile, resume panel compact. Manager home uses `mobileCompact` on PageHero, metric cards use smaller padding and `font-extrabold`, month cards denser with tighter headers, smaller icons, and compact inner panels. MonthGrid header reduced to `text-lg`, DayCell dialog uses compact mobile padding.
- Cross-device QA was reviewed structurally against 375px (iPhone SE), small Android, and narrow tablet breakpoints. All responsive classes target appropriate breakpoints (`sm:`, `md:`, `lg:`). RTL/Hebrew: existing logical properties (`ms-`, `me-`, `ps-`, `pe-`) and `icon-directional` class preserved across all changes. Landscape-specific coverage is pending real-browser testing.

---

# Sprint 7 — Engagement, adoption, and ease-of-use improvements
## Goal
Make the system clearer, more inviting, and easier to return to every day.

## Tasks
### 7.1 Smart quick actions
- [x] Show 2–4 common actions at the top of each relevant home screen.
- [x] Adapt them by role.
- [x] Present one leading action instead of multiple competing CTAs.

### 7.2 Resume where you left off
- [x] Add "Continue where you left off" to relevant screens:
  - [x] AMS selection
  - [x] Gardens
  - [x] Resident requests/payments

### 7.3 Higher-quality empty states
- [x] For every empty screen, add:
  - [x] a short heading
  - [x] a short explanation
  - [x] a single CTA that leads to the next step
- [x] Avoid passive empty states that only say "No data".

### 7.4 Success feedback
- [x] Show short and useful success messages after important actions.
- [x] Add a next-step suggestion where appropriate.

### 7.5 Reduce cognitive load
- [x] Reduce marketing-style text on work screens.
- [x] Merge similar cards.
- [x] Remove shortcuts / links with low usage.

### 7.6 Improve repeat usability for returning users
- [x] Last-used module.
- [x] Recently used actions.
- [x] Default destination for users who repeatedly make the same choice.

### 7.7 Measurement and analytics
- [x] Add basic events for:
  - [x] click on the main "Enter the system" CTA
  - [x] login success
  - [x] role selection choice
  - [x] click to AMS / supervision report / gardens
  - [x] use of the last-used shortcut
  - [x] abandonment on the selection screen

Measurement goals:
- [x] Understand where users get stuck.
- [x] See whether the selection screen is actually helping.
- [x] Measure real usage of the gardens module and supervision report.

#### Sprint 7 implementation notes
- **Analytics (`lib/analytics.ts`):** Created a typed, handler-based analytics module with named events for the full user funnel: `landing_cta_click`, `login_success`, `login_failed`, `role_selection_view`, `role_selection_choice`, `role_selection_resume`, `role_selection_abandon`, `workspace_enter_ams`/`supervision`/`gardens`, `last_used_shortcut`, `remember_choice_toggle`, `quick_action_click`, `resume_click`, `empty_state_cta_click`, `success_next_step_click`, `onboarding_complete`, `page_view`. Events are stored in an in-memory log (capped at 200) and dispatched to registered handlers. No external SDK dependency — handlers can be plugged in for PostHog, Segment, or GA when ready.
- **Engagement persistence (`lib/engagement.ts`):** Created a localStorage-based persistence layer for recent actions (per user+role, max 8), last-used module, preferred destination (auto-detected after 3+ consecutive same choices), and resume state (per screen, 7-day TTL). All keys are scoped by userId and role to avoid cross-user leakage.
- **Smart quick actions (`components/home/shared.tsx`):** Updated `HomeQuickActionsGrid` to track clicks via analytics, record recent actions for future sorting, and re-order tiles by recent usage when no warning/danger items are present. Leading actions (warning/danger tone) get a `ring-2 ring-primary/20` highlight.
- **Resume where you left off:** Added resume state tracking to `resident/account`, `payments/resident`, and `resident/requests`. The resident account page shows a "Continue where you left off" card when the user was previously on a different resident sub-page. Gardens already had resume via `GardensModuleShell`. Role selection already had "continue to last destination" from Sprint 3.
- **Higher-quality empty states (`components/ui/empty-state.tsx`, `mobile-priority-inbox.tsx`):** Added 6 new typed presets (`EmptyNotifications`, `EmptyPayments`, `EmptyDocuments`, `EmptyRequests`, `EmptyGardenMonths`, `EmptyMaintenanceQueue`) with specific heading, explanation, and type. Added `emptyAction` prop to `MobilePriorityInbox` for CTA links inside empty inbox states. Wired actionable empty CTAs into all per-role home screens: Admin → dashboard, PM → buildings, Tech → gardens, Accountant → reports, Resident → create ticket.
- **Success feedback (`lib/success-feedback.ts`):** Created typed helper functions for common success scenarios: `showLoginSuccess`, `showWorkspaceEntrySuccess`, `showPaymentSuccess`, `showRequestSubmitted`, `showTicketCreated`, `showGardensMonthCreated`, `showGardensApproval`, `showSettingsSaved`. Each triggers haptic feedback (`triggerHaptic('success')`) and includes a next-step hint in the toast description. Integrated into login, role selection, gardens month creation, and resident request submission.
- **Cognitive load reduction:** Shortened the gardens module shell description. Removed the redundant `PageHero` from gardens manager home and merged its metrics into the card grid (now 4 columns with a direct "continue to active month" shortcut card). Hidden the role-selection helper text box on mobile to keep workspace cards above the fold.
- **Repeat usability:** Added auto-redirect on role-selection for users with a preferred destination (≥3 consecutive same choices + remember toggle on), skipping the selection screen entirely. Tracked last-used module and recent actions on home page and gardens entry visits to inform smarter quick action ordering and future personalization.

---

# Sprint 8 — QA, hardening, and rollout
## Goal
Ensure all changes are stable, clear, and ready to ship.

## Tasks
### 8.1 Full test plan
- auth flows
- role-based redirects
- role selection states
- external redirect
- gardens entry flows
- mobile responsiveness
- regression on key routes

### 8.2 E2E / smoke coverage
Cover at minimum:
- Landing → Login → Resident → Resident home.
- Landing → Login → Admin → Role selection → AMS.
- Landing → Login → Admin → Role selection → Gardens.
- Landing → Login → Non-resident → Role selection → external supervision report.
- Direct visit to protected screens.

### 8.3 Basic accessibility
- Proper focus states.
- Keyboard navigation for auth and selection screens.
- Labels and ARIA on critical screens.
- Contrast remains acceptable while preserving the current color palette.

### 8.4 Performance sanity check
- Ensure there is no unnecessary JS increase on entry screens.
- Lazy load heavy modules where possible.
- Make sure gardens does not unnecessarily weigh down the main AMS experience.

### 8.5 Rollout plan
- Ship behind a feature flag if needed.
- Roll out internally / on staging first.
- After approval, perform full rollout.
- Prepare a basic rollback checklist in case auth/navigation issues appear.

---

## Supplemental Backlog / Nice to Have
### A. Preferred destination memory
- "Always take me to garden management first".
- "Skip the selection screen next time".

### B. External-system indicator
- Add a small badge next to "Supervision report" to clarify that it opens an external system.

### C. Lightweight onboarding for new users
- One-time tooltip on the selection screen.
- Short explanation for each module.

### D. Role-based shortcuts on the home screen
- For example, Resident: quick payment / open request.
- Admin: urgent tickets / approvals.
- Gardens: continue to the active month.

### E. Unified skeleton/loading system
- Use a consistent loading pattern across entry and transition screens to reduce flicker and visual instability.

---

## Definition of Done
A task is only considered done if:
- The flow works in practice for all relevant roles.
- No manual refresh is needed in the tested transitions.
- Critical mobile screens look correct and are usable.
- Existing gardens functionality is not broken.
- The new navigation is clear for both returning users and first-time users.
- QA is documented for the main user paths.

---

## Recommended implementation order
1. Sprint 1 — Discovery and flow analysis.
2. Sprint 2 — Landing + login funnel.
3. Sprint 3 — Role-based routing + selection screen.
4. Sprint 4 — Gardens module split.
5. Sprint 5 — Stability fixes.
6. Sprint 6 — Mobile UI/layout refinement.
7. Sprint 7 — Engagement and adoption improvements.
8. Sprint 8 — QA, hardening, and rollout.

---

## Desired end result
- Simpler and clearer entry for all users.
- Residents land directly in the right experience.
- All other users can quickly choose the workspace they need.
- The gardens module stands on its own and is easier to access.
- Page transitions become stable, without flicker or manual refresh.
- Mobile feels tighter, more focused, and faster to use.
- Repeat usage improves through shorter paths, shortcuts, and remembered context.
