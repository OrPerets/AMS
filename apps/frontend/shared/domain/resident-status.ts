export const ResidentRequestStatus = {
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
} as const;

export type ResidentRequestStatus = (typeof ResidentRequestStatus)[keyof typeof ResidentRequestStatus];

const REQUEST_STATUS_LABEL: Record<ResidentRequestStatus, string> = {
  SUBMITTED: 'הוגשה',
  IN_REVIEW: 'בסקירה',
  COMPLETED: 'הושלמה',
  CLOSED: 'נסגרה',
};

export function getResidentRequestStatusLabel(status: ResidentRequestStatus): string {
  return REQUEST_STATUS_LABEL[status] ?? status;
}

const REQUEST_STATUS_TONE: Record<ResidentRequestStatus, 'warning' | 'active' | 'success'> = {
  SUBMITTED: 'warning',
  IN_REVIEW: 'active',
  COMPLETED: 'success',
  CLOSED: 'success',
};

export function getResidentRequestStatusTone(status: ResidentRequestStatus): 'warning' | 'active' | 'success' {
  return REQUEST_STATUS_TONE[status] ?? 'active';
}
