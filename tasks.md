# Mobile App Polish Plan Based on `mobile-app.mp4`

## Goal

Use the reference video in `mobile-app.mp4` as inspiration for structure and polish, but do **not** copy it 1:1. The target outcome is:

- clearer mobile information architecture
- more premium and intentional visual hierarchy
- stronger "wow" factor through motion, depth, and branded surfaces
- a more professional resident/mobile experience inside the existing AMS frontend

This app is already using a premium token system and mobile shell. The work should extend the current design language, not replace it with a generic clone of the reference.

## What The Reference Video Is Doing Well

Observed from the video:

- a simple bottom-tab mental model with 4 persistent destinations and low navigation ambiguity
- a home screen built around a branded top image plus a grid of obvious entry points
- list screens that stay single-column, roomy, and easy to scan
- cards with large radius, thin borders, soft contrast, and consistent vertical rhythm
- profile/settings screens that group information into compact chunks instead of long mixed forms
- service directory patterns that use repeating reusable cards with icon + title + supporting text
- alerts/messages presented as stacked feed items with clear separation and comfortable tap areas
- FAQ/legal content handled with predictable accordion/list layouts rather than complex compositions

## What We Should Extract, Not Copy

Extract these principles:

- mobile-first single-column composition
- stable bottom navigation with a very clear active state
- obvious category entry points on the home screen
- repeated card patterns instead of many one-off layouts
- generous spacing and tap targets
- simple visual language for profile, services, alerts, FAQ, and contacts

Do **not** copy these literally:

- the exact icon set, icon-in-circle treatment, or exact card outlines
- the exact home grid layout or count of actions
- the washed-out pale pink/white tone of the reference
- exact Hebrew copy, screen names, or ordering
- brand header photography style as-is

AMS should feel more premium than the reference: richer contrast, better depth, stronger typography, cleaner states, and more purposeful motion.

## Target Design Direction For AMS

### Overall direction

Blend the reference app's clarity with AMS's existing premium theme:

- keep the current premium token base in `apps/frontend/styles/premium-theme.css`
- preserve the strong display typography and warm luxury palette already in the app
- simplify dense screens so they feel closer to a high-end mobile product than a responsive desktop app

### Desired visual qualities

- fewer competing surfaces per screen
- stronger top-level hierarchy: hero, primary action, grouped content
- cleaner section spacing and alignment
- one dominant accent per screen, not many competing accents
- more depth through layered shadows, gradients, and frosted surfaces
- restrained motion that feels expensive rather than busy

### "Wow" without overdesign

Add wow through:

- branded hero backplates and premium texture
- elegant animation on first load and section reveal
- refined active states in bottom navigation
- better cards, badges, and status styling
- polished empty/loading/success states

Avoid wow through:

- random neon colors
- overly glassy unreadable surfaces
- excessive bounce animations
- many different card styles on the same page

## Implementation Instructions By Area

## 1. Strengthen the mobile visual system first

Files:

- `apps/frontend/styles/premium-theme.css`
- `apps/frontend/styles/globals.css`
- `apps/frontend/components/ui/card.tsx`
- `apps/frontend/components/ui/button.tsx`
- `apps/frontend/components/ui/badge.tsx`

Instructions:

- increase mobile polish by tightening the token system before changing screens
- keep the warm premium palette, but improve separation between page background, card background, muted surfaces, and active accents
- slightly increase perceived softness and luxury:
  - keep `--radius` around large mobile-friendly values
  - tune surface shadows to be softer and more layered
  - introduce one subtle page background treatment for mobile, such as radial glow plus very light texture
- standardize card variants so every mobile screen can use the same 4-5 surface types:
  - primary feature card
  - default content card
  - muted list row card
  - action card
  - warning/critical card
- make primary buttons feel more premium:
  - clearer weight
  - better press state
  - slightly stronger depth
  - optional subtle shimmer/gradient only on hero CTAs
- make badges/status pills more compact and deliberate

Acceptance criteria:

- screens look related even before page-specific redesign starts
- mobile cards/buttons/badges no longer feel like generic Tailwind defaults
- contrast remains strong in both light and dark themes

