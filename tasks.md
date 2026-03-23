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
- Map what happens today for each role after login.
- Document which routes are sent through `getDefaultRoute` and which use manual redirects.
- Identify overlap or conflict between `/home`, `/resident/account`, `/role-selection`, and module entry points such as `/gardens`.

### 1.2 Define the target flow
Define an agreed target flow:
1. User arrives on the landing page.
2. A clear CTA is shown: "Enter the system".
3. From there, the user goes to `/login`.
4. After login:
   - If the role is `RESIDENT` → direct route to the Resident interface.
   - If the role is any other role → route to a selection screen.
5. The selection screen should show 3 options:
   - Enter the AMS management system.
   - Go to the supervision report (`https://amit-form.vercel.app`).
   - Go to garden management.

### 1.3 Product decisions around roles
- Define exactly which roles are considered "Resident" and which are considered "Other".
- Confirm expected behavior for impersonation / `actAsRole`.
- Define a safe fallback if the token exists but the role is unknown.

### 1.4 Define initial acceptance criteria
- Resident users do not see the selection screen and go directly to the Resident interface.
- Every other role does see the selection screen.
- Every option on the selection screen works without a manual refresh.
- Clicking the supervision report always opens the correct destination.
- Gardens is accessible as a standalone module and not only as a hidden section inside admin.

### 1.5 Map technical risks
- Check whether flicker is caused by auth state loading on the client only.
- Check whether there are duplicate redirects between `_app`, `Layout`, guards, and pages.
- Check whether hydration mismatch, loading skeleton loops, or race conditions are causing the need for refresh.

---

# Sprint 2 — Landing page + login entry funnel
## Goal
Create a clearer, shorter, and more pleasant entry path into the product.

## Tasks
### 2.1 Create or upgrade the landing page
- Add a clear landing page with a central CTA: "Enter the system".
- If a landing page already exists, update it so it focuses on entry instead of heavy text.
- On mobile, the CTA must appear above the fold.
- Add a short message explaining that the system supports residents, management, operations, and gardens.

### 2.2 Refine the transition to login
- The main CTA should route to `/login`.
- Preserve relevant query params if they exist.
- Make sure there is no dead-end between landing and login.

### 2.3 Improve the login UI
- Improve hierarchy on the login screen so the form is the focal point.
- Reduce visual noise on mobile.
- Ensure fields are large, clear, touch-friendly, and show readable validation states.
- Confirm there is one clear primary CTA for sign-in.

### 2.4 Improve microcopy
- Update text so it is shorter and clearer.
- Add a short hint telling users what happens after login.
- Consider a concise trust/security note only, without overloading the screen.

### 2.5 Sprint success metrics
- Shorter time from landing page to login.
- Less scrolling before the first action on mobile.
- Less confusion between the landing page and the login page.

---

# Sprint 3 — Role-based routing and a selection screen for non-Resident users
## Goal
Implement clear post-login routing by role.

## Tasks
### 3.1 Update post-login routing logic
- Update the logic so Residents are routed directly to the Resident screen.
- Route every other role to a dedicated selection screen.
- Make sure the logic works for both normal login and refresh on a protected page.

### 3.2 Upgrade `/role-selection`
Turn the page from an automatic redirect screen into a real decision screen that includes:
- A clear title.
- A short explanation: "Choose which interface to enter".
- 3 action cards:
  1. AMS management system.
  2. Supervision report.
  3. Garden management.
- An indication of the recommended or last-used destination.

### 3.3 UX for the selection screen
- Each card should include a title, description, icon, and a clear CTA.
- Mobile-first: stacked cards with large tap targets.
- Desktop: clean, organized grid.
- Show the last-used destination when possible.
- Consider a "remember this choice for next time" option for non-Resident users.

### 3.4 Redirect to the supervision report
- Clicking the supervision report should perform a correct redirect to `https://amit-form.vercel.app`.
- Decide whether it opens in the same tab or a new tab.
- If it opens in a new tab, make it clear to the user that this is an external system.

### 3.5 Entry into the main AMS system
- Define exactly which route the user enters when choosing "AMS management system", based on role.
- Make sure each role lands in the right home screen and not in an overly generic one.

### 3.6 Persistence and reduced repeat friction
- Save the last choice locally (for example, with local storage) only for relevant users.
- Show a shortcut to the last-used destination on the next visit to improve engagement and speed.

### 3.7 QA and edge cases
- Login with Resident.
- Login with Admin / PM / Tech / Accountant.
- Logout and login again.
- Direct entry using a protected URL.
- Expired token.
- Missing role / unsupported role.

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
