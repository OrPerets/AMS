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
    title: 'גיבור מסך ומסננים',
    description: 'סקירה מרכזית, חלון זמן ופעולות הניהול הראשיות.',
    group: 'overview',
    defaultVisible: true,
    canHide: false,
    canReorder: false,
  },
  {
    id: 'portfolio-kpis',
    title: 'מדדי תיק הנכסים',
    description: 'מדדי עומס תפעולי ובריאות פיננסית בזמן אמת.',
    group: 'overview',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'attention-items',
    title: 'נושאים לטיפול מיידי',
    description: 'הנושאים המרכזיים שדורשים פעולה ישירה מאדמין או מנהל נכס.',
    group: 'overview',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'building-load',
    title: 'עומס לפי בניין',
    description: 'לחץ הקריאות הנוכחי בפילוח לפי בניין.',
    group: 'operations',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'maintenance-window',
    title: 'חלון תחזוקה',
    description: 'עבודות מתוזמנות ותחזוקה באיחור בתוך הטווח שנבחר.',
    group: 'operations',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'notifications',
    title: 'התראות אחרונות',
    description: 'התראות מערכת ובניין שנכנסו בתוך חלון הזמן שנבחר.',
    group: 'operations',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'tech-workload',
    title: 'עומס טכנאים',
    description: 'קריאות משויכות, עומס דחוף וחשיפה ל-SLA לפי טכנאי.',
    group: 'operations',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'bottlenecks',
    title: 'צווארי בקבוק תפעוליים',
    description: 'מוקדי עיכוב באישורים, SLA, שיוך וגבייה.',
    group: 'operations',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'building-risk',
    title: 'סיכון בניינים',
    description: 'דירוג סיכון משולב של קריאות, פיננסים, ציות ותחזוקה.',
    group: 'risk',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'collections',
    title: 'גבייה',
    description: 'יתרות פתוחות ודיירים עם החשיפה הגבוהה ביותר.',
    group: 'risk',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'system-health',
    title: 'בריאות מערכת',
    description: 'זמינות, מצב API, תורים ושימוש פעיל.',
    group: 'system',
    defaultVisible: true,
    canHide: true,
    canReorder: true,
  },
  {
    id: 'role-distribution',
    title: 'פילוח תפקידים',
    description: 'תמונת משתמשים והקשר התחזות לניהול המערכת.',
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
