# Mobile UX Enterprise Refinement Plan

This document replaces the previous backlog and turns the latest UX review into a sprinted execution plan focused on making the mobile experience feel professional, efficient, engaging, and enterprise-ready.

## Objective

Deliver a mobile-first experience that is:

- fast to learn,
- easy to operate under pressure,
- visually polished without being noisy,
- trustworthy for enterprise buyers,
- scalable across roles,
- consistent across all major workflows.

## Delivery principles

1. Mobile primary workflows come before decorative polish.
2. Shared patterns come before page-by-page one-off fixes.
3. Enterprise trust, clarity, and recoverability matter as much as visual quality.
4. Every sprint must ship visible UX gains and reduce design debt.
5. Navigation, forms, notifications, and feedback must work equally well for repeat users and first-time users.

## Definition of done for every sprint

A sprint is only complete when:

- the affected flows work on small mobile screens,
- touch targets and spacing are mobile-safe,
- loading, empty, success, and error states exist,
- actions are clearly prioritized,
- no critical content is hidden behind fixed surfaces,
- the updated UI uses shared components or documented patterns,
- acceptance criteria are reviewed against real role-based workflows.

---

# Sprint 1 — Mobile Navigation Reset

## Goal

Create a navigation model that lets each role reach its most important tasks in one or two taps.

## Outcomes

- Mobile users no longer rely on a dense drawer for primary work.
- Top-level navigation becomes role-aware and predictable.
- Secondary/admin destinations move out of the critical path.

## Detailed TODO

### 1. Define the mobile information architecture

- [ ] Audit all current routes and map them by role: Resident, PM, Admin, Tech, Accountant.
- [ ] Identify the top 3-5 most frequent destinations per role.
- [ ] Define which routes are top-level navigation destinations versus secondary destinations.
- [ ] Create a route ownership table showing which screen belongs to which mobile nav bucket.
- [ ] Document edge cases for shared screens that appear in more than one role.

### 2. Design the mobile primary nav pattern

- [ ] Introduce a persistent bottom navigation for mobile only.
- [ ] Limit bottom navigation to a maximum of 5 items per role.
- [ ] Ensure each nav item has both icon and text label.
- [ ] Add active-state treatment that is visually obvious in both light and dark themes.
- [ ] Add support for badges for unread notifications, open tasks, or urgent work.

### 3. Separate primary from secondary actions

- [ ] Move secondary/admin destinations into a mobile “More” sheet or drawer.
- [ ] Keep rarely used configuration and admin routes out of the primary bottom nav.
- [ ] Ensure destructive or account-level actions are visually separated from standard navigation actions.
- [ ] Add clear grouping in the secondary menu to avoid long undifferentiated lists.

### 4. Preserve navigation context

- [ ] Ensure deep links still highlight the correct top-level mobile destination.
- [ ] Preserve scroll position and filter state when navigating back from detail pages.
- [ ] Confirm nested routes do not cause bottom-nav state confusion.
- [ ] Add a predictable back behavior model for detail pages and subflows.

### 5. Implementation and QA

- [ ] Implement mobile nav without regressing desktop sidebar behavior.
- [ ] Verify navigation on common breakpoints: small phone, large phone, tablet.
- [ ] Test each role’s nav map end-to-end.
- [ ] Validate no destination becomes unreachable during the transition.

## Acceptance criteria

- Each role has a clearly defined mobile top-level nav.
- Users can reach their highest-value tasks in one tap from the app shell.
- The sidebar remains a desktop/tablet pattern, not the default mobile primary nav.

---

# Sprint 2 — Mobile Header Simplification and Faster Time-to-Action

## Goal

Reduce header clutter and get users to the main task faster on small screens.

## Outcomes

- The mobile header becomes focused and calm.
- Users see the page purpose faster.
- Decorative content no longer delays core work.

## Detailed TODO

### 1. Simplify the mobile header

- [ ] Split header behavior into mobile and desktop variants.
- [ ] Keep only the essential mobile header actions: back/menu, page title, one contextual utility.
- [ ] Remove redundant always-visible actions from the mobile header.
- [ ] Route non-essential tools such as global search into dedicated mobile-friendly entry points.
- [ ] Replace dense header dropdown behavior with route-based or full-height sheet behavior where appropriate.