## 2. Upgrade the mobile shell

Files:

- `apps/frontend/components/Layout.tsx`
- `apps/frontend/components/layout/Header.tsx`
- `apps/frontend/components/layout/MobileBottomNav.tsx`
- `apps/frontend/components/ui/mobile-action-bar.tsx`

Instructions:

- make the shell feel like a real mobile product, not desktop chrome compressed to phone width
- reduce header noise on mobile
- turn the mobile header into a compact branded context bar:
  - current page or building context
  - search/access action
  - notification access
  - avatar/profile shortcut where useful
- redesign bottom navigation to borrow the reference app's clarity while exceeding it in quality:
  - 4 stable primary tabs max
  - stronger active state, preferably pill/backplate instead of only icon tint
  - better unread badge placement
  - improved spacing for thumb reach
- keep the "More" sheet, but make its grouping look premium and easier to scan
- ensure safe-area handling remains correct in PWA/standalone mode

Acceptance criteria:

- top and bottom bars feel intentionally designed as one system
- active tab is obvious at a glance
- mobile chrome consumes less visual attention than page content

## 3. Rebuild the home screen around mobile entry patterns from the reference

Files:

- `apps/frontend/pages/home.tsx`
- `apps/frontend/components/ui/page-hero.tsx`
- `apps/frontend/components/ui/section-header.tsx`
- `apps/frontend/components/ui/card.tsx`

Instructions:

- the reference app's home screen works because it answers "where do I go next?" immediately
- adapt that principle using AMS content:
  - keep a premium hero, but make it shorter and more mobile-efficient
  - place 4-8 top actions/categories near the top in a highly tappable layout
  - use one consistent quick-action card/grid pattern
  - keep role-specific actions, but visually normalize them
- reduce visual competition between hero, metrics, next actions, and spotlight content
- reorganize the home page into this order:
  1. compact branded hero with one main CTA
  2. quick actions / main destinations
  3. critical metrics or urgent items
  4. prioritized work queue / next actions
  5. supporting insights
- on mobile, prioritize scan speed over desktop drama

Acceptance criteria:

- user can understand the app's main areas within 3 seconds
- top tasks are reachable with one thumb from the first screenful
- screen feels premium, not crowded

## 4. Create reusable list/detail patterns inspired by the video

Files:

- `apps/frontend/pages/notifications.tsx`
- `apps/frontend/pages/settings.tsx`
- `apps/frontend/pages/resident/account.tsx`
- `apps/frontend/components/ui/notification-center.tsx`
- `apps/frontend/components/ui/empty-state.tsx`
- `apps/frontend/components/ui/page-states.tsx`

Instructions:

- the reference app repeatedly uses a few strong patterns; AMS should do the same
- define reusable mobile patterns for:
  - stacked feed items
  - grouped settings cards
  - service/category directory cards
  - accordion/help/legal sections
  - profile summary panels
- notifications:
  - make feed items more editorial and premium
  - improve title/message/date hierarchy
  - use cleaner priority styling
  - preserve swipe interactions, but make cards calmer and more readable
- settings/profile:
  - avoid giant uninterrupted forms
  - split into grouped cards with short section intros
  - add a clearer profile summary header
  - make switches/preferences feel like premium controls, not raw form rows
- empty/loading states:
  - replace generic placeholders with polished states that match the premium design language

Acceptance criteria:

- all list-heavy mobile screens feel like variations of one coherent system
- settings/profile flows become easier to scan and less fatiguing
- notification feed feels operationally serious and visually polished

## 5. Improve motion, transitions, and perceived quality

Files:

- `apps/frontend/pages/home.tsx`
- `apps/frontend/components/layout/MobileBottomNav.tsx`
- `apps/frontend/components/ui/page-hero.tsx`
- relevant card/list components that already use `framer-motion`

Instructions:

- keep motion restrained and deliberate
- add:
  - soft page-enter animation
  - staggered reveal for cards on home and major lists
  - subtle tab transition/active-indicator motion
  - stronger pressed/active feedback on tappable cards
