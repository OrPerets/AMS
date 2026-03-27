import type { MobilePriorityInboxItem } from '../ui/mobile-priority-inbox';
import { RoleHomeShell, type BottomSheetActionFlow, type HomePrimaryAction, type HomeQuickAction, type HomeStatusMetric, type MetricPulseState, type RoleContextPreview, homeIcons } from './shared';

export type TechMobileHomeData = {
  statusMetrics: HomeStatusMetric[];
  primaryAction: HomePrimaryAction;
  pulseMetrics?: MetricPulseState[];
  quickActions: HomeQuickAction[];
  contextPreview?: RoleContextPreview;
  launcher?: BottomSheetActionFlow;
  queueItems: MobilePriorityInboxItem[];
};

export function TechMobileHome({ data }: { data: TechMobileHomeData }) {
  return (
    <RoleHomeShell
      roleLabel="טכנאי"
      roleKey="TECH"
      statusMetrics={data.statusMetrics}
      primaryAction={data.primaryAction}
      pulseMetrics={data.pulseMetrics}
      quickActions={data.quickActions}
      contextPreview={data.contextPreview}
      launcher={data.launcher}
      inboxTitle="תור העבודות להיום"
      inboxSubtitle="המשימה הבאה מסומנת בראש, ולאחריה התור לפי דחיפות ו-SLA."
      inboxItems={data.queueItems}
      emptyTitle="אין משימות שטח להיום"
      emptyDescription="יום שקט. אפשר לבדוק את לוח המחר או לעבור על תוכנית הגינון."
      emptyAction={{ label: 'פתח גינון חודשי', href: '/gardens' }}
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
      eyebrow: 'המשימה הבאה',
      title: 'פתח את תור העבודות',
      description: 'רשימת העבודות, הגינון והעדכונים שלי זמינים גם ללא נתוני שטח חיים.',
      ctaLabel: 'צפה בעבודות',
      href: '/tech/jobs',
      tone: 'warning',
      secondaryAction: { label: 'עדכן סטטוס', href: '/tickets?mine=true' },
    },
    pulseMetrics: [
      { id: 'jobs', label: 'משימות', value: 0, meta: 'להיום', tone: 'success' },
      { id: 'urgent', label: 'דחוף', value: 0, meta: 'בתור', tone: 'default' },
      { id: 'status', label: 'עדכון', value: 'מוכן', meta: 'לשידור', tone: 'default' },
    ],
    quickActions: [
      { id: 'jobs', title: 'עבודות', value: 0, subtitle: 'היום', href: '/tech/jobs', icon: homeIcons.maintenance },
      { id: 'gardens', title: 'גינון', value: 'חודשי', subtitle: 'תוכנית', href: '/gardens', icon: homeIcons.calendar },
      { id: 'supervision', title: 'פיקוח', value: 'דוח', subtitle: 'שטח', href: '/supervision-report', icon: homeIcons.supervision },
      { id: 'status', title: 'עדכן', value: 'סטטוס', subtitle: 'שלי', href: '/tickets?mine=true', icon: homeIcons.ticket },
    ],
    contextPreview: {
      eyebrow: 'Next Stop',
      title: 'תמונת שטח',
      subtitle: 'מה הבא בתור ומה צריך לדווח.',
      items: [
        { id: 'jobs', label: 'עבודות', value: 0, meta: 'פתוחות להיום', href: '/tech/jobs', icon: homeIcons.maintenance },
        { id: 'status', label: 'סטטוס', value: 'מוכן', meta: 'לשידור מיידי', href: '/tickets?mine=true', icon: homeIcons.ticket },
        { id: 'gardens', label: 'גינון', value: 'חודשי', meta: 'מסלול קבוע', href: '/gardens', icon: homeIcons.calendar },
        { id: 'supervision', label: 'פיקוח', value: 'דוח', meta: 'גיבוי לשטח', href: '/supervision-report', icon: homeIcons.supervision },
      ],
    },
    launcher: {
      title: 'פעולות שטח מהירות',
      description: 'הפעולה הבאה בלי לעבור בין כמה מסכים.',
      ctaLabel: 'פתח פעולות שטח',
      items: [
        { id: 'jobs', title: 'תור העבודות', description: 'כל המשימות הפעילות להיום.', href: '/tech/jobs', icon: homeIcons.maintenance, tone: 'warning' },
        { id: 'status', title: 'עדכון סטטוס', description: 'דיווח מהיר על טיפול, הגעה או סיום.', href: '/tickets?mine=true', icon: homeIcons.ticket },
        { id: 'gardens', title: 'מסלול גינון', description: 'תכנית החודש והעבודה הבאה.', href: '/gardens', icon: homeIcons.calendar },
        { id: 'supervision', title: 'דוח פיקוח', description: 'פתיחת דוח שטח מגובה.', href: '/supervision-report', icon: homeIcons.supervision },
      ],
    },
    queueItems: [],
  };
}
