import { addMonths, format } from 'date-fns';

export function getNextMonthLabel() {
  return format(addMonths(new Date(), 1), 'yyyy-MM');
}

export function getStatusTone(status: string): 'neutral' | 'active' | 'success' | 'warning' {
  switch (status) {
    case 'SUBMITTED':
      return 'active';
    case 'APPROVED':
      return 'success';
    case 'NEEDS_CHANGES':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'SUBMITTED':
      return 'ממתין לאישור';
    case 'APPROVED':
      return 'אושר';
    case 'NEEDS_CHANGES':
      return 'הוחזר לתיקון';
    default:
      return 'טיוטה';
  }
}
