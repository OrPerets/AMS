# Product Backlog – AMIT-PMS (MVP)

---

## Epic: Authentication & Tenancy

**User Story:** כ–משתמש, אני רוצה להתחבר למערכת לפי תפקיד (דייר, מנהל, טכנאי, רו"ח).

- [x] Task 1: Implement JWT-based Auth (short-lived + refresh tokens).
- [x] Task 2: Create User model with role & tenant_id.
- [x] Task 3: Add RBAC middleware (admin/pm/tech/resident/accountant).
- [x] Task 4: Setup RLS (Row-Level Security) in Postgres by tenant_id.

**Acceptance:** משתמש נכנס ורואה רק את המידע של הטננט שלו לפי הרשאה.

---

## Epic: Buildings & Residents

**User Story:** כ–מנהל, אני רוצה לנהל בניינים, דירות ודיירים.

 - [x] Task 1: Create Building, Unit, Resident models.
 - [x] Task 2: CRUD endpoints: /api/v1/buildings, /api/v1/units.
 - [x] Task 3: Associate residents with units (many-to-many).
 - [x] Task 4: Seed demo building with test data.

**Acceptance:** מנהל יכול להוסיף בניין, יחידות ודיירים; דייר רואה רק את יחידתו.

---

## Epic: Tickets (קריאות שירות)

**User Story:** כ–דייר, אני רוצה לפתוח קריאת שירות עם תיאור ותמונה.

 - [x] Task 1: Create Ticket model (id, unit_id, severity, status, sla_due, photos[]).
 - [x] Task 2: Endpoint POST /api/v1/tickets (with photo upload → S3).
 - [x] Task 3: Endpoint GET /api/v1/tickets?status&buildingId.
 - [x] Task 4: Manager dashboard: assign ticket to supplier/tech.
 - [x] Task 5: Notifications on status change (email/push).

**Acceptance:** דייר פותח קריאה → מופיעה לדשבורד המנהל → מוקצת לטכנאי → נסגרת.

---

## Epic: Suppliers & Work Orders

**User Story:** כ–מנהל, אני רוצה להקצות קריאות שירות לטכנאי או ספק.

- [x] Task 1: Create Supplier model (skills[], rating, documents).
- [x] Task 2: Create WorkOrder model (ticket_id, supplier_id, cost_estimate).
- [x] Task 3: Endpoint PATCH /api/v1/tickets/{id}/assign.
- [x] Task 4: Tech mobile view: list of today’s jobs + update status.

**Acceptance:** מנהל מקצה תקלה לספק; ספק רואה אותה באפליקציה וסוגר עם תמונה.

---

## Epic: Payments & Billing

**User Story:** כ–דייר, אני רוצה לשלם אונליין ולקבל קבלה במייל.

 - [x] Task 1: Create Invoice model (debtor_id, items[], status).
 - [x] Task 2: Integrate with Tranzila sandbox API.
 - [x] Task 3: Webhook endpoint for payment confirmation.
 - [x] Task 4: PDF receipt generation (SendGrid or SES).
 - [x] Task 5: Dashboard: unpaid invoices list + filter.

**Acceptance:** דייר מקבל לינק תשלום → משלם → קבלה נשלחת למייל.

---

## Epic: Notifications & Communication

**User Story:** כ–מנהל, אני רוצה לשלוח הודעות לדיירים/בניינים.

 - [x] Task 1: Notification service (to: user/building/all tenants).
 - [x] Task 2: Channels: Email (SendGrid), Push (PWA), SMS (Twilio).
 - [x] Task 3: Templates for status updates & general announcements.

**Acceptance:** דייר מקבל הודעת "קריאה נפתרה" + יכולת למנהל לשלוח עדכון לכל בניין.

---

## Epic: Dashboard & Reporting

**User Story:** כ–מנהל, אני רוצה לראות סטטוס כולל של תקלות ותשלומים.

- [x] Task 1: Build dashboard with KPIs (open tickets, SLA breaches, unpaid invoices).
- [x] Task 2: Add search/filter bar for quick lookup.
- [x] Task 3: Export CSV/Excel for accountant.

**Acceptance:** מנהל רואה בלוח בקרה תמונה מלאה ומבצע חיתוכים לפי בניין/סטטוס.

---

## Epic: Non-Functional (NFRs)

**User Story:** כ–מנהל מערכת, אני רוצה שהמערכת תהיה מאובטחת ונגישה.

- [ ] Task 1: Add MFA for admin login.
- [ ] Task 2: WCAG 2.1 AA accessibility for web.
- [ ] Task 3: Structured logging (JSON logs + correlation IDs).
- [ ] Task 4: Monitoring (Prometheus + Grafana).
- [ ] Task 5: Backups & restore test.

**Acceptance:** אבטחת מידע עומדת ב-OWASP ASVS L2, המערכת זמינה ב-99.9%.

---

## Epic: Frontend Implementation

**User Story:** כ–משתמש, אני רוצה ממשק משתמש בעברית המכסה את כל הפונקציונליות כדי ליהנות מחוויית שימוש מקצועית.

 - [x] Task 1: Hebrew interface.
 - [x] Task 2: Include all system functionality.
 - [x] Task 3: Elegant & professional UI.
 - [x] Task 4: Enhanced user experience & engagement.

**Acceptance:** משתמשים יכולים להפעיל את כל המערכת דרך ממשק עברי מקצועי וחוויתי.

---

## Epic: Master User & Role Switching

**User Story:** כ–מנהל מערכת, אני רוצה משתמש-על ("Master") שיכול להחליף תצוגות בין תפקידים (מנהל/דייר/טכנאי/רו"ח/PM) לצורך בדיקות, תמיכה והדרכות – באופן מאובטח ומתועד.

- [x] Task 1: Add `MASTER` to roles enum + DB migration.
- [x] Task 2: Seed Master user (DEV בלבד) עם סיסמה מאובטחת.
- [x] Task 3: Backend – Impersonation מאובטח:
  - יצירת endpoint `POST /api/v1/admin/impersonate` (Master בלבד) שמנפיק JWT עם claim של `actAsRole` ו-`tenantId`.
  - יצירת endpoint `POST /api/v1/admin/impersonate/stop` שמחזיר ל-token המקורי.
  - הוספת Audit log לטבלת `impersonation_events` (start/stop, by, target, reason, ip, userAgent).
  - הגנות: תוקף קצר (30 דק'), מניעת חציית טננטים, אימות שרק תפקידים מוכרים ב-actAs.
- [x] Task 4: Frontend – Role Switcher UI:
  - רכיב מחליף-תפקידים ב-`Layout` ל-Master בלבד, עם badge מודגש "צפייה כ–<role>".
  - קריאה ל-impersonate לקבלת token חדש והחזרה ל-token המקורי ב-stop.
  - אינדיקציה קבועה (banner) במצב impersonation + כפתור "חזור למשתמש המקורי".
- [ ] Task 5: אבטחה והתנהגות פעולות רגישות:
  - החלטת מדיניות: לאפשר פעולות כתפקיד המתחזה (לצורכי בדיקות) אך לתעד הכל, או להגביל פעולות הרסניות.
  - הוספת התראות מנהליות על impersonation פעיל מעבר ל-60 דק'.
- [ ] Task 6: בדיקות – יחידה/אינטגרציה/E2E לריבוי תפקידים תחת impersonation ו-RBAC.

**Acceptance:** משתמש Master יכול להחליף תצוגה לתפקידים מותרים באותו tenant; כל בקשות ה-API מאושרות לפי `actAsRole`; כל אירועי impersonation מתועדים ומסומנים UI.

---

## Epic: Rich Mock/Test Data (Seed)

**User Story:** כ–בודק/מדריך, אני רוצה דאטה מגוון וריאלי כדי להדגים תרחישים ולבצע בדיקות מקיפות ללא עבודה ידנית.

 - [x] Task 1: הרחבת `seed.ts` עם קונפיג קנה-מידה (`SEED_SCALE=small|medium|large`).
 - [x] Task 2: יצירת נתונים:
   - Tenants (2), Buildings (3–5 לכל טננט), Units (20–50 לכל בניין).
   - Users לפי תפקיד: Master (1, DEV), Admin, PM, Tech, Accountant, Residents.
   - Suppliers, Tickets (סטטוסים שונים, עם SLA), Work Orders (כולל "היום"), Invoices (UNPAID/PAID/OVERDUE), Payments, Notifications.
 - [x] Task 3: דור נתונים דטרמיניסטי (seed ל-faker), Idempotent (ניקוי והזרקה מחדש), DEV בלבד.
 - [x] Task 4: מדיה ודוא"ל בסביבת פיתוח:
   - תמונות: שימוש ב-placeholder/avatarlorempics; אחסון מקומי/דמי.
   - דוא"ל: ניתוב ל-Mailhog/Console במקום שליחה אמיתית.
 - [x] Task 5: הדפסת תקציר קרדנציאלס בסיום seed (טבלה של משתמשים/סיסמאות DEV).
 - [x] Task 6: סקריפטים: `yarn db:reset` + `yarn seed:test` + תיעוד שגיאות נפוצות.
 - [x] Task 7: תיעוד: README – איך מריצים seed, לאילו משתמשים להתחבר, ומה לבדוק.

**Acceptance:** הרצה יחידה מייצרת דאטה ריאלי עם קרדנציאלס לבדיקה; עמודי תשלומים/משימות טכנאי מאוכלסים; הרצה חוזרת בטוחה ומנקה נתונים קודמים ב-DEV.

---

## Epic: UI Redesign & Theming (RTL-first)

**User Story:** כ–משתמש, אני רוצה ממשק אלגנטי, מקצועי ושימושי (RTL מלא), שמדגיש בהירות ויעילות.

 - [x] Task 1: Design System & Foundations:
   - הטמעת Tailwind CSS + Radix UI + shadcn/ui.
   - הגדרת RTL, טיפוגרפיה, טוקני צבע/ריווח, מצב Light/Dark.
 - [x] Task 2: Layout & Navigation:
   - App Shell מודרני: Header (עם Role Switcher), Sidebar, Breadcrumbs, Footer.
   - ניווט רספונסיבי ונגיש (Mobile-first).
 - [x] Task 3: Component Library:
   - Buttons, Inputs, Selects, Date/Time Picker, Modal, Toast, Badge, Tabs.
   - Data Table (מיון/סינון/עמוד-עבודה), Skeletons, Empty States.
   - טפסים עם `react-hook-form` + `zod`, הודעות שגיאה עקביות.
 - [x] Task 4: Page Redesigns:
   - Dashboard: כרטיסי KPI, גרפים בסיסיים.
   - Tickets: רשימה, פרטי קריאה, הקצאה, העלאת תמונות.
   - Tech Jobs: רשימת משימות היום, פעולה מהירה לסגירה, פידבק הצלחה.
   - Payments: רשימת חובות, CTA לתשלום, סטטוס קבלה.
   - Buildings/Units: רשימות ופרטים עם UX עריכה נוח.
 - [x] Task 5: Accessibility & i18n:
   - תאימות WCAG 2.1 AA, מצבי פוקוס, ARIA, ניווט מקלדת.
   - טיפול כיוון ותרגומים, מספרים/תאריכים בפורמט מקומי.
 - [x] Task 6: Visual Polish:
   - מיקרו-אנימציות, טרנזיציות עדינות, ריווח עקבי.
   - מצבי טעינה/שגיאה אחידים, Toasts להתראות.
 - [x] Task 7: Docs & Storybook:
   - Storybook לרכיבים מרכזיים, מדריך תרומות לעיצוב.

**Acceptance:** UI אחיד, נגיש ומותאם RTL; עמודים מרכזיים נראים ומתנהגים באופן מקצועי; מדדים חיוביים בשביעות רצון ובמהירות ביצוע.

## Gaps & Unimplemented Items (Detected by code review)

- [x] Settings page missing: `Sidebar` links to `/settings`, but no page exists. Create `apps/frontend/pages/settings.tsx` with profile, password, preferences.
- [x] Privacy page missing: `Footer` links to `/privacy`, but no page exists. Create `apps/frontend/pages/privacy.tsx` with policy content.
- [x] Terms page missing: `Footer` links to `/terms`, but no page exists. Create `apps/frontend/pages/terms.tsx` with terms content.
- [x] Support page missing: `Footer` links to `/support`, but no page exists. Create `apps/frontend/pages/support.tsx` with contact/help info.
- [x] Dashboard charts endpoint: Frontend calls `/api/v1/dashboard/charts`, but backend has no route. Add `GET /api/v1/dashboard/charts` returning ticketsByStatus, monthlyTrend, techWorkload.
- [x] Tickets domain mismatches: Frontend uses statuses aligned with backend (`OPEN/ASSIGNED/IN_PROGRESS/RESOLVED`). Mapping validated.
- [x] Tickets page create/view/assign flows wired: `POST /api/v1/tickets` with photos, `/tickets/[id].tsx`, assign/status update actions wired to backend.
- [x] Tech jobs: `/api/v1/work-orders/today`, start/complete endpoints implemented and UI mapped to `IN_PROGRESS/RESOLVED`.
- [x] Payments resident flow: `/api/v1/invoices/:id/pay` + receipt download implemented; UI shows result and opens receipt.
- [x] Admin unpaid invoices page: wired to `GET /api/v1/invoices/unpaid` and bulk `POST /api/v1/invoices/:id/confirm`.
- [x] Role switcher banner: אינדיקציה קבועה בעת impersonation ב-Header עם CTA "חזור למקורי".
- [x] Impersonation guard: חסימת העלאה ל-`MASTER` מאושמת ב-`AdminService`.
- [ ] Tenant isolation & RLS: לאשר שכל השאילתות נאכפות תחת RLS לכל הבקשות (כולל impersonation); להוסיף בדיקות אינטגרציה/SQL שמוודאות `SET app.tenant_id` פעיל לכל בקשה מוגנת.
- [x] Auth refresh flow: להוסיף endpoint `POST /auth/refresh` (Guard: `jwt-refresh`) ולהטמיע ב-frontend נסיון רענון שקט לפני ניתוב ל-login.
- [x] Environment config: לתעד ולאמת `NEXT_PUBLIC_API_BASE` (frontend) + סודות backend (JWT_SECRET, JWT_REFRESH_SECRET); הודעת אזהרה/Toast אם חסר בקונפיג ריצה.
- [x] Notifications security & UI:
  - לאבטח את `NotificationController` עם `JwtAuthGuard` + `Roles(Role.ADMIN, Role.PM)` ולהעביר לנתיב `api/v1/notifications`.
  - להוסיף עמוד Admin לשליחת הודעות (User/Building/All tenants) עם תבניות.
- [ ] File storage (S3/local): להגדיר `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` או מתאם קבצים מקומי לפיילוט; טיפול שגיאות העלאה והצגת Placeholder.
- [ ] Seed completeness: להוסיף חשבוניות (UNPAID/PAID/OVERDUE) ו-Work Orders לנתוני seed כדי לאכלס עמודי Payments/Jobs לפיילוט.
- [ ] Error UX: עמוד 403/Unauthorized כלל מערכת, מסכי ריק עקביים, ומחסומי הרשאות בדפים רגישים.
- [ ] i18n coverage: סקירת טקסטים קשיחים והעברתם ל-`useLocale` keys; תמיכה מלאה ב-he/en.
- [ ] Accessibility checks: WCAG 2.1 AA – תיוגי ARIA חסרים, סדרי טאב, מצבי פוקוס נראים, ניגודיות.
- [ ] Testing: כיסוי יחידה/אינטגרציה/E2E עבור:
  - impersonation + RBAC בכל הראוטים הרגישים
  - יצירת קריאה עם תמונות + הודעת סטטוס
  - קבלות תשלום (PDF) ו-webhook
  - KPIs/Charts של הדשבורד (ערכים ואגרגציות)
- [x] Deployment readiness:
  - קבצי `.env.example` לשתי האפליקציות עם הסברים.
  - הנחיות פריסה (Vercel/Render) כולל `NEXT_PUBLIC_API_BASE`.
  - בריאות/מצב (health check) ו-liveness/readiness ב-backend.
