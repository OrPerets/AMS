import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Bell, Building2, ClipboardList, CreditCard, FileText, MapPinned, MessageCircle, ShieldCheck, Ticket, UserRound } from 'lucide-react';
import { authFetch, getCurrentUserId, getEffectiveRole } from '../../lib/auth';
import { cn, formatCurrency, formatDate, getTicketStatusTone } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { ResidentHero } from '../../components/resident/resident-hero';
import { getResumeState, setResumeState } from '../../lib/engagement';
import { trackResumeClick } from '../../lib/analytics';

type AccountContext = {
  user: { id: number; email: string; role: string };
  residentId: number | null;
  units: Array<{
    id: number;
    number: string;
    building: {
      id: number;
      name: string;
      address: string;
    };
  }>;
  notifications: Array<{ id: number; title: string; message: string; createdAt: string; read: boolean }>;
  documents: Array<{ id: number; name: string; category?: string | null; url: string; uploadedAt: string }>;
  tickets: Array<{
    id: number;
    status: string;
    severity?: string | null;
    description?: string | null;
    createdAt: string;
    unit: { number: string; building: { name: string } };
  }>;
};

type ResidentFinance = {
  summary: {
    currentBalance: number;
    unpaidInvoices: number;
    overdueInvoices: number;
    openTickets: number;
    unreadNotifications: number;
  };
  invoices: Array<{
    id: number;
    amount: number;
    dueDate: string;
    paidAt?: string | null;
    status: string;
    description: string;
  }>;
};

const payableStatuses = new Set(['UNPAID', 'OVERDUE']);

