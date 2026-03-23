import type { MobilePriorityInboxItem } from '../ui/mobile-priority-inbox';
import { RoleHomeShell, type HomePrimaryAction, type HomeQuickAction, type HomeStatusMetric, homeIcons } from './shared';

export type AdminMobileHomeData = {
  statusMetrics: HomeStatusMetric[];
  primaryAction: HomePrimaryAction;
  quickActions: HomeQuickAction[];
  priorityItems: MobilePriorityInboxItem[];
};

export function AdminMobileHome({ data }: { data: AdminMobileHomeData }) {
  return (
    <RoleHomeShell
      roleLabel="מנהל מערכת"
      roleKey="ADMIN"
      statusMetrics={data.statusMetrics}
      primaryAction={data.primaryAction}
      quickActions={data.quickActions}
      inboxTitle="תיבת עדיפויות"
      inboxSubtitle="חריגות SLA, אישורים ותחזוקה לא מאומתת לפני שהעומס מסלים."
      inboxItems={data.priorityItems}
      emptyTitle="אין חריגות פתוחות"
      emptyDescription="הכול טופל. אפשר לעבור לבקרה, יומן או דוח שבועי."
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
      eyebrow: 'Primary Action',
      title: 'פתח מוקד קריאות',
      description: 'החיבור לנתונים אינו זמין כרגע, אבל מוקד הקריאות והבקרה נשארו זמינים.',
      ctaLabel: 'פתח מוקד',
      href: '/tickets',
      tone: 'warning',
    },
    quickActions: [
      { id: 'tickets', title: 'קריאות', value: 0, subtitle: 'פתוחות', href: '/tickets', icon: homeIcons.ticket },
      { id: 'control', title: 'בקרה', value: '—', subtitle: 'תפוסה', href: '/admin/dashboard', icon: homeIcons.dashboard },
      { id: 'maintenance', title: 'תחזוקה', value: 0, subtitle: 'לאימות', href: '/maintenance', icon: homeIcons.maintenance },
      { id: 'calendar', title: 'יומן', value: 0, subtitle: 'אירועים', href: '/operations/calendar', icon: homeIcons.calendar },
    ],
    priorityItems: [],
  };
}