### 2. Introduce compact mobile hero rules

- [ ] Create a compact mobile variant of the page hero component.
- [ ] Reduce title size, vertical padding, and supporting copy on mobile.
- [ ] Show only one primary CTA on mobile hero sections by default.
- [ ] Move secondary KPIs and supporting content below the fold when they are not immediately actionable.
- [ ] Remove or collapse side panels/aside content inside hero sections on small screens.

### 3. Prioritize immediate actions on key pages

- [ ] Update Home so the first visible action supports the role’s main daily job.
- [ ] Update Resident Requests so the request form or request-type selector is reachable faster.
- [ ] Update Settings so the first viewport focuses on the user’s most common task, not page chrome.
- [ ] Update Notifications so filters and critical messages are visible before lower-priority content.

### 4. Validate scannability

- [ ] Review all top mobile pages for first-screen scan order.
- [ ] Ensure users can answer these questions within seconds:
  - where am I?
  - what matters most?
  - what should I do next?
- [ ] Remove visual noise that competes with primary actions.

## Acceptance criteria

- The mobile header no longer feels crowded.
- Core action areas are visible earlier on key pages.
- The app feels faster even before performance work begins.

---

# Sprint 3 — Form UX, Validation, and Recovery Hardening

## Goal

Make all high-value forms feel safe, clear, and enterprise-grade on mobile.

## Outcomes

- Users understand what is required.
- Validation helps rather than interrupts.
- Recovery paths are obvious when something goes wrong.

## Detailed TODO

### 1. Standardize validation behavior

- [ ] Introduce a consistent touched/dirty strategy across forms.
- [ ] Prevent untouched fields from rendering as invalid on first load.
- [ ] Validate on blur or submit rather than aggressively on each keystroke.
- [ ] Ensure every invalid field has a specific, actionable error message.
- [ ] Add consistent success messaging after save/submit events.

### 2. Improve form accessibility and recovery

- [ ] Auto-focus and scroll to the first invalid field on submit failure.
- [ ] Add a reusable top-of-form error summary for multi-error forms.
- [ ] Ensure error messages are announced accessibly.
- [ ] Verify labels, helper text, and required states are consistent across all forms.
- [ ] Distinguish clearly between disabled, read-only, and editable states.

### 3. Improve mobile input ergonomics

- [ ] Add password show/hide support to the shared input pattern.
- [ ] Verify semantic input types are used for email, phone, and numeric fields.
- [ ] Confirm input heights and spacing remain touch-friendly across breakpoints.
- [ ] Ensure suffix/prefix icons never obscure user-entered text.
- [ ] Review keyboard behavior and autofill support on login and account forms.

### 4. Upgrade the highest-impact flows first

- [ ] Login: add recovery path, clearer auth errors, and password visibility.
- [ ] Settings: stop showing validation errors before user interaction.
- [ ] Resident Requests: add clearer inline guidance and more forgiving recovery after failed submit.
- [ ] Any password update flow: add stronger confirmation feedback.

### 5. QA and consistency pass

- [ ] Test forms with slow network and failed submissions.
- [ ] Test forms in RTL, small mobile widths, and large text settings.
- [ ] Ensure all success, warning, and destructive states are visually distinct.

## Acceptance criteria

- No major form shows premature validation states.
- Submit failures take users directly to the field that needs attention.
- All major forms support confident completion on mobile.

---

# Sprint 4 — Notification Triage and Operational Inbox

## Goal

Turn notifications from a generic feed into a useful enterprise inbox that helps users decide what to act on first.

## Outcomes

- Critical items are distinguishable from informational items.
- Users can triage work quickly on mobile.
- Header notifications become a lightweight preview, not the full system.

## Detailed TODO

### 1. Redesign the notification model for actionability

- [ ] Define notification priority levels: Critical, Needs Action, Informational, Completed/Archived.
- [ ] Define display rules for urgency, unread state, and SLA relevance.
- [ ] Add source context and recommended next action to each notification item.
- [ ] Identify which notification types should open a detail screen versus perform a quick action.

### 2. Improve the notification page

