export const InvoiceStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const CollectionStatus = {
  CURRENT: 'CURRENT',
  PAST_DUE: 'PAST_DUE',
  IN_COLLECTIONS: 'IN_COLLECTIONS',
  PROMISE_TO_PAY: 'PROMISE_TO_PAY',
  RESOLVED: 'RESOLVED',
} as const;

export type CollectionStatus = (typeof CollectionStatus)[keyof typeof CollectionStatus];

export const ReminderState = {
  NONE: 'NONE',
  UPCOMING: 'UPCOMING',
  SENT: 'SENT',
  PROMISED: 'PROMISED',
  ESCALATED: 'ESCALATED',
} as const;

export type ReminderState = (typeof ReminderState)[keyof typeof ReminderState];

const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  PENDING: 'ממתין',
  PAID: 'שולם',
  OVERDUE: 'פיגור',
};

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  return INVOICE_STATUS_LABEL[status] ?? status;
}

const INVOICE_STATUS_TONE: Record<InvoiceStatus, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
};

export function getInvoiceStatusTone(status: InvoiceStatus): 'warning' | 'success' | 'danger' {
  return INVOICE_STATUS_TONE[status] ?? 'warning';
}

const COLLECTION_STATUS_LABEL: Record<CollectionStatus, string> = {
  CURRENT: 'שוטף',
  PAST_DUE: 'חוב',
  IN_COLLECTIONS: 'בגבייה',
  PROMISE_TO_PAY: 'הבטחה לתשלום',
  RESOLVED: 'נפתר',
};

export function getCollectionStatusLabel(status: CollectionStatus): string {
  return COLLECTION_STATUS_LABEL[status] ?? status;
}
