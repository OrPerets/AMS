import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  Building2,
  CalendarClock,
  ClipboardList,
  Command,
  CreditCard,
  FileText,
  Sparkles,
  Ticket,
  Wrench,
} from 'lucide-react';
import { authFetch, getCurrentUserId, getEffectiveRole } from '../lib/auth';
import { formatCurrency, formatDate } from '../lib/utils';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { EmptyState } from '../components/ui/empty-state';
import { MobileContextBar } from '../components/ui/mobile-context-bar';
import { MobileActionHub } from '../components/ui/mobile-action-hub';
import { MobilePriorityInbox, MobilePriorityInboxItem } from '../components/ui/mobile-priority-inbox';
import { MobileCardSkeleton } from '../components/ui/page-states';
import { PageHero } from '../components/ui/page-hero';
import { CompactStatusStrip } from '../components/ui/compact-status-strip';
import { PrimaryActionCard } from '../components/ui/primary-action-card';
import { SectionHeader } from '../components/ui/section-header';
import { StatusBadge } from '../components/ui/status-badge';
import { toast } from '../components/ui/use-toast';

type RoleKey = 'ADMIN' | 'PM' | 'TECH' | 'RESIDENT' | 'ACCOUNTANT' | 'MASTER';

type HomeMetric = {
  label: string;
  value: string | number;
  hint: string;
  tone: 'success' | 'warning' | 'info' | 'neutral';
};

type HomeAction = {
  title: string;
  description: string;
  href: string;
  icon: typeof Ticket;
  accent: string;
};

type HomeShortcut = {
  title: string;
  description: string;
  href: string;
  icon: typeof Ticket;
  badge?: string;
};

type HomeSnapshot = {
  roleTitle: string;
  headline: string;
  description: string;
  eyebrowLabel: string;
  metrics: HomeMetric[];
  nextActions: HomeAction[];
  spotlightTitle: string;
  spotlightDescription: string;
  spotlightItems: string[];
  digestTitle: string;
  digestMarkdown: string;
};

type TicketsSnapshot = {
  summary?: {
    open?: number;
    inProgress?: number;
  };
  meta?: {
    total?: number;
  };
  riskSummary?: {
    atRisk?: number;
    dueToday?: number;
    breached?: number;
  };
  items?: Array<{
    severity?: string;
    status?: string;
  }>;
};

type MaintenanceExceptionsSnapshot = {
  summary?: {
    unverifiedMaintenance?: number;
    openWorkOrders?: number;
  };
};

type OperationsCalendarSnapshot = {
  summary?: {
    total?: number;
  };
};

type UserNotificationSnapshot = Array<{
  read?: boolean;
}>;

const roleTitles: Record<RoleKey, string> = {
  ADMIN: 'מנהל מערכת',
  PM: 'מנהל נכס',
  TECH: 'טכנאי',
  RESIDENT: 'דייר',
  ACCOUNTANT: 'כספים וגבייה',
  MASTER: 'מנהל ראשי',
};

const heroVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleKey>('RESIDENT');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<HomeSnapshot | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    setMounted(true);
    setRole((getEffectiveRole() as RoleKey) || 'RESIDENT');
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const effectiveRole = (getEffectiveRole() as RoleKey) || 'RESIDENT';
    setRole(effectiveRole);
    void loadSnapshot(effectiveRole);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !currentUserId) return;
    const key = `amit-onboarding:v8:${currentUserId}:${role}`;
    const seen = window.localStorage.getItem(key);
    setOnboardingOpen(!seen);
  }, [currentUserId, mounted, role]);

  async function loadSnapshot(activeRole: RoleKey) {
    try {
      setLoading(true);
      const next = await buildSnapshot(activeRole, currentUserId);
      setSnapshot(next);
    } catch {
      toast({
        title: 'טעינת מרכז העבודה נכשלה',
        description: 'לא ניתן לבנות כרגע את הסיכום המותאם. מוצגת תצורת ברירת מחדל.',
        variant: 'destructive',
      });
      setSnapshot(buildFallbackSnapshot(activeRole));
    } finally {
      setLoading(false);
    }
  }

  const onboardingSteps = useMemo(() => getOnboardingSteps(role), [role]);
  const quickLinks = useMemo(() => getRoleQuickLinks(role, snapshot?.metrics ?? [], snapshot?.nextActions ?? []), [role, snapshot]);
  const priorityItems = useMemo<MobilePriorityInboxItem[]>(() => {
    if (!snapshot) return [];
    return snapshot.nextActions.slice(0, 3).map((action, index) => ({
      id: `${action.href}-${index}`,
      status:
        index === 0
          ? 'דורש פעולה'
          : action.title.includes('התראות') || action.title.includes('תשלומים')
            ? 'בסיכון'
            : 'בתהליך',
      tone: index === 0 ? 'warning' : index === 1 ? 'active' : 'neutral',
      title: action.title,
      reason: action.description,
      meta: snapshot.metrics[index]?.hint,
      href: action.href,
      ctaLabel: 'פתח',
    }));
  }, [snapshot]);
  const recentActivity = useMemo(() => snapshot?.spotlightItems.slice(0, 3) ?? [], [snapshot]);
  const contextLabel = useMemo(() => {
    switch (role) {
      case 'RESIDENT':
        return 'מרכז שירות עצמי';
      case 'PM':
        return 'קונסולת ניהול נכסים';
      case 'ADMIN':
        return 'שליטה ניהולית';
      case 'ACCOUNTANT':
        return 'בקרת כספים';
      case 'TECH':
        return 'תפעול שטח';
      default:
        return 'מרכז עבודה תפעולי';
    }
  }, [role]);
  const contextChips = useMemo(
    () => (snapshot ? snapshot.metrics.slice(0, 2).map((metric) => `${metric.label}: ${metric.value}`) : []),
    [snapshot],
  );
  const mobilePrimaryAction = snapshot?.nextActions[0];
  const mobileQuickActions = quickLinks.slice(0, 4);
  const mobileStatusMetrics = snapshot?.metrics.slice(0, 2).map((metric) => ({
    id: metric.label,
    label: metric.label,
    value: typeof metric.value === 'number' ? metric.value : Number(String(metric.value).replace(/[^\d.-]/g, '')) || metric.value,
    tone: metric.tone === 'warning' ? 'warning' as const : metric.tone === 'success' ? 'success' as const : 'default' as const,
    onClick: () => {
      if (role === 'ACCOUNTANT') router.push('/payments');
      else if (role === 'ADMIN') router.push('/admin/dashboard');
      else if (role === 'PM') router.push('/tickets');
      else if (role === 'TECH') router.push('/tech/jobs');
      else router.push('/resident/account');
    },
  })) ?? [];

  function completeOnboarding() {
    if (currentUserId && typeof window !== 'undefined') {
      window.localStorage.setItem(`amit-onboarding:v8:${currentUserId}:${role}`, new Date().toISOString());
    }
    setOnboardingOpen(false);
    toast({
      title: 'המסלול האישי הופעל',
      description: 'מרכז העבודה ימשיך להדגיש עבורך את הפעולה הכי רלוונטית בכל כניסה.',
      variant: 'success',
    });
  }

  if (!mounted || loading || !snapshot) {
    return <MobileCardSkeleton cards={4} />;
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <div className="space-y-3 md:hidden">
        <CompactStatusStrip
          roleLabel={snapshot.roleTitle}
          icon={getRoleStatusIcon(role)}
          metrics={mobileStatusMetrics}
        />

        {mobilePrimaryAction ? (
          <PrimaryActionCard
            eyebrow={snapshot.eyebrowLabel}
            title={mobilePrimaryAction.title}
            description={mobilePrimaryAction.description}
            ctaLabel="פתח"
            href={mobilePrimaryAction.href}
            tone={snapshot.metrics.some((metric) => metric.tone === 'warning') ? 'warning' : 'default'}
          />
        ) : null}

        <MobileActionHub
          title={<span className="sr-only">פעולות מהירות</span>}
          items={mobileQuickActions.map((item, index) => ({
            id: `${item.href}-${index}`,
            label: item.title,
            description: item.description,
            href: item.href,
            icon: item.icon,
            badge: item.badge,
            accent: index === 0 ? 'primary' : index === 1 ? 'info' : index === 2 ? 'warning' : 'neutral',
          }))}
        />

        <MobilePriorityInbox
          title="תיבת עדיפויות"
          subtitle="מה דורש פעולה עכשיו."
          items={priorityItems.slice(0, 3)}
        />
      </div>

      <div className="hidden space-y-5 sm:space-y-8 md:block">
        <MobileContextBar
          roleLabel={snapshot.roleTitle}
          contextLabel={contextLabel}
          syncLabel="סנכרון חי עם המערכת"
          lastUpdated={formatDate(new Date())}
          chips={contextChips}
        />

        <motion.div variants={heroVariants} initial="initial" animate="animate">
          <PageHero
            variant="operational"
            eyebrow={
              <>
                <StatusBadge label={snapshot.eyebrowLabel} tone="finance" />
                <Badge variant="outline" className="text-[11px] sm:text-xs">
                  {snapshot.roleTitle}
                </Badge>
              </>
            }
            kicker="מרכז עבודה"
            title={snapshot.headline}
            description={snapshot.description}
            actions={
              <>
                {snapshot.nextActions[0] ? (
                  <Button asChild size="sm" className="sm:h-11 sm:px-5 sm:text-sm">
                    <Link href={snapshot.nextActions[0].href}>{snapshot.nextActions[0].title}</Link>
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  className="sm:h-11 sm:px-5 sm:text-sm"
                  onClick={() => setOnboardingOpen(true)}
                >
                  <Sparkles className="me-1.5 h-3.5 w-3.5" />
                  מסלול מהיר
                </Button>
              </>
            }
          />
        </motion.div>

        <MobileActionHub
          title="פעולות ראשיות"
          subtitle="הדברים שכדאי לפתוח קודם, בלי לחפש בין תפריטים."
          items={quickLinks.map((item, index) => ({
          id: `${item.href}-${index}`,
          label: item.title,
          description: item.description,
          href: item.href,
          icon: item.icon,
          badge: item.badge,
          accent: index === 0 ? 'primary' : index === 1 ? 'info' : 'neutral',
        }))}
        />

        <MobilePriorityInbox
          title="תיבת עדיפויות"
          subtitle="מה דורש פעולה עכשיו ומה עלול להפוך לחסם אם נשאיר אותו פתוח."
          items={priorityItems}
        />

        <section className="space-y-3">
        <SectionHeader
          title="מדדים מרכזיים"
          subtitle="שלושה מספרים מספיקים כדי להבין את העומס והסיכון ברגע זה."
          meta="מדדי ליבה"
        />
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
          {snapshot.metrics.slice(0, 3).map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.05, duration: 0.32 }}
            >
              <MetricCard metric={metric} />
            </motion.div>
          ))}
        </div>
        </section>

        <section className="grid gap-4 sm:gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader>
            <SectionHeader
              title="הפעולה הבאה"
              subtitle="רשימה מדורגת של הצעדים שכדאי לבצע עכשיו לפי עומס, סיכון והקשר תפעולי."
              meta="הבא בתור"
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshot.nextActions.length ? (
              snapshot.nextActions.map((action, index) => (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + index * 0.05, duration: 0.28 }}
                >
                  <ActionCard action={action} />
                </motion.div>
              ))
            ) : (
              <EmptyState
                type="action"
                title="הכול בשליטה"
                description="אין כרגע משימה דחופה שממתינה לך. זה זמן טוב לסגור לולאות, לעבור על דוחות או לרענן נהלים."
              />
            )}
          </CardContent>
        </Card>

        <Card variant="muted" className="overflow-hidden">
          <CardHeader>
            <SectionHeader
              title="פעילות אחרונה"
              subtitle="אותות קצרים בשפה פשוטה במקום כרטיסי תובנה דקורטיביים."
              meta="מה השתנה"
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length ? (
              recentActivity.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14 + index * 0.05, duration: 0.28 }}
                  className="rounded-[22px] border border-primary/14 bg-primary/7 p-4 text-sm leading-7"
                >
                  {item}
                </motion.div>
              ))
            ) : (
              <EmptyState
                type="empty"
                title="אין חריגות חריפות כרגע"
                description="זה סימן טוב. אפשר להשתמש בזמן הזה כדי לבצע פעולות מניעה, לשפר תיעוד או ללטש תהליכי שירות."
              />
            )}
          </CardContent>
        </Card>
        </section>

        <section className="grid gap-4 sm:gap-6">
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader>
            <SectionHeader
              title="תקציר תפעולי"
              subtitle="סיכום שיתופי וקריא לבקרה שבועית, תיאום או העברת משמרת."
              meta="תקציר"
              actions={
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(snapshot.digestMarkdown)}>
                    העתק תקציר
                  </Button>
                  <Button asChild>
                    <Link href={snapshot.nextActions[0]?.href || '/home'}>
                      המשך
                      <ArrowLeft className="ms-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              }
            />
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-[24px] border border-subtle-border bg-muted/35 p-4 text-xs leading-6 whitespace-pre-wrap text-foreground/88 sm:p-5 sm:text-sm sm:leading-7">
{snapshot.digestMarkdown}
            </pre>
          </CardContent>
        </Card>
        </section>
      </div>

      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent className="mx-3 max-w-lg border-white/10 bg-slate-950/95 text-white shadow-modal backdrop-blur-xl sm:mx-auto sm:max-w-2xl dark-surface">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-white sm:text-lg">
              <Sparkles className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              מסלול פתיחה
            </DialogTitle>
            <DialogDescription className="text-xs text-white/65 sm:text-sm">
              שלושה צעדים קצרים כדי להתחיל בקלות.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2.5 sm:gap-3">
            {onboardingSteps.map((step, index) => (
              <div key={step.title} className="rounded-xl border border-white/10 bg-white/6 p-3 sm:rounded-[22px] sm:p-4">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-sm font-semibold text-primary sm:h-10 sm:w-10 sm:rounded-2xl sm:text-base">
                    {index + 1}
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="text-sm font-semibold text-white sm:text-base">{step.title}</div>
                    <div className="text-xs leading-5 text-white/65 sm:text-sm sm:leading-7">{step.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-3">
            <Button variant="outline" size="sm" className="border-white/10 bg-white/6 text-white hover:bg-white/12 sm:h-11 sm:px-5 sm:text-sm" onClick={() => setOnboardingOpen(false)}>
              אחר כך
            </Button>
            <Button size="sm" className="sm:h-11 sm:px-5 sm:text-sm" onClick={completeOnboarding}>
              הפעל חוויה מותאמת
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

async function buildSnapshot(role: RoleKey, currentUserId: number | null): Promise<HomeSnapshot> {
  if ((role === 'RESIDENT' || role === 'TECH') && !currentUserId) {
    return buildFallbackSnapshot(role);
  }

  if (role === 'RESIDENT' && currentUserId) {
    const data = await fetchRequiredJson<any>(`/api/v1/invoices/account/${currentUserId}`);

    const nextActions: HomeAction[] = [
      data.summary?.overdueInvoices
        ? {
            title: 'סגור תשלום בפיגור',
            description: 'יש כרגע חיובים שדורשים טיפול מיידי כדי למנוע פנייה לשירות.',
            href: '/payments/resident',
            icon: CreditCard,
            accent: 'from-rose-500/18 to-orange-500/18',
          }
        : {
            title: 'בדוק את האזור האישי',
            description: 'תמונת מצב של תשלומים, מסמכים וקריאות פתוחות במקום אחד.',
            href: '/resident/account',
            icon: CreditCard,
            accent: 'from-emerald-500/18 to-cyan-500/18',
          },
      {
        title: 'פתח בקשת דייר',
        description: 'למעבר, מסמך, חניה או עדכון פרטים בלי לחפש את הטופס הנכון.',
        href: '/resident/requests',
        icon: ClipboardList,
        accent: 'from-primary/18 to-amber-500/18',
      },
      {
        title: 'פתח קריאת תחזוקה',
        description: 'מסלול שירות מהיר עם מצלמה והתקדמות טיפול ברורה.',
        href: '/create-call',
        icon: Ticket,
        accent: 'from-sky-500/18 to-indigo-500/18',
      },
    ];

    return {
      roleTitle: roleTitles[role],
      headline: 'הכול מרוכז עבורך במקום אחד',
      description: 'המסך הזה מחליף פתיחה גנרית בסיכום אישי: מה דחוף, מה פתוח ומה הכי כדאי לבצע עכשיו כדי לסגור לולאות מהר.',
      eyebrowLabel: 'מסלול דייר',
      metrics: [
        { label: 'יתרה נוכחית', value: formatCurrency(data.summary?.currentBalance ?? 0), hint: 'תמונת מצב מיידית של מצב החשבון.', tone: 'info' },
        { label: 'חיובים שלא שולמו', value: data.summary?.unpaidInvoices ?? 0, hint: 'כולל גם חיובים לקראת מועד פירעון.', tone: 'warning' },
        { label: 'פיגורים פעילים', value: data.summary?.overdueInvoices ?? 0, hint: 'כאן כדאי להתחיל כדי למנוע עיכובים מיותרים.', tone: 'warning' },
        { label: 'קריאות פתוחות', value: data.summary?.openTickets ?? 0, hint: 'סטטוס שירות נוכחי בלי לחפש בין מסכים.', tone: 'neutral' },
      ],
      nextActions,
      spotlightTitle: 'תובנות חכמות לשבוע הקרוב',
      spotlightDescription: 'המערכת מזהה מה דורש ממך פעולה ומה כבר במסלול תקין.',
      spotlightItems: [
        data.summary?.overdueInvoices
          ? `יש ${data.summary.overdueInvoices} חיובים בפיגור. כדאי להתחיל משם כדי לעצור מעקב ידני וצוותי גבייה.`
          : 'אין כרגע פיגורים פעילים, כך שאפשר להתמקד במסמכים, אוטופיי או פתיחת פניות חדשות.',
        data.tickets?.length
          ? `יש ${data.summary?.openTickets ?? 0} קריאות פתוחות. מתוך המסך האישי אפשר לראות מי מטפל ומה העדכון האחרון.`
          : 'אין קריאות פעילות כרגע. אם משהו משתנה, מסלול פתיחת הקריאה מוכן כבר מהמסך הראשי.',
        `יש ${data.summary?.unreadNotifications ?? 0} התראות לא נקראו שמרוכזות במרכז ההתראות שלך.`,
      ],
      digestTitle: 'תקציר שבועי אוטומטי לדייר',
      digestMarkdown: [
        `# מצב אישי שבועי`,
        `- תאריך: ${formatDate(new Date())}`,
        `- יתרה נוכחית: ${formatCurrency(data.summary?.currentBalance ?? 0)}`,
        `- חיובים שלא שולמו: ${data.summary?.unpaidInvoices ?? 0}`,
        `- קריאות שירות פתוחות: ${data.summary?.openTickets ?? 0}`,
        `- התראות לא נקראו: ${data.summary?.unreadNotifications ?? 0}`,
        ``,
        `פעולה מומלצת: ${nextActions[0]?.title ?? 'בדיקה תקופתית של החשבון והפניות.'}`,
      ].join('\n'),
    };
  }

  if (role === 'TECH' && currentUserId) {
    const [tickets, notifications] = await Promise.all([
      fetchRequiredJson<TicketsSnapshot>(`/api/v1/tickets?view=dispatch&assigneeId=${currentUserId}&limit=24`),
      fetchRequiredJson<UserNotificationSnapshot>(`/api/v1/notifications/user/${currentUserId}`),
    ]);
    const urgentCount = tickets.items?.filter((item: any) => item.severity === 'URGENT' && item.status !== 'RESOLVED').length ?? 0;
    const riskCount = (tickets.riskSummary?.atRisk ?? 0) + (tickets.riskSummary?.dueToday ?? 0) + (tickets.riskSummary?.breached ?? 0);

    return {
      roleTitle: roleTitles[role],
      headline: 'היום שלך כבר מסודר לפי דחיפות',
      description: 'במקום לפתוח כמה מסכים, המרכז מציג את הקריאות שהכי חשוב להתחיל מהן, את עומס הסיכון ואת נקודות החיכוך שעלולות לעכב יציאה לשטח.',
      eyebrowLabel: 'תפעול שטח',
      metrics: [
        { label: 'קריאות פעילות', value: tickets.summary?.inProgress ?? tickets.meta?.total ?? 0, hint: 'כל מה שכבר משויך אליך ומצריך טיפול.', tone: 'info' },
        { label: 'בהולות', value: urgentCount, hint: 'כדאי לפתוח אותן לפני כל עבודה אחרת.', tone: 'warning' },
        { label: 'בסיכון SLA', value: riskCount, hint: 'חריגות או סיכונים שמצריכים עדכון מהיר.', tone: 'warning' },
        { label: 'התראות חדשות', value: Array.isArray(notifications) ? notifications.filter((item: any) => !item.read).length : 0, hint: 'עדכונים שיכולים לשנות את סדר העבודה שלך.', tone: 'neutral' },
      ],
      nextActions: [
        {
          title: urgentCount ? 'טפל בקריאה בהולה' : 'פתח את משימות השטח',
          description: urgentCount ? 'יש כרגע קריאה בהולה שמחכה להתחלת טיפול.' : 'המשך לעומס המשימות שלך עם מסלול התחלה מהיר.',
          href: '/tech/jobs',
          icon: Wrench,
          accent: 'from-amber-500/18 to-rose-500/18',
        },
        {
          title: 'עדכן קריאות בלוח העבודה',
          description: 'כדי שהצוות יראה התקדמות, הערות וסטטוסים בזמן אמת.',
          href: '/tickets',
          icon: Ticket,
          accent: 'from-sky-500/18 to-indigo-500/18',
        },
        {
          title: 'בדוק התראות תפעוליות',
          description: 'שינויים, תיאומי גישה או פניות חדשות שקשורות לשטח.',
          href: '/notifications',
          icon: Bell,
          accent: 'from-primary/18 to-cyan-500/18',
        },
      ],
      spotlightTitle: 'אינטליגנציה תפעולית לטכנאי',
      spotlightDescription: 'במקום לעבור ידנית על כל הרשימה, המערכת מציפה את נקודות הסיכון שכדאי לטפל בהן ראשונות.',
      spotlightItems: [
        urgentCount ? `יש ${urgentCount} קריאות בהולות פתוחות. מומלץ לאשר התחלת טיפול כדי להוריד חרדה אצל הלקוח.` : 'אין כרגע קריאות בהולות פתוחות, כך שאפשר להתקדם לפי תכנון מסודר.',
        riskCount ? `זוהו ${riskCount} קריאות בסיכון SLA. עדכון קצר מהנייד יכול לעצור הסלמה מיותרת.` : 'אין כרגע קריאות בסיכון SLA מעל הסף שהוגדר.',
        `מרכז ההתראות כולל ${Array.isArray(notifications) ? notifications.length : 0} פריטים אחרונים כדי שלא תפספס שינויי גישה או תיאום.`,
      ],
      digestTitle: 'תדריך שבועי אוטומטי לטכנאי',
      digestMarkdown: [
        `# תדריך שטח`,
        `- תאריך: ${formatDate(new Date())}`,
        `- קריאות פעילות: ${tickets.summary?.inProgress ?? tickets.meta?.total ?? 0}`,
        `- קריאות בהולות: ${urgentCount}`,
        `- סיכוני SLA: ${riskCount}`,
        `- התראות שלא נקראו: ${Array.isArray(notifications) ? notifications.filter((item: any) => !item.read).length : 0}`,
        ``,
        `מיקוד השבוע: להתחיל מהקריאות עם סיכון SLA גבוה, ולסגור לפחות עדכון אחד לכל טיפול שנמצא בשטח.`,
      ].join('\n'),
    };
  }

  const ticketsPromise = fetchOptionalJson<TicketsSnapshot>('/api/v1/tickets?view=dispatch&limit=40');
  const exceptionsPromise =
    role === 'ACCOUNTANT'
      ? Promise.resolve(null)
      : fetchOptionalJson<MaintenanceExceptionsSnapshot>('/api/v1/maintenance/exceptions');
  const operationsPromise = fetchOptionalJson<OperationsCalendarSnapshot>('/api/v1/operations/calendar');
  const notificationsPromise = currentUserId
    ? fetchOptionalJson<UserNotificationSnapshot>(`/api/v1/notifications/user/${currentUserId}`)
    : Promise.resolve(null);

  const [tickets, exceptions, operations, notifications] = await Promise.all([
    ticketsPromise,
    exceptionsPromise,
    operationsPromise,
    notificationsPromise,
  ]);

  if (!tickets && !exceptions && !operations) {
    throw new Error('ops snapshot failed');
  }

  const riskCount = (tickets?.riskSummary?.atRisk ?? 0) + (tickets?.riskSummary?.dueToday ?? 0) + (tickets?.riskSummary?.breached ?? 0);
  const openWorkOrders = exceptions?.summary?.openWorkOrders ?? 0;

  const nextActions: HomeAction[] = [
    {
      title: riskCount ? 'פתח את לוח הקריאות המסוכן' : 'פתח את לוח הקריאות',
      description: riskCount
        ? `יש כרגע ${riskCount} קריאות עם סיכון SLA או חריגה שמחכות להחלטה.`
        : 'בדוק את מצב התור, השיוכים והתגובות האחרונות בלי לעבור בין מסכים.',
      href: '/tickets',
      icon: Ticket,
      accent: 'from-primary/18 to-amber-500/18',
    },
    {
      title: 'עבור ליומן התפעול',
      description: `מרוכזים שם ${operations?.summary?.total ?? 0} אירועים קרובים של תחזוקה, חוזים ופירעונות.`,
      href: '/operations/calendar',
      icon: CalendarClock,
      accent: 'from-sky-500/18 to-cyan-500/18',
    },
    {
      title: role === 'ACCOUNTANT' ? 'עבור למסך התשלומים' : 'עבור ללוח הניהול',
      description: role === 'ACCOUNTANT' ? 'גבייה, פירעונות וניתוח מגמות במקום אחד.' : 'תמונת מערכת רחבה עם מדדי ליבה, סיכונים ואירועים ניהוליים.',
      href: role === 'ACCOUNTANT' ? '/payments' : '/admin/dashboard',
      icon: role === 'ACCOUNTANT' ? CreditCard : Building2,
      accent: 'from-emerald-500/18 to-lime-500/18',
    },
  ];

  return {
    roleTitle: roleTitles[role],
    headline: role === 'ACCOUNTANT' ? 'המספרים מספרים איפה לפעול קודם' : 'מרכז העבודה שלך כבר ממוין לפי סיכון והשפעה',
    description:
      role === 'ACCOUNTANT'
        ? 'המסך מציף נקודות גבייה, עומסים תפעוליים ואירועים קרובים כדי לחבר בין כספים לתפעול, במקום לנתח כל רשימה בנפרד.'
        : 'במקום פתיחה גנרית, קיבלת סיכום שמבליט חריגות SLA, תחזוקה לא מאומתת, עומס עבודה והמהלך הבא שכדאי לבצע.',
    eyebrowLabel: role === 'ACCOUNTANT' ? 'בקרת כספים' : 'מודיעין תפעולי',
    metrics: [
      { label: 'קריאות פתוחות', value: tickets?.summary?.open ?? 0, hint: 'כלל התור הפעיל כרגע במערכת.', tone: 'info' },
      { label: 'סיכון SLA', value: riskCount, hint: 'כולל קריאות בחריגה, יעד היום או סיכון קרוב.', tone: 'warning' },
      { label: 'תחזוקה לא מאומתת', value: exceptions?.summary?.unverifiedMaintenance ?? 0, hint: 'פעולות שבוצעו אבל עדיין לא נסגרו כראוי.', tone: 'warning' },
      { label: 'הזמנות עבודה פתוחות', value: openWorkOrders, hint: 'מסמן איפה יש חיכוך בין מוקד, ספק ואישור.', tone: 'neutral' },
    ],
    nextActions,
    spotlightTitle: role === 'ACCOUNTANT' ? 'אותות שבועיים לכספים' : 'אותות חכמים מהמערכת',
    spotlightDescription:
      role === 'ACCOUNTANT'
        ? 'המערכת מחברת בין אירועי תפעול, חוזים ופירעונות כדי שתוכל לפעול מוקדם ולא רק להגיב.'
        : 'זיהוי חריגות תחזוקה, צווארי בקבוק והמסכים שבהם כדאי להתערב קודם.',
    spotlightItems: [
      riskCount
        ? `זוהו ${riskCount} קריאות בסיכון SLA. זהו כרגע צוואר הבקבוק המרכזי במסלול השירות.`
        : 'אין כרגע צבר קריאות מסוכן, כך שאפשר לעבור למניעה ולאופטימיזציה.',
      exceptions?.summary?.unverifiedMaintenance
        ? `יש ${exceptions.summary.unverifiedMaintenance} פעולות תחזוקה שבוצעו ועדיין לא אומתו. זה סיכון שקט שכדאי לסגור.`
        : role === 'ACCOUNTANT'
          ? 'תמונת התחזוקה המעמיקה לא זמינה לתפקיד הכספים, ולכן המיקוד כאן הוא באירועים ותזרים.'
          : 'אין כרגע פעולות תחזוקה ממתינות לאימות, וזה משחרר זמן להסתכלות קדימה.',
      operations?.summary?.total
        ? `ביומן התפעול מחכים ${operations.summary.total} אירועים קרובים. שימוש ביומן עכשיו חוסך הפתעות מאוחרות יותר.`
        : 'לא זוהו אירועים תפעוליים חריגים בטווח הקרוב.',
    ],
    digestTitle: role === 'ACCOUNTANT' ? 'דוח שבועי אוטומטי לכספים' : 'תקציר ניהולי אוטומטי לשבוע הקרוב',
    digestMarkdown: [
      role === 'ACCOUNTANT' ? '# תקציר כספים שבועי' : '# תקציר תפעולי שבועי',
      `- תאריך: ${formatDate(new Date())}`,
      `- קריאות פתוחות: ${tickets?.summary?.open ?? 0}`,
      `- קריאות בסיכון SLA: ${riskCount}`,
      `- תחזוקה לא מאומתת: ${exceptions?.summary?.unverifiedMaintenance ?? 0}`,
      `- הזמנות עבודה פתוחות: ${openWorkOrders}`,
      `- אירועים ביומן התפעול: ${operations?.summary?.total ?? 0}`,
      `- התראות שלא נקראו: ${Array.isArray(notifications) ? notifications.filter((item: any) => !item.read).length : 0}`,
      ``,
      `המלצה לשבוע הקרוב: ${nextActions[0].description}`,
    ].join('\n'),
  };
}

async function fetchRequiredJson<T>(path: string): Promise<T> {
  const response = await authFetch(path);
  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function fetchOptionalJson<T>(path: string): Promise<T | null> {
  try {
    return await fetchRequiredJson<T>(path);
  } catch {
    return null;
  }
}

function buildFallbackSnapshot(role: RoleKey): HomeSnapshot {
  return {
    roleTitle: roleTitles[role],
    headline: 'מרכז עבודה חכם בבנייה',
    description: 'החיבור לנתונים לא הצליח כרגע, אבל שכבת הניווט, המסלול האישי והפעולות המומלצות כבר מוכנים.',
    eyebrowLabel: 'מצב גיבוי',
    metrics: [
      { label: 'מצב נתונים', value: 'לא זמין', hint: 'נסה לרענן בעוד רגע.', tone: 'warning' },
      { label: 'מרכז התראות', value: 'מוכן', hint: 'הניווט וההתראות ממשיכים לעבוד.', tone: 'success' },
      { label: 'פעולות מהירות', value: 3, hint: 'המסכים המרכזיים עדיין זמינים.', tone: 'info' },
      { label: 'מסלול אישי', value: 'פעיל', hint: 'אפשר לפתוח את מסלול הפתיחה המותאם.', tone: 'neutral' },
    ],
    nextActions: [
      { title: 'עבור ללוח הקריאות', description: 'המסך הקריטי ביותר ממשיך להיות זמין גם בלי תמונת מצב מלאה.', href: '/tickets', icon: Ticket, accent: 'from-primary/18 to-amber-500/18' },
      { title: 'פתח התראות', description: 'בדוק אם יש עדכונים אחרונים שמצריכים פעולה ידנית.', href: '/notifications', icon: Bell, accent: 'from-sky-500/18 to-indigo-500/18' },
      { title: 'רענן את הדף', description: 'ברוב המקרים החיבור יחזור ויבנה מחדש את הסיכום המותאם.', href: '/home', icon: Command, accent: 'from-emerald-500/18 to-lime-500/18' },
    ],
    spotlightTitle: 'מה עדיין כן עובד',
    spotlightDescription: 'גם בזמן תקלה זמנית נשמרת דרך קצרה לחזור לעבודה.',
    spotlightItems: [
      'שכבת הפקודות החוצת-מערכת זמינה דרך מקש Command או Ctrl יחד עם K.',
      'מרכז ההתראות נשאר נגיש כדי שלא תפספס אירועים חדשים.',
      'המסלולים המרכזיים זמינים גם בלי בניית סיכום עשיר.',
    ],
    digestTitle: 'תקציר זמני',
    digestMarkdown: ['# תקציר זמני', `- תאריך: ${formatDate(new Date())}`, '- מצב נתונים: לא זמין כרגע', '- פעולה מומלצת: פתח את אחד המסכים המרכזיים והמשך עבודה רגילה עד לחזרת הקישוריות.'].join('\n'),
  };
}

function getOnboardingSteps(role: RoleKey) {
  const shared = [
    {
      title: 'התחל מהכרטיס העליון',
      description: 'שלושת המדדים הראשונים מייצגים את צוואר הבקבוק שלך עכשיו, לא סתם נתונים יפים.',
    },
    {
      title: 'השתמש בפעולה המומלצת הראשונה',
      description: 'המערכת ממיינת עבורך את המסך שכדאי לפתוח ראשון לפי תפקיד וסיכון פעיל.',
    },
  ];

  const roleSpecific: Record<RoleKey, { title: string; description: string }> = {
    ADMIN: { title: 'בדוק חריגות תחזוקה וסיכון SLA יחד', description: 'זו הצטלבות שמזהה איפה נדרש תיאום ניהולי ולא רק טיפול בודד.' },
    PM: { title: 'הפעל מיון חכם מתוך לוח הקריאות', description: 'המערכת כבר ממליצה על קטגוריה, עדיפות ושיוך, כדי לחסוך סבב ניחושים ידני.' },
    TECH: { title: 'סגור לולאה עם עדכון קצר מהשטח', description: 'עדכון אחד בזמן מקטין הסלמה ומשאיר את התמונה הניהולית נקייה.' },
    RESIDENT: { title: 'עקוב אחרי שירות ותשלומים מאותו מסך', description: 'אין צורך יותר לדלג בין אזור אישי, בקשות וקריאות כדי להבין את מצבך.' },
    ACCOUNTANT: { title: 'שלב יומן תפעול עם גבייה', description: 'כך תזהה חידושי חוזים, פירעונות והתראות לפני שהם הופכים לבור עבודה.' },
    MASTER: { title: 'התחל מסיכונים רוחביים', description: 'מרכז העבודה מיועד להציף לך חריגות שמצטברות בין צוותים, לא רק משימות בודדות.' },
  };

  return [...shared, roleSpecific[role]];
}

function getRoleQuickLinks(role: RoleKey, metrics: HomeMetric[], nextActions: HomeAction[]): HomeShortcut[] {
  const metricByLabel = (label: string) => metrics.find((metric) => metric.label === label)?.value;
  const byRole: Record<RoleKey, HomeShortcut[]> = {
    RESIDENT: [
      { title: 'בקשה חדשה', description: 'פניות, מסמכים וחניה.', href: '/resident/requests', icon: ClipboardList, badge: String(metricByLabel('התראות לא נקראו') ?? '') },
      { title: 'קריאת שירות', description: 'פתח קריאת תחזוקה.', href: '/create-call', icon: Ticket },
      { title: 'מסמכים', description: 'מסמכים חדשים ועדכוני ועד.', href: '/documents', icon: FileText },
      { title: 'הבניין שלי', description: 'מידע ואנשי קשר.', href: '/resident/account?section=building', icon: Building2 },
    ],
    TECH: [
      { title: 'עבודות', description: 'המשימות שלך להיום.', href: '/tech/jobs', icon: Wrench, badge: String(metricByLabel('קריאות פעילות') ?? '') },
      { title: 'גינון', description: 'תוכנית חודשית ואישור.', href: '/gardens', icon: CalendarClock },
      { title: 'עדכן סטטוס', description: 'מעבר מהיר לעדכונים שלי.', href: '/tickets?mine=true', icon: ClipboardList },
      { title: 'התראות', description: 'שינויים ותיאומים.', href: '/notifications', icon: Bell },
    ],
    PM: [
      { title: 'קריאות', description: 'טיפול ושיוך.', href: '/tickets', icon: Ticket, badge: String(metricByLabel('קריאות פתוחות') ?? '') },
      { title: 'בניינים', description: 'נכסים ויחידות פעילות.', href: '/buildings', icon: Building2 },
      { title: 'לו"ז', description: 'אירועים קרובים וחוזים.', href: '/operations/calendar', icon: CalendarClock },
      { title: 'ספקים', description: 'תקשורת וספקים.', href: '/communications', icon: Bell },
    ],
    ADMIN: [
      { title: 'קריאות', description: 'מוקד והסלמות.', href: '/tickets', icon: Ticket, badge: String(metricByLabel('סיכון SLA') ?? '') },
      { title: 'בקרה', description: 'סיכונים ובקרה רוחבית.', href: '/admin/dashboard', icon: Building2 },
      { title: 'תחזוקה', description: 'חריגות ואימותים.', href: '/maintenance', icon: Wrench },
      { title: 'יומן', description: 'לוח זמנים ותיאומים.', href: '/operations/calendar', icon: CalendarClock },
    ],
    ACCOUNTANT: [
      { title: 'תשלומים', description: 'גבייה ופירעונות.', href: '/payments', icon: CreditCard, badge: String(metricByLabel('קריאות פתוחות') ?? '') },
      { title: 'תקציבים', description: 'הוצאות וחריגות.', href: '/finance/budgets', icon: FileText },
      { title: 'דוחות', description: 'סיכומים וייצוא.', href: '/finance/reports', icon: Bell },
      { title: 'יומן', description: 'אירועי פירעון.', href: '/operations/calendar', icon: CalendarClock },
    ],
    MASTER: [
      { title: 'דשבורד', description: 'סיכונים והזדמנויות.', href: '/admin/dashboard', icon: Building2 },
      { title: 'קריאות', description: 'מוקדי עומס במערכת.', href: '/tickets', icon: Ticket },
    ],
  };

  return byRole[role].slice(0, 4);
}

function MetricCard({ metric }: { metric: HomeMetric }) {
  const tones = {
    success: 'border-emerald-500/20 bg-emerald-500/6',
    warning: 'border-amber-500/20 bg-amber-500/6',
    info: 'border-sky-500/20 bg-sky-500/6',
    neutral: 'border-subtle-border bg-background',
  };

  return (
    <Card variant="muted" className={`rounded-[22px] ${tones[metric.tone]}`}>
      <CardHeader className="pb-1 sm:pb-2">
        <CardDescription className="text-xs">{metric.label}</CardDescription>
        <CardTitle className="text-xl sm:text-2xl">{metric.value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs leading-5 text-secondary-foreground sm:text-sm sm:leading-6">{metric.hint}</CardContent>
    </Card>
  );
}

function ActionCard({ action }: { action: HomeAction }) {
  const Icon = action.icon;

  return (
    <Link
      href={action.href}
      className={`group flex items-start gap-3 rounded-[24px] border border-subtle-border bg-gradient-to-br ${action.accent} p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-card active:translate-y-0 sm:gap-4 sm:p-4`}
    >
      <div className="rounded-[18px] bg-background/88 p-2.5 text-primary shadow-sm sm:p-3">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
        <div className="flex items-center gap-2">
        <div className="text-sm font-semibold text-foreground sm:text-base">{action.title}</div>
          <ArrowLeft className="icon-directional h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground sm:h-4 sm:w-4" />
        </div>
        <div className="text-xs leading-5 text-secondary-foreground sm:text-sm sm:leading-7">{action.description}</div>
      </div>
    </Link>
  );
}

function getRoleStatusIcon(role: RoleKey) {
  switch (role) {
    case 'ADMIN':
      return <Building2 className="h-4 w-4" strokeWidth={1.75} />;
    case 'PM':
      return <Ticket className="h-4 w-4" strokeWidth={1.75} />;
    case 'TECH':
      return <Wrench className="h-4 w-4" strokeWidth={1.75} />;
    case 'RESIDENT':
      return <CreditCard className="h-4 w-4" strokeWidth={1.75} />;
    case 'ACCOUNTANT':
      return <FileText className="h-4 w-4" strokeWidth={1.75} />;
    default:
      return <Command className="h-4 w-4" strokeWidth={1.75} />;
  }
}