- [ ] Rebuild the page around triage sections rather than a flat chronological list.
- [ ] Add mobile-friendly filter chips for unread, urgent, assigned to me, and archived.
- [ ] Keep batch actions visible but not dominant.
- [ ] Make the first screen show the highest-value or most urgent items.
- [ ] Preserve filter and search state when users navigate away and back.

### 3. Simplify the header notification experience

- [ ] Reduce the mobile header notification surface to a lightweight preview.
- [ ] Replace mobile dropdown-heavy behavior with a route or sheet pattern.
- [ ] Limit preview content to the most important items.
- [ ] Add a clear transition into the full notification workspace.

### 4. Improve notification preferences UX

- [ ] Group preferences by channel and by event type.
- [ ] Reduce cognitive overload in the settings/preferences UI.
- [ ] Explain the consequence of toggling each preference.
- [ ] Ensure saved state feedback is immediate and clear.

### 5. QA and metrics

- [ ] Test unread count accuracy across shell and notification page.
- [ ] Test live updates and read-state changes under real-time events.
- [ ] Validate mobile usability with large numbers of notifications.

## Acceptance criteria

- Critical and actionable notifications are immediately obvious.
- Mobile users can triage and act without digging through a long feed.
- Notification preview and full inbox serve clearly different purposes.

---

# Sprint 5 — Landing and Brand Trust Optimization

## Goal

Make the marketing/entry experience feel premium, trustworthy, and enterprise-appropriate without overusing visual effects.

## Outcomes

- The landing page feels calmer and more credible.
- Motion supports brand quality instead of distracting from it.
- Enterprise buyers see proof, trust, and clarity earlier.

## Detailed TODO

### 1. Reduce decorative overload

- [ ] Audit all non-essential motion on the landing page.
- [ ] Remove or reduce infinite decorative animations that do not support comprehension.
- [ ] Disable touch-interactive particle behavior on mobile devices.
- [ ] Respect reduced-motion settings across hero experiences.
- [ ] Keep only one premium motion signature for the hero.

### 2. Strengthen enterprise trust signals

- [ ] Rework above-the-fold content so proof points appear earlier.
- [ ] Add stronger messaging around reliability, operational control, and security.
- [ ] Highlight role-based workflows and business outcomes rather than generic feature claims.
- [ ] Clarify the primary CTA path for invited users versus evaluators.

### 3. Improve readability and scan behavior

- [ ] Review contrast and readability of gold-on-dark treatments.
- [ ] Simplify headline, subheadline, and CTA hierarchy.
- [ ] Reduce visual competition between logo effects, particles, gradients, and type animation.
- [ ] Ensure the first screen reads clearly without motion.

### 4. Align login entry with enterprise expectations

- [ ] Add trust/support messaging to the login experience.
- [ ] Add a visible recovery path for password issues.
- [ ] Reserve space for future enterprise auth methods if needed.
- [ ] Clarify error states for invalid credentials versus provisioning/access issues.

### 5. QA and performance review

- [ ] Review mobile battery and perceived performance impact of visual effects.
- [ ] Test landing readability on bright screens and low-power devices.
- [ ] Confirm the page still feels premium after motion reduction.

## Acceptance criteria

- The landing experience feels premium but restrained.
- Buyers see trust and value faster than decorative flair.
- Mobile motion no longer feels heavy or distracting.

---

# Sprint 6 — Safe Areas, Bottom Surfaces, and Shell Reliability

## Goal

Make fixed mobile surfaces behave predictably so content and CTAs are never blocked.

## Outcomes

- Bottom bars, install prompts, and sticky actions no longer compete for the same space.
- Scroll areas remain readable and actionable to the last item.
- The shell feels intentionally engineered for mobile.

## Detailed TODO

### 1. Inventory fixed and sticky mobile surfaces

- [ ] List every bottom-anchored or fixed mobile surface in the app shell.
- [ ] Classify each as essential, optional, promotional, or contextual.
- [ ] Document which combinations are currently allowed to appear at the same time.

### 2. Create a shared bottom-inset system

- [ ] Introduce a shared offset strategy for all bottom-fixed UI.
- [ ] Ensure scroll containers account for active bottom surfaces dynamically.
- [ ] Respect safe areas for iPhone and Android gesture zones.
- [ ] Prevent promotional surfaces from overlapping primary task controls.

