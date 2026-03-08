# Payments Implementation Plan (Tasks 1–5)

This document converts Tasks 1–5 into actionable engineering work with explicit TODO checklists.

---

## Task 1 — Implement production-grade payment provider integration with real authorization/capture status

### Goal
Replace placeholder/sandbox payment provider behavior with real provider API calls and real payment state transitions.

### Scope
- `apps/backend/src/payments/tranzila.provider.ts`
- `apps/backend/src/payments/payment.service.ts`
- Environment variables (`.env`, deployment secrets)

### Detailed instructions
1. **Define provider config contract**
   - Add strongly typed config accessors for provider credentials and endpoints.
   - Include mode separation (`sandbox` vs `production`).

2. **Implement real `createPayment`**
   - Send charge/checkout-init request to provider API.
   - Include amount, currency, invoice reference, resident metadata, return URLs.
   - Parse and return:
     - `providerIntentId`
     - `redirectUrl` or `clientSecret`
     - action requirement (`requiresAction`)
   - Persist full raw response (sanitized) for troubleshooting.

3. **Implement real `confirm` and `retrieve`**
   - Confirm payment by provider intent/transaction ID.
   - Retrieve authoritative status from provider.
   - Map provider statuses to internal statuses:
     - `requires_payment_method`
     - `requires_action`
     - `processing`
     - `succeeded`
     - `failed` / `canceled`

4. **Implement real `refund`**
   - Call provider refund API with full/partial amount.
   - Save provider refund identifier and response payload.

5. **Update payment lifecycle orchestration**
   - In `PaymentService`, only mark invoice PAID when provider status is definitively successful.
   - Do not auto-succeed without provider verification.
   - Add safe retry behavior for temporary provider failures.

6. **Logging & observability**
   - Structured logs with correlation IDs (`invoiceId`, `intentId`, `providerIntentId`).
   - Redact secrets and PCI-sensitive fields.

### TODO checklist
- [ ] Add provider env vars and config validation (startup fail if missing).
- [ ] Replace placeholder URL construction in `createPayment` with real API call.
- [ ] Implement status mapping utility (`provider -> PaymentIntentStatus`).
- [ ] Wire `confirm` and `retrieve` to real provider endpoints.
- [ ] Wire `refund` to real endpoint and persist refund IDs.
- [ ] Ensure `confirmPayment` updates invoice only after verified success.
- [ ] Add integration tests for success, action-required, failure, and timeout paths.

---

## Task 2 — Harden payment webhook verification before invoice settlement

### Goal
Process only authenticated, idempotent webhook events and prevent forged settlement actions.

### Scope
- `apps/backend/src/payments/payment.controller.ts`
- `apps/backend/src/payments/payment.service.ts`
- Payment webhook persistence model/table (if not already present)

### Detailed instructions
1. **Require signature verification**
   - Read provider signature header(s).
   - Validate signature against raw request body and webhook secret.
   - Reject invalid/missing signatures with `401/400`.

2. **Enforce idempotency**
   - Store each verified webhook event by `(provider, eventId)` unique key.
   - Ignore duplicate events (return 200 but no repeated side effects).

3. **Event type allowlist**
   - Accept only known event types (e.g., payment succeeded/failed/refunded).
   - Log and safely ignore unknown event types.

4. **Safe state transitions**
   - Move intent/invoice states based on event type and current state machine.
   - Prevent invalid transitions (e.g., already refunded -> paid).

5. **Audit trail**
   - Persist full event metadata (sanitized), timestamps, processing outcome.

### TODO checklist
- [ ] Add raw-body webhook handling middleware if provider signature requires raw payload.
- [ ] Validate signature before any business logic.
- [ ] Persist webhook event with unique `(provider, eventId)` constraint.
- [ ] Implement duplicate detection and no-op behavior.
- [ ] Implement event-type allowlist and transition handler.
- [ ] Add tests for valid signature, invalid signature, duplicate delivery, unknown event.

---

## Task 3 — Add resident-facing credit-card payment action and hosted checkout return flow

### Goal
Enable residents to pay unpaid invoices via card from the resident account page with clear success/failure UX.

### Scope
- `apps/frontend/pages/resident/account.tsx`
- Existing endpoints:
  - `POST /api/v1/invoices/:id/pay`
  - `POST /api/v1/payments/intents`
  - `GET /api/v1/payments/:id`

### Detailed instructions
1. **Add “Pay now” CTA for eligible invoices**
   - Show for unpaid/overdue invoices.
   - Disable while request is in progress.

2. **Initiate payment intent**
   - Call backend endpoint and receive redirect URL/client secret.
   - If redirect flow: navigate browser to provider-hosted checkout.
   - If embedded flow: open card form with secure provider SDK.

