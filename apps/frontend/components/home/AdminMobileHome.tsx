import type { MobilePriorityInboxItem } from '../ui/mobile-priority-inbox';
import { RoleHomeShell, type BottomSheetActionFlow, type HomePrimaryAction, type HomeQuickAction, type HomeStatusMetric, type MetricPulseState, type RoleContextPreview, homeIcons } from './shared';

export type AdminMobileHomeData = {
  statusMetrics: HomeStatusMetric[];
  primaryAction: HomePrimaryAction;
  pulseMetrics?: MetricPulseState[];
  quickActions: HomeQuickAction[];
  contextPreview?: RoleContextPreview;
  launcher?: BottomSheetActionFlow;
  priorityItems: MobilePriorityInboxItem[];
};

export function AdminMobileHome({ data }: { data: AdminMobileHomeData }) {
  return (
    <RoleHomeShell
      roleLabel="מנהל מערכת"
      roleKey="ADMIN"
      statusMetrics={data.statusMetrics}
      primaryAction={data.primaryAction}
      pulseMetrics={data.pulseMetrics}
      quickActions={data.quickActions}
      contextPreview={data.contextPreview}
      launcher={data.launcher}
      inboxTitle="חריגים פתוחים"
      inboxSubtitle="SLA, אישורים וחריגות תחזוקה לפני שהמערכת עוברת לעומס."
      inboxItems={data.priorityItems}
      emptyTitle="אין חריגות פתוחות"
      emptyDescription="הכול טופל. אפשר לעבור לבקרה, יומן או דוח שבועי."
      emptyAction={{ label: 'פתח לוח בקרה', href: '/admin/dashboard' }}
      prioritizeInbox
    />
  );
}

export function buildAdminFallback(): AdminMobileHomeData {
  return {
    statusMetrics: [
      { id: 'tickets', label: 'קריאות', value: 0, tone: 'success', href: '/tickets' },
      { id: 'sla', label: 'SLA', value: 0, tone: 'success', href: '/admin/dashboard' },
    ],
    primaryAction: {
      eyebrow: 'מוקד בקרה',
      title: 'פתח מוקד שליטה',
      description: 'החיבור לנתונים אינו זמין כרגע, אבל מוקד הקריאות, האישור והבקרה נשארו זמינים.',
      ctaLabel: 'פתח מוקד בקרה',
      href: '/tickets',
      tone: 'warning',
      secondaryAction: { label: 'מערכת ובקרה', href: '/admin/dashboard' },
    },
    pulseMetrics: [
      { id: 'sla', label: 'SLA', value: 0, meta: 'ללא חריגה', tone: 'success' },
      { id: 'approvals', label: 'אישורים', value: 0, meta: 'ממתינים', tone: 'default' },
      { id: 'ops', label: 'יומן', value: 0, meta: 'היום', tone: 'default' },
    ],
    quickActions: [
      { id: 'tickets', title: 'מוקד קריאות', value: 0, subtitle: 'פתוחות עכשיו', href: '/tickets', icon: homeIcons.ticket },
      { id: 'control', title: 'בקרה מערכתית', value: '—', subtitle: 'תפוסה פעילה', href: '/admin/dashboard', icon: homeIcons.dashboard },
      { id: 'approvals', title: 'אישורים', value: 0, subtitle: 'ממתינים', href: '/communications', icon: homeIcons.notifications },
      { id: 'maintenance', title: 'תחזוקה', value: 0, subtitle: 'חריגים לבדיקה', href: '/maintenance', icon: homeIcons.maintenance },
    ],
    contextPreview: {
      eyebrow: 'Control Center',
      title: 'דופק תפעולי',
      subtitle: 'מה מתחמם עכשיו במערכת.',
      items: [
        { id: 'sla', label: 'SLA', value: 0, meta: 'ללא חריגות פתוחות', href: '/admin/dashboard', tone: 'success', icon: homeIcons.dashboard },
        { id: 'tickets', label: 'קריאות', value: 0, meta: 'ללא תור פתוח', href: '/tickets', tone: 'success', icon: homeIcons.ticket },
        { id: 'approvals', label: 'אישורים', value: 0, meta: 'ממתינים', href: '/admin/approvals', icon: homeIcons.notifications },
        { id: 'maintenance', label: 'תחזוקה', value: 0, meta: 'חריגים לבדיקה', href: '/maintenance', icon: homeIcons.maintenance },
      ],
    },
    launcher: {
      title: 'פעולות בקרה מהירות',
      description: 'כניסה ישירה למוקדים הניהוליים עם פחות ניווט.',
      ctaLabel: 'פעולות מהירות',
      items: [
        { id: 'tickets', title: 'מוקד קריאות', description: 'פתיחת תור הטיפול והשיוך.', href: '/tickets', icon: homeIcons.ticket, tone: 'warning' },
        { id: 'approvals', title: 'אישורים', description: 'בקשות והמתנות שמחכות להכרעה.', href: '/admin/approvals', icon: homeIcons.notifications },
        { id: 'maintenance', title: 'תחזוקה', description: 'חריגים ועבודות שדורשים סגירה.', href: '/maintenance', icon: homeIcons.maintenance },
        { id: 'calendar', title: 'יומן תפעול', description: 'לוח זמנים, חוזים ופירעונות קרובים.', href: '/operations/calendar', icon: homeIcons.calendar },
      ],
    },
    priorityItems: [],
  };
}
