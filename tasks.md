# AMS Remaining Tasks

Updated: 2026-03-08

This file tracks the main work still left before AMS is pilot-ready for broader use at עמית אחזקות.

## 1. Approval Workflows

Status: Done on 2026-03-08

- [x] Add approval-task entities and API for expense approvals, work-order approvals, budget overruns, document deletion, and resident balance adjustments.
- [x] Enforce approval gates in backend logic so restricted actions cannot bypass policy checks.
- [x] Add PM/Admin UI for pending approvals, decisions, comments, and audit history.
- [x] Add notifications for approval requested, approved, and rejected states.

## 2. Data Quality And Controls

Status: Done on 2026-03-08

- [x] Add duplicate detection for residents, units, suppliers, and contact details.
- [x] Add completeness checks for required building, unit, contract, and supplier fields.
- [x] Add invalid document-link detection and missing compliance-document alerts.
- [x] Add manager-facing data quality dashboard with actionable exceptions.

## 3. Resident Experience

Status: Done on 2026-03-08

- [x] Expand resident self-service beyond generic requests:
- [x] Moving notice form
- [x] Parking request form
- [x] Document request form with category
- [x] Contact-details update form
- [x] Add resident request history filters and status tracking.
- [x] Add resident downloads for statements, receipts, and shared documents from one account area.

## 4. Communications

Status: Done on 2026-03-08

- [x] Strengthen announcement targeting UI for entrance, floor, unit, owner vs tenant, and urgency presets.
- [x] Add announcement history, recipient preview, and delivery summary.
- [x] Add document/decision publishing flow for meeting summaries, signed protocols, regulations, and committee decisions.
- [x] Add resident notification preferences management for in-app behavior.

## 5. Vendors, Contracts, And Calendar

Status: Done on 2026-03-08

- [x] Add edit/update flows for vendors and contracts, not just create/list.
- [x] Add vendor compliance reminders for insurance and document expiry.
- [x] Add contract renewal reminder jobs and overdue renewal alerts.
- [x] Expand operations calendar with filters, status views, and quick links back to contracts, maintenance, and schedules.

## 6. Finance And Collections

- [ ] Add export flows for ledger statements, unpaid balances, invoice lists, maintenance history, vendors, and contract renewals.
- [ ] Add aging and arrears dashboards with top debtors, delinquency rate, and monthly billed vs collected views.
- [ ] Add promise-to-pay workflow UI and reminder follow-up timeline.
- [ ] Add budget threshold alerts tied to approval rules.

## 7. Asset And Maintenance Controls

- [ ] Add asset lifecycle indicators: warranty alerts, replacement recommendation flag, and inventory verification workflow.
- [ ] Add maintenance cost rollups by asset.
- [ ] Add manager exceptions for unverified maintenance and overdue high-severity work.

## 8. Admin And Security

- [ ] Harden the permissions matrix across backend endpoints and frontend navigation.
- [ ] Verify that resident, accountant, PM, admin, and master roles only see allowed data and actions.
- [ ] Add more audit coverage for impersonation, building-code changes, permission changes, and sensitive exports.

## 9. QA And Verification

- [ ] Finish Sprint 7 verification for budgets, financial reports, exports, and analytics pages.
- [ ] Finish Sprint 8 verification for communications, documents, and notifications pages.
- [ ] Finish Sprint 9 verification for admin pages, unpaid invoices, settings, support, privacy, terms, and jobs pages.
- [ ] Run Sprint 10 end-to-end integration checks, including file uploads and mobile responsiveness.
- [ ] Run Sprint 11 performance, authorization, validation, and error-handling checks.
- [ ] Run Sprint 12 production-mode verification and deployment checklist.

## 10. Nice-To-Have After Pilot

- [ ] Live accounting sync
- [ ] Expanded payment-provider automation
- [ ] Advanced BI and forecasting
- [ ] Mobile app
- [ ] Complex automation rules engine
- [ ] Public tenant onboarding and registration