3. **Handle return/callback states**
   - Parse callback query params after return from provider.
   - Re-fetch payment intent/invoice status.
   - Display success, pending, failed states with actionable next steps.

4. **Retry and resilience**
   - Allow retry on failed intents.
   - Prevent duplicate submissions with request lock.

5. **Resident transparency**
   - Show amount, invoice ID, payment attempt timestamp, current status.
   - Show receipt link once payment is completed.

### TODO checklist
- [ ] Add `Pay now` button in resident invoice card/table.
- [ ] Implement `initiatePayment(invoiceId)` client action.
- [ ] Handle redirect/client-secret branches.
- [ ] Add callback handling and status refresh logic.
- [ ] Add status banners/toasts for success/failure/pending.
- [ ] Add retry flow for failed attempts.
- [ ] Add frontend tests for button visibility and payment state transitions.

---

## Task 4 — Introduce multi-provider routing and fee economics tracking per payment intent

### Goal
Support provider routing strategy and capture true payment economics (gross, fees, net) for optimization and reporting.

### Scope
- `apps/backend/src/payments/payment.service.ts`
- `apps/backend/src/payments/providers/payment-provider.ts`
- Prisma schema (`PaymentIntent`, related ledgers/settlements)

### Detailed instructions
1. **Provider routing strategy**
   - Add routing policy module:
     - by card type (debit/credit/commercial)
     - by amount bands
     - by BIN/country
     - fallback provider on soft decline/timeouts

2. **Persist economics fields**
   - Add fields (if missing):
     - `grossAmount`
     - `providerFeeEstimated`
     - `providerFeeActual`
     - `netAmount`
     - `settlementBatchId`
     - `providerLatencyMs`

3. **Track both estimate and reconciliation**
   - Estimate fees at intent creation.
   - Update with actual settlement/fee data after provider payout reports.

4. **Routing observability**
   - Log route decision reason and fallback path.
   - Add dashboard metrics for approval rate and cost per provider.

### TODO checklist
- [ ] Create routing strategy abstraction and config toggles.
- [ ] Add at least one additional provider implementation beyond current default.
- [ ] Extend schema/migrations for fee and net tracking fields.
- [ ] Write intent creation logic to store chosen provider + fee estimate.
- [ ] Add reconciliation job/process to update actual fee/net values.
- [ ] Add reporting endpoint or export showing provider-level economics.
- [ ] Add tests for provider failover and fee field persistence.

---

## Task 5 — Enable tokenized card-on-file and autopay for recurring resident invoices

### Goal
Allow residents to save tokenized cards and auto-charge recurring invoices securely.

### Scope
- `apps/backend/prisma/schema.prisma` (`PaymentMethod`, recurring invoice linkage)
- `apps/backend/src/payments/payment.service.ts`
- Resident settings/account APIs + frontend settings UI

### Detailed instructions
1. **Card-on-file data model**
   - Store tokenized reference only (never PAN/CVV).
   - Store brand, last4, expiry month/year, network token indicator, default flag.

2. **Resident payment method management APIs**
   - Add endpoints for:
     - add payment method (tokenized setup flow)
     - list methods
     - set default
     - remove method

3. **Autopay preferences**
   - Resident-level toggle: autopay enabled/disabled.
   - Per-recurring-invoice override where needed.
   - Define retry schedule and dunning rules.

4. **Recurring charge execution**
   - On due recurring invoice generation, auto-create payment intent.
   - Attempt charge with default tokenized method.
   - On success: close invoice + generate receipt.
   - On failure: mark actionable state + notify resident + schedule retry.

5. **Compliance and risk controls**
   - Ensure SAQ-A/A-EP compatible architecture (depending on integration mode).
   - Add consent records and clear cancellation logic for autopay.

### TODO checklist
- [ ] Extend `PaymentMethod` metadata as needed (brand, last4, expiry, default).
- [ ] Implement payment-method CRUD endpoints for residents.
- [ ] Add resident UI to manage saved cards and default method.
- [ ] Add autopay preference fields + API.
- [ ] Integrate autopay into recurring invoice run pipeline.
- [ ] Add notifications for charge success/failure and retry schedule.
- [ ] Add tests for token lifecycle, default switching, and autopay failure recovery.

---

## Suggested implementation order
1. Task 2 (webhook security + idempotency)
2. Task 1 (real provider integration)
3. Task 3 (resident pay UX)
4. Task 4 (routing + economics)
5. Task 5 (card-on-file + autopay)

This order minimizes payment-risk exposure first, then enables resident experience and margin optimization.
