import type {
  BudgetStatus,
  CodeType,
  ExpenseCategory,
  GardensPlanStatus,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceType,
  Priority,
  ScheduleStatus,
  TaskStatus,
  TaskType,
  TicketSeverity,
  TicketStatus,
  VoteType,
  WorkOrderStatus,
} from '@prisma/client';

export const BUDGET_STATUSES = ['PLANNED', 'ACTIVE', 'CLOSED'] as const satisfies readonly BudgetStatus[];
export const CODE_TYPES = ['ENTRANCE', 'SERVICE', 'ELEVATOR', 'GATE', 'PARKING', 'WIFI', 'ALARM', 'OTHER'] as const satisfies readonly CodeType[];
export const EXPENSE_CATEGORIES = ['MAINTENANCE', 'UTILITIES', 'STAFF', 'ADMINISTRATION', 'OTHER'] as const satisfies readonly ExpenseCategory[];
export const GARDENS_PLAN_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'NEEDS_CHANGES'] as const satisfies readonly GardensPlanStatus[];
export const MAINTENANCE_CATEGORIES = ['GENERAL', 'HVAC', 'ELECTRICAL', 'PLUMBING', 'SAFETY', 'LANDSCAPING', 'ELEVATORS'] as const satisfies readonly MaintenanceCategory[];
export const MAINTENANCE_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const satisfies readonly MaintenancePriority[];
export const MAINTENANCE_TYPES = ['PREVENTIVE', 'INSPECTION', 'CORRECTIVE', 'EMERGENCY'] as const satisfies readonly MaintenanceType[];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const satisfies readonly Priority[];
export const SCHEDULE_STATUSES = ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const satisfies readonly ScheduleStatus[];
export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED'] as const satisfies readonly TaskStatus[];
export const TASK_TYPES = ['MAINTENANCE', 'INSPECTION', 'REPAIR', 'CLEANING', 'EMERGENCY', 'MEETING', 'OTHER'] as const satisfies readonly TaskType[];
export const TICKET_SEVERITIES = ['NORMAL', 'HIGH', 'URGENT'] as const satisfies readonly TicketSeverity[];
export const TICKET_STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] as const satisfies readonly TicketStatus[];
export const VOTE_TYPES = ['YES_NO', 'MULTIPLE_CHOICE', 'RATING'] as const satisfies readonly VoteType[];
export const WORK_ORDER_STATUSES = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'INVOICED'] as const satisfies readonly WorkOrderStatus[];
