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
      inboxTitle="תור החלטות"
      inboxSubtitle="שיוך קריאות, בקשות דייר והלוח הקרוב במסך אחד."
      inboxItems={data.priorityItems}
      emptyTitle="אין קריאות חדשות"
      emptyDescription="כל הקריאות שויכו. זה זמן טוב לבדוק בניינים, ספקים ולוח תפעול."
      emptyAction={{ label: 'בדוק בניינים', href: '/buildings' }}
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
      eyebrow: 'מסלול שיוך',
      title: 'פתח תור ניהול',
      description: 'עמוד הקריאות, מסך הבניינים והיומן זמינים גם כשאין תמונת מצב מלאה.',
      ctaLabel: 'פתח תור שיוך',
      href: '/tickets',
      tone: 'warning',
      secondaryAction: { label: 'בניינים', href: '/buildings' },
    },
    quickActions: [
      { id: 'tickets', title: 'תור קריאות', value: 0, subtitle: 'חדשות לשיוך', href: '/tickets', icon: homeIcons.ticket },
      { id: 'buildings', title: 'בניינים', value: 0, subtitle: 'מצב נכסים', href: '/buildings', icon: homeIcons.dashboard },
      { id: 'requests', title: 'בקשות דייר', value: 0, subtitle: 'ממתינות', href: '/communications', icon: homeIcons.notifications },
      { id: 'calendar', title: 'יומן תפעול', value: 0, subtitle: 'קרוב לביצוע', href: '/operations/calendar', icon: homeIcons.calendar },
    ],
    priorityItems: [],
  };
}
