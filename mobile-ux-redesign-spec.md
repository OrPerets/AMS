# Mobile UX Redesign Specification
## Property Management Platform — Pilot-Ready Mobile Facelift

**Version:** 1.0  
**Date:** March 2026  
**Status:** Specification for Engineering Handoff  
**Scope:** Mobile-first UX redesign across all five roles (Admin, PM, Resident, Tech, Accountant)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [UX Diagnosis](#2-ux-diagnosis)
3. [Mobile Information Architecture](#3-mobile-information-architecture)
4. [Home & Dashboard Principles](#4-home--dashboard-principles)
5. [Role-by-Role Screen Blueprints](#5-role-by-role-screen-blueprints)
6. [Mobile UX Rules & Design System](#6-mobile-ux-rules--design-system)
7. [Navigation & Flow Redesign](#7-navigation--flow-redesign)
8. [Visual Facelift Guidance](#8-visual-facelift-guidance)
9. [Wow Factor Ideas](#9-wow-factor-ideas)
10. [Accessibility & RTL](#10-accessibility--rtl)
11. [Prioritized Implementation Roadmap](#11-prioritized-implementation-roadmap)
12. [Acceptance Criteria for Engineering](#12-acceptance-criteria-for-engineering)

---

## 1. Executive Summary

### The Problem

The current platform is feature-rich but structurally hostile to mobile users. Five distinct roles share a layout originally designed for desktop managers sitting at a desk. On a 375px screen, pages scroll endlessly, heroes consume half the viewport, and users face a "where do I even start?" moment every time they open the app. The landing pages function as navigation hubs rather than work surfaces, which adds an unnecessary tap between login and actual task completion.

### The Solution

Replace the current page-centric architecture with a **role-adaptive, action-first mobile shell** that:

- Gets every user to their #1 task in **one tap** from the home screen
- Caps above-the-fold content to a **compact status strip + 3 action tiles**
- Pushes all secondary content behind **drill-down screens, tabs, and bottom sheets**
- Maintains the existing gold/neutral premium palette while sharpening hierarchy and depth
- Delivers subtle premium motion without harming performance on mid-range Android devices
- Supports Hebrew/RTL natively with proper mirroring, spacing, and reading flow

### Key Metrics to Track Post-Launch

| Metric | Current Baseline (est.) | Target |
|--------|------------------------|--------|
| Taps to primary action from home | 3–4 | 1 |
| Scroll depth before first interaction | >2 viewports | <0.5 viewport |
| Hero/header viewport consumption (mobile) | ~45–55% | <20% |
| Sections visible per mobile screen | 1–1.5 | 2.5–3 |
| Time to meaningful first action | ~12s | <4s |
| "More" menu discovery rate | unknown | >60% within first week |

---

## 2. UX Diagnosis

### 2.1 What Is Wrong with the Current Experience

#### A. Oversized Heroes Steal the Viewport

The current `PageHero` component renders a `rounded-[28px]` card with `text-[1.4rem] sm:text-[2.35rem] lg:text-[3rem]` titles, blur orbs, eyebrow badges, kicker text, descriptions, and action buttons. On a 375px iPhone, this hero alone consumes **280–340px** — nearly half the viewport — before the user sees any actionable content. The `DashboardHero` is even worse: it contains greeting text, filters (building + date range selects), and a 4-metric grid inside a dark surface, pushing actionable content **below the fold entirely**.

**Why this harms usability:** Mobile users decide whether a screen is useful within 2–3 seconds. If the first viewport is decorative text and a gradient, they scroll past it every single visit, building muscle memory to ignore the top of every page. The hero becomes invisible wallpaper.

#### B. Pages Are Too Long and Unstructured

`pages/home.tsx` stacks seven full sections vertically:
1. `MobileContextBar` (role badges, sync status, metric chips)
2. `PageHero` (operational variant with title, description, actions)
3. `MobileActionHub` (6 tiles in a 2-column grid, `min-h-[132px]` each)
4. `MobilePriorityInbox` (3 priority items)
5. Metrics section (3 metric cards)
6. Next Actions + Recent Activity (two-column split)
7. Operational Digest (full-width pre-formatted text)

This produces a page that is **5–7 viewport-heights tall** on mobile. Users have to scroll through MobileContextBar badges just to reach the hero, then scroll past the hero to reach the action tiles, then past the tiles to see priorities. There is no visual "done" signal — the page just keeps going.

#### C. Landing Pages Act as Navigation Portals

`/worker-hub` is a portal page with cards linking to "Management System", "Weekly Form", and "Gardens". The resident account page (`/resident/account`) is ~1,380 lines and packs finance summary, invoices, tickets, documents, building info, payment methods, recent activity, and contact info into a single scrollable page. These pages attempt to be one-stop-shops but end up as navigation indices that should be split across focused screens.

#### D. Role Confusion in Navigation

The bottom nav shows 3 primary items + "More" for each role, but:
- ADMIN gets Home + Dashboard + Tickets — but Home and Dashboard are almost redundant (both show metrics and action links)
- PM gets Home + Tickets + Buildings — but "Buildings" is a secondary reference, not a daily action
- RESIDENT gets Home + Requests + Payments — correct priorities, but Payments links to an anchor (`#payments-section`) on the Account page, not a standalone payments screen
- The "More" sheet contains 15+ items for ADMIN, organized by abstract categories (Operations, Properties, Finance, Administration, System) that don't match how users think about their tasks

#### E. Information Density Problems

- `MobileContextBar` shows role badge + context badge + sync badge + metric chips + timestamp — 5 information types in a single strip that nobody reads after the first visit
- `MobileActionHub` tiles are `min-h-[132px]` each — generous for desktop but wasteful on mobile when showing 6 tiles (requires scrolling past 3 rows)
- Card radius of `rounded-[24px] sm:rounded-[28px]` with generous padding creates beautiful cards but reduces information density — on mobile, you see fewer items per screen than necessary

### 2.2 Common Mistakes in Multi-Role Management Systems

1. **One layout fits all:** The same page structure (`PageHero` → `MobileActionHub` → `MobilePriorityInbox` → Metrics) is used for all roles on `/home`. A tech in the field needs a completely different first screen than an accountant at their desk.

2. **Organizational hierarchy as navigation:** The sidebar groups items as Dashboard / Operations / Properties / Finance / Administration. This mirrors the org chart, not the user's task flow. A PM resolving a ticket doesn't think "I need Operations → Tickets", they think "I need to close this ticket."

3. **Feature parity across roles:** Every role can reach almost every page. The "More" menu for a Tech includes Finance Reports, Budgets, and Contracts — pages they will never use. This creates decision fatigue and makes the app feel complex.

4. **Descriptive text instead of status:** The home page hero shows a sentence like "מרכז העבודה שלך כבר ממוין לפי סיכון והשפעה" (your work center is already sorted by risk and impact). This is marketing copy on a work tool. Users want numbers and statuses, not reassurance.

---

## 3. Mobile Information Architecture

### 3.1 True Main Navigation

The bottom tab bar is the mobile user's primary orientation system. It must answer: "Where am I?" and "Where can I go?" in one glance. Current: 3 tabs + More. Proposed: **4 tabs + More**.

The addition of one tab per role eliminates the most common "More" drill-down.

### 3.2 Recommended Bottom Navigation by Role

#### ADMIN (System Administrator)

| Position | Tab | Icon | Target | Rationale |
|----------|-----|------|--------|-----------|
| 1 | בית (Home) | `Home` | `/home` | Action dashboard |
| 2 | קריאות (Tickets) | `Ticket` | `/tickets` | Primary daily surface |
| 3 | בקרה (Control) | `BarChart3` | `/admin/dashboard` | KPIs and system health |
| 4 | פעולות (Ops) | `CalendarClock` | `/operations/calendar` | Proactive scheduling |
| 5 | עוד (More) | `MoreHorizontal` | Bottom sheet | Everything else |

**More sheet groups:**
- ניהול נכסים: Buildings, Assets, Vendors, Contracts
- כספים: Payments, Budgets, Finance Reports
- מערכת: Configuration, Security, Audit, Data Quality, Approvals
- כלים: Notifications, Settings, Documents

#### PM (Property Manager)

| Position | Tab | Icon | Target | Rationale |
|----------|-----|------|--------|-----------|
| 1 | בית | `Home` | `/home` | Action dashboard |
| 2 | קריאות | `Ticket` | `/tickets` | Core daily work |
| 3 | בניינים | `Building` | `/buildings` | Property oversight |
| 4 | לוח זמנים | `CalendarClock` | `/operations/calendar` | Scheduling & deadlines |
| 5 | עוד | `MoreHorizontal` | Bottom sheet | Everything else |

**More sheet groups:**
- תפעול: Maintenance, Communications, Gardens, Schedules
- כספים: Payments, Budgets, Finance Reports
- ניהול: Configuration, Notifications, Activity, Approvals
- כלים: Documents, Vendors, Contracts, Settings

#### RESIDENT (Tenant)

| Position | Tab | Icon | Target | Rationale |
|----------|-----|------|--------|-----------|
| 1 | בית | `Home` | `/resident/account` | Personal dashboard |
| 2 | בקשות | `ClipboardList` | `/resident/requests` | Service requests |
| 3 | תשלומים | `CreditCard` | `/payments/resident` | Standalone payments view |
| 4 | קריאות | `Ticket` | `/create-call` | Direct ticket creation |
| 5 | עוד | `MoreHorizontal` | Bottom sheet | Everything else |

**More sheet groups:**
- חשבון: Documents, Building Info, Payment Methods
- תמיכה: Contact Support, Notifications
- הגדרות: Settings

**Key change:** The Payments tab MUST link to a dedicated mobile payments screen, NOT an anchor scroll on the account page.

#### TECH (Field Technician)

| Position | Tab | Icon | Target | Rationale |
|----------|-----|------|--------|-----------|
| 1 | בית | `Home` | `/home` | Today's brief |
| 2 | עבודות | `Wrench` | `/tech/jobs` | Active job queue |
| 3 | גינון | `Leaf` | `/gardens` | Garden maintenance |
| 4 | עדכון | `ClipboardList` | `/tickets?mine=true` | Quick status updates |
| 5 | עוד | `MoreHorizontal` | Bottom sheet | Everything else |

**More sheet groups:**
- תפעול: Maintenance, Schedules, Assets
- מידע: Documents, Communications
- כלים: Notifications, Settings

#### ACCOUNTANT

| Position | Tab | Icon | Target | Rationale |
|----------|-----|------|--------|-----------|
| 1 | בית | `Home` | `/home` | Financial overview |
| 2 | גבייה | `CreditCard` | `/payments` | Collection & payments |
| 3 | תקציבים | `Wallet` | `/finance/budgets` | Budget monitoring |
| 4 | דוחות | `BarChart3` | `/finance/reports` | Financial reports |
| 5 | עוד | `MoreHorizontal` | Bottom sheet | Everything else |

**More sheet groups:**
- תפעול: Operations Calendar, Tickets, Vendors, Contracts
- מידע: Documents
- כלים: Notifications, Settings

### 3.3 What Should Go in "More"

Rules for the "More" sheet:

1. **Maximum 12 items** total (across all groups)
2. **Maximum 3 groups** — cognitive load rises sharply after 3 categories
3. Items a user taps **less than once per week** belong in More
4. Items a user has **never tapped** should be hidden entirely (progressive disclosure based on usage analytics)
5. **No duplicates** — if it's in the tab bar, it's not in More
6. Each item shows: icon + label + one-line hint (current pattern is good)
7. **Recently used** section at the top (max 2 items) — dynamically populated from usage

### 3.4 Role-Based Navigation Differences Summary

| Concern | ADMIN | PM | TECH | RESIDENT | ACCOUNTANT |
|---------|-------|-----|------|----------|------------|
| Primary action | Resolve ticket escalation | Dispatch/triage tickets | Complete field job | Pay bill or open request | Process collection |
| Secondary action | Review system health | Check building status | Update job status | Track open tickets | Review budget |
| Tabs count | 4+More | 4+More | 4+More | 4+More | 4+More |
| More items | ~12 | ~11 | ~7 | ~6 | ~8 |
| Finance access | Full | Full | None | Own account | Full |
| Admin access | Full | Partial | None | None | None |

---

## 4. Home & Dashboard Principles

### 4.1 Replace Landing Pages with Action Dashboards

**Current state:** `/home` is an information broadcast page. The user arrives, reads a headline, scrolls past metrics, finds an action link, taps it, navigates to a new page, and finally begins work.

**New principle:** The home screen IS the workspace. The user arrives and their #1 action is already visible and tappable above the fold. No greeting, no marketing copy, no "work center" label.

### 4.2 Above-the-Fold Formula (Mobile)

The first **568px** (iPhone SE viewport minus header and bottom nav) must contain exactly:

```
┌─────────────────────────────────┐
│  Compact Status Strip (48px)    │  Role + 2 key metrics inline
├─────────────────────────────────┤
│                                 │
│  Primary Action Card (120px)    │  One big tappable card
│  "You have 3 urgent tickets"   │  with CTA button
│                                 │
├─────────────────────────────────┤
│  Quick Actions (2×2) (200px)    │  Four tile grid
│  ┌──────┐ ┌──────┐            │  Each tile = icon + label
│  │ Act1 │ │ Act2 │            │  + metric badge
│  └──────┘ └──────┘            │
│  ┌──────┐ ┌──────┐            │
│  │ Act3 │ │ Act4 │            │
│  └──────┘ └──────┘            │
├─────────────────────────────────┤
│  Section peek (100px)           │  Top of priority inbox
│  showing first item visible     │  Invites scroll
└─────────────────────────────────┘
```

**Total:** ~468px content + ~100px for header (48px) + bottom nav (54px) = 622px. Fits within 667px (iPhone SE) with room to breathe.

### 4.3 Top 3–5 Primary Actions Per Role

#### ADMIN
1. **Resolve escalated ticket** — link to filtered ticket view (SLA risk, unassigned)
2. **Review system health** — condensed KPI card with drill-down
3. **Check maintenance exceptions** — unverified items count + tap to list
4. **Open operations calendar** — upcoming events this week
5. **Review audit alerts** — new security/data quality items

#### PM
1. **Triage incoming tickets** — new/unassigned count + tap to dispatch view
2. **Check building status** — occupancy/issue summary per building
3. **Review overdue maintenance** — work orders past SLA
4. **Process vendor communications** — unread messages from suppliers
5. **Approve pending requests** — resident requests awaiting approval

#### RESIDENT
1. **Pay outstanding balance** — amount + direct payment link
2. **Track open ticket** — latest ticket status with timeline
3. **Submit new request** — direct creation flow
4. **View latest documents** — new documents since last visit
5. **Contact building management** — quick call/message

#### TECH
1. **Start next job** — highest priority assigned ticket
2. **Update current job** — status update for in-progress work
3. **Check today's schedule** — time-ordered job list
4. **Review garden tasks** — monthly plan status
5. **Check notifications** — new assignments or changes

#### ACCOUNTANT
1. **Process overdue collections** — overdue amount + resident list
2. **Review payment status** — daily collection summary
3. **Check budget variances** — flagged items
4. **Generate financial report** — quick report generation
5. **Review vendor invoices** — pending approvals

### 4.4 What Must Appear Above the Fold

| Element | Purpose | Max Height |
|---------|---------|------------|
| Compact Status Strip | Role identity + live metrics | 48px |
| Primary Action Card | The ONE thing to do right now | 120px |
| Quick Action Grid (2×2) | Fast access to top 4 actions | 200px |
| Priority Inbox peek | First item + scroll invitation | 100px |

### 4.5 What Should Be Hidden Behind Drill-Down

| Content | Where It Lives Now | Where It Should Go |
|---------|-------------------|-------------------|
| Operational Digest / markdown summary | Home page bottom | Settings → Reports or swipe-down refresh panel |
| Recent Activity list | Home page grid | Notifications tab or "Activity" in More |
| Full metric details | Inline metric cards | Tap metric → detail bottom sheet |
| Onboarding dialog | Auto-popup on home | First-launch flow only, then Settings → Guide |
| Role/sync badges | MobileContextBar | Collapsed into status strip single line |
| Hero description text | PageHero description | Remove entirely — action labels are sufficient |
| Building/date filters | DashboardHero | Filter bar at top of dashboard, collapsible |

---

## 5. Role-by-Role Screen Blueprints

### 5.1 ADMIN

#### Mobile Home Screen

```
┌─ Status Strip ─────────────────────────┐
│ 🔒 מנהל מערכת  ·  5 קריאות  ·  2 SLA   │
└────────────────────────────────────────┘

┌─ Primary Action Card ──────────────────┐
│  ⚠️  2 חריגות SLA פתוחות               │
│  3 קריאות ממתינות לשיוך                │
│                           [פתח מוקד →] │
└────────────────────────────────────────┘

┌────────┐ ┌────────┐
│ קריאות │ │ בקרה   │
│   5    │ │  92%   │
│ פתוחות │ │ תפוסה  │
└────────┘ └────────┘
┌────────┐ ┌────────┐
│ תחזוקה │ │ יומן   │
│   3    │ │  4     │
│ לאימות │ │ אירועים│
└────────┘ └────────┘

┌─ Priority Inbox ───────────────────────┐
│ 🔴 קריאה #2847 — חריגת SLA 4 שעות     │
│    בניין הדר, דירה 12 · טכנאי לא שויך  │
│                              [טפל →]   │
├────────────────────────────────────────┤
│ 🟡 קריאה #2845 — ממתינה לאישור         │
│    בקשת דייר לחניה · 2 ימים ממתינה     │
│                             [אשר →]    │
├────────────────────────────────────────┤
│ 🔵 תחזוקה — 3 פעולות לא מאומתות       │
│    ביצוע שבועי שלא נסגר · חסם קל       │
│                             [בדוק →]   │
└────────────────────────────────────────┘
```

#### Primary Actions
1. Open ticket dispatch (filtered to SLA risk + unassigned)
2. Review system dashboard (KPI drill-down)
3. Check maintenance exceptions
4. Open operations calendar
5. Review audit/security alerts

#### Status/Summary Cards
- Open tickets count (with trend arrow)
- SLA breach count (red if >0)
- Occupancy rate (percentage)
- Unverified maintenance count

#### Inbox/Alerts
- SLA breaches (highest priority, red indicator)
- Unassigned tickets (waiting for dispatch)
- Pending approvals (resident requests, vendor quotes)
- System alerts (security events, data quality)

#### Recent Activity
Hidden by default. Accessible via "Activity" link in More sheet, or pull-down on home screen.

#### Secondary Navigation (More Sheet)
- Properties: Buildings, Assets, Vendors, Contracts
- Finance: Payments, Budgets, Reports
- System: Configuration, Security, Audit, Data Quality, Approvals
- Tools: Notifications, Documents, Settings

#### Empty States
- **No open tickets:** "הכול טופל. אין קריאות פתוחות כרגע." + illustration of completed checklist + secondary CTA "סקור דוח שבועי"
- **No SLA breaches:** "אין חריגות SLA. השירות עומד ביעדים." + green checkmark
- **No maintenance exceptions:** "כל פעולות התחזוקה מאומתות." + subtle success animation

---

### 5.2 PM (Property Manager)

#### Mobile Home Screen

```
┌─ Status Strip ─────────────────────────┐
│ 🏢 מנהל נכס  ·  8 קריאות  ·  1 דחוף   │
└────────────────────────────────────────┘

┌─ Primary Action Card ──────────────────┐
│  📋 8 קריאות חדשות ממתינות לשיוך        │
│  1 קריאה דחופה שנפתחה לפני שעה          │
│                         [שייך עכשיו →] │
└────────────────────────────────────────┘

┌────────┐ ┌────────┐
│ קריאות │ │ בניינים│
│   8    │ │   3    │
│ חדשות  │ │ פעילים │
└────────┘ └────────┘
┌────────┐ ┌────────┐
│ לוח    │ │ ספקים  │
│   2    │ │  1     │
│ אירועים│ │ הודעה  │
└────────┘ └────────┘

┌─ Priority Inbox ───────────────────────┐
│ 🔴 קריאה #2850 — דחוף · נזילה פעילה   │
│    בניין אורן, דירה 7 · דווח לפני 1ש  │
│                           [שייך →]     │
├────────────────────────────────────────┤
│ 🟡 3 בקשות דייר ממתינות                │
│    חניה (2), מעבר דירה (1) · 1-3 ימים  │
│                           [סקור →]     │
└────────────────────────────────────────┘
```

#### Primary Actions
1. Triage/dispatch new tickets
2. Review building status dashboard
3. Process resident requests
4. Check upcoming maintenance schedules
5. Review vendor communications

#### Status/Summary Cards
- New tickets awaiting dispatch
- Active buildings count
- Upcoming calendar events
- Pending vendor messages

#### Empty States
- **No new tickets:** "אין קריאות חדשות. הכול שויך ומנוהל." + calm illustration
- **No pending requests:** "כל הבקשות טופלו. הדיירים מרוצים." + thumbs up icon

---

### 5.3 RESIDENT (Tenant)

#### Mobile Home Screen

```
┌─ Status Strip ─────────────────────────┐
│ 🏠 דייר · בניין הדר · דירה 5            │
└────────────────────────────────────────┘

┌─ Balance Card ─────────────────────────┐
│  יתרה לתשלום                           │
│  ₪1,240                               │
│  2 חיובים פתוחים · מועד: 15.04         │
│  [שלם עכשיו →]     [פרטי חשבון]       │
└────────────────────────────────────────┘

┌────────┐ ┌────────┐
│ בקשה   │ │ קריאה  │
│ חדשה   │ │ תחזוקה │
│ 📋     │ │ 🔧     │
└────────┘ └────────┘
┌────────┐ ┌────────┐
│ מסמכים │ │ הבניין │
│  2     │ │ שלי    │
│ חדשים  │ │ 🏢     │
└────────┘ └────────┘

┌─ My Tickets ───────────────────────────┐
│ 🟢 קריאה #2801 — נפתרה                │
│    תיקון ברז · הושלם לפני 2 ימים      │
├────────────────────────────────────────┤
│ 🔵 קריאה #2843 — בטיפול               │
│    רטיבות בקיר · טכנאי מתוזמן מחר     │
│                        [צפה בפרטים →] │
└────────────────────────────────────────┘
```

#### Primary Actions
1. Pay outstanding balance (direct payment flow)
2. Submit new service request
3. Open maintenance ticket (camera + description)
4. View documents (new documents badge)
5. Contact building management (quick action)

#### Status/Summary Cards
- Balance to pay (large, prominent, with due date)
- Open tickets count with latest status
- New documents count
- Building info quick access

#### Inbox/Alerts
- Ticket status changes
- New invoices
- Building announcements
- Document uploads

#### Empty States
- **No balance due:** "אין יתרה לתשלום. החשבון מעודכן ✓" + green banner instead of balance card
- **No open tickets:** "אין קריאות פתוחות. צריך משהו?" + CTA "פתח קריאה חדשה"
- **No documents:** "אין מסמכים חדשים." + secondary "צפה בארכיון"

---

### 5.4 TECH (Field Technician)

#### Mobile Home Screen

```
┌─ Status Strip ─────────────────────────┐
│ 🔧 טכנאי · 4 משימות היום · 1 דחוף      │
└────────────────────────────────────────┘

┌─ Next Job Card ────────────────────────┐
│  🔴 דחוף — נזילה פעילה                 │
│  בניין אורן · דירה 7 · קומה 2          │
│  נפתח לפני 3 שעות · SLA: 2 שעות       │
│  [התחל טיפול →]          [ניווט 📍]   │
└────────────────────────────────────────┘

┌────────┐ ┌────────┐
│ עבודות │ │ גינון  │
│   4    │ │  חודשי │
│ היום   │ │ 🌿     │
└────────┘ └────────┘
┌────────┐ ┌────────┐
│ עדכן   │ │ התראות │
│ סטטוס  │ │   2    │
│ ✏️     │ │ חדשות  │
└────────┘ └────────┘

┌─ Today's Queue ────────────────────────┐
│ 🔴 #2850 נזילה · אורן 7 · SLA 2ש     │
│ 🟡 #2848 חשמל · הדר 12 · SLA 8ש      │
│ 🔵 #2844 צבע · שקמה 3 · ללא SLA       │
│ 🟢 #2840 ניקיון · לובי אורן · תוזמן   │
│                     [צפה בכל העבודות →]│
└────────────────────────────────────────┘
```

#### Primary Actions
1. Start/continue highest priority job
2. Update job status (quick status change)
3. View today's job queue (ordered by priority)
4. Check garden maintenance plan
5. Review notifications (new assignments)

#### Status/Summary Cards
- Today's job count (with urgent highlight)
- Current SLA status (at risk / on track)
- Garden tasks status
- Unread notifications

#### Empty States
- **No jobs today:** "אין משימות שטח להיום. יום שקט!" + relaxed illustration + "בדוק את לוח המחר"
- **No urgent items:** "אין דחופים. אפשר להתקדם לפי תכנון." + ordered list icon

---

### 5.5 ACCOUNTANT

#### Mobile Home Screen

```
┌─ Status Strip ─────────────────────────┐
│ 💰 כספים · ₪45,200 לגבייה · 12 פיגורים │
└────────────────────────────────────────┘

┌─ Collection Card ──────────────────────┐
│  גבייה שוטפת                           │
│  ₪45,200 יתרת חוב כוללת               │
│  12 חשבונות בפיגור · 3 מעל 60 יום      │
│  [פתח רשימת גבייה →]                   │
└────────────────────────────────────────┘

┌────────┐ ┌────────┐
│ תשלומים│ │ תקציבים│
│ ₪8,400 │ │  2     │
│ היום   │ │ חריגות │
└────────┘ └────────┘
┌────────┐ ┌────────┐
│ דוחות  │ │ יומן   │
│ חודשי  │ │  3     │
│ 📊     │ │ פירעון │
└────────┘ └────────┘

┌─ Attention Items ──────────────────────┐
│ 🔴 3 חשבונות מעל 60 יום פיגור         │
│    סכום כולל: ₪12,800 · דורש הסלמה     │
│                          [טפל →]       │
├────────────────────────────────────────┤
│ 🟡 חוזה ספק #45 — פירעון ב-3 ימים     │
│    חברת ניקיון ״נקי בע״מ״ · ₪4,200     │
│                          [סקור →]      │
└────────────────────────────────────────┘
```

#### Primary Actions
1. Process overdue collections
2. Review daily payments
3. Check budget variances
4. Generate monthly report
5. Review upcoming vendor payments

#### Empty States
- **No overdue accounts:** "אין חשבונות בפיגור. הגבייה תקינה." + green financial chart
- **No budget variances:** "כל התקציבים במסגרת. ניהול תקין." + on-track indicator

---

## 6. Mobile UX Rules & Design System

### 6.1 Header & Hero Constraints

| Rule | Current | New Specification |
|------|---------|-------------------|
| Mobile header height | `h-12` (48px) | **48px** — keep as-is, it's correct |
| Hero/status area max height | ~300px (PageHero full) | **48px** (Status Strip only) |
| Primary action card max height | N/A (part of hero) | **120px** max |
| Combined header + status + action | ~400px+ | **216px max** (48 + 48 + 120) |
| Viewport percentage for "chrome" | ~55% | **<33%** of 667px viewport |

**Implementation:** Replace `PageHero` on mobile home screens with a `CompactStatusStrip` component. The `PageHero` remains for detail pages and desktop views but is hidden (`hidden md:block`) on role home screens.

### 6.2 Card Density

| Rule | Current | New |
|------|---------|-----|
| Card border radius | `rounded-[24px] sm:rounded-[28px]` | `rounded-2xl` (16px) on mobile, `rounded-[24px]` on desktop |
| Card internal padding | `p-3.5 sm:p-5` | `p-3` on mobile, `p-4 sm:p-5` on desktop |
| Action tile height | `min-h-[132px]` | `min-h-[88px]` — icon + label + metric badge |
| Cards per viewport | 1.5–2 | 3–4 visible simultaneously |
| Card gap | `gap-3 sm:gap-4` | `gap-2.5` on mobile, `gap-4` on desktop |
| Metric card height | ~120px | ~80px — single-line value + label |

### 6.3 Typography Hierarchy

| Level | Current | New (Mobile) | Usage |
|-------|---------|-------------|-------|
| Page title | `text-[1.4rem]` (22.4px) | `text-lg` (18px) | Status strip context only |
| Section header | `text-base` (16px) | `text-[15px]` font-semibold | Section titles |
| Card title | `text-sm` (14px) font-semibold | `text-sm` (14px) font-semibold | Keep as-is |
| Card description | `text-xs` (12px) | `text-[12px]` leading-5 | Keep as-is |
| Metric value | `text-xl sm:text-2xl` | `text-xl` (20px) font-bold | Metric cards |
| Metric label | `text-xs` | `text-[11px]` font-medium | Metric labels |
| Body text | `text-sm` (14px) | `text-[13px]` leading-6 | Descriptions, hints |
| Caption/hint | `text-[11px]` | `text-[10px]` | Timestamps, secondary info |
| Tab label | `text-[9px]` | `text-[10px]` font-semibold | Bottom nav labels |

**Font family rules:**
- Headings (h1–h3): `var(--font-display)` (Fraunces) — keep for brand identity
- All other text: `var(--font-sans)` (Heebo) — Hebrew-optimized

### 6.4 Touch Targets

| Element | Current | New |
|---------|---------|-----|
| Bottom nav item | `min-h-[54px]` | `min-h-[52px]` — slightly tighter |
| More sheet item | `min-h-[52px]` | `min-h-[48px]` with `min-w-[48px]` icon area |
| Action tile | `min-h-[132px]` | `min-h-[88px]` |
| List row | Varies | `min-h-[56px]` — consistent across all lists |
| Button | Default | `min-h-[44px]` min, `min-h-[48px]` for primary CTAs |
| Icon button | Varies | `min-w-[44px] min-h-[44px]` — WCAG 2.5.8 |

**Touch rejection zone:** 8px padding between adjacent touch targets minimum.

### 6.5 Spacing Rhythm

Adopt a **4px base unit** with a restricted scale:

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Icon-to-text gap |
| `space-sm` | 8px | Between related items in a group |
| `space-md` | 12px | Card internal padding (mobile) |
| `space-lg` | 16px | Between cards / sections |
| `space-xl` | 24px | Major section breaks |
| `space-2xl` | 32px | Page-level top/bottom margins |

**Mobile page padding:** `px-3 py-3` (12px) — reduce from current `px-3 py-3 sm:px-6 sm:py-6` which is fine, but apply `sm:` only for tablet+.

### 6.6 Section Count Per Screen

| Rule | Specification |
|------|--------------|
| Max sections on mobile home | **4** (status + action card + quick actions + priority inbox) |
| Max sections per drill-down page | **3** visible without scroll |
| Max items in a list before pagination | **10** — then "Load more" or infinite scroll |
| Max cards in a horizontal scroll | **6** — with peek showing partial card at edge |
| Max metric cards above the fold | **4** (2×2 grid) |

### 6.7 When to Use UI Patterns

#### Accordions
- **Use for:** FAQ sections, building detail subsections, settings groups, document categories
- **Don't use for:** Primary content, frequently accessed data, anything above the fold
- **Rule:** Max 5 accordion items per group. First one open by default if it contains the most common content.

#### Tabs (Segmented Controls)
- **Use for:** Ticket views (All / Mine / Urgent), payment history (Pending / Paid / Overdue), building detail tabs (Info / Units / Tickets)
- **Don't use for:** Primary navigation (that's the bottom bar), more than 4 options (use bottom sheet instead)
- **Rule:** Max 4 tabs. Labels max 8 characters (Hebrew). Use `sticky top-[48px]` to stick below header on scroll.

#### Bottom Sheets
- **Use for:** More menu, quick filters, action confirmations, detail previews, metric drill-downs
- **Don't use for:** Multi-step forms (use full-screen), content longer than 70vh (use dedicated page)
- **Heights:** Small (30vh), Medium (50vh), Large (70vh max). Always include drag handle and close button.
- **Animation:** `cubic-bezier(0.16, 1, 0.3, 1)` — current implementation is correct.

#### Floating Action Button (FAB)
- **Use for:** Resident "New Request" button on `/resident/requests`, Tech "Quick Update" on job detail
- **Don't use for:** Navigation, actions that are already in the tab bar
- **Position:** `bottom-[calc(54px+env(safe-area-inset-bottom)+12px)]` — 12px above bottom nav
- **Size:** 56px diameter, `rounded-full`, primary color, `shadow-raised`
- **Rule:** Max 1 FAB per screen. Never on the home screen (quick actions grid handles this).

#### Sticky CTA Bars
- **Use for:** Payment confirmation ("Pay ₪1,240"), form submission ("Submit Request"), ticket status update
- **Don't use for:** Informational pages, passive content
- **Height:** 64px (48px button + 8px top padding + 8px bottom padding)
- **Position:** Sticks above bottom nav. Animates in when user scrolls past the inline CTA.

---

## 7. Navigation & Flow Redesign

### 7.1 Overview → Detail → Action → Confirmation Flow

**Current flow (example: Admin resolving a ticket):**
1. Open app → `/home`
2. Scroll past hero
3. Find "Open Ticket Board" in action cards
4. Tap → navigate to `/tickets`
5. Find the ticket in the list
6. Tap ticket → navigate to `/tickets/[id]`
7. Scroll to find the action button
8. Take action

**8 steps, 3 page loads, significant scrolling.**

**Redesigned flow:**
1. Open app → home screen shows "2 SLA breaches" in Primary Action Card
2. Tap → `/tickets?filter=sla-risk` (pre-filtered view)
3. Tap first ticket → bottom sheet with key info + action buttons
4. Tap "Assign" → confirmation bottom sheet
5. Done

**4 steps, 1 page load + 2 bottom sheets, zero scrolling.**

### 7.2 Flow Patterns by Action Type

#### Quick Status Change (Tech updating a job)
```
Home → Tap job in queue → Bottom sheet with status picker → Tap new status → 
Toast confirmation → Back to queue (auto-refreshed)
```
Total: 3 taps, 0 page navigations

#### Payment (Resident paying a bill)
```
Home → Tap "Pay ₪1,240" → Payment screen with pre-filled amount → 
Confirm payment method → Success screen with receipt
```
Total: 3 taps, 1 page navigation

#### Ticket Creation (Resident)
```
Home → Tap "Open Maintenance Ticket" → Full-screen form (camera + description) → 
Submit → Success screen with ticket number
```
Total: 4 taps, 1 page navigation

#### Dispatch/Assign (PM)
```
Home → Tap "8 new tickets" → Filtered ticket list → Tap ticket → 
Bottom sheet with "Assign" button → Select tech from list → Confirm → 
Toast + next ticket auto-displayed
```
Total: 5 taps, 1 page navigation + 2 bottom sheets

### 7.3 Reducing Back-and-Forth

| Problem | Solution |
|---------|----------|
| User goes to tickets, filters, picks one, goes back to filter again | **Swipe to next ticket** within detail bottom sheet |
| User opens home, taps dashboard, realizes they need tickets | **Primary Action Card links directly** to the relevant filtered view |
| User in More menu, taps item, wants to go back to More | **More sheet remembers scroll position** on re-open |
| Resident on account page scrolls to payments then back up | **Separate payments tab** eliminates scrolling |
| Tech checks job detail, goes back to list to find next | **"Next job" button** at bottom of job detail |

### 7.4 Quick Actions & Contextual Actions

#### Quick Actions (always available, home screen tiles)
These are the 4 tiles in the Quick Action Grid. They should show:
- Icon
- Label (max 2 words)
- Live count/metric badge (if applicable)
- Tap navigates directly to the relevant screen

#### Contextual Actions (available based on current screen/state)
| Context | Action | UI |
|---------|--------|-----|
| Viewing ticket detail | Assign, Escalate, Close | Sticky bottom bar with 2–3 buttons |
| Viewing payment list | Pay Selected, Export | FAB or sticky bar |
| In ticket list | Filter, Sort, Search | Sticky filter bar below tabs |
| On building detail | Call Manager, View Units, See Tickets | Quick action row at top |
| On resident account | Pay, New Request, Call | Quick action row at top |

### 7.5 Every Important Operation in 1–2 Taps

| Operation | Tap 1 | Tap 2 | Done? |
|-----------|-------|-------|-------|
| See open tickets count | Home screen (visible) | — | Yes (0 taps) |
| Open ticket dispatch | Primary Action Card | — | Yes (1 tap) |
| Pay a bill (Resident) | Balance Card "Pay now" | Confirm payment | Yes (2 taps) |
| Submit service request | Quick Action "New Request" | — form opens | 1 tap + form |
| Update job status (Tech) | "Update Status" tile | Pick status | Yes (2 taps) |
| Check SLA status (Admin) | Status strip metric | — | Yes (0 taps) |
| View budget variance | Quick Action "Budgets" | — | Yes (1 tap) |
| Contact building mgmt (Resident) | Quick Action "Building" | Tap phone/email | Yes (2 taps) |

---

## 8. Visual Facelift Guidance

### 8.1 Existing Palette — Preserved

The gold/neutral palette is the product's identity. No changes to color values.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| Primary | `hsl(38, 76%, 47%)` | `hsl(39, 78%, 58%)` | CTAs, active states, accents |
| Background | `hsl(42, 20%, 98%)` | `hsl(25, 14%, 12%)` | Page background |
| Card | `hsl(42, 26%, 99%)` | `hsl(28, 14%, 14%)` | Card surfaces |
| Foreground | `hsl(24, 21%, 8%)` | `hsl(42, 18%, 96%)` | Primary text |
| Muted | `hsl(28, 9%, 40%)` | `hsl(32, 10%, 68%)` | Secondary text |
| Destructive | `hsl(0, 72%, 51%)` | `hsl(0, 72%, 55%)` | Errors, urgent items |
| Success | `hsl(148, 52%, 32%)` | `hsl(148, 48%, 46%)` | Positive states |

### 8.2 Improvements to Apply

#### Contrast & Hierarchy
- **Increase foreground/muted contrast:** On mobile, `text-muted-foreground` at `hsl(28, 9%, 40%)` is too similar to `text-foreground` at `hsl(24, 21%, 8%)` in low-light conditions. Add a utility class `text-secondary-foreground` that is 15% more opaque than muted for important secondary text (card descriptions, metric labels).
- **Bolder metric values:** Use `font-extrabold` (800) instead of `font-bold` (700) for metric numbers on mobile.
- **Sharper section dividers:** Replace the current subtle 1px borders with a 2px `border-b-2 border-primary/8` for section separators on home screens.

#### Depth & Surface Treatment
- **Card elevation tiers:** Define 3 tiers clearly:
  - Tier 1 (Primary Action Card): `shadow-raised` + `border-primary/12` — the most prominent card on screen
  - Tier 2 (Quick Action Tiles, Priority Inbox): `shadow-card` — standard interactive cards
  - Tier 3 (Metric Cards, Info Cards): `shadow-elevation-1` — subtle, passive surfaces
- **Reduce blur orb intensity on mobile:** Scale `PageHero` blur orbs from `h-36 w-36` to `h-24 w-24` on mobile. They currently create visual noise on small screens.
- **Remove decorative gradients from actionable surfaces:** The `bg-gradient-to-br` on action cards adds visual complexity. Replace with solid `bg-card` + left accent border (`border-s-4 border-primary`).

#### Icon Treatment
- **Consistent icon size:** All inline icons at `h-4 w-4` (16px). All tile icons at `h-5 w-5` (20px). All hero icons at `h-6 w-6` (24px). Remove current inconsistency where some icons are `h-[18px]` and others are `h-3.5`.
- **Icon containers:** Tile icons get a `h-10 w-10 rounded-xl` container with `bg-primary/8` (keep current toneClasses pattern but reduce container from `h-14 w-14` to `h-10 w-10`).
- **Lucide stroke width:** Use `strokeWidth={1.75}` consistently. The default 2px feels heavy on mobile.

#### Card System Cleanup
- **One radius to rule them (mobile):** `rounded-2xl` (16px) for ALL cards on mobile. The current mix of `rounded-[22px]`, `rounded-[24px]`, `rounded-[26px]`, `rounded-[28px]` creates visual inconsistency.
- **Consistent card padding:** `p-3` on mobile, `p-4` on `sm:`, `p-5` on `lg:`. No exceptions.
- **Card variant reduction:** Reduce from 8 variants (default, elevated, metric, action, warning, featured, listRow, muted) to 5: `default`, `elevated`, `action`, `warning`, `muted`. Merge `metric` into `default`, merge `featured` into `elevated`, merge `listRow` into `muted`.

### 8.3 Premium Animations — Restrained

#### Page Transitions
- **Enter:** Fade in + slide up 8px over 280ms with `cubic-bezier(0.16, 1, 0.3, 1)`
- **Exit:** Fade out over 180ms with `cubic-bezier(0.7, 0, 0.84, 0)`
- **Implementation:** Wrap `<main>` content with `framer-motion` `AnimatePresence` using `key={router.pathname}`

#### Loading States
- **Skeleton screens:** Keep current `MobileCardSkeleton` but add shimmer effect (`animate-shimmer`) with a subtle gold tint: `bg-gradient-to-r from-muted via-primary/5 to-muted`
- **Content pop-in:** When data arrives, cards animate in with staggered timing: 50ms offset per card, 200ms duration each
- **Pull-to-refresh:** Custom spring animation on pull (16px travel), gold-tinted loading spinner

#### Success States
- **Payment success:** Check circle scales from 0 → 1 with overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)`) over 400ms, then gentle pulse
- **Ticket submitted:** Brief confetti burst (3–5 particles, gold-colored, 600ms duration), then card slides into place
- **Status update:** Ripple effect from the button outward, status badge morphs color

#### Transition Motion
- **Bottom sheet open:** Spring animation with `damping: 26, stiffness: 280` (framer-motion spring)
- **Tab switch:** Content crossfades with 180ms duration (no sliding — sliding implies hierarchy)
- **Card tap:** `scale(0.98)` on press, `scale(1)` on release with 100ms duration
- **Navigation indicator:** `layoutId` pill (current implementation is correct, keep it)

#### Performance Rules
- **Max simultaneous animations:** 3 (beyond this, skip animations for later items)
- **Prefer CSS transforms:** Use `transform` and `opacity` only — never animate `width`, `height`, `margin`, `padding`
- **Reduce motion:** Respect `prefers-reduced-motion` — current implementation is correct
- **Animation budget per interaction:** Max 300ms for feedback animations, max 500ms for celebrations

---

## 9. Wow Factor Ideas

### 9.1 Live Status Pulse
The Status Strip shows a subtle breathing pulse on the most critical metric. If SLA breaches > 0, the breach count has a gentle `animate-pulse` with a red glow ring (`box-shadow: 0 0 0 4px hsl(0 72% 51% / 0.12)`). If everything is clear, a green dot pulses next to "הכול תקין". Removes after 5 seconds — not persistent.

### 9.2 Smart Priority Reordering
When the Priority Inbox receives a new item (via WebSocket — the app already uses `socket.io-client`), the new item slides in from the top with a gentle `translateY(-100%) → translateY(0)` animation over 300ms. Existing items smoothly shift down using `layout` animation.

### 9.3 Haptic Feedback on Key Actions
The app already imports `triggerHaptic` from `lib/mobile`. Extend usage:
- **Light haptic:** Tab switch, card tap, toggle switch
- **Medium haptic:** Successful payment, ticket submitted, status changed
- **Heavy haptic:** Error state, form validation failure
- Use `navigator.vibrate()` with duration patterns: light (10ms), medium (20ms), heavy (40ms, 20ms, 40ms).

### 9.4 Contextual Greeting Fade
Replace the current static greeting in `DashboardHero` with a time-aware, one-line contextual message that fades in on first load only:
- Morning: "בוקר טוב. 3 קריאות חדשות מחכות."
- Afternoon: "צהריים טובים. הנה מה שהשתנה מהבוקר."
- Evening: "ערב טוב. סיכום היום שלך מוכן."
Displayed for 3 seconds, then collapses to make room for content. Uses `AnimatePresence` with exit animation.

### 9.5 Card Depth on Scroll
As the user scrolls down, cards above the fold gain a subtle `translateZ` illusion: the Primary Action Card gets a slightly larger shadow and the quick action tiles get slightly reduced shadow, creating a parallax depth effect. Implemented with `Intersection Observer` + CSS custom properties — no JS-driven animation frames.

### 9.6 Swipe-to-Act on Priority Items
Priority Inbox items support swipe gestures:
- **Swipe right (in RTL: swipe left):** Reveals a green "Start" button for tech, "Approve" for PM
- **Swipe left (in RTL: swipe right):** Reveals a blue "Snooze 1h" option
- Implemented with `framer-motion` drag gestures. Threshold: 80px. Snap back if below threshold.

### 9.7 Badge Counter Animation
When a bottom nav tab's badge count changes (e.g., new ticket arrives), the badge does a subtle scale bounce: `scale(1) → scale(1.3) → scale(1)` over 300ms with a gentle spring. Combined with the pulse animation already on the notification badge.

### 9.8 Smooth Number Transitions
Metric values in the Status Strip and metric cards use animated number counting. When the value changes (on WebSocket update or data refresh), the number smoothly counts from old → new over 400ms using `requestAnimationFrame`. Uses a spring interpolation for a premium feel.

### 9.9 Pull-to-Refresh with Brand Flair
Custom pull-to-refresh replaces the browser default. A gold-colored ring draws as the user pulls (like a progress circle), completing at 72px pull distance. On release, the ring transforms into a spinning loader. On completion, the ring fills solid gold and shrinks to nothing. Total animation: ~800ms.

### 9.10 Ticket Status Timeline Dots
On ticket detail, the status timeline uses animated dots that "light up" sequentially when the screen loads: Open → Assigned → In Progress → Resolved. Each dot transitions from `bg-muted` to its status color with a 150ms stagger. Creates a sense of progress and narrative.

### 9.11 Skeleton-to-Content Morph
Instead of skeletons disappearing and content appearing, skeleton shapes morph into content shapes. The skeleton rectangle for a metric card smoothly transitions its background from `bg-muted` to the actual card background while the text fades in. Uses shared `layout` keys in framer-motion.

### 9.12 Subtle Card Hover Lift (Touch Feedback)
On touch-and-hold (150ms), cards lift with `translateY(-2px)` and shadow increases. On release, they settle back with a micro-bounce. This gives every card a "physical" feel without being distracting. Uses `whileTap={{ y: -2, boxShadow: "var(--surface-shadow-raised)" }}`.

---

## 10. Accessibility & RTL

### 10.1 RTL Layout Rules

This product is Hebrew-first. All layout rules must be authored RTL-first with LTR as the exception.

#### Directional Properties — Use Logical Properties Only

| Physical (DO NOT USE) | Logical (USE THIS) |
|-----------------------|-------------------|
| `left` / `right` | `inset-inline-start` / `inset-inline-end` |
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| `text-align: left` | `text-align: start` |
| `float: left` | `float: inline-start` |
| `border-left` | `border-inline-start` |

Tailwind equivalents: `ms-*` / `me-*` / `ps-*` / `pe-*` / `start-*` / `end-*` (already used in codebase — enforce consistently).

#### Icon Mirroring

Icons that imply direction MUST be mirrored in RTL:
- **Mirror:** Arrows (→, ←, ↗), chevrons, "back" icons, "forward" icons, "open in new" icons
- **Don't mirror:** Icons that represent real-world objects (phone, camera, check, X, search, gear), media controls (play, pause), clock icons

Current implementation in `globals.css` uses `.icon-directional { transform: scaleX(-1) }` in RTL — this is correct. Ensure all directional icons have the `icon-directional` class.

**Specific fix needed:** `ArrowUpRight` in `MobileActionHub` tiles and `ArrowLeft` in `ActionCard` should have `icon-directional` class. Currently they don't.

#### Text Alignment

- Body text: `text-start` (auto-flows RTL)
- Numeric values (currency, counts): `text-start` — numbers in Hebrew context read left-to-right but are placed on the right in RTL layout
- Metric cards: Value uses `tabular-nums` for alignment + `text-start`
- Buttons: `text-center` (always, regardless of direction)

#### Spacing Asymmetry

Hebrew text has different visual weight distribution than Latin text. Apply these corrections:
- **Status Strip:** `ps-3 pe-4` (extra end padding for visual balance)
- **Card content with icon:** Icon at `inline-end`, text flowing from `inline-start`
- **List items with avatars:** Avatar at `inline-end`, content at `inline-start`

### 10.2 Accessibility Requirements

#### WCAG 2.1 AA Compliance

| Requirement | Specification |
|-------------|--------------|
| Color contrast (normal text) | 4.5:1 minimum — current gold-on-white is **3.8:1** for `hsl(38, 76%, 47%)` on white. Use `hsl(36, 70%, 38%)` (gold-600) for text on light backgrounds |
| Color contrast (large text) | 3:1 minimum — current is compliant for headings |
| Touch target size | 44×44px minimum (WCAG 2.5.8) — enforce with `touch-target` utility |
| Focus indicators | 2px ring + 2px offset — current `focus-visible` implementation is correct |
| Screen reader labels | All interactive elements need `aria-label` or visible text |
| Skip navigation | Current `.skip-link` implementation is correct — keep it |
| Reduced motion | Current `prefers-reduced-motion` handling is correct — keep it |

#### Specific Fixes Needed

1. **Bottom nav active state:** Current `bg-primary/12` is too subtle for screen reader users who also have low vision. Add `aria-current="page"` (already done) AND ensure the active indicator has sufficient contrast.

2. **More sheet:** Add `role="dialog"` (already done) and `aria-modal="true"` (already done). Add `aria-describedby` pointing to the subtitle text.

3. **Priority Inbox items:** Each item needs `role="article"` or `role="listitem"` with `aria-label` describing the priority level and action needed.

4. **Metric cards:** Add `role="status"` and `aria-live="polite"` so screen readers announce when values change.

5. **Form inputs:** Enforce `font-size: 16px` on mobile inputs (already done in `globals.css`) to prevent iOS zoom.

6. **Bottom sheets:** Trap focus within the sheet when open. Current implementation locks scroll but doesn't trap focus — add `focus-trap` behavior.

#### Keyboard Navigation

- Tab order follows visual order (top-to-bottom, start-to-end)
- Bottom nav items are focusable with Enter/Space activation
- Escape closes all modals, bottom sheets, and dropdowns (current: Escape closes More sheet — extend to all overlays)
- Arrow keys navigate within tab bars, radio groups, and select menus

### 10.3 Hebrew Typography Specifics

- **Font:** Heebo is an excellent choice for Hebrew. Keep it.
- **Line height:** Hebrew diacritics (nikud) need extra line height. Current `leading-5` (20px) for 12px text = 1.67 ratio — correct. Don't go below 1.5 for any Hebrew text.
- **Letter spacing:** Hebrew text should NOT use `tracking-tight` or `tracking-wide`. Keep default tracking for body text. Only headings (Fraunces) should use `tracking-[-0.03em]` which is already applied.
- **Word breaking:** Hebrew compound words can be very long. Apply `overflow-wrap: break-word` to all card content areas.
- **Bidirectional text:** When Hebrew text includes English words or numbers (ticket numbers, email addresses), wrap them in `<bdi>` elements or use `unicode-bidi: isolate` to prevent display issues.

---

## 11. Prioritized Implementation Roadmap

### Phase 1: Foundation (Ship First)

**Components to build/modify:**

| # | Task | Files Affected | Complexity |
|---|------|---------------|------------|
| 1.1 | Create `CompactStatusStrip` component | New: `components/ui/compact-status-strip.tsx` | Low — simple flex row with badges |
| 1.2 | Create `PrimaryActionCard` component | New: `components/ui/primary-action-card.tsx` | Low — single card with conditional content |
| 1.3 | Redesign `MobileActionHub` tile dimensions | `components/ui/mobile-action-hub.tsx` | Low — reduce `min-h`, icon size, padding |
| 1.4 | Hide `PageHero` on mobile home screens | `pages/home.tsx`, `components/ui/page-hero.tsx` | Low — conditional `hidden md:block` |
| 1.5 | Add 4th tab to bottom nav for each role | `components/layout/MobileBottomNav.tsx` | Medium — update `getRoleBottomNav`, change grid to `grid-cols-5` |
| 1.6 | Reduce card border radius on mobile | `components/ui/card.tsx` | Low — change to `rounded-2xl md:rounded-[24px]` |
| 1.7 | Restructure home page sections | `pages/home.tsx` | Medium — reorder sections, remove digest from mobile |

**Definition of done:** Mobile home screen for all 5 roles fits primary content within one viewport. 4 tabs + More in bottom nav. Hero eliminated from mobile home.

### Phase 2: Role Optimization

| # | Task | Files Affected | Complexity |
|---|------|---------------|------------|
| 2.1 | Create standalone resident payments page | New: `pages/resident/payments.tsx` | Medium — extract from account page |
| 2.2 | Create Tech "Next Job" card with direct start | Modify: `pages/home.tsx` (TECH branch) | Medium — new API integration for top job |
| 2.3 | Implement Priority Inbox swipe gestures | `components/ui/mobile-priority-inbox.tsx` | Medium — framer-motion drag |
| 2.4 | Reduce More sheet items per role | `components/layout/MobileBottomNav.tsx` | Low — prune items, max 12 |
| 2.5 | Add "Recently Used" section to More sheet | `components/layout/MobileBottomNav.tsx` | Medium — localStorage tracking |
| 2.6 | Build Accountant collection card | Modify: `pages/home.tsx` (ACCOUNTANT branch) | Medium — new API data |
| 2.7 | Build empty states for each role | Multiple page files | Low — new illustrations/messages |

**Definition of done:** Each role has a purpose-built home screen with role-specific Primary Action Card and Quick Actions. Resident payments is a standalone page.

### Phase 3: Polish & Motion

| # | Task | Files Affected | Complexity |
|---|------|---------------|------------|
| 3.1 | Implement page transitions | `pages/_app.tsx`, `components/Layout.tsx` | Medium — AnimatePresence wrapper |
| 3.2 | Add skeleton-to-content morph | `components/ui/page-states.tsx` | Medium — shared layout keys |
| 3.3 | Implement animated number transitions | New: `hooks/use-animated-number.ts` | Low — requestAnimationFrame |
| 3.4 | Add haptic feedback to key interactions | Multiple files using `triggerHaptic` | Low — extend existing calls |
| 3.5 | Implement pull-to-refresh with brand ring | New: `components/ui/pull-to-refresh.tsx` | Medium — custom gesture handling |
| 3.6 | Refine card elevation tiers | `styles/premium-theme.css`, `components/ui/card.tsx` | Low — shadow adjustments |
| 3.7 | Add live status pulse to critical metrics | `components/ui/compact-status-strip.tsx` | Low — CSS animation |
| 3.8 | Fix RTL icon mirroring gaps | `components/ui/mobile-action-hub.tsx`, `pages/home.tsx` | Low — add `icon-directional` class |

**Definition of done:** All animations run at 60fps on a mid-range Android device. Haptic feedback on 10+ interaction points. RTL mirroring complete.

### Phase 4: Advanced Interactions

| # | Task | Files Affected | Complexity |
|---|------|---------------|------------|
| 4.1 | Implement ticket detail bottom sheet | New: `components/tickets/ticket-quick-view.tsx` | High — replaces page navigation |
| 4.2 | Add "swipe to next ticket" in detail view | Above component | Medium — gesture handling |
| 4.3 | Build smart notification grouping | `pages/notifications.tsx` | Medium — group by type/time |
| 4.4 | Add contextual quick-action rows | Multiple detail pages | Medium — screen-aware actions |
| 4.5 | Implement sticky CTA bar component | New: `components/ui/sticky-cta-bar.tsx` | Medium — scroll-aware visibility |
| 4.6 | Build real-time badge updates via WebSocket | `components/layout/MobileBottomNav.tsx` | Medium — integrate websocketService |
| 4.7 | Add focus trapping to all bottom sheets | Global utility or per-component | Medium — accessibility requirement |

**Definition of done:** Users can complete the top 3 actions per role without full-page navigation. WebSocket drives real-time badge counts. All overlays trap focus.

---

## 12. Acceptance Criteria for Engineering

### 12.1 Global Mobile Criteria

- [ ] **Viewport fit:** Home screen for each role shows Status Strip + Primary Action Card + Quick Actions (2×2) + Priority Inbox peek within the first viewport (667px - 48px header - 52px bottom nav = 567px usable)
- [ ] **No hero on mobile home:** `PageHero` component is hidden on mobile (`< md` breakpoint) for all role home screens
- [ ] **Bottom nav:** 4 tabs + More for every role, `grid-cols-5`, each tab with icon + label + optional badge
- [ ] **Touch targets:** All interactive elements meet 44×44px minimum (verify with Chrome DevTools "Show touch target sizes")
- [ ] **Card radius:** All cards use `rounded-2xl` (16px) on mobile, `rounded-[24px]` on `md:+`
- [ ] **Section limit:** No mobile page has more than 4 sections above the fold
- [ ] **Load time:** Home screen reaches interactive state in <2s on 3G throttle (Chrome DevTools)
- [ ] **RTL compliance:** All layouts use logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`). No physical `left`/`right` in new code.
- [ ] **Accessibility:** All interactive elements have `aria-label` or visible accessible text. Focus order is logical. Color contrast meets 4.5:1 for normal text.

### 12.2 Component-Specific Criteria

#### CompactStatusStrip
- [ ] Height: exactly 48px
- [ ] Contains: role badge + 2 inline metrics (e.g., "5 קריאות · 2 SLA")
- [ ] Truncates gracefully on narrow screens (320px)
- [ ] Tapping a metric opens a detail bottom sheet

#### PrimaryActionCard
- [ ] Max height: 120px
- [ ] Contains: headline + one-line description + CTA button
- [ ] CTA button is at least 44px tall
- [ ] Content is role-specific and data-driven
- [ ] Shows appropriate empty/success state when no action needed

#### MobileActionHub (Redesigned)
- [ ] Tile min-height: 88px (reduced from 132px)
- [ ] Icon container: 40×40px (reduced from 56×56px)
- [ ] Grid: 2 columns, max 4 tiles on home, max 6 on secondary screens
- [ ] Each tile shows: icon + label + badge (optional)
- [ ] Badge shows live data count

#### MobileBottomNav (Updated)
- [ ] Grid: `grid-cols-5` (from `grid-cols-4`)
- [ ] 4 role-specific primary tabs + More
- [ ] Active indicator uses `layoutId` animation (keep existing)
- [ ] More sheet: max 12 items, max 3 groups, Recently Used section at top
- [ ] No duplicate links between tabs and More sheet

#### Priority Inbox
- [ ] Max 3 items visible on home
- [ ] Each item: status indicator (colored dot) + title + reason + CTA
- [ ] Item min-height: 56px
- [ ] "View all" link at bottom if more than 3 items
- [ ] Supports swipe gestures (Phase 2)

### 12.3 Animation Criteria

- [ ] All animations complete within 500ms
- [ ] No animation uses properties other than `transform` and `opacity`
- [ ] All animations respect `prefers-reduced-motion: reduce`
- [ ] Skeleton screens use shimmer with gold tint
- [ ] Page transitions use fade + 8px slide-up (280ms enter, 180ms exit)
- [ ] Card press feedback: `scale(0.98)` on touch, 100ms duration
- [ ] Bottom sheet spring: `damping: 26, stiffness: 280`

### 12.4 RTL/Accessibility Criteria

- [ ] All new components use Tailwind logical property utilities exclusively
- [ ] Directional icons (arrows, chevrons) include `icon-directional` class
- [ ] Hebrew text does not use `tracking-tight` or `tracking-wide`
- [ ] All card content areas have `overflow-wrap: break-word`
- [ ] Form inputs maintain 16px font-size on mobile (prevent iOS zoom)
- [ ] All bottom sheets trap focus when open
- [ ] Metric values use `tabular-nums` for consistent width
- [ ] Color contrast: No text-on-background combination below 4.5:1 ratio
- [ ] All images and icons have meaningful `alt` text or `aria-hidden="true"`

### 12.5 Performance Criteria

- [ ] Lighthouse Performance score > 85 on mobile throttled profile
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] No layout shifts from bottom nav or status strip rendering
- [ ] Max 3 simultaneous framer-motion animations
- [ ] No JavaScript bundle increase > 15KB gzipped from animation additions

---

## Appendix A: Component Migration Map

| Current Component | Action | Replacement |
|-------------------|--------|-------------|
| `PageHero` (on home screens) | Hide on mobile | `CompactStatusStrip` + `PrimaryActionCard` |
| `PageHero` (on detail pages) | Keep but make compact | Add `mobile-compact` prop that renders compact variant |
| `DashboardHero` | Simplify | Extract filters to `FilterBar`, keep KPIs in `CompactStatusStrip` |
| `MobileContextBar` | Replace | `CompactStatusStrip` (same data, denser layout) |
| `MobileActionHub` | Resize | Same component, reduced dimensions |
| `MobilePriorityInbox` | Keep | Add swipe gestures in Phase 2 |
| `MobileBottomNav` | Extend | Add 4th tab, update grid, prune More items |
| Resident account payments section | Extract | New `/resident/payments` page |
| Home page Operational Digest | Remove from mobile | Move to "Reports" or remove entirely |
| Onboarding Dialog | Limit | Show only on first login, then accessible from Settings |

## Appendix B: Key File Reference

| File | Purpose | Phases Affected |
|------|---------|-----------------|
| `components/layout/MobileBottomNav.tsx` | Bottom navigation | 1, 2 |
| `components/layout/Header.tsx` | App header | 1 |
| `components/ui/page-hero.tsx` | Hero sections | 1 |
| `components/ui/mobile-action-hub.tsx` | Quick action tiles | 1 |
| `components/ui/mobile-context-bar.tsx` | Context strip | 1 |
| `components/ui/mobile-priority-inbox.tsx` | Priority inbox | 1, 2 |
| `components/ui/card.tsx` | Card system | 1, 3 |
| `pages/home.tsx` | Role home screen | 1, 2 |
| `pages/admin/dashboard.tsx` | Admin dashboard | 1, 2 |
| `pages/resident/account.tsx` | Resident account | 2 |
| `pages/tech/jobs.tsx` | Tech job queue | 2 |
| `styles/premium-theme.css` | Theme tokens | 1, 3 |
| `styles/globals.css` | Global styles | 1, 3 |
| `pages/_app.tsx` | App wrapper | 3 |
| `components/Layout.tsx` | Main layout | 1, 3 |

## Appendix C: Measurement Checklist

Before each phase ships, measure on a real device (iPhone SE 3rd gen + Samsung Galaxy A14):

- [ ] Screen recording of each role's home-to-action flow — count taps
- [ ] Viewport screenshot of home screen — verify content fits
- [ ] 3G throttle load test — verify <2s time to interactive
- [ ] VoiceOver/TalkBack walkthrough — verify all elements announced correctly
- [ ] RTL screenshot review — verify no layout breaks in Hebrew
- [ ] Animation performance — verify 60fps with Chrome DevTools Performance tab
- [ ] Memory usage — verify no memory leaks from animation mounts/unmounts
