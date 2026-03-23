import type { MobilePriorityInboxItem } from '../ui/mobile-priority-inbox';
import { RoleHomeShell, type HomePrimaryAction, type HomeQuickAction, type HomeStatusMetric, homeIcons } from './shared';

export type PmMobileHomeData = {
  statusMetrics: HomeStatusMetric[];
  primaryAction: HomePrimaryAction;
  quickActions: HomeQuickAction[];
  priorityItems: MobilePriorityInboxItem[];
};

export function PmMobileHome({ data }: { data: PmMobileHomeData }) {
  return (
    <RoleHomeShell
      roleLabel="מנהל נכס"
      roleKey="PM"
      statusMetrics={data.statusMetrics}
      primaryAction={data.primaryAction}
      quickActions={data.quickActions}
      inboxTitle="תיבת מנהל נכס"
      inboxSubtitle="מה דורש טיפול עכשיו, מה בסיכון, ומה כבר חורג."
      inboxItems={data.priorityItems}
      emptyTitle="אין קריאות חדשות"
      emptyDescription="כל הקריאות שויכו. זה זמן טוב לעבור על הבניינים והיומן הקרוב."
      prioritizeInbox
    />
  );
}

export function buildPmFallback(): PmMobileHomeData {
  return {
    statusMetrics: [
      { id: 'tickets', label: 'קריאות', value: 0, tone: 'success', href: '/tickets' },
      { id: 'urgent', label: 'דחוף', value: 0, tone: 'success', href: '/tickets' },
    ],
    primaryAction: {
      eyebrow: 'Primary Action',
      title: 'שייך עכשיו',
      description: 'עמוד הקריאות, עמוד הבניינים והיומן זמינים גם כשאין תמונת מצב מלאה.',
      ctaLabel: 'שייך עכשיו',
      href: '/tickets',
      tone: 'warning',
    },
    quickActions: [
      { id: 'tickets', title: 'קריאות', value: 0, subtitle: 'חדשות', href: '/tickets', icon: homeIcons.ticket },
      { id: 'buildings', title: 'בניינים', value: 0, subtitle: 'פעילים', href: '/buildings', icon: homeIcons.dashboard },
      { id: 'calendar', title: 'לוח', value: 0, subtitle: 'אירועים', href: '/operations/calendar', icon: homeIcons.calendar },
      { id: 'vendors', title: 'ספקים', value: 0, subtitle: 'הודעות', href: '/communications', icon: homeIcons.notifications },
    ],
    priorityItems: [],
  };
}
