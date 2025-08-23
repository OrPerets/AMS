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

## Sprint Plan 

- **Sprint 0**: Repo setup (monorepo, Next.js + NestJS, auth base, DB seed).
- **Sprint 1**: Tickets module (end-to-end).
- **Sprint 2**: Payments basic flow.
- **Sprint 3**: Dashboard + Notifications.
- **Sprint 4**: Hardening (NFRs, polish, MFA, backups).

