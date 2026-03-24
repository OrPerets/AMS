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
      inboxTitle="חריגים פתוחים"
      inboxSubtitle="SLA, אישורים וחריגות תחזוקה לפני שהמערכת עוברת לעומס."
      inboxItems={data.priorityItems}
      emptyTitle="אין חריגות פתוחות"
      emptyDescription="הכול טופל. אפשר לעבור לבקרה, יומן או דוח שבועי."
      emptyAction={{ label: 'פתח לוח בקרה', href: '/admin/dashboard' }}
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
    quickActions: [
      { id: 'tickets', title: 'מוקד קריאות', value: 0, subtitle: 'פתוחות עכשיו', href: '/tickets', icon: homeIcons.ticket },
      { id: 'control', title: 'בקרה מערכתית', value: '—', subtitle: 'תפוסה פעילה', href: '/admin/dashboard', icon: homeIcons.dashboard },
      { id: 'approvals', title: 'אישורים', value: 0, subtitle: 'ממתינים', href: '/communications', icon: homeIcons.notifications },
      { id: 'maintenance', title: 'תחזוקה', value: 0, subtitle: 'חריגים לבדיקה', href: '/maintenance', icon: homeIcons.maintenance },
    ],
    priorityItems: [],
  };
}
