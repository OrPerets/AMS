import type { MobilePriorityInboxItem } from '../ui/mobile-priority-inbox';
import { RoleHomeShell, type BottomSheetActionFlow, type HomePrimaryAction, type HomeQuickAction, type HomeStatusMetric, type MetricPulseState, type RoleContextPreview, homeIcons } from './shared';

export type AccountantMobileHomeData = {
  statusMetrics: HomeStatusMetric[];
  primaryAction: HomePrimaryAction;
  pulseMetrics?: MetricPulseState[];
  quickActions: HomeQuickAction[];
  contextPreview?: RoleContextPreview;
  launcher?: BottomSheetActionFlow;
  attentionItems: MobilePriorityInboxItem[];
};

export function AccountantMobileHome({ data }: { data: AccountantMobileHomeData }) {
  return (
    <RoleHomeShell
      roleLabel="כספים"
      roleKey="ACCOUNTANT"
      statusMetrics={data.statusMetrics}
      primaryAction={data.primaryAction}
      pulseMetrics={data.pulseMetrics}
      quickActions={data.quickActions}
      contextPreview={data.contextPreview}
      launcher={data.launcher}
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
    pulseMetrics: [
      { id: 'collection', label: 'לגבייה', value: '₪0', meta: 'יתרה פתוחה', tone: 'success' },
      { id: 'overdue', label: 'פיגורים', value: 0, meta: 'דורש מעקב', tone: 'default' },
      { id: 'budgets', label: 'תקציב', value: 0, meta: 'חריגות', tone: 'default' },
    ],
    quickActions: [
      { id: 'payments', title: 'תשלומים', value: '₪0', subtitle: 'היום', href: '/payments', icon: homeIcons.payments },
      { id: 'budgets', title: 'תקציבים', value: 0, subtitle: 'חריגות', href: '/finance/budgets', icon: homeIcons.reports },
      { id: 'reports', title: 'דוחות', value: 'חודשי', subtitle: 'פיננסי', href: '/finance/reports', icon: homeIcons.dashboard },
      { id: 'calendar', title: 'יומן', value: 0, subtitle: 'פירעון', href: '/operations/calendar', icon: homeIcons.calendar },
    ],
    contextPreview: {
      eyebrow: 'Collections Pulse',
      title: 'דופק הגבייה',
      subtitle: 'מה דורש טיפול לפני סוף היום.',
      items: [
        { id: 'payments', label: 'גבייה', value: '₪0', meta: 'יתרה פתוחה', href: '/payments', icon: homeIcons.payments },
        { id: 'overdue', label: 'פיגורים', value: 0, meta: 'מעל 60 יום', href: '/payments', icon: homeIcons.notifications },
        { id: 'budgets', label: 'תקציבים', value: 0, meta: 'חריגות', href: '/finance/budgets', icon: homeIcons.reports },
        { id: 'calendar', label: 'פירעון', value: 0, meta: 'אירועים קרובים', href: '/operations/calendar', icon: homeIcons.calendar },
      ],
    },
    launcher: {
      title: 'קיצורי כספים',
      description: 'מסלול קצר לרשימות הגבייה והבקרה הפיננסית.',
      ctaLabel: 'קיצורי כספים',
      items: [
        { id: 'payments', title: 'רשימת גבייה', description: 'יתרות פתוחות, פיגורים ומעקב תשלומים.', href: '/payments', icon: homeIcons.payments, tone: 'warning' },
        { id: 'budgets', title: 'בדיקת תקציבים', description: 'חריגות, סטטוסים והוצאות מול תכנון.', href: '/finance/budgets', icon: homeIcons.reports },
        { id: 'reports', title: 'דוחות פיננסיים', description: 'תמונת חודש, מגמות וייצוא.', href: '/finance/reports', icon: homeIcons.dashboard },
        { id: 'calendar', title: 'יומן פירעונות', description: 'חוזים, חשבוניות ומועדים קרובים.', href: '/operations/calendar', icon: homeIcons.calendar },
      ],
    },
    attentionItems: [],
  };
}
