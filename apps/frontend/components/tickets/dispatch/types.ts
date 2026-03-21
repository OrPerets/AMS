export type QueueKey = 'TRIAGE' | 'UNASSIGNED' | 'SLA_RISK' | 'ACTIVE' | 'RESOLVED_RECENT';

export interface DispatchTicket {
  id: number;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  severity: 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: string;
  latestActivityAt: string;
  title: string;
  description: string;
  category: string;
  residentContact: string | null;
  residentName: string;
  building: {
    id: number;
    name: string;
  };
  unit: {
    id: number;
    number: string;
  };
  assignedTo: {
    id: number;
    email: string;
  } | null;
  commentCount: number;
  photoCount: number;
  hasPhotos: boolean;
  photos: string[];
  slaDue: string | null;
  slaState: 'NONE' | 'ON_TRACK' | 'AT_RISK' | 'DUE_TODAY' | 'BREACHED';
  workOrders: Array<{
    id: number;
    status: string;
    supplierName: string;
  }>;
  comments: Array<{
    id: number;
    content: string;
    createdAt: string;
    author: string;
    role: string | null;
  }>;
}

export interface DispatchResponse {
  items: DispatchTicket[];
  queueCounts: Record<QueueKey, number>;
  summary: {
    open: number;
    unassigned: number;
    inProgress: number;
    dueToday: number;
    breached: number;
    resolvedToday: number;
  };
  filterOptions: {
    buildings: Array<{ id: number; name: string }>;
    assignees: Array<{ id: number; email: string }>;
    categories: string[];
  };
  workload: Array<{
    technicianId: number;
    technicianEmail: string;
    activeCount: number;
    riskCount: number;
    breachedCount: number;
    urgentCount: number;
    lastActivityAt: string | null;
  }>;
  riskSummary: {
    triage: number;
    unassigned: number;
    atRisk: number;
    dueToday: number;
    breached: number;
  };
  meta: {
    total: number;
  };
}

export interface BuildingOption {
  id: number;
  name: string;
}

export interface UnitOption {
  id: number;
  number: string;
  floor: number | null;
}

export interface TechnicianOption {
  id: number;
  email: string;
  phone: string | null;
  supplier?: {
    id: number;
    name: string;
    skills: string[];
    rating: number | null;
  } | null;
}

export interface VendorOption {
  id: number;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  skills: string[];
  rating?: number | null;
  isActive: boolean;
}

export interface SmartTriagePreview {
  summary: string;
  category: string;
  severity: 'NORMAL' | 'HIGH' | 'URGENT';
  reasons: string[];
  draftResponse: string;
  suggestedAssignee: {
    id: number;
    email: string;
    score: number;
    reason: string;
  } | null;
  confidence: number;
}

export interface DispatchFilters {
  queue: QueueKey;
  search: string;
  buildingFilter: string;
  assigneeFilter: string;
  statusFilter: string;
  severityFilter: string;
  slaFilter: string;
  categoryFilter: string;
  sort: string;
}

export interface DispatchPreset {
  id: string;
  name: string;
  filters: DispatchFilters;
  builtin?: boolean;
}
