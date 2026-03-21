export interface DashboardResponse {
  filters: {
    selectedBuildingId: number | null;
    range: string;
    rangeLabel: string;
    buildings: Array<{ id: number; name: string }>;
  };
  portfolioKpis: {
    openTickets: number;
    urgentTickets: number;
    slaBreaches: number;
    unpaidBalance: number;
    overdueInvoices: number;
    occupiedUnits: number;
    vacantUnits: number;
    resolvedToday: number;
    resolvedInRange: number;
    createdInRange: number;
  };
  attentionItems: Array<{
    id: string;
    tone: 'danger' | 'warning' | 'calm';
    title: string;
    value: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  }>;
  ticketTrends: {
    ticketsByStatus: Record<string, number>;
    monthlyTrend: Array<{ month: string; count: number }>;
    buildingLoad: Array<{
      buildingId: number;
      buildingName: string;
      openTickets: number;
      urgentTickets: number;
      inProgressTickets: number;
      slaBreaches: number;
    }>;
  };
  collectionsSummary: {
    unpaidBalance: number;
    overdueInvoices: number;
    pendingInvoices: number;
    topDebtors: Array<{
      residentId: number;
      residentName: string;
      amount: number;
      overdueCount: number;
    }>;
  };
  maintenanceSummary: {
    overdue: number;
    dueToday: number;
    dueInRange: number;
    upcoming: Array<{
      id: number;
      title: string;
      priority: string;
      nextOccurrence: string | null;
      buildingName: string;
      assignedTo: string | null;
    }>;
  };
  recentNotifications: Array<{
    id: number;
    title: string;
    message: string;
    type: string | null;
    read: boolean;
    createdAt: string;
    buildingName: string | null;
  }>;
  buildingRiskList: Array<{
    buildingId: number;
    buildingName: string;
    address: string;
    managerName: string | null;
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    openTickets: number;
    urgentTickets: number;
    inProgressTickets: number;
    slaBreaches: number;
    unpaidAmount: number;
    overdueInvoices: number;
    upcomingMaintenance: number;
    complianceExpiries: number;
    lastManagerActivity: string | null;
    riskScore: number;
  }>;
  systemAdmin: {
    stats: {
      totalUsers: number;
      totalBuildings: number;
      openTickets: number;
      unpaidInvoices: number;
      activeTechs: number;
      activeUsersInRange: number;
      activityEventsInRange: number;
      pendingApprovals: number;
    };
    health: Record<
      string,
      {
        status: 'healthy' | 'warning' | 'critical';
        label: string;
        value: string;
        description: string;
      }
    >;
    roleCounts: Record<string, number>;
    users: Array<{
      id: number;
      email: string;
      role: string;
      tenantId: number;
      phone?: string | null;
      createdAt: string;
    }>;
    recentImpersonationEvents: Array<{
      id: number;
      action: string;
      targetRole?: string | null;
      reason?: string | null;
      createdAt: string;
    }>;
    techWorkload: Array<{
      techId: number;
      email: string;
      assignedOpenTickets: number;
      urgentOpenTickets: number;
      slaBreaches: number;
      loadBand: 'balanced' | 'busy' | 'critical';
    }>;
    bottlenecks: Array<{
      id: string;
      title: string;
      count: number;
      tone: 'danger' | 'warning' | 'calm';
      description: string;
      href: string;
    }>;
  };
}
