import type { MobilePriorityInboxItem } from '../ui/mobile-priority-inbox';
import { RoleHomeShell, type BottomSheetActionFlow, type HomePrimaryAction, type HomeQuickAction, type HomeStatusMetric, type MetricPulseState, type RoleContextPreview, homeIcons } from './shared';

export type PmMobileHomeData = {
  statusMetrics: HomeStatusMetric[];
  primaryAction: HomePrimaryAction;
  pulseMetrics?: MetricPulseState[];
  quickActions: HomeQuickAction[];
  contextPreview?: RoleContextPreview;
  launcher?: BottomSheetActionFlow;
  priorityItems: MobilePriorityInboxItem[];
};

export function PmMobileHome({ data }: { data: PmMobileHomeData }) {
  return (
    <RoleHomeShell
      roleLabel="מנהל נכס"
      roleKey="PM"
      statusMetrics={data.statusMetrics}
      primaryAction={data.primaryAction}
      pulseMetrics={data.pulseMetrics}
      quickActions={data.quickActions}
      contextPreview={data.contextPreview}
      launcher={data.launcher}
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
    pulseMetrics: [
      { id: 'tickets', label: 'קריאות', value: 0, meta: 'חדשות לשיוך', tone: 'success' },
      { id: 'requests', label: 'דיירים', value: 0, meta: 'ממתינים', tone: 'default' },
      { id: 'calendar', label: 'יומן', value: 0, meta: 'קרוב', tone: 'default' },
    ],
    quickActions: [
      { id: 'tickets', title: 'תור קריאות', value: 0, subtitle: 'חדשות לשיוך', href: '/tickets', icon: homeIcons.ticket },
      { id: 'buildings', title: 'בניינים', value: 0, subtitle: 'מצב נכסים', href: '/buildings', icon: homeIcons.dashboard },
      { id: 'requests', title: 'בקשות דייר', value: 0, subtitle: 'ממתינות', href: '/communications', icon: homeIcons.notifications },
      { id: 'calendar', title: 'יומן תפעול', value: 0, subtitle: 'קרוב לביצוע', href: '/operations/calendar', icon: homeIcons.calendar },
    ],
    contextPreview: {
      eyebrow: 'Property Pulse',
      title: 'מוקדי הנכס',
      subtitle: 'חריגים, דיירים ויומן בתמונה אחת.',
      items: [
        { id: 'tickets', label: 'קריאות', value: 0, meta: 'ממתינות לשיוך', href: '/tickets', icon: homeIcons.ticket },
        { id: 'buildings', label: 'בניינים', value: 0, meta: 'מצב נכסים', href: '/buildings', icon: homeIcons.dashboard },
        { id: 'requests', label: 'דיירים', value: 0, meta: 'בקשות פתוחות', href: '/communications', icon: homeIcons.notifications },
        { id: 'calendar', label: 'יומן', value: 0, meta: 'לוח קרוב', href: '/operations/calendar', icon: homeIcons.calendar },
      ],
    },
    launcher: {
      title: 'קיצורי ניהול',
      description: 'מעברים מהירים למסכי העבודה שנפתחים הכי הרבה.',
      ctaLabel: 'קיצורי ניהול',
      items: [
        { id: 'tickets', title: 'פתח תור שיוך', description: 'כל הקריאות החדשות והדחופות.', href: '/tickets', icon: homeIcons.ticket, tone: 'warning' },
        { id: 'buildings', title: 'מסך בניינים', description: 'מצב נכסים, בניינים ויחידות.', href: '/buildings', icon: homeIcons.dashboard },
        { id: 'communications', title: 'בקשות דייר', description: 'חניה, מעבר דירה ומסמכים בהמתנה.', href: '/communications', icon: homeIcons.notifications },
        { id: 'calendar', title: 'יומן תפעול', description: 'משימות קרובות, ספקים ולוחות זמנים.', href: '/operations/calendar', icon: homeIcons.calendar },
      ],
    },
    priorityItems: [],
  };
}