### 3. Rationalize promotional and contextual surfaces

- [ ] Ensure only one promotional surface can appear at a time.
- [ ] Review whether the PWA install prompt should be delayed until the user has completed a meaningful action.
- [ ] Make quick-action bars contextual rather than globally persistent where appropriate.
- [ ] Confirm dismiss actions are easy, clear, and remembered.

### 4. Validate end-of-page usability

- [ ] Test long forms, long lists, and list detail pages with bottom surfaces active.
- [ ] Confirm the last button, input, or card is never hidden.
- [ ] Check pull-to-refresh, sticky bars, and bottom prompts together on touch devices.

## Acceptance criteria

- No mobile bottom surface obscures critical content.
- Fixed shell elements cooperate predictably.
- Safe areas are respected across all primary flows.

---

# Sprint 7 — Internationalization Clarity and Settings Polish

## Goal

Improve trust and clarity by making language, direction, and user preferences behave predictably.

## Outcomes

- Locale handling feels intentional, not bundled together implicitly.
- Settings become easier to understand and maintain.
- International users get more reliable behavior.

## Detailed TODO

### 1. Separate preference concepts

- [ ] Split language, layout direction, and regional formatting into distinct settings.
- [ ] Define sensible defaults for Hebrew and English users without hard-coupling every preference.
- [ ] Review where users should access quick language changes versus persistent preference settings.

### 2. Improve settings information architecture

- [ ] Group settings into clearer sections: Profile, Security, Notifications, Language & Region.
- [ ] Reduce repeated or overlapping preference controls between notifications and settings where possible.
- [ ] Add concise helper text to clarify consequences of key settings.
- [ ] Make save states and unsaved changes more obvious.

### 3. Audit formatting consistency

- [ ] Review locale-sensitive date, time, and number formatting across the app.
- [ ] Ensure notification timestamps, dashboard metrics, and history screens follow the selected locale rules.
- [ ] Verify RTL spacing, alignment, and icon mirroring across critical screens.

### 4. QA and regression checks

- [ ] Test language changes on key flows without full confusion or visual breakage.
- [ ] Test both RTL and LTR shells on mobile.
- [ ] Confirm that settings changes persist and remain understandable after reload.

## Acceptance criteria

- Language and direction feel deliberate and professional.
- Settings are easier to scan, edit, and trust.
- Locale-sensitive UI behaves consistently across the product.

---

# Cross-sprint QA checklist

Use this checklist in every sprint review.

## Mobile usability

- [ ] All primary tap targets are comfortably touchable.
- [ ] No horizontal scroll appears on key pages.
- [ ] The most important action is visible without confusion.
- [ ] Fixed surfaces do not cover the final actionable element.

## Accessibility

- [ ] Focus order is logical.
- [ ] Errors are announced and understandable.
- [ ] Color is not the only status signal.
- [ ] Reduced motion and large text do not break critical flows.

## Enterprise readiness

- [ ] The UI prioritizes trust over decoration.
- [ ] Error states explain recovery paths.
- [ ] Notifications and tasks help users act, not just observe.
- [ ] Repeated-use workflows feel efficient for operational teams.

## Design system discipline

- [ ] Shared patterns are used instead of ad-hoc markup.
- [ ] Visual hierarchy is consistent across updated screens.
- [ ] Primary and secondary actions are clearly differentiated.
- [ ] Mobile and desktop variants follow one coherent system.

---

# Recommended implementation order

1. Sprint 1 — Mobile Navigation Reset
2. Sprint 2 — Mobile Header Simplification and Faster Time-to-Action
3. Sprint 3 — Form UX, Validation, and Recovery Hardening
4. Sprint 4 — Notification Triage and Operational Inbox
5. Sprint 5 — Landing and Brand Trust Optimization
6. Sprint 6 — Safe Areas, Bottom Surfaces, and Shell Reliability
7. Sprint 7 — Internationalization Clarity and Settings Polish

This order delivers the biggest improvement in perceived professionalism and usability earliest, while also reducing the biggest sources of mobile friction for enterprise users.
