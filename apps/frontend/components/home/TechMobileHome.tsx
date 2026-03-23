import type { MobilePriorityInboxItem } from '../ui/mobile-priority-inbox';
import { RoleHomeShell, type HomePrimaryAction, type HomeQuickAction, type HomeStatusMetric, homeIcons } from './shared';

export type TechMobileHomeData = {
  statusMetrics: HomeStatusMetric[];
  primaryAction: HomePrimaryAction;
  quickActions: HomeQuickAction[];
  queueItems: MobilePriorityInboxItem[];
};

export function TechMobileHome({ data }: { data: TechMobileHomeData }) {
  return (
    <RoleHomeShell
      roleLabel="טכנאי"
      roleKey="TECH"
      statusMetrics={data.statusMetrics}
      primaryAction={data.primaryAction}
      quickActions={data.quickActions}
      inboxTitle="תור העבודות להיום"
      inboxSubtitle="המשימה הבאה מסומנת בראש, ולאחריה התור לפי דחיפות ו-SLA."
      inboxItems={data.queueItems}
      emptyTitle="אין משימות שטח להיום"
      emptyDescription="יום שקט. אפשר לבדוק את לוח המחר או לעבור על תוכנית הגינון."
    />
  );
}

export function buildTechFallback(): TechMobileHomeData {
  return {
    statusMetrics: [
      { id: 'jobs', label: 'משימות', value: 0, tone: 'success', href: '/tech/jobs' },
      { id: 'urgent', label: 'דחוף', value: 0, tone: 'success', href: '/tech/jobs' },
    ],
    primaryAction: {
      eyebrow: 'Next Job',
      title: 'פתח את תור העבודות',
      description: 'רשימת העבודות, הגינון והעדכונים שלי זמינים גם ללא נתוני שטח חיים.',
      ctaLabel: 'צפה בעבודות',
      href: '/tech/jobs',
      tone: 'warning',
      secondaryAction: { label: 'עדכן סטטוס', href: '/tickets?mine=true' },
    },
    quickActions: [
      { id: 'jobs', title: 'עבודות', value: 0, subtitle: 'היום', href: '/tech/jobs', icon: homeIcons.maintenance },
      { id: 'gardens', title: 'גינון', value: 'חודשי', subtitle: 'תוכנית', href: '/gardens', icon: homeIcons.calendar },
      { id: 'status', title: 'עדכן', value: 'סטטוס', subtitle: 'שלי', href: '/tickets?mine=true', icon: homeIcons.ticket },
      { id: 'alerts', title: 'התראות', value: 0, subtitle: 'חדשות', href: '/notifications', icon: homeIcons.notifications },
    ],
    queueItems: [],
  };
}