export default function ResidentAccountPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [context, setContext] = useState<AccountContext | null>(null);
  const [finance, setFinance] = useState<ResidentFinance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    if (router.query.section === 'building') {
      void router.replace('/resident/building');
      return;
    }

    if (router.query.section === 'methods') {
      void router.replace('/resident/payment-methods');
      return;
    }

    void loadAccount();
  }, [router.isReady, router.query.section]);

  async function loadAccount() {
    try {
      setLoading(true);
      setError(null);
      const accountRes = await authFetch('/api/v1/users/account');
      if (!accountRes.ok) {
        throw new Error(await accountRes.text());
      }

      const nextContext = (await accountRes.json()) as AccountContext;
      setContext(nextContext);

      if (!nextContext.residentId) {
        setFinance(null);
        return;
      }

      const financeRes = await authFetch(`/api/v1/invoices/account/${nextContext.residentId}`);
      if (!financeRes.ok) {
        throw new Error(await financeRes.text());
      }

      setFinance(await financeRes.json());
    } catch (nextError) {
      console.error(nextError);
      setError('לא ניתן לטעון כעת את האזור האישי.');
    } finally {
      setLoading(false);
    }
  }

  const primaryUnit = context?.units[0] ?? null;
  const primaryBuilding = primaryUnit?.building ?? null;
  const residentName = context?.user?.email?.split('@')[0] || 'דייר';
  const openTickets = useMemo(() => (context?.tickets ?? []).filter((ticket) => ticket.status !== 'RESOLVED'), [context?.tickets]);
  const unreadNotifications = useMemo(() => (context?.notifications ?? []).filter((item) => !item.read), [context?.notifications]);
  const recentDocuments = useMemo(() => [...(context?.documents ?? [])].slice(0, 2), [context?.documents]);
  const newestDocument = recentDocuments[0] ?? null;
  const newestNotification = unreadNotifications[0] ?? null;
  const locale = 'he';
  const labels = {
    home: 'האזור האישי',
    actions: 'פעולות מהירות',
    updatesReady: '{{count}} עדכונים חדשים מחכים לך',
    updatesClear: 'כל העדכונים האחרונים נקראו',
  };
  const nextPaymentDue = useMemo(
    () =>
      [...(finance?.invoices ?? [])]
        .filter((invoice) => payableStatuses.has(invoice.status))
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0],
    [finance?.invoices],
  );

  const residentPrimaryAction = (() => {
    if (nextPaymentDue) {
      return {
        eyebrow: nextPaymentDue.status === 'OVERDUE' ? 'לתשלום מיידי' : 'חיוב קרוב',
        title: formatCurrency(nextPaymentDue.amount, 'ILS', locale),
        description: `${nextPaymentDue.description} · עד ${formatDate(nextPaymentDue.dueDate, locale)}`,
        ctaLabel: 'שלם עכשיו',
        href: '/payments/resident',
        tone: nextPaymentDue.status === 'OVERDUE' ? ('danger' as const) : ('warning' as const),
      };
    }

    if (openTickets[0]) {
      return {
        eyebrow: 'מעקב קריאה',
        title: `קריאה #${openTickets[0].id}`,
        description: openTickets[0].description?.trim() || `${openTickets[0].unit.building.name} · דירה ${openTickets[0].unit.number}`,
        ctaLabel: 'עקוב אחרי הקריאה',
        href: '/resident/requests?view=history',
        tone: getTicketStatusTone(openTickets[0].status) === 'danger' ? ('danger' as const) : ('default' as const),
      };
    }

    if (newestDocument) {
      return {
        eyebrow: 'מסמך חדש',
        title: newestDocument.name,
        description: `עלה ב-${formatDate(newestDocument.uploadedAt, locale)} ונמצא במסמכים שלך.`,
        ctaLabel: 'פתח מסמכים',
        href: '/documents',
        tone: 'default' as const,
      };
    }

    if (newestNotification) {
      return {
        eyebrow: 'עדכון חדש',
        title: newestNotification.title,
        description: newestNotification.message,
        ctaLabel: 'פתח עדכונים',
        href: '/notifications',
        tone: 'default' as const,
      };
    }

    return {
      eyebrow: 'הכול בשליטה',
      title: 'אין משהו דחוף כרגע',
      description: 'אפשר לפתוח בקשה חדשה, לדווח על תקלה או לבדוק מסמכים ועדכונים אחרונים.',
      ctaLabel: 'בקשה חדשה',
      href: '/resident/requests?view=new',
      tone: 'success' as const,
    };
  })();

  const heroSubline = primaryUnit
    ? `דירה ${primaryUnit.number}${primaryBuilding?.name ? ` · ${primaryBuilding.name}` : ''}`
    : 'חשבון דייר פעיל';
  const heroSupportLine = primaryBuilding?.address || 'גישה מהירה לתשלומים, קריאות, מסמכים ועדכונים.';
  const spotlight = nextPaymentDue
    ? {
        label: nextPaymentDue.status === 'OVERDUE' ? 'לתשלום מיידי' : 'חיוב קרוב',
        value: formatCurrency(nextPaymentDue.amount, 'ILS', locale),
        description: `${nextPaymentDue.description} · עד ${formatDate(nextPaymentDue.dueDate, locale)}`,
        progress: finance?.summary.currentBalance
          ? Math.min(100, Math.round((nextPaymentDue.amount / Math.max(finance.summary.currentBalance, 1)) * 100))
          : 72,
        tone: nextPaymentDue.status === 'OVERDUE' ? ('danger' as const) : ('warning' as const),
      }
    : finance?.summary.currentBalance
      ? {
          label: finance.summary.currentBalance > 0 ? 'יתרה פתוחה' : 'מצב חשבון',
          value: formatCurrency(finance.summary.currentBalance, 'ILS', locale),
          description: finance.summary.currentBalance > 0 ? 'אפשר לעבור לתשלום או לפירוט החשבון.' : 'כל החיובים כרגע סגורים.',
          progress: finance.summary.currentBalance > 0 ? 58 : 100,
          tone: finance.summary.currentBalance > 0 ? ('warning' as const) : ('success' as const),
        }
      : openTickets.length
        ? {
            label: 'קריאות פתוחות',
            value: openTickets.length,
            description: 'מעקב חי אחרי סטטוס הטיפול והעדכונים האחרונים.',
            progress: Math.min(openTickets.length * 22, 100),
            tone: openTickets.length > 1 ? ('warning' as const) : ('default' as const),
          }
        : {
            label: 'הכול בשליטה',
            value: unreadNotifications.length,
            description: unreadNotifications.length ? 'עדכונים חדשים מחכים לעיון.' : 'אין כרגע משהו דחוף לטפל בו.',
            progress: unreadNotifications.length ? 44 : 100,
        tone: unreadNotifications.length ? ('default' as const) : ('success' as const),
          };
  const actionItems = [
    {
      id: 'pay',
      label: nextPaymentDue ? 'שלם עכשיו' : 'מרכז תשלומים',
      description: nextPaymentDue ? residentPrimaryAction.description : 'יתרה, קבלות ואמצעי תשלום במקום אחד.',
      href: '/payments/resident',
      icon: CreditCard,
      badge: finance?.summary.unpaidInvoices ? finance.summary.unpaidInvoices : undefined,
      accent: nextPaymentDue ? ('warning' as const) : ('primary' as const),
    },
    {
      id: 'request',
      label: 'בקשה חדשה',
      description: 'פתיחה קצרה עם צפי טיפול ברור.',
      href: '/resident/requests?view=new',
      icon: ClipboardList,
      accent: 'primary' as const,
    },
    {
      id: 'call',
      label: openTickets.length ? 'מעקב קריאות' : 'קריאת תחזוקה',
      description: openTickets.length ? 'בדוק מה בטיפול כרגע.' : 'דיווח מהיר עם צילום כשצריך.',
      href: openTickets.length ? '/resident/requests?view=history' : '/create-call',
      icon: Ticket,
      badge: openTickets.length || undefined,
      accent: openTickets.length ? ('warning' as const) : ('neutral' as const),
    },
    {
      id: 'contact',
      label: primaryBuilding ? 'הבניין שלי' : 'צור קשר',
      description: primaryBuilding?.name || 'תמיכה וניהול',
      href: primaryBuilding ? '/resident/building' : '/support',
      icon: primaryBuilding ? Building2 : MessageCircle,
      accent: 'neutral' as const,
    },
  ];

  const userId = getCurrentUserId();
  const role = getEffectiveRole();
  const resumeState = useMemo(() => getResumeState('resident', userId, role), [userId, role]);
  const showResume = resumeState && resumeState.href !== '/resident/account' && resumeState.href !== router.asPath;
  const unreadNotificationsSummary = unreadNotifications.length
    ? `${unreadNotifications.length} עדכונים חדשים`
    : 'הכול נקרא';
  const residentSignals = [
    {
      id: 'signal-balance',
      label: 'יתרה',
      value: finance ? formatCurrency(finance.summary.currentBalance, 'ILS', locale) : '—',
      href: '/payments/resident',
      tone: nextPaymentDue ? ('warning' as const) : ('success' as const),
      hint: nextPaymentDue ? 'למסך תשלומים' : 'צפייה בחיובים',
    },
    {
      id: 'signal-requests',
      label: 'קריאות',
      value: openTickets.length,
      href: openTickets.length ? '/resident/requests?view=history' : '/create-call',
      tone: openTickets.length ? ('warning' as const) : ('success' as const),
      hint: openTickets.length ? 'למעקב עכשיו' : 'פתח קריאה',
    },
    {
      id: 'signal-updates',
      label: 'עדכונים',
      value: unreadNotifications.length,
      href: '/notifications',
      tone: unreadNotifications.length ? ('info' as const) : ('default' as const),
      hint: unreadNotifications.length ? 'פתח מרכז עדכונים' : 'כל ההתראות נקראו',
    },
  ];
  const updatesPreview = newestNotification?.message || 'כל ההתראות, האישורים והעדכונים האחרונים מרוכזים במסך אחד.';

  useEffect(() => {
    if (!loading && context) {
      setResumeState({ screen: 'resident', href: '/resident/account', label: 'האזור האישי', role: role || 'RESIDENT', userId });
    }
  }, [loading, context, role, userId]);

  if (loading) return <DetailPanelSkeleton />;
  if (error || !context) {
    return (
      <InlineErrorPanel
        title="האזור האישי לא נטען"
        description={error || 'לא נמצאו נתונים'}
        onRetry={() => void loadAccount()}
      />
    );
  }

  return (
    <div dir="rtl" className="mx-auto w-full max-w-md space-y-4 pb-24 text-right sm:max-w-4xl sm:space-y-5">
      {showResume ? (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="gold-sheen-surface rounded-[24px] px-4 py-3"
          data-accent-sheen="true"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">המשך מאיפה שעצרת</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{resumeState.label}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-full"
              onClick={() => trackResumeClick('resident', resumeState.href)}
            >
              <Link href={resumeState.href}>
                המשך
                <ArrowLeft className="ms-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </motion.div>
      ) : null}

      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: 'easeOut' }}
      >
        <ResidentHero
          eyebrow="מרכז השליטה האישי"
          title={labels.home}
          subtitle="הכול מתחיל מפעולה אחת ברורה, והשאר נשאר נגיש אבל שקט."
          badge={<div className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white">חשבון דייר</div>}
          floatingCard={
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/72">
                    {primaryBuilding?.name || labels.home}
                  </div>
                  <h1 className="mt-1 text-[30px] font-black leading-[1.02] tracking-[-0.02em] text-foreground">{residentName}</h1>
                  <p className="mt-1 text-[14px] leading-6 text-secondary-foreground">{heroSubline}</p>
                  <p className="mt-1 text-[13px] leading-5 text-secondary-foreground/90">{heroSupportLine}</p>
                </div>
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[radial-gradient(circle_at_30%_30%,rgba(255,244,220,0.96),rgba(221,174,80,0.94)_38%,rgba(101,70,28,1)_100%)] text-white shadow-[0_18px_34px_rgba(207,146,50,0.28)]">
                  <UserRound className="h-10 w-10" strokeWidth={1.8} />
                </div>
              </div>

              <div className="gold-sheen-surface rounded-[26px] p-4" data-accent-sheen="true">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold tracking-[0.16em] text-secondary-foreground">{spotlight.label}</div>
                    <div className="mt-2 text-[38px] font-black leading-none text-foreground">
                      <bdi>{spotlight.value}</bdi>
                    </div>
                  </div>
                  <HeroStatusBadge
                    icon={nextPaymentDue ? <CreditCard className="h-4 w-4" strokeWidth={1.8} /> : <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />}
                    label={nextPaymentDue ? 'לתשלום' : 'מבט מהיר'}
                  />
                </div>
                <div className="mt-2 text-[15px] leading-6 text-secondary-foreground">{spotlight.description}</div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                {residentSignals.map((signal) => (
                  <HeroSignalChip key={signal.id} label={signal.label} value={signal.value} href={signal.href} hint={signal.hint} tone={signal.tone} />
                ))}
              </div>
            </div>
          }
          bodyClassName="pt-0"
        >
          <div className="space-y-3">
            <Button size="lg" className="min-h-[56px] w-full rounded-full text-base" asChild>
              <Link href={residentPrimaryAction.href}>
                {residentPrimaryAction.ctaLabel}
                <ArrowUpRight className="icon-directional me-2 h-4 w-4" strokeWidth={1.85} />
              </Link>
            </Button>
            <div className="grid gap-2.5 min-[420px]:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[24px] border border-divider/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] p-3.5 shadow-[0_12px_24px_rgba(44,28,9,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold tracking-[0.16em] text-primary/70">{residentPrimaryAction.eyebrow}</div>
                    <div className="mt-1 text-[16px] font-semibold text-foreground">{residentPrimaryAction.title}</div>
                  </div>
                  <span className="rounded-full border border-primary/12 bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {residentPrimaryAction.ctaLabel}
                  </span>
                </div>
                <div className="mt-1 text-[13px] leading-5 text-secondary-foreground">{residentPrimaryAction.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
              <Button
                size="lg"
                variant="outline"
                className="min-h-[52px] rounded-full border-primary/14 bg-white/76 text-foreground hover:bg-white"
                asChild
              >
                <Link href="/resident/requests?view=new">בקשה חדשה</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-[52px] rounded-full border-primary/14 bg-white/76 text-foreground hover:bg-white"
                asChild
              >
                <Link href="/resident/profile">
                  הפרופיל שלי
                  <UserRound className="me-2 h-4 w-4" strokeWidth={1.85} />
                </Link>
              </Button>
              </div>
            </div>
          </div>
        </ResidentHero>
      </motion.section>

      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.04, ease: 'easeOut' }}
        className="grid gap-3"
      >
        <div className="rounded-[26px] border border-divider/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] px-4 py-4 shadow-[0_12px_24px_rgba(44,28,9,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold tracking-[0.16em] text-primary/70">היום במסך</div>
              <div className="mt-1 text-[18px] font-semibold text-foreground">
                {newestNotification?.title || newestDocument?.name || (primaryBuilding ? primaryBuilding.name : 'החשבון מעודכן')}
              </div>
              <div className="mt-1 text-[13px] leading-5 text-secondary-foreground">
                {newestNotification?.message || (newestDocument ? `מסמך חדש עלה ב-${formatDate(newestDocument.uploadedAt, locale)}.` : primaryBuilding?.address || 'אין כרגע משהו דחוף, אז אפשר להתקדם ישירות לפעולה שצריך.')}
              </div>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 rounded-full px-3 text-[12px]" asChild>
              <Link href={newestNotification ? '/notifications' : newestDocument ? '/documents' : primaryBuilding ? '/resident/building' : '/resident/requests?view=new'}>
                פתח
                <ArrowUpRight className="icon-directional ms-1 h-3.5 w-3.5" strokeWidth={1.8} />
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <motion.section
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.05, ease: 'easeOut' }}
            className="rounded-[30px] border border-divider/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] px-4 pb-4 pt-4 shadow-[0_18px_40px_rgba(44,28,9,0.06)]"
          >
            <div className="mb-3">
              <h2 className="text-[18px] font-semibold text-foreground">המשך מהיר</h2>
              <div className="mt-1 text-[12px] text-secondary-foreground">מעט מסלולים, כל אחד עושה דבר אחד ברור.</div>
            </div>
            <div className="space-y-2.5">
              {actionItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-[24px] border px-3.5 py-3.5 transition hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_12px_24px_rgba(44,28,9,0.06)]',
                      item.accent === 'primary'
                        ? 'gold-sheen-surface border-primary/14'
                        : item.accent === 'warning'
                          ? 'border-warning/18 bg-[linear-gradient(180deg,rgba(255,251,240,0.98)_0%,rgba(255,255,255,0.94)_100%)]'
                          : 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.94)_100%)]',
                    )}
                    data-accent-sheen={item.accent === 'primary' ? 'true' : undefined}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-primary/12 bg-primary/8 text-primary">
                        <Icon className="h-5 w-5" strokeWidth={1.85} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-foreground">{item.label}</span>
                          {item.badge !== undefined ? (
                            <span className="rounded-full border border-primary/12 bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-primary">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 text-[12px] leading-5 text-secondary-foreground">{item.description}</div>
                      </div>
                    </div>
                    <ArrowUpRight className="icon-directional h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                  </Link>
                );
              })}
            </div>
          </motion.section>
        </div>

        <div className="space-y-4">
          <motion.section
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.15, ease: 'easeOut' }}
            className="rounded-[26px] border border-divider/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] px-3.5 pb-3.5 pt-3.5 shadow-[0_12px_24px_rgba(44,28,9,0.05)]"
          >
            <CompactSectionHeader
              icon={<Bell className="h-4 w-4" strokeWidth={1.8} />}
              title="עדכונים"
              subtitle={unreadNotificationsSummary}
              actionLabel="פתח"
              actionHref="/notifications"
            />
            <div className="rounded-[20px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)] p-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                  <Bell className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold text-foreground">
                    {newestNotification?.title || (unreadNotifications.length ? labels.updatesReady.replace('{{count}}', String(unreadNotifications.length)) : labels.updatesClear)}
                  </div>
                  <div className="mt-0.5 text-[13px] leading-5 text-secondary-foreground">
                    {updatesPreview}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
            className="rounded-[26px] border border-divider/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] px-3.5 pb-3.5 pt-3.5 shadow-[0_12px_24px_rgba(44,28,9,0.05)]"
          >
            <CompactSectionHeader
              icon={<Building2 className="h-4 w-4" strokeWidth={1.8} />}
              title={primaryBuilding ? 'הבניין שלי' : 'קשר ומידע'}
              subtitle={primaryBuilding?.name || 'תמיכה וניהול'}
              actionLabel={primaryBuilding ? 'פתח' : 'תמיכה'}
              actionHref={primaryBuilding ? '/resident/building' : '/support'}
            />
            {primaryBuilding ? (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/resident/building" className="rounded-[20px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)] p-3 transition hover:-translate-y-0.5 hover:border-primary/18">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/8 text-primary">
                    <MapPinned className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <div className="mt-2 text-[15px] font-semibold text-foreground">{primaryBuilding.name}</div>
                  <div className="mt-0.5 line-clamp-2 text-[12px] leading-5 text-secondary-foreground">{primaryBuilding.address}</div>
                </Link>
                <Link href="/support" className="rounded-[20px] border border-subtle-border bg-white/82 p-3 transition hover:-translate-y-0.5 hover:border-primary/18">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/8 text-primary">
                    <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <div className="mt-2 text-[15px] font-semibold text-foreground">תמיכה</div>
                  <div className="mt-0.5 line-clamp-2 text-[12px] leading-5 text-secondary-foreground">
                    {newestNotification?.title || 'פנייה לצוות הניהול והתמיכה.'}
                  </div>
                </Link>
              </div>
            ) : (
              <EmptyState type="action" size="sm" title="אין מידע משלים" description="כשהבניין או פרטי התמיכה ייטענו, נראה אותם כאן." action={{ label: 'רענן', onClick: () => void loadAccount() }} />
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}

