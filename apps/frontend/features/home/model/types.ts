import type { MobilePriorityInboxItem } from '../../../components/ui/mobile-priority-inbox';
import type { HomePrimaryAction, HomeQuickAction, HomeStatusMetric, RoleKey } from '../../../components/home/shared';
import type { AdminMobileHomeData } from '../../../components/home/AdminMobileHome';
import type { PmMobileHomeData } from '../../../components/home/PmMobileHome';
import type { TechMobileHomeData } from '../../../components/home/TechMobileHome';
import type { AccountantMobileHomeData } from '../../../components/home/AccountantMobileHome';

export type { RoleKey } from '../../../components/home/shared';
export type { AdminMobileHomeData } from '../../../components/home/AdminMobileHome';
export type { PmMobileHomeData } from '../../../components/home/PmMobileHome';
export type { TechMobileHomeData } from '../../../components/home/TechMobileHome';
export type { AccountantMobileHomeData } from '../../../components/home/AccountantMobileHome';

export type ResidentHomeData = {
  statusMetrics: HomeStatusMetric[];
  primaryAction: HomePrimaryAction;
  quickActions: HomeQuickAction[];
  inboxItems: MobilePriorityInboxItem[];
};

export type HomeBlueprintState =
  | { kind: 'ADMIN'; data: AdminMobileHomeData }
  | { kind: 'PM'; data: PmMobileHomeData }
  | { kind: 'TECH'; data: TechMobileHomeData }
  | { kind: 'ACCOUNTANT'; data: AccountantMobileHomeData }
  | { kind: 'RESIDENT'; data: ResidentHomeData };

export type UserNotificationSnapshot = Array<{
  id?: number;
  read?: boolean;
  title?: string;
  createdAt?: string;
}>;

export type TicketsSnapshot = {
  summary?: {
    open?: number;
    inProgress?: number;
  };
  meta?: {
    total?: number;
  };
  riskSummary?: {
    atRisk?: number;
    dueToday?: number;
    breached?: number;
  };
  items?: Array<{
    id?: number;
    severity?: 'NORMAL' | 'HIGH' | 'URGENT';
    status?: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
    title?: string;
    buildingName?: string;
    building?: { name?: string };
    unitNumber?: string | number;
    unit?: { number?: string | number };
    createdAt?: string;
    updatedAt?: string;
    category?: string;
  }>;
};

export type MaintenanceExceptionsSnapshot = {
  summary?: {
    unverifiedMaintenance?: number;
    openWorkOrders?: number;
  };
};

export type OperationsCalendarSnapshot = {
  summary?: {
    total?: number;
  };
  items?: Array<{
    id: string;
    type: 'SCHEDULE' | 'MAINTENANCE' | 'CONTRACT' | 'INVOICE' | 'NOTICE' | 'VOTE' | 'COMPLIANCE';
    date: string;
    title: string;
    description: string;
    buildingName: string;
    priority: string;
    href?: string;
  }>;
};

export type WorkOrderSnapshot = Array<{
  id: number;
  ticket: {
    id: number;
    assignedToId?: number;
    severity: 'NORMAL' | 'HIGH' | 'URGENT';
    status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
    title?: string;
    description?: string;
  };
  dueTime?: string;
  assignedAt?: string;
  estimatedDuration?: number;
  location?: {
    building?: string;
    address?: string;
    floor?: number;
  };
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
}>;

export type BuildingSnapshot = Array<{
  id: number;
  name: string;
  status?: string;
}>;

export type ResidentRequestsSnapshot = Array<{
  requestKey: string;
  subject: string;
  requestType: string;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CLOSED';
  statusNotes?: string | null;
}>;

export type InvoiceSummarySnapshot = {
  summary?: {
    currentBalance?: number;
    unpaidInvoices?: number;
    overdueInvoices?: number;
    openTickets?: number;
    unreadNotifications?: number;
    dueDate?: string;
  };
  tickets?: Array<{
    id?: number;
    title?: string;
    status?: string;
    updatedAt?: string;
  }>;
};

export type InvoiceRow = {
  id: number;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate: string;
  createdAt: string;
  buildingName?: string | null;
  residentName?: string;
  collectionStatus?: string;
  reminderState?: string;
  promiseToPayDate?: string | null;
};

export type CollectionsSummary = {
  totals: {
    invoiceCount: number;
    unpaidCount: number;
    overdueCount: number;
    outstandingBalance: number;
    delinquencyRate: number;
    billedThisMonth: number;
    collectedThisMonth: number;
  };
  topDebtors: Array<{
    residentId: number;
    residentName: string;
    buildingName: string | null;
    amount: number;
    overdueCount: number;
    promiseToPayDate: string | null;
  }>;
  followUps: Array<{
    invoiceId: number;
    residentId: number;
    residentName: string;
    buildingName: string | null;
    collectionStatus: string;
    reminderState: string;
    promiseToPayDate: string | null;
    lastReminderAt: string | null;
    collectionNotes: string | null;
  }>;
};

export type BudgetSnapshot = Array<{
  id: number;
  name: string;
  amount: number;
  actualSpent: number;
  variance: number;
  alertLevel?: 'normal' | 'warning' | 'critical';
}>;
