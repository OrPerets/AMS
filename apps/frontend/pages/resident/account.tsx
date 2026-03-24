import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Bell, Building2, ClipboardList, CreditCard, FileText, MapPinned, MessageCircle, Sparkles, Ticket, UserRound, WalletCards } from 'lucide-react';
import { authFetch, getCurrentUserId, getEffectiveRole } from '../../lib/auth';
import { useLocale } from '../../lib/providers';
import { cn, formatCurrency, formatDate, getStatusLabel, getTicketStatusTone } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
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
  const { locale } = useLocale();
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
  const labels = locale === 'en'
    ? {
        home: 'My account',
        activeNow: 'Needs attention now',
        activeNowSubtitle: 'The next item to pay, track, or open.',
        actions: 'Quick actions',
        recentDocs: 'Recent documents',
        allDocs: 'All documents',
        noUrgent: 'Nothing urgent right now',
        noUrgentDesc: 'When a charge, request, or new update appears, it will show here first.',
        docsEmpty: 'No recent documents',
        docsEmptyDesc: 'New committee files and updates will appear here.',
        updatesReady: '{{count}} new updates are waiting',
        updatesClear: 'You are up to date',
      }
    : {
        home: 'האזור האישי',
        activeNow: 'פעיל עכשיו',
        activeNowSubtitle: 'הפריט הבא שכדאי לשלם, לעקוב אחריו או לפתוח.',
        actions: 'פעולות מהירות',
        recentDocs: 'מסמכים אחרונים',
        allDocs: 'לכל המסמכים',
        noUrgent: 'אין משהו דחוף כרגע',
        noUrgentDesc: 'כשתיפתח קריאה, יופיע חיוב או ייכנס עדכון חדש, נראה אותו כאן.',
        docsEmpty: 'אין מסמכים חדשים',
        docsEmptyDesc: 'כשהצוות יעלה מסמך חדש, הוא יופיע כאן.',
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

  const actionItems = [
    {
      id: 'pay',
      label: 'תשלום',
      description: nextPaymentDue ? 'שלם עכשיו' : 'צפה בחיובים',
      href: '/payments/resident',
      icon: CreditCard,
      badge: finance?.summary.unpaidInvoices ? finance.summary.unpaidInvoices : undefined,
      accent: nextPaymentDue ? ('warning' as const) : ('primary' as const),
      emphasize: Boolean(nextPaymentDue),
      priority: 'primary' as const,
    },
    {
      id: 'request',
      label: 'בקשה חדשה',
      description: 'פנייה מהירה',
      href: '/resident/requests?view=new',
      icon: ClipboardList,
      accent: 'primary' as const,
      emphasize: !nextPaymentDue,
      priority: 'secondary' as const,
    },
    {
      id: 'call',
      label: openTickets.length ? 'מעקב קריאות' : 'קריאה / תקלה',
      description: openTickets.length ? 'בדוק סטטוס קיים' : 'דיווח עם צילום',
      href: openTickets.length ? '/resident/requests?view=history' : '/create-call',
      icon: Ticket,
      badge: openTickets.length || undefined,
      accent: openTickets.length ? ('warning' as const) : ('neutral' as const),
      priority: 'secondary' as const,
    },
    {
      id: 'documents',
      label: 'מסמכים',
      description: 'קבצים ועדכונים',
      href: '/documents',
      icon: FileText,
      badge: recentDocuments.length || undefined,
      accent: 'info' as const,
      priority: 'utility' as const,
    },
    {
      id: 'contact',
      label: primaryBuilding ? 'הבניין שלי' : 'צור קשר',
      description: primaryBuilding?.name || 'תמיכה וניהול',
      href: primaryBuilding ? '/resident/building' : '/support',
      icon: primaryBuilding ? Building2 : MessageCircle,
      accent: 'neutral' as const,
      priority: 'utility' as const,
    },
  ];

  const activeItems: Array<{
    id: string;
    status: string;
    tone: 'danger' | 'warning' | 'success' | 'default' | 'neutral' | 'active';
    title: string;
    reason: string;
    meta?: string;
    href?: string;
    ctaLabel?: string;
  }> = [];
  if (nextPaymentDue) {
    activeItems.push({
      id: `invoice-${nextPaymentDue.id}`,
      status: nextPaymentDue.status === 'OVERDUE' ? 'פיגור' : 'לתשלום',
      tone: nextPaymentDue.status === 'OVERDUE' ? 'danger' : 'warning',
      title: nextPaymentDue.description,
      reason: `${formatCurrency(nextPaymentDue.amount, 'ILS', locale)} · עד ${formatDate(nextPaymentDue.dueDate, locale)}`,
      href: '/payments/resident',
      ctaLabel: 'שלם עכשיו',
    });
  }
  if (openTickets[0]) {
    activeItems.push({
      id: `ticket-${openTickets[0].id}`,
      status: getStatusLabel(openTickets[0].status, 'he'),
      tone: getTicketStatusTone(openTickets[0].status),
      title: `קריאה #${openTickets[0].id}`,
      reason: openTickets[0].description?.trim() || `${openTickets[0].unit.building.name} · דירה ${openTickets[0].unit.number}`,
      meta: formatDate(openTickets[0].createdAt, locale),
      href: '/resident/requests?view=history',
      ctaLabel: 'עקוב',
    });
  }

  const userId = getCurrentUserId();
  const role = getEffectiveRole();
  const resumeState = useMemo(() => getResumeState('resident', userId, role), [userId, role]);
  const showResume = resumeState && resumeState.href !== '/resident/account' && resumeState.href !== router.asPath;
  const unreadNotificationsSummary = unreadNotifications.length
    ? `${unreadNotifications.length} עדכונים חדשים`
    : 'הכול נקרא';
  const heroShortcuts = [
    {
      id: 'hero-pay',
      label: 'תשלום',
      href: '/payments/resident',
      icon: WalletCards,
      badge: finance?.summary.unpaidInvoices ? String(finance.summary.unpaidInvoices) : undefined,
    },
    {
      id: 'hero-request',
      label: 'בקשה',
      href: '/resident/requests?view=new',
      icon: ClipboardList,
    },
    {
      id: 'hero-ticket',
      label: 'קריאות',
      href: openTickets.length ? '/resident/requests?view=history' : '/create-call',
      icon: Ticket,
      badge: openTickets.length ? String(openTickets.length) : undefined,
    },
    {
      id: 'hero-docs',
      label: 'מסמכים',
      href: '/documents',
      icon: FileText,
      badge: recentDocuments.length ? String(recentDocuments.length) : undefined,
    },
  ];

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
          className="rounded-[24px] border border-primary/12 bg-[linear-gradient(180deg,rgba(255,249,240,0.96)_0%,rgba(255,255,255,0.92)_100%)] px-4 py-3 shadow-[0_14px_32px_rgba(44,28,9,0.06)]"
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
        <div className="relative overflow-hidden rounded-[32px] border border-primary/12 bg-[radial-gradient(circle_at_top_right,rgba(243,185,91,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(68,124,255,0.08),transparent_28%),linear-gradient(180deg,rgba(255,251,244,0.98)_0%,rgba(255,255,255,0.96)_55%,rgba(247,242,233,0.94)_100%)] px-4 pb-4 pt-4 text-foreground shadow-[0_18px_44px_rgba(44,28,9,0.08)] sm:px-5 sm:pb-5 sm:pt-5">
          <AccountHeroPattern />
          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/78 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-secondary-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.9} />
                {labels.home}
              </div>
              <div className="rounded-full border border-primary/10 bg-white/72 px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
                {primaryBuilding ? `דירה ${primaryUnit?.number}` : residentName}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-primary/12 bg-[linear-gradient(135deg,rgba(255,245,225,0.96)_0%,rgba(243,185,91,0.34)_100%)] text-primary shadow-[0_10px_24px_rgba(194,143,57,0.14)]">
                <UserRound className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-secondary-foreground">{residentName}</div>
                <h1 className="mt-1 text-[34px] font-black leading-[1.02] tracking-[-0.02em] text-foreground">{primaryBuilding?.name || labels.home}</h1>
                <p className="mt-2 max-w-[22rem] text-[15px] leading-6 text-secondary-foreground">
                  {primaryBuilding?.address || 'גישה מהירה לתשלומים, קריאות, מסמכים ועדכונים.'}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[26px] border border-primary/12 bg-white/78 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-foreground">{residentPrimaryAction.eyebrow}</div>
                    <div className="mt-2 text-[38px] font-black leading-none text-foreground">
                      <bdi>
                        {nextPaymentDue
                          ? formatCurrency(nextPaymentDue.amount, 'ILS', locale)
                          : finance?.summary.currentBalance
                            ? formatCurrency(finance.summary.currentBalance, 'ILS', locale)
                            : 'שולם'}
                      </bdi>
                    </div>
                  </div>
                  <HeroStatusBadge
                    icon={nextPaymentDue ? <CreditCard className="h-4 w-4" strokeWidth={1.8} /> : <Sparkles className="h-4 w-4" strokeWidth={1.8} />}
                    label={nextPaymentDue ? 'לתשלום' : 'מצב חשבון'}
                  />
                </div>
                <div className="mt-2 text-[15px] leading-6 text-secondary-foreground">{residentPrimaryAction.description}</div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <HeroSignalChip label="קריאות" value={openTickets.length} />
                <HeroSignalChip label="עדכונים" value={unreadNotifications.length} />
                <HeroSignalChip label="חיובים" value={finance?.summary.unpaidInvoices ?? 0} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                size="lg"
                className="min-h-[54px] rounded-full bg-primary text-primary-foreground shadow-[0_14px_28px_rgba(194,143,57,0.22)] hover:bg-primary/92"
                asChild
              >
                <Link href={residentPrimaryAction.href}>
                  {residentPrimaryAction.ctaLabel}
                  <ArrowUpRight className="icon-directional me-2 h-4 w-4" strokeWidth={1.85} />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-[54px] rounded-full border-primary/14 bg-white/76 text-foreground hover:bg-white"
                asChild
              >
                <Link href="/resident/profile">
                  הפרופיל שלי
                  <UserRound className="me-2 h-4 w-4" strokeWidth={1.85} />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {heroShortcuts.map((item) => (
                <HeroShortcut
                  key={item.id}
                  href={item.href}
                  label={item.label}
                  badge={item.badge}
                  icon={<item.icon className="h-4 w-4" strokeWidth={1.85} />}
                />
              ))}
            </div>
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
              <h2 className="text-[18px] font-semibold text-foreground">{labels.actions}</h2>
              <p className="mt-1 text-[14px] leading-6 text-secondary-foreground">פעולות מהירות, גדולות וברורות למסך קטן.</p>
            </div>
            <ResidentActionConstellation items={actionItems} />
          </motion.section>

          <motion.section
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.1, ease: 'easeOut' }}
            className="rounded-[26px] border border-divider/60 bg-white/94 px-3.5 pb-3.5 pt-3.5 shadow-[0_12px_24px_rgba(44,28,9,0.05)]"
          >
            <CompactSectionHeader
              icon={<Sparkles className="h-4 w-4" strokeWidth={1.8} />}
              title={labels.activeNow}
              subtitle={activeItems.length ? `${activeItems.length} פריטים פתוחים` : labels.noUrgent}
              actionLabel={activeItems[0]?.ctaLabel || 'פתח'}
              actionHref={activeItems[0]?.href || '/resident/requests?view=new'}
            />
            {activeItems.length ? (
              <div className="space-y-2">
                {activeItems.slice(0, 2).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                    animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.26, delay: reducedMotion ? 0 : 0.08 + index * 0.04, ease: 'easeOut' }}
                  >
                    <ResidentLiveItem item={item} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState type="empty" size="sm" title={labels.noUrgent} description={labels.noUrgentDesc} />
            )}
          </motion.section>
        </div>

        <div className="space-y-4">
          <motion.section
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.15, ease: 'easeOut' }}
            className="rounded-[26px] border border-divider/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.95)_100%)] px-3.5 pb-3.5 pt-3.5 shadow-[0_12px_24px_rgba(44,28,9,0.05)]"
          >
            <CompactSectionHeader
              icon={<FileText className="h-4 w-4" strokeWidth={1.8} />}
              title={labels.recentDocs}
              subtitle={recentDocuments.length ? `${recentDocuments.length} זמינים` : labels.docsEmpty}
              actionLabel={labels.allDocs}
              actionHref="/documents"
            />
            {recentDocuments.length ? (
              <div className="space-y-2">
                {recentDocuments.map((document) => (
                  <Link
                    key={document.id}
                    href="/documents"
                    className="flex items-center justify-between gap-3 rounded-[20px] border border-subtle-border bg-white/84 px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-primary/18"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                        <FileText className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold text-foreground">{document.name}</div>
                        <div className="mt-0.5 text-[12px] text-secondary-foreground">{formatDate(document.uploadedAt, locale)}</div>
                      </div>
                    </div>
                    <ArrowUpRight className="icon-directional h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState type="empty" size="sm" title={labels.docsEmpty} description={labels.docsEmptyDesc} />
            )}
          </motion.section>

          <motion.section
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
            className="rounded-[26px] border border-divider/60 bg-white/94 px-3.5 pb-3.5 pt-3.5 shadow-[0_12px_24px_rgba(44,28,9,0.05)]"
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
                    {newestNotification?.message || 'כל ההתראות, האישורים והעדכונים האחרונים מרוכזים במסך אחד.'}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.24, ease: 'easeOut' }}
            className="rounded-[26px] border border-divider/60 bg-white/94 px-3.5 pb-3.5 pt-3.5 shadow-[0_12px_24px_rgba(44,28,9,0.05)]"
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

function AccountHeroPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-8 top-4 h-24 w-24 rounded-full border border-primary/10" />
      <div className="absolute right-10 top-0 h-20 w-20 rounded-b-[30px] rounded-t-full bg-primary/6" />
      <div className="absolute bottom-0 left-6 h-16 w-28 rounded-t-full bg-warning/10 blur-2xl" />
      <div className="absolute bottom-4 right-4 h-14 w-14 rounded-[18px] bg-primary/8" />
    </div>
  );
}

function HeroSignalChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[20px] border border-primary/10 bg-white/76 px-3 py-3 shadow-[0_8px_20px_rgba(44,28,9,0.04)]">
      <div className="text-[11px] font-semibold text-secondary-foreground">{label}</div>
      <div className="mt-1.5 text-[22px] font-black tabular-nums text-foreground">
        <bdi>{value}</bdi>
      </div>
    </div>
  );
}

function HeroStatusBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/6 px-3 py-1.5 text-[11px] font-semibold text-primary">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function HeroShortcut({
  href,
  label,
  icon,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="relative flex min-h-[76px] flex-col items-center justify-center rounded-[22px] border border-primary/10 bg-white/78 px-2 py-3 text-center shadow-[0_10px_24px_rgba(44,28,9,0.04)] transition hover:-translate-y-0.5 hover:border-primary/18"
    >
      {badge ? (
        <span className="absolute end-2 top-2 rounded-full border border-primary/10 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          {badge}
        </span>
      ) : null}
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/8 text-primary">{icon}</span>
      <span className="mt-2 text-[12px] font-semibold leading-4 text-foreground">{label}</span>
    </Link>
  );
}

function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 text-base font-semibold text-foreground">
        <span className="text-primary">{icon}</span>
        <span>{title}</span>
      </div>
      <p className="mt-1 text-sm leading-6 text-secondary-foreground">{subtitle}</p>
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

