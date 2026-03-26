export const CalendarEventType = {
  SCHEDULE: 'SCHEDULE',
  MAINTENANCE: 'MAINTENANCE',
  CONTRACT: 'CONTRACT',
  INVOICE: 'INVOICE',
  NOTICE: 'NOTICE',
  VOTE: 'VOTE',
  COMPLIANCE: 'COMPLIANCE',
} as const;

export type CalendarEventType = (typeof CalendarEventType)[keyof typeof CalendarEventType];

const EVENT_TYPE_LABEL: Record<CalendarEventType, string> = {
  SCHEDULE: 'לוח זמנים',
  MAINTENANCE: 'תחזוקה',
  CONTRACT: 'חוזה',
  INVOICE: 'חשבונית',
  NOTICE: 'הודעה',
  VOTE: 'הצבעה',
  COMPLIANCE: 'רגולציה',
};

export function getCalendarEventTypeLabel(type: CalendarEventType): string {
  return EVENT_TYPE_LABEL[type] ?? type;
}
