export const TicketStatus = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketSeverity = {
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TicketSeverity = (typeof TicketSeverity)[keyof typeof TicketSeverity];

const SEVERITY_RANK: Record<TicketSeverity, number> = {
  URGENT: 3,
  HIGH: 2,
  NORMAL: 1,
};

export function severityRank(severity: TicketSeverity): number {
  return SEVERITY_RANK[severity] ?? 1;
}

export function getSeverityLabel(severity: TicketSeverity): string {
  switch (severity) {
    case 'URGENT':
      return '🔴 דחוף';
    case 'HIGH':
      return '🟡 גבוה';
    default:
      return '🔵 רגיל';
  }
}

export function getSeverityTone(severity: TicketSeverity): 'danger' | 'warning' | 'active' {
  switch (severity) {
    case 'URGENT':
      return 'danger';
    case 'HIGH':
      return 'warning';
    default:
      return 'active';
  }
}

const STATUS_LABEL_MAP: Record<TicketStatus, string> = {
  OPEN: 'פתוחה',
  ASSIGNED: 'שויכה',
  IN_PROGRESS: 'בטיפול',
  RESOLVED: 'נפתרה',
};

export function getTicketStatusLabel(status: TicketStatus): string {
  return STATUS_LABEL_MAP[status] ?? status;
}

const STATUS_TONE_MAP: Record<TicketStatus, 'warning' | 'active' | 'success'> = {
  OPEN: 'warning',
  ASSIGNED: 'active',
  IN_PROGRESS: 'active',
  RESOLVED: 'success',
};

export function getTicketStatusTone(status: TicketStatus): 'warning' | 'active' | 'success' {
  return STATUS_TONE_MAP[status] ?? 'active';
}
