import type { MobilePriorityInboxItem } from '../ui/mobile-priority-inbox';
import { RoleHomeShell, type HomePrimaryAction, type HomeQuickAction, type HomeStatusMetric, homeIcons } from './shared';

export type AccountantMobileHomeData = {
  statusMetrics: HomeStatusMetric[];
  primaryAction: HomePrimaryAction;
  quickActions: HomeQuickAction[];
  attentionItems: MobilePriorityInboxItem[];
};

export function AccountantMobileHome({ data }: { data: AccountantMobileHomeData }) {
  return (
    <RoleHomeShell
      roleLabel="כספים"
      roleKey="ACCOUNTANT"
      statusMetrics={data.statusMetrics}
      primaryAction={data.primaryAction}
      quickActions={data.quickActions}
      inboxTitle="פריטי תשומת לב"
      inboxSubtitle="פיגורים, חריגות תקציב ופירעונות קרובים שדורשים החלטה."
      inboxItems={data.attentionItems}
      emptyTitle="אין חשבונות בפיגור"
      emptyDescription="הגבייה תקינה. אפשר לעבור על התקציבים והדוחות החודשיים."
      emptyAction={{ label: 'בדוק דוחות חודשיים', href: '/finance/reports' }}
    />
  );
}

export function buildAccountantFallback(): AccountantMobileHomeData {
  return {
    statusMetrics: [
      { id: 'collection', label: 'לגבייה', value: '₪0', tone: 'success', href: '/payments' },
      { id: 'overdue', label: 'פיגורים', value: 0, tone: 'success', href: '/payments' },
    ],
    primaryAction: {
      eyebrow: 'Collection Card',
      title: 'פתח רשימת גבייה',
      description: 'עמודי הגבייה, התקציבים, הדוחות והיומן נשארו זמינים גם ללא סיכום חי.',
      ctaLabel: 'פתח רשימת גבייה',
      href: '/payments',
      tone: 'warning',
    },
    quickActions: [
      { id: 'payments', title: 'תשלומים', value: '₪0', subtitle: 'היום', href: '/payments', icon: homeIcons.payments },
      { id: 'budgets', title: 'תקציבים', value: 0, subtitle: 'חריגות', href: '/finance/budgets', icon: homeIcons.reports },
      { id: 'reports', title: 'דוחות', value: 'חודשי', subtitle: 'פיננסי', href: '/finance/reports', icon: homeIcons.dashboard },
      { id: 'calendar', title: 'יומן', value: 0, subtitle: 'פירעון', href: '/operations/calendar', icon: homeIcons.calendar },
    ],
    attentionItems: [],
  };
}
