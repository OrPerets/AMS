export const MaintenanceStatus = {
  PENDING: 'PENDING',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  VERIFIED: 'VERIFIED',
  OVERDUE: 'OVERDUE',
} as const;

export type MaintenanceStatus = (typeof MaintenanceStatus)[keyof typeof MaintenanceStatus];

export const WorkOrderStatus = {
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
} as const;

export type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];

const MAINTENANCE_STATUS_LABEL: Record<MaintenanceStatus, string> = {
  PENDING: 'ממתין',
  SCHEDULED: 'מתוזמן',
  IN_PROGRESS: 'בביצוע',
  COMPLETED: 'הושלם',
  VERIFIED: 'אומת',
  OVERDUE: 'באיחור',
};

export function getMaintenanceStatusLabel(status: MaintenanceStatus): string {
  return MAINTENANCE_STATUS_LABEL[status] ?? status;
}

const MAINTENANCE_STATUS_TONE: Record<MaintenanceStatus, 'warning' | 'active' | 'success' | 'danger'> = {
  PENDING: 'warning',
  SCHEDULED: 'active',
  IN_PROGRESS: 'active',
  COMPLETED: 'success',
  VERIFIED: 'success',
  OVERDUE: 'danger',
};

export function getMaintenanceStatusTone(status: MaintenanceStatus): 'warning' | 'active' | 'success' | 'danger' {
  return MAINTENANCE_STATUS_TONE[status] ?? 'active';
}

const WORK_ORDER_STATUS_LABEL: Record<WorkOrderStatus, string> = {
  ASSIGNED: 'מוכן להתחלה',
  IN_PROGRESS: 'בתהליך',
  RESOLVED: 'הושלם',
};

export function getWorkOrderStatusLabel(status: WorkOrderStatus): string {
  return WORK_ORDER_STATUS_LABEL[status] ?? status;
}