function ResidentActionConstellation({
  items,
}: {
  items: Array<{
    id: string;
    label: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badge?: string | number;
    accent: 'warning' | 'primary' | 'neutral' | 'info';
    emphasize?: boolean;
  }>;
}) {
  const primary = items.find((item) => item.emphasize) ?? items[0];
  const secondary = items.filter((item) => item.id !== primary.id);

  return (
    <div className="rounded-[28px] border border-primary/10 bg-[radial-gradient(circle_at_top,rgba(243,185,91,0.10),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.96)_100%)] p-3.5">
      <div className="flex justify-center">
        <ResidentActionBubble item={primary} primary />
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        {secondary.map((item) => (
          <ResidentActionBubble key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ResidentActionBubble({
  item,
  primary = false,
}: {
  item: {
    id: string;
    label: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badge?: string | number;
    accent: 'warning' | 'primary' | 'neutral' | 'info';
  };
  primary?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const Icon = item.icon;
  const accentClasses =
    item.accent === 'warning'
      ? 'border-warning/18 bg-[linear-gradient(135deg,rgba(255,250,232,1)_0%,rgba(255,255,255,0.94)_100%)] text-warning'
      : item.accent === 'info'
        ? 'border-info/18 bg-[linear-gradient(135deg,rgba(240,248,255,1)_0%,rgba(255,255,255,0.94)_100%)] text-info'
        : item.accent === 'neutral'
          ? 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)] text-foreground'
          : 'border-primary/18 bg-[linear-gradient(135deg,rgba(245,235,214,1)_0%,rgba(255,255,255,0.94)_100%)] text-primary';

  return (
    <motion.div
      whileTap={reducedMotion ? undefined : { scale: 0.97 }}
      className={cn(primary ? 'w-full max-w-[240px]' : 'w-full')}
    >
      <Link
        href={item.href}
        className={cn(
          'group block rounded-[24px] border p-3 text-center shadow-[0_12px_24px_rgba(44,28,9,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_32px_rgba(44,28,9,0.08)]',
          accentClasses,
          primary && 'relative overflow-hidden border-primary/16 bg-[radial-gradient(circle_at_top,rgba(243,185,91,0.18),transparent_36%),linear-gradient(135deg,rgba(255,250,240,1)_0%,rgba(255,255,255,0.96)_44%,rgba(240,247,255,0.90)_100%)] py-4',
        )}
      >
        {primary ? <span className="absolute inset-x-6 top-0 h-px bg-white/70" /> : null}
        <div
          className={cn(
            'mx-auto flex items-center justify-center rounded-full border',
            primary ? 'h-24 w-24 border-primary/12 bg-[linear-gradient(135deg,rgba(53,111,237,0.96)_0%,rgba(207,146,50,0.96)_100%)] text-white shadow-[0_18px_34px_rgba(80,61,24,0.18)]' : 'h-16 w-16 border-current/10 bg-white/78',
          )}
        >
          <Icon className={cn(primary ? 'h-8 w-8' : 'h-6 w-6')} strokeWidth={1.85} />
        </div>
        <div className="mt-3 text-[15px] font-semibold leading-5 text-foreground">{item.label}</div>
        <div className="mt-1 text-[12px] leading-5 text-secondary-foreground">{item.description}</div>
        {item.badge !== undefined ? (
          <div className="mt-2 inline-flex rounded-full border border-primary/12 bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {item.badge}
          </div>
        ) : null}
        <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
          <ArrowUpRight className="icon-directional h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} />
        </div>
      </Link>
    </motion.div>
  );
}

function ResidentLiveItem({
  item,
}: {
  item: {
    id: string;
    status: string;
    tone: 'danger' | 'warning' | 'success' | 'default' | 'neutral' | 'active';
    title: string;
    reason: string;
    meta?: string;
    href?: string;
    ctaLabel?: string;
  };
}) {
  const toneClasses =
    item.tone === 'danger'
      ? 'border-destructive/18 bg-destructive/8 text-destructive'
      : item.tone === 'warning'
        ? 'border-warning/18 bg-warning/10 text-warning'
        : item.tone === 'success'
          ? 'border-success/18 bg-success/10 text-success'
          : 'border-primary/16 bg-primary/8 text-primary';

  return (
    <div className="rounded-[20px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] p-3 shadow-[0_10px_20px_rgba(44,28,9,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', toneClasses)}>{item.status}</span>
            {item.meta ? <span className="text-[11px] text-secondary-foreground">{item.meta}</span> : null}
          </div>
          <div className="mt-1.5 text-[15px] font-semibold text-foreground">{item.title}</div>
          <div className="mt-0.5 text-[13px] leading-5 text-secondary-foreground">{item.reason}</div>
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border', toneClasses)}>
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
        </span>
      </div>
      {item.href && item.ctaLabel ? (
        <div className="mt-2.5">
          <Button asChild size="sm" variant="outline" className="w-full justify-between rounded-full text-[12px]">
            <Link href={item.href}>
              {item.ctaLabel}
              <ArrowUpRight className="icon-directional h-4 w-4" strokeWidth={1.8} />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