function HeroSignalChip({
  label,
  value,
  href,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  href: string;
  hint: string;
  tone?: 'default' | 'warning' | 'success' | 'info';
}) {
  const toneClass =
    tone === 'warning'
      ? 'border-warning/18 bg-warning/10'
      : tone === 'success'
        ? 'border-success/18 bg-success/10'
        : tone === 'info'
          ? 'border-info/18 bg-info/10'
          : 'border-white/12 bg-white/8';

  return (
    <Link
      href={href}
      className={cn(
        'rounded-[20px] border px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm transition hover:-translate-y-0.5',
        toneClass,
      )}
    >
      <div className="text-[11px] font-semibold text-white/68">{label}</div>
      <div className="mt-1.5 text-[22px] font-black tabular-nums text-white">
        <bdi>{value}</bdi>
      </div>
      <div className="mt-1 text-[11px] text-white/70">{hint}</div>
    </Link>
  );
}

function HeroStatusBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] font-semibold text-white">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function CompactSectionHeader({
  icon,
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[16px] font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/8 text-primary">{icon}</span>
          <span>{title}</span>
        </div>
        <div className="mt-1 truncate text-[12px] text-secondary-foreground">{subtitle}</div>
      </div>
      <Button variant="outline" size="sm" className="shrink-0 rounded-full px-3 text-[12px]" asChild>
        <Link href={actionHref}>
          {actionLabel}
          <ArrowUpRight className="icon-directional ms-1 h-3.5 w-3.5" strokeWidth={1.8} />
        </Link>
      </Button>
    </div>
  );
}