- avoid:
  - large springy movement
  - long durations
  - animation on every small element

Acceptance criteria:

- the app feels smoother and more expensive
- animation improves hierarchy and feedback instead of distracting
- motion remains performant on mid-range mobile devices

## 6. Use the reference IA patterns where they fit AMS

Translate the reference app's screen ideas into AMS equivalents:

- branded home dashboard -> AMS role-based work hub
- services catalog -> AMS quick actions / modules / resident self-service categories
- alerts feed -> AMS notifications and announcements
- profile/about screen -> AMS account/settings summary
- FAQ accordion -> AMS help/support/knowledge sections
- contact/company directory -> AMS vendors, managers, building contacts

Do not force all reference patterns onto every role. Keep role-specific relevance.

## Detailed To-Do List

- [ ] Create a short screenshot sheet from `mobile-app.mp4` and keep 6-8 representative frames for design reference during implementation.
- [ ] Write a one-page visual rules note inside the task branch describing what is allowed to borrow from the reference and what is forbidden to copy.
- [ ] Refine core design tokens in `apps/frontend/styles/premium-theme.css` for mobile surface contrast, radius, shadows, and accent hierarchy.
- [ ] Add one subtle branded mobile page background treatment in `apps/frontend/styles/globals.css`.
- [ ] Audit `Card`, `Button`, `Badge`, and related primitives so they express a single premium mobile visual language.
- [ ] Add or refine a "feature card" and "list row card" variant for repeated mobile use.
- [ ] Redesign the mobile header in `apps/frontend/components/layout/Header.tsx` to be more compact, branded, and context-aware.
- [ ] Redesign `apps/frontend/components/layout/MobileBottomNav.tsx` with clearer active-state treatment and better visual weight.
- [ ] Polish `apps/frontend/components/ui/mobile-action-bar.tsx` so it matches the upgraded shell.
- [ ] Recompose `apps/frontend/pages/home.tsx` around mobile-first quick entry, urgent items, and one dominant CTA.
- [ ] Convert top home destinations into a reusable quick-actions pattern instead of ad hoc blocks.
- [ ] Shorten the mobile hero so important actions appear above the fold.
- [ ] Simplify metric styling so metrics support the page instead of competing with the hero.
- [ ] Redesign `apps/frontend/components/ui/notification-center.tsx` cards for stronger hierarchy and calmer scanning.
- [ ] Update `apps/frontend/pages/notifications.tsx` so filters, preferences, and live-state indicators feel like part of one premium flow.
- [ ] Restructure `apps/frontend/pages/settings.tsx` into grouped premium settings cards with clearer sectioning.
- [ ] Add a stronger profile/account summary header to `apps/frontend/pages/resident/account.tsx` or the closest resident account surface.
- [ ] Standardize accordion/help/legal list styling to match the new card system.
- [ ] Upgrade empty, loading, and error states so they feel branded and intentional.
- [ ] Add restrained motion polish to hero, home cards, and bottom-nav active state.
- [ ] Verify touch targets, safe-area padding, and thumb reach on iPhone-sized viewports.
- [ ] Test RTL layout carefully because the reference video is Hebrew and AMS already supports RTL/LTR switching.
- [ ] Test both light and dark themes after token changes.
- [ ] Check performance on first mobile load so extra gradients and motion do not hurt responsiveness.
- [ ] Run Playwright or manual mobile QA for `home`, `notifications`, `settings`, and at least one resident flow after redesign.

## Suggested Execution Order

1. Design tokens and primitive surfaces
2. Mobile shell
3. Home screen
4. Notifications and list/feed patterns
5. Settings/profile patterns
6. Empty/loading/error polish
7. Motion tuning
8. Mobile QA and performance pass

## Definition of Done

The redesign is done when:

- AMS clearly reflects inspiration from the reference video's structure without resembling it visually
- mobile screens feel premium and cohesive across shell, home, feeds, and settings
- the first screenful of `home`, `notifications`, and `settings` looks intentionally designed on phone widths
- interaction quality feels smoother and more professional
- no regression is introduced in RTL, dark mode, PWA safe areas, or mobile navigation
