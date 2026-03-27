/**
 * Standardized status enum maps with Hebrew translations.
 * 
 * These provide a single source of truth for status values and their
 * display labels across the API. Frontend can use these directly or
 * map them through i18n.
 */

export const TicketStatusMap = {
  OPEN: { key: 'OPEN', label: 'פתוחה', labelEn: 'Open' },
  ASSIGNED: { key: 'ASSIGNED', label: 'שויכה', labelEn: 'Assigned' },
  IN_PROGRESS: { key: 'IN_PROGRESS', label: 'בטיפול', labelEn: 'In Progress' },
  RESOLVED: { key: 'RESOLVED', label: 'נפתרה', labelEn: 'Resolved' },
} as const;

export const TicketSeverityMap = {
  NORMAL: { key: 'NORMAL', label: 'רגיל', labelEn: 'Normal', rank: 1 },
  HIGH: { key: 'HIGH', label: 'גבוה', labelEn: 'High', rank: 2 },
  URGENT: { key: 'URGENT', label: 'דחוף', labelEn: 'Urgent', rank: 3 },
} as const;

export const InvoiceStatusMap = {
  PENDING: { key: 'PENDING', label: 'ממתין', labelEn: 'Pending' },
  PAID: { key: 'PAID', label: 'שולם', labelEn: 'Paid' },
  OVERDUE: { key: 'OVERDUE', label: 'פיגור', labelEn: 'Overdue' },
} as const;

export const CollectionStatusMap = {
  CURRENT: { key: 'CURRENT', label: 'שוטף', labelEn: 'Current' },
  PAST_DUE: { key: 'PAST_DUE', label: 'חוב', labelEn: 'Past Due' },
  IN_COLLECTIONS: { key: 'IN_COLLECTIONS', label: 'בגבייה', labelEn: 'In Collections' },
  PROMISE_TO_PAY: { key: 'PROMISE_TO_PAY', label: 'הבטחה לתשלום', labelEn: 'Promise to Pay' },
  RESOLVED: { key: 'RESOLVED', label: 'נפתר', labelEn: 'Resolved' },
} as const;

export const ReminderStateMap = {
  NONE: { key: 'NONE', label: 'ללא', labelEn: 'None' },
  UPCOMING: { key: 'UPCOMING', label: 'מתקרב', labelEn: 'Upcoming' },
  SENT: { key: 'SENT', label: 'נשלח', labelEn: 'Sent' },
  PROMISED: { key: 'PROMISED', label: 'הובטח', labelEn: 'Promised' },
  ESCALATED: { key: 'ESCALATED', label: 'הוסלם', labelEn: 'Escalated' },
} as const;

export const MaintenanceStatusMap = {
  PENDING: { key: 'PENDING', label: 'ממתין', labelEn: 'Pending' },
  SCHEDULED: { key: 'SCHEDULED', label: 'מתוזמן', labelEn: 'Scheduled' },
  IN_PROGRESS: { key: 'IN_PROGRESS', label: 'בביצוע', labelEn: 'In Progress' },
  COMPLETED: { key: 'COMPLETED', label: 'הושלם', labelEn: 'Completed' },
  OVERDUE: { key: 'OVERDUE', label: 'באיחור', labelEn: 'Overdue' },
} as const;

export const WorkOrderStatusMap = {
  PENDING: { key: 'PENDING', label: 'ממתין', labelEn: 'Pending' },
  APPROVED: { key: 'APPROVED', label: 'אושר', labelEn: 'Approved' },
  IN_PROGRESS: { key: 'IN_PROGRESS', label: 'בתהליך', labelEn: 'In Progress' },
  COMPLETED: { key: 'COMPLETED', label: 'הושלם', labelEn: 'Completed' },
  INVOICED: { key: 'INVOICED', label: 'חשבונית', labelEn: 'Invoiced' },
} as const;

export const BudgetStatusMap = {
  PLANNED: { key: 'PLANNED', label: 'מתוכנן', labelEn: 'Planned' },
  ACTIVE: { key: 'ACTIVE', label: 'פעיל', labelEn: 'Active' },
  CLOSED: { key: 'CLOSED', label: 'סגור', labelEn: 'Closed' },
} as const;

export const ResidentRequestStatusMap = {
  SUBMITTED: { key: 'SUBMITTED', label: 'הוגשה', labelEn: 'Submitted' },
  IN_REVIEW: { key: 'IN_REVIEW', label: 'בסקירה', labelEn: 'In Review' },
  COMPLETED: { key: 'COMPLETED', label: 'הושלמה', labelEn: 'Completed' },
  CLOSED: { key: 'CLOSED', label: 'נסגרה', labelEn: 'Closed' },
} as const;

export const ScheduleStatusMap = {
  DRAFT: { key: 'DRAFT', label: 'טיוטה', labelEn: 'Draft' },
  PUBLISHED: { key: 'PUBLISHED', label: 'פורסם', labelEn: 'Published' },
  IN_PROGRESS: { key: 'IN_PROGRESS', label: 'בביצוע', labelEn: 'In Progress' },
  COMPLETED: { key: 'COMPLETED', label: 'הושלם', labelEn: 'Completed' },
  CANCELLED: { key: 'CANCELLED', label: 'בוטל', labelEn: 'Cancelled' },
} as const;

export function getStatusLabel(statusMap: Record<string, { label: string }>, status: string): string {
  return statusMap[status]?.label ?? status;
}

export function getStatusLabelEn(statusMap: Record<string, { labelEn: string }>, status: string): string {
  return statusMap[status]?.labelEn ?? status;
}
