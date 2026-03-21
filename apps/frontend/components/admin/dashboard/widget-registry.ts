export type AdminDashboardWidgetId =
  | 'hero'
  | 'portfolio-kpis'
  | 'attention-items'
  | 'building-load'
  | 'maintenance-window'
  | 'notifications'
  | 'tech-workload'
  | 'bottlenecks'
  | 'building-risk'
  | 'collections'
  | 'system-health'
  | 'role-distribution';

export type DashboardWidgetDefinition = {
  id: AdminDashboardWidgetId;
  title: string;
  description: string;
  group: 'overview' | 'operations' | 'risk' | 'system';
  defaultVisible: boolean;
  canHide: boolean;
  canReorder: boolean;
};

export const ADMIN_DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
  {
    id: 'hero',
    title: 'Hero + filters',
    description: 'High-signal overview, time window, and primary admin actions.',
    group: 'overview',
    defaultVisible: true,
    canHide: false,
    canReorder: false,
  },
  {
    id: 'portfolio-kpis',
    title: 'Portfolio KPIs',
    description: 'Live operational backlog and finance health cards.',
    group: 'overview',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'attention-items',
    title: 'Attention items',
    description: 'Top issues that need direct action from admin or PM.',
    group: 'overview',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'building-load',
    title: 'Building load',
    description: 'Current ticket pressure split by building.',
    group: 'operations',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'maintenance-window',
    title: 'Maintenance window',
    description: 'Scheduled work and overdue maintenance within the selected range.',
    group: 'operations',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'notifications',
    title: 'Recent notifications',
    description: 'Latest platform and building notices within the selected time window.',
    group: 'operations',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'tech-workload',
    title: 'Tech workload',
    description: 'Assigned open tickets, urgent load, and SLA exposure by technician.',
    group: 'operations',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'bottlenecks',
    title: 'Operational bottlenecks',
    description: 'Approval, SLA, assignment, and collection hotspots.',
    group: 'operations',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'building-risk',
    title: 'Building risk',
    description: 'Cross-functional risk ranking that blends tickets, finance, compliance, and maintenance.',
    group: 'risk',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'collections',
    title: 'Collections',
    description: 'Outstanding balance and residents with the highest exposure.',
    group: 'risk',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'system-health',
    title: 'System health',
    description: 'Uptime, API, queue state, and active usage.',
    group: 'system',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'role-distribution',
    title: 'Role distribution',
    description: 'User and impersonation context for platform oversight.',
    group: 'system',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
];

export const DASHBOARD_WIDGET_GROUP_ORDER: DashboardWidgetDefinition['group'][] = [
  'overview',
  'operations',
  'risk',
  'system',
];
