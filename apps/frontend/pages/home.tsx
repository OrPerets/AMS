import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
import { MobilePriorityInbox, MobilePriorityInboxItem } from '../components/ui/mobile-priority-inbox';
import { MobileCardSkeleton } from '../components/ui/page-states';
import { PageHero } from '../components/ui/page-hero';
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
          ? 'Needs action'
          : action.title.includes('התראות') || action.title.includes('תשלומים')
            ? 'At risk'
            : 'In progress',
      tone: index === 0 ? 'warning' : index === 1 ? 'active' : 'neutral',
      title: action.title,
      reason: action.description,
      meta: snapshot.metrics[index]?.hint,
      href: action.href,
      ctaLabel: 'Open',
    }));
  }, [snapshot]);
  const recentActivity = useMemo(() => snapshot?.spotlightItems.slice(0, 3) ?? [], [snapshot]);
  const contextLabel = useMemo(() => {
    switch (role) {
      case 'RESIDENT':
        return 'Self-service workspace';
      case 'PM':
        return 'Portfolio action console';
      case 'ADMIN':
        return 'Executive control';
      case 'ACCOUNTANT':
        return 'Finance oversight';
      case 'TECH':
        return 'Field operations';
      default:
        return 'Operational workspace';
    }
  }, [role]);
  const contextChips = useMemo(
    () => (snapshot ? snapshot.metrics.slice(0, 2).map((metric) => `${metric.label}: ${metric.value}`) : []),
    [snapshot],
  );

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
      <MobileContextBar
        roleLabel={snapshot.roleTitle}
        contextLabel={contextLabel}
        syncLabel="Live portfolio sync"
        lastUpdated={formatDate(new Date())}
        chips={contextChips}
      />

      <motion.div variants={heroVariants} initial="initial" animate="animate">
        <PageHero
          className="mobile-only-glow"
          eyebrow={
            <>
              <StatusBadge label={snapshot.eyebrowLabel} tone="finance" />
              <Badge variant="outline" className="border-white/15 bg-white/8 text-white/80 text-[11px] sm:text-xs">
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
                <Button asChild variant="hero" size="sm" className="sm:h-11 sm:px-5 sm:text-sm">
                  <Link href={snapshot.nextActions[0].href}>{snapshot.nextActions[0].title}</Link>
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="border-white/15 bg-white/8 text-white hover:bg-white/12 sm:h-11 sm:px-5 sm:text-sm"
                onClick={() => setOnboardingOpen(true)}
              >
                <Sparkles className="me-1.5 h-3.5 w-3.5" />
                מסלול מהיר
              </Button>
            </>
          }
          aside={
            <div className="space-y-3">
              <div className="text-[11px] tracking-[0.16em] text-white/65 sm:text-xs sm:tracking-[0.18em]">Today in one view</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-3">
                {snapshot.metrics.slice(0, 3).map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-white/10 bg-white/6 p-2.5 sm:rounded-[20px] sm:p-3.5">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/50 sm:text-xs">{metric.label}</div>
                    <div className="mt-1 text-lg font-black sm:mt-2 sm:text-2xl">{metric.value}</div>
                    <div className="mt-0.5 hidden text-sm leading-6 text-white/65 sm:block">{metric.hint}</div>
                  </div>
                ))}
              </div>
            </div>
          }
        />
      </motion.div>

      <MobilePriorityInbox
        title="Priority inbox"
        subtitle="What changed, what needs action, and what could become a blocker if left alone."
        items={priorityItems}
      />

      <section className="space-y-3">
        <SectionHeader
          title="פעולות ראשיות"
          subtitle="Two-tap access to the actions this role uses most on mobile."
          meta="Primary actions"
        />
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
          {quickLinks.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 + index * 0.04, duration: 0.28 }}
            >
              <QuickActionCard item={item} />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="מדדים מרכזיים"
          subtitle="Compact numbers that explain workload, risk, and current balance without forcing a deep dive."
          meta="Key KPIs"
        />
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
          {snapshot.metrics.map((metric, index) => (
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
              title="Suggested next action"
              subtitle="A ranked list of the most useful actions for the role, based on current load and visible risk."
              meta="Next up"
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

        <Card variant="featured" className="overflow-hidden">
          <CardHeader>
            <SectionHeader
              title="Recent activity and signals"
              subtitle="Plain-language operational notes instead of decorative insight cards."
              meta="What changed"
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

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card variant="muted" className="overflow-hidden">
          <CardHeader>
            <SectionHeader
              title="Mobile summary"
              subtitle="One compressed strip for buyers and operators who need the state of play in seconds."
              meta="At a glance"
            />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {snapshot.metrics.slice(0, 3).map((metric) => (
              <div key={`summary-${metric.label}`} className="rounded-[22px] border border-subtle-border/80 bg-background/80 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-tertiary">{metric.label}</div>
                <div className="mt-2 text-xl font-black text-foreground">{metric.value}</div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">{metric.hint}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="elevated" className="overflow-hidden">
          <CardHeader>
            <SectionHeader
              title="Operational digest"
              subtitle="A shareable, audit-friendly summary for weekly review or handoff."
              meta="Digest"
              actions={
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(snapshot.digestMarkdown)}>
                    Copy digest
                  </Button>
                  <Button asChild>
                    <Link href={snapshot.nextActions[0]?.href || '/home'}>
                      Continue
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
  if (role === 'RESIDENT' && currentUserId) {
    const response = await authFetch(`/api/v1/invoices/account/${currentUserId}`);
    if (!response.ok) throw new Error('resident snapshot failed');
    const data = await response.json();

    const nextActions: HomeAction[] = [
      data.summary?.overdueInvoices
        ? {
            title: 'סגור תשלום בפיגור',
            description: 'יש כרגע חיובים שדורשים טיפול מיידי כדי למנוע פנייה לשירות.',
            href: '/resident/account#payments',
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
      eyebrowLabel: 'Resident flow',
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
    const [ticketsResponse, notificationsResponse] = await Promise.all([
      authFetch(`/api/v1/tickets?view=dispatch&assigneeId=${currentUserId}&limit=24`),
      authFetch(`/api/v1/notifications/user/${currentUserId}`),
    ]);
    if (!ticketsResponse.ok || !notificationsResponse.ok) throw new Error('tech snapshot failed');
    const tickets = await ticketsResponse.json();
    const notifications = await notificationsResponse.json();
    const urgentCount = tickets.items?.filter((item: any) => item.severity === 'URGENT' && item.status !== 'RESOLVED').length ?? 0;
    const riskCount = (tickets.riskSummary?.atRisk ?? 0) + (tickets.riskSummary?.dueToday ?? 0) + (tickets.riskSummary?.breached ?? 0);

    return {
      roleTitle: roleTitles[role],
      headline: 'היום שלך כבר מסודר לפי דחיפות',
      description: 'במקום לפתוח כמה מסכים, המרכז מציג את הקריאות שהכי חשוב להתחיל מהן, את עומס הסיכון ואת נקודות החיכוך שעלולות לעכב יציאה לשטח.',
      eyebrowLabel: 'Field operations',
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

  const [ticketsResponse, exceptionsResponse, operationsResponse, notificationsResponse] = await Promise.all([
    authFetch('/api/v1/tickets?view=dispatch&limit=40'),
    authFetch('/api/v1/maintenance/exceptions'),
    authFetch('/api/v1/operations/calendar'),
    currentUserId ? authFetch(`/api/v1/notifications/user/${currentUserId}`) : Promise.resolve(null),
  ]);
  if (!ticketsResponse.ok || !exceptionsResponse.ok || !operationsResponse.ok) throw new Error('ops snapshot failed');

  const tickets = await ticketsResponse.json();
  const exceptions = await exceptionsResponse.json();
  const operations = await operationsResponse.json();
  const notifications = notificationsResponse?.ok ? await notificationsResponse.json() : [];
  const riskCount = (tickets.riskSummary?.atRisk ?? 0) + (tickets.riskSummary?.dueToday ?? 0) + (tickets.riskSummary?.breached ?? 0);
  const openWorkOrders = exceptions.summary?.openWorkOrders ?? 0;

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
      description: `מרוכזים שם ${operations.summary?.total ?? 0} אירועים קרובים של תחזוקה, חוזים ופירעונות.`,
      href: '/operations/calendar',
      icon: CalendarClock,
      accent: 'from-sky-500/18 to-cyan-500/18',
    },
    {
      title: role === 'ACCOUNTANT' ? 'עבור למסך התשלומים' : 'עבור ללוח הניהול',
      description: role === 'ACCOUNTANT' ? 'גבייה, פירעונות וניתוח מגמות במקום אחד.' : 'תמונת מערכת רחבה עם KPI, סיכונים ואירועים ניהוליים.',
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
    eyebrowLabel: role === 'ACCOUNTANT' ? 'Finance control' : 'Operations intelligence',
    metrics: [
      { label: 'קריאות פתוחות', value: tickets.summary?.open ?? 0, hint: 'כלל התור הפעיל כרגע במערכת.', tone: 'info' },
      { label: 'סיכון SLA', value: riskCount, hint: 'כולל קריאות בחריגה, יעד היום או סיכון קרוב.', tone: 'warning' },
      { label: 'תחזוקה לא מאומתת', value: exceptions.summary?.unverifiedMaintenance ?? 0, hint: 'פעולות שבוצעו אבל עדיין לא נסגרו כראוי.', tone: 'warning' },
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
      exceptions.summary?.unverifiedMaintenance
        ? `יש ${exceptions.summary.unverifiedMaintenance} פעולות תחזוקה שבוצעו ועדיין לא אומתו. זה סיכון שקט שכדאי לסגור.`
        : 'אין כרגע פעולות תחזוקה ממתינות לאימות, וזה משחרר זמן להסתכלות קדימה.',
      operations.summary?.total
        ? `ביומן התפעול מחכים ${operations.summary.total} אירועים קרובים. שימוש ביומן עכשיו חוסך הפתעות מאוחרות יותר.`
        : 'לא זוהו אירועים תפעוליים חריגים בטווח הקרוב.',
    ],
    digestTitle: role === 'ACCOUNTANT' ? 'דוח שבועי אוטומטי לכספים' : 'תקציר ניהולי אוטומטי לשבוע הקרוב',
    digestMarkdown: [
      role === 'ACCOUNTANT' ? '# תקציר כספים שבועי' : '# תקציר תפעולי שבועי',
      `- תאריך: ${formatDate(new Date())}`,
      `- קריאות פתוחות: ${tickets.summary?.open ?? 0}`,
      `- קריאות בסיכון SLA: ${riskCount}`,
      `- תחזוקה לא מאומתת: ${exceptions.summary?.unverifiedMaintenance ?? 0}`,
      `- הזמנות עבודה פתוחות: ${openWorkOrders}`,
      `- אירועים ביומן התפעול: ${operations.summary?.total ?? 0}`,
      `- התראות שלא נקראו: ${Array.isArray(notifications) ? notifications.filter((item: any) => !item.read).length : 0}`,
      ``,
      `המלצה לשבוע הקרוב: ${nextActions[0].description}`,
    ].join('\n'),
  };
}

function buildFallbackSnapshot(role: RoleKey): HomeSnapshot {
  return {
    roleTitle: roleTitles[role],
    headline: 'מרכז עבודה חכם בבנייה',
    description: 'החיבור לנתונים לא הצליח כרגע, אבל שכבת הניווט, המסלול האישי והפעולות המומלצות כבר מוכנים.',
    eyebrowLabel: 'Fallback mode',
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
      'שכבת הפקודות החוצת-מערכת זמינה דרך Cmd/Ctrl + K.',
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
    PM: { title: 'הפעל triage חכם מתוך לוח הקריאות', description: 'המערכת כבר ממליצה על קטגוריה, עדיפות ושיוך, כדי לחסוך סבב ניחושים ידני.' },
    TECH: { title: 'סגור לולאה עם עדכון קצר מהשטח', description: 'עדכון אחד בזמן מקטין הסלמה ומשאיר את התמונה הניהולית נקייה.' },
    RESIDENT: { title: 'עקוב אחרי שירות ותשלומים מאותו מסך', description: 'אין צורך יותר לדלג בין אזור אישי, בקשות וקריאות כדי להבין את מצבך.' },
    ACCOUNTANT: { title: 'שלב יומן תפעול עם גבייה', description: 'כך תזהה חידושי חוזים, פירעונות והתראות לפני שהם הופכים לבור עבודה.' },
    MASTER: { title: 'התחל מסיכונים רוחביים', description: 'מרכז העבודה מיועד להציף לך חריגות שמצטברות בין צוותים, לא רק משימות בודדות.' },
  };

  return [...shared, roleSpecific[role]];
}

function getRoleQuickLinks(role: RoleKey, metrics: HomeMetric[], nextActions: HomeAction[]): HomeShortcut[] {
  const metricByLabel = (label: string) => metrics.find((metric) => metric.label === label)?.value;
  const actionMap = nextActions.map(({ title, description, href, icon }) => ({ title, description, href, icon }));

  const common: HomeShortcut[] = [
    ...actionMap.slice(0, 2),
    { title: 'התראות', description: 'כל מה שנכנס עכשיו לפי דחיפות וסוג טיפול.', href: '/notifications', icon: Bell },
    { title: 'הגדרות', description: 'שפה, התראות, אבטחה והעדפות אישיות.', href: '/settings', icon: Command },
  ];

  const byRole: Record<RoleKey, HomeShortcut[]> = {
    RESIDENT: [
      { title: 'בקשות דייר', description: 'מסלולים מוכנים לפניות, מסמכים וחניה.', href: '/resident/requests', icon: ClipboardList, badge: String(metricByLabel('התראות לא נקראו') ?? '') },
      { title: 'האזור האישי', description: 'תשלומים, מסמכים וסטטוס השירות במקום אחד.', href: '/resident/account', icon: CreditCard },
    ],
    TECH: [
      { title: 'עבודות שטח', description: 'רשימת המשימות שלך עם סדר עדיפויות ברור.', href: '/tech/jobs', icon: Wrench },
      { title: 'לוח קריאות', description: 'עדכון סטטוס מהיר מתוך הטלפון.', href: '/tickets', icon: Ticket },
    ],
    PM: [
      { title: 'בניינים', description: 'מעקב מהיר אחר הבניינים והיחידות הפעילות.', href: '/buildings', icon: Building2 },
      { title: 'יומן תפעול', description: 'אירועים קרובים, תחזוקה וחוזים.', href: '/operations/calendar', icon: CalendarClock },
    ],
    ADMIN: [
      { title: 'דשבורד ניהולי', description: 'תצוגה רוחבית של המערכת והסיכונים.', href: '/admin/dashboard', icon: Building2 },
      { title: 'יומן תפעול', description: 'לוח זמנים ותיאומים קרובים.', href: '/operations/calendar', icon: CalendarClock },
    ],
    ACCOUNTANT: [
      { title: 'תשלומים', description: 'גבייה, פירעונות וניסיונות חיוב.', href: '/payments', icon: CreditCard },
      { title: 'תקציבים', description: 'מעקב שוטף אחרי הוצאות וחריגות.', href: '/finance/budgets', icon: FileText },
    ],
    MASTER: [
      { title: 'דשבורד ניהולי', description: 'תמונה רחבה של סיכונים והזדמנויות.', href: '/admin/dashboard', icon: Building2 },
      { title: 'לוח קריאות', description: 'מעבר מהיר למוקדי העומס במערכת.', href: '/tickets', icon: Ticket },
    ],
  };

  return [...byRole[role], ...common].slice(0, 4);
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
      <CardContent className="text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">{metric.hint}</CardContent>
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
          <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground sm:h-4 sm:w-4" />
        </div>
        <div className="text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-7">{action.description}</div>
      </div>
    </Link>
  );
}

function QuickActionCard({ item }: { item: HomeShortcut }) {
  const Icon = item.icon;

  return (
    <Link href={item.href} className="group block">
      <Card variant="action" className="h-full p-0">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-primary/12 bg-primary/10 text-primary shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
            {item.badge ? <Badge variant="finance">{item.badge}</Badge> : null}
          </div>
          <div className="space-y-1.5">
            <div className="text-sm font-semibold text-foreground sm:text-[15px]">{item.title}</div>
            <div className="text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">{item.description}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
