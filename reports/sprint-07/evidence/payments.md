# Sprint 7 Payments Evidence

- Verified seeded finance user: `finance@demo.com / password123`.
- Verified invoice listing via `GET /api/v1/invoices` returns payment status, payment history, receipt metadata, and overdue detection.
- Verified payment processing via `POST /api/v1/invoices/1/settle`.
- Verified receipt/export access via `GET /api/v1/invoices/:id/receipt` and CSV export via `GET /api/v1/invoices/unpaid?format=csv`.

## API checks

### Invoice list

`GET /api/v1/invoices`

Key response fields observed:

- `id: 1`
- `status: "PENDING"` before settlement
- `id: 2`
- `status: "OVERDUE"`
- `id: 3`
- `status: "PAID"`
- `history[0].status: "SUCCEEDED"`
- `receiptNumber: "REC-3"`

### Payment settlement

`POST /api/v1/invoices/1/settle`

Key response fields observed after settlement:

- `id: 1`
- `status: "PAID"`
- `paymentMethod: "manual"`
- `receiptNumber: "REC-1"`
- `history[0].kind: "PAYMENT"`
- `history[0].status: "SUCCEEDED"`

## Result

- Payment list displays real statuses.
- Payment processing updates invoice state.
- Receipt generation is available after payment.
- Payment history is exposed to the frontend.
