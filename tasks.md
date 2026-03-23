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
- Map all existing garden screens:
  - home / overview
  - months
  - worker planning
  - approvals
  - reports
  - reminders
- Identify the permissions required for each flow.

### 4.2 Define a standalone entry point
- Create a clear standalone entry into the gardens module.
- Define a gardens shell / header / navigation context as a standalone product area inside AMS.
- Remove the feeling that it is just a hidden internal page under admin.

### 4.3 Separate navigation
- Add navigation tailored to gardens inside the module itself.
- Consider breadcrumbs / subnav / tabs depending on the scenario.
- Make it clear when the user is inside general AMS and when they are inside the gardens module.

### 4.4 Preserve all existing capabilities
- Make sure all current functionality remains intact:
  - create a new month
  - assign workers
  - worker submissions
  - approvals
  - reports
  - reminders
- If there are dependencies on admin screens, split them gradually without breaking workflows.

### 4.5 Different home screens by user type
- Manager / Coordinator: a managerial home page with monthly status, waiting workers, and shortcuts.
- Worker: a personal home page with the active month, open days/tasks, and a direct continue action.

### 4.6 Connect it to the new selection screen
- The "Garden management" card on the selection screen should route directly to this entry point.
- If a user lacks garden permissions, show a disabled state or hide the option entirely — based on product decision.

### 4.7 Engagement improvements for gardens
- Add quick resume: "Continue where you left off".
- Show pending actions when entering the module.
- Show clear empty states with a single CTA.
- Add short and precise success messages after critical actions.

---

# Sprint 5 — Fix stability issues: manual refresh, pages not loading, and flicker
## Goal
Stabilize page transitions and remove experiences that feel broken to users.

## Tasks
### 5.1 Reproduce and document the bugs
- Gather a list of routes where the issue occurs.
- Document when a page does not load until refresh.
- Document when flicker happens, including whether it occurs during auth check, data loading, or redirect.
- Add internal screenshots/videos if needed for reproduction.

### 5.2 Review the routing lifecycle
- Inspect redirects in `login`, `home`, `role-selection`, guards, and layout.
- Check for duplicate or circular `router.replace` behavior.
- Check for race conditions between token parsing, user fetch, and first render.

### 5.3 Review hydration and initial load behavior
- Check for SSR/CSR mismatch.
- Check whether some components depend on `window` or `localStorage` without proper guards.
- Check for loaders/skeletons that never resolve into the final state.

### 5.4 Improve page transitions
- Add stable and concise loading states.
- Prevent a flash of the wrong screen before redirect.
- Avoid full unmount/remount where state can be preserved cleanly.

### 5.5 Harden data fetching
- Add retry / empty / error states wherever they are missing.
- Make sure an endpoint failure does not leave a blank screen.
- Show a clear fallback instead of forcing users to manually refresh.

### 5.6 Regression QA
- Repeated navigation tests between key pages at least 20 times.
- Tests on mobile, desktop, authenticated, and unauthenticated users.
- Tests with network throttling to catch real-world flicker conditions.

### 5.7 Sprint KPI
- Remove the need for manual refresh in the reported scenarios.
- Significantly reduce route-transition flicker.
- Improve perceived performance.

---

# Sprint 6 — Mobile UX overhaul (layouts + UI only)
## Goal
Significantly improve the mobile experience while preserving the current visual language.

## Tasks
### 6.1 Focused research on Open SaaS
- Review how the template handles:
  - landing/login surfaces
  - card hierarchy
  - mobile spacing
  - dashboard density
  - CTA prominence
- Produce a list of principles to adopt, not a list of components to copy.

### 6.2 Align with `mobile-ux-redesign-spec.md`
- Review the recommendations that already exist in the internal spec.
- Decide what should be implemented now and what should be deferred.
- Produce a focused backlog for the highest-priority screens only.

### 6.3 Highest-priority mobile screens
1. Landing
2. Login
3. Role selection
4. Resident home/account
5. Home for management roles
6. Gardens module home + month screens

### 6.4 UI principles to implement
- Reduce oversized heroes.
- Reduce the height of cards that do not need large content areas.
- Move key actions above the fold.
- Improve vertical rhythm and spacing between sections.
- Improve readability of short text and headings.
- Preserve clean RTL behavior, large tap targets, and safe-area spacing.

### 6.5 Improve mobile navigation
- Check whether bottom nav / more menu / shortcuts are too crowded.
- Ensure primary actions are reachable within 1–2 taps.
- Reduce secondary-link overload on home screens.

### 6.6 Improve the Resident mobile experience
- Break up overly long content areas.
- Create a clearer hierarchy for balance, payments, requests, and building info.
- Promote common actions to the top of the screen.
- Make section jumps clearer if they are still needed.

### 6.7 Improve Admin / PM / Tech mobile screens
- Shift focus from "information screens" to "action screens".
- Reduce decorative areas at the top of pages.
- Bring queue, tasks, alerts, and shortcuts forward.

### 6.8 Improve gardens on mobile
- Ensure month/calendar views remain readable on mobile.
- Improve touch interactions, sticky actions, and ease of submit/approve flows.
- Avoid oversized cards on operational work screens.

### 6.9 Responsive QA
- iPhone SE / 375px.
- Small Android viewport.
- Narrow tablet.
- RTL + Hebrew.
- Basic landscape coverage for critical screens.

---

# Sprint 7 — Engagement, adoption, and ease-of-use improvements
## Goal
Make the system clearer, more inviting, and easier to return to every day.

## Tasks
### 7.1 Smart quick actions
- Show 2–4 common actions at the top of each relevant home screen.
- Adapt them by role.
- Present one leading action instead of multiple competing CTAs.

### 7.2 Resume where you left off
- Add "Continue where you left off" to relevant screens:
  - AMS selection
  - Gardens
  - Resident requests/payments

### 7.3 Higher-quality empty states
- For every empty screen, add:
  - a short heading
  - a short explanation
  - a single CTA that leads to the next step
- Avoid passive empty states that only say "No data".

### 7.4 Success feedback
- Show short and useful success messages after important actions.
- Add a next-step suggestion where appropriate.

### 7.5 Reduce cognitive load
- Reduce marketing-style text on work screens.
- Merge similar cards.
- Remove shortcuts / links with low usage.

### 7.6 Improve repeat usability for returning users
- Last-used module.
- Recently used actions.
- Default destination for users who repeatedly make the same choice.

### 7.7 Measurement and analytics
Add basic events for:
- click on the main "Enter the system" CTA
- login success
- role selection choice
- click to AMS / supervision report / gardens
- use of the last-used shortcut
- abandonment on the selection screen

Measurement goals:
- Understand where users get stuck.
- See whether the selection screen is actually helping.
- Measure real usage of the gardens module and supervision report.

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
