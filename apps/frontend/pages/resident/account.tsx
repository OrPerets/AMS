import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Bell, Building2, ClipboardList, CreditCard, FileText, ShieldCheck, Ticket, UserRound } from 'lucide-react';
import { authFetch, getAccessToken, getCurrentUserId, getEffectiveRole } from '../../lib/auth';
import { cn, formatCurrency, formatDate, getTicketStatusTone } from '../../lib/utils';
import { triggerHaptic } from '../../lib/mobile';
import { getMobileSurfaceInteractionState } from '../../lib/mobile-interaction-flags';
import { Button } from '../../components/ui/button';
import { AmsDrawer } from '../../components/ui/ams-drawer';
import { GlassSurface } from '../../components/ui/glass-surface';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { PullToRefreshIndicator } from '../../components/ui/pull-to-refresh-indicator';
import { QuickActionTile } from '../../components/ui/quick-action-tile';
import { ResidentListCard } from '../../components/ui/resident-list-card';
import { ResidentHero } from '../../components/resident/resident-hero';
import { ResidentReassuranceBand } from '../../components/resident/resident-reassurance-band';
import { ResidentTrendCard } from '../../components/resident/resident-trend-card';
import { buildResidentTrendState } from '../../components/resident/resident-view-models';
import { residentScreenMotion } from '../../components/resident/motion';
import { getResumeState, setResumeState } from '../../lib/engagement';
import { trackResumeClick } from '../../lib/analytics';
import { usePullToRefresh } from '../../hooks/use-pull-to-refresh';
import { websocketService } from '../../lib/websocket';

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
  const motionReduced = Boolean(reducedMotion);
  const residentInteractions = getMobileSurfaceInteractionState('resident');
  const [context, setContext] = useState<AccountContext | null>(null);
  const [finance, setFinance] = useState<ResidentFinance | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickAccessOpen, setQuickAccessOpen] = useState(false);

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
      setLastUpdatedAt(Date.now());
    } catch (nextError) {
      console.error(nextError);
      setError('לא ניתן לטעון כעת את האזור האישי.');
    } finally {
      setLoading(false);
    }
  }

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh({
    enabled: residentInteractions.elasticRefresh,
    preset: 'detail',
    onRefresh: async () => {
      await loadAccount();
      triggerHaptic('success');
    },
  });

  const primaryUnit = context?.units[0] ?? null;
  const primaryBuilding = primaryUnit?.building ?? null;
  const residentName = context?.user?.email?.split('@')[0] || 'דייר';
  const locale = 'he';
  const openTickets = useMemo(() => (context?.tickets ?? []).filter((ticket) => ticket.status !== 'RESOLVED'), [context?.tickets]);
  const unreadNotifications = useMemo(() => (context?.notifications ?? []).filter((item) => !item.read), [context?.notifications]);
  const recentDocuments = useMemo(() => [...(context?.documents ?? [])].slice(0, 2), [context?.documents]);
  const newestDocument = recentDocuments[0] ?? null;
  const newestNotification = unreadNotifications[0] ?? null;
  const continuationItems = [
    openTickets[0]
      ? {
          id: `ticket-${openTickets[0].id}`,
          label: `קריאה #${openTickets[0].id}`,
          meta: getTicketStatusTone(openTickets[0].status) === 'danger' ? 'דורש תשומת לב' : 'בטיפול',
          detail: openTickets[0].description?.trim() || `${openTickets[0].unit.building.name} · דירה ${openTickets[0].unit.number}`,
          href: '/resident/requests?view=history',
        }
      : null,
    newestNotification
      ? {
          id: `notification-${newestNotification.id}`,
          label: newestNotification.title,
          meta: unreadNotifications.length > 1 ? `${unreadNotifications.length} עדכונים` : 'עדכון חדש',
          detail: newestNotification.message,
          href: '/notifications',
        }
      : null,
    newestDocument
      ? {
          id: `document-${newestDocument.id}`,
          label: newestDocument.name,
          meta: 'מסמך זמין',
          detail: formatDate(newestDocument.uploadedAt, locale),
          href: '/documents',
        }
      : null,
  ].filter(Boolean) as Array<{ id: string; label: string; meta: string; detail: string; href: string }>;
  const labels = {
    home: 'האזור האישי',
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

  const userId = getCurrentUserId();
  const role = getEffectiveRole();
  const resumeState = useMemo(() => getResumeState('resident', userId, role), [userId, role]);
  const showResume = !!(resumeState && resumeState.href !== '/resident/account' && resumeState.href !== router.asPath);

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
        description: formatDate(newestDocument.uploadedAt, locale),
        ctaLabel: 'פתח מסמכים',
        href: '/documents',
        tone: 'default' as const,
      };
    }

    if (newestNotification) {
      return {
        eyebrow: 'מרכז עדכונים',
        title: unreadNotifications.length > 1 ? `${unreadNotifications.length} עדכונים חדשים` : newestNotification.title,
        description: unreadNotifications.length > 1 ? 'פתח עדכונים' : newestNotification.message,
        ctaLabel: 'פתח עדכונים',
        href: '/notifications',
        tone: 'default' as const,
      };
    }

    return {
      eyebrow: 'הכול בשליטה',
      title: 'אין משהו דחוף כרגע',
      description: 'בקשה חדשה או עדכון.',
      ctaLabel: 'בקשה חדשה',
      href: '/resident/requests?view=new',
      tone: 'success' as const,
    };
  })();

  const heroSubline = primaryUnit
    ? `דירה ${primaryUnit.number}${primaryBuilding?.name ? ` · ${primaryBuilding.name}` : ''}`
    : 'חשבון דייר פעיל';
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
          description: finance.summary.currentBalance > 0 ? 'מוכן לתשלום.' : 'הכול סגור.',
          progress: finance.summary.currentBalance > 0 ? 58 : 100,
          tone: finance.summary.currentBalance > 0 ? ('warning' as const) : ('success' as const),
        }
      : openTickets.length
        ? {
            label: 'קריאות פתוחות',
            value: openTickets.length,
            description: 'פתח מעקב',
            progress: Math.min(openTickets.length * 22, 100),
            tone: openTickets.length > 1 ? ('warning' as const) : ('default' as const),
          }
        : {
            label: 'הכול בשליטה',
            value: unreadNotifications.length,
            description: unreadNotifications.length ? 'פתח עדכונים' : 'אין משהו דחוף',
            progress: unreadNotifications.length ? 44 : 100,
            tone: unreadNotifications.length ? ('default' as const) : ('success' as const),
          };

  const quickActions = [
    {
      id: 'request-new',
      title: 'בקשה חדשה',
      subtitle: 'פתיחה מהירה לצוות',
      href: '/resident/requests?view=new',
      icon: ClipboardList,
      tone: 'default' as const,
      stateLabel: 'מומלץ',
    },
    {
      id: 'documents',
      title: 'מסמכים',
      subtitle: newestDocument ? newestDocument.name : 'חוזים, קבלות ועדכונים',
      href: '/documents',
      icon: FileText,
      tone: 'info' as const,
      badge: recentDocuments.length || null,
    },
    {
      id: 'support',
      title: 'תקשורת',
      subtitle: unreadNotifications.length ? `${unreadNotifications.length} עדכונים מחכים` : 'התראות ושיחות פתוחות',
      href: '/notifications',
      icon: Bell,
      tone: unreadNotifications.length ? ('warning' as const) : ('default' as const),
      badge: unreadNotifications.length || null,
    },
    {
      id: 'building',
      title: 'הבניין שלי',
      subtitle: primaryBuilding?.address || 'פרטים, שירותים ואנשי קשר',
      href: '/resident/building',
      icon: Building2,
      tone: 'success' as const,
    },
  ];
  const quickAccessItems = [
    {
      id: 'resident-pay',
      title: 'שלם עכשיו',
      description: nextPaymentDue ? `${nextPaymentDue.description} · ${formatDate(nextPaymentDue.dueDate, locale)}` : 'פתיחת מרכז התשלומים והחשבוניות.',
      href: '/payments/resident',
      icon: CreditCard,
      tone: nextPaymentDue?.status === 'OVERDUE' ? ('warning' as const) : ('default' as const),
    },
    {
      id: 'resident-request',
      title: 'פתח בקשה',
      description: 'פתיחה מהירה לצוות עם מעקב מלא אחר הטיפול.',
      href: '/resident/requests?view=new',
      icon: ClipboardList,
      tone: 'default' as const,
    },
    {
      id: 'resident-support',
      title: 'מרכז עדכונים',
      description: unreadNotifications.length ? `${unreadNotifications.length} עדכונים מחכים.` : 'התראות, שיחות ועדכוני בניין.',
      href: '/notifications',
      icon: Bell,
      tone: unreadNotifications.length ? ('warning' as const) : ('default' as const),
    },
    {
      id: 'resident-building',
      title: 'הבניין שלי',
      description: primaryBuilding?.address || 'שירותים, אנשי קשר ופרטי הבניין.',
      href: '/resident/building',
      icon: Building2,
      tone: 'success' as const,
    },
  ];
  const refreshSubtitle = liveConnected
    ? lastUpdatedAt
      ? `מחובר בזמן אמת · עודכן ${formatDate(new Date(lastUpdatedAt), locale)}`
      : 'מחובר בזמן אמת'
    : 'המידע יתעדכן בסנכרון הבא';

  useEffect(() => {
    if (!loading && context) {
      setResumeState({ screen: 'resident', href: '/resident/account', label: 'האזור האישי', role: role || 'RESIDENT', userId });
    }
  }, [loading, context, role, userId]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    websocketService.connect(token);
    setLiveConnected(websocketService.isConnected());

    const handleNewNotification = (event: { notification?: AccountContext['notifications'][number] }) => {
      if (!event.notification) return;
      setContext((current) => {
        if (!current) return current;
        const nextNotifications = [
          event.notification!,
          ...current.notifications.filter((item) => item.id !== event.notification!.id),
        ];

        return {
          ...current,
          notifications: nextNotifications,
        };
      });
      setLastUpdatedAt(Date.now());
    };

    websocketService.on('new_notification', handleNewNotification);

    const statusTimer = window.setInterval(() => {
      setLiveConnected(websocketService.isConnected());
    }, 5000);

    return () => {
      websocketService.off('new_notification', handleNewNotification);
      window.clearInterval(statusTimer);
    };
  }, []);

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

  const trendState = finance
    ? buildResidentTrendState({
        currentBalance: finance.summary.currentBalance,
        unpaidInvoices: finance.summary.unpaidInvoices,
        overdueInvoices: finance.summary.overdueInvoices,
        openTickets: openTickets.length,
        unreadNotifications: unreadNotifications.length,
        latestLedgerAmount: finance.invoices[0]?.amount ?? null,
        locale,
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-md space-y-4 pb-24 text-right sm:max-w-4xl sm:space-y-6">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={threshold}
        label="משוך לרענון האזור האישי"
      />

      {/* {showResume ? (
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
                <ArrowLeft className="icon-directional ms-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </motion.div>
      ) : null} */}

      <motion.section {...residentScreenMotion(motionReduced)}>
        <ResidentHero
          eyebrow="מרכז השליטה האישי"
          title={labels.home}
          subtitle={heroSubline}
          density="compact"
          badge={<div className="rounded-full border border-primary/12 bg-white/76 px-3 py-1.5 text-xs font-semibold text-primary">חשבון דייר</div>}
          floatingCard={
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/72">
                    {primaryBuilding?.name || labels.home}
                  </div>
                  <h1 className="mt-1 text-[22px] font-black leading-[1.02] tracking-[-0.02em] text-foreground">{residentName}</h1>
                  <p className="mt-1 text-[12px] leading-5 text-secondary-foreground">{residentPrimaryAction.description}</p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[radial-gradient(circle_at_30%_30%,rgba(255,244,220,0.96),rgba(221,174,80,0.94)_38%,rgba(101,70,28,1)_100%)] text-white shadow-[0_12px_24px_rgba(207,146,50,0.18)]">
                  <UserRound className="h-6 w-6" strokeWidth={1.8} />
                </div>
              </div>

              <div className="gold-sheen-surface rounded-[24px] p-3.5" data-accent-sheen="true">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold tracking-[0.16em] text-secondary-foreground">דופק החשבון</div>
                    <div className="mt-2 text-[30px] font-black leading-none text-foreground">
                      <bdi>{spotlight.value}</bdi>
                    </div>
                  </div>
                  <HeroStatusBadge
                    icon={nextPaymentDue ? <CreditCard className="h-4 w-4" strokeWidth={1.8} /> : <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />}
                    label={nextPaymentDue ? spotlight.label : 'מבט מהיר'}
                  />
                </div>
                <div className="mt-2 text-[13px] leading-5 text-secondary-foreground">{spotlight.description}</div>
              </div>
            </div>
          }
          bodyClassName="pt-0"
        >
          <div className="space-y-3">
            <ResidentReassuranceBand
              title={nextPaymentDue ? 'חיוב מוכן לטיפול' : 'החשבון נשאר בשליטה'}
              subtitle={refreshSubtitle}
              items={[
                {
                  id: 'resident-next',
                  label: nextPaymentDue ? 'מועד חיוב' : 'סטטוס חשבון',
                  value: nextPaymentDue ? formatDate(nextPaymentDue.dueDate, locale) : finance?.summary.currentBalance ? 'יתרה פתוחה' : 'הכול מעודכן',
                  tone: nextPaymentDue?.status === 'OVERDUE' ? 'warning' : finance?.summary.currentBalance ? 'default' : 'success',
                  icon: <CreditCard className="h-3.5 w-3.5" strokeWidth={1.8} />,
                },
                {
                  id: 'resident-notifications',
                  label: 'עדכונים',
                  value: unreadNotifications.length ? `${unreadNotifications.length} ממתינים` : 'אין דחופים',
                  tone: unreadNotifications.length ? 'warning' : 'success',
                  icon: <Bell className="h-3.5 w-3.5" strokeWidth={1.8} />,
                },
                {
                  id: 'resident-security',
                  label: 'שירות מאובטח',
                  value: liveConnected ? 'זמין עכשיו' : 'מתעדכן בקרוב',
                  tone: liveConnected ? 'success' : 'default',
                  icon: <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} />,
                },
              ]}
            />

            <div className="grid grid-cols-1 gap-2">
              <Link
                href={residentPrimaryAction.href}
                className="gold-sheen-button flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full px-4 text-base font-semibold shadow-raised"
                data-accent-sheen="true"
              >
                {residentPrimaryAction.ctaLabel}
                <ArrowUpRight className="icon-directional h-4 w-4" strokeWidth={1.85} />
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[50px] rounded-full px-4 text-sm"
                  onClick={() => setQuickAccessOpen(true)}
                >
                  גישה מהירה
                </Button>
                <Button variant="outline" className="min-h-[50px] rounded-full px-4 text-sm" asChild>
                  <Link href="/notifications">פתח עדכונים</Link>
                </Button>
              </div>
            </div>
          </div>
        </ResidentHero>
      </motion.section>

      <motion.section {...residentScreenMotion(motionReduced, 0.15)} className="space-y-3">
        <div className="grid grid-cols-3 gap-2.5">
          <LaunchMetric label="יתרה" value={formatCurrency(finance?.summary.currentBalance ?? 0)} tone={finance?.summary.currentBalance ? 'warning' : 'success'} />
          <LaunchMetric label="פתוחים" value={finance?.summary.unpaidInvoices ?? 0} tone={finance?.summary.unpaidInvoices ? 'warning' : 'default'} />
          <LaunchMetric label="קריאות" value={openTickets.length} tone={openTickets.length ? 'default' : 'success'} />
        </div>

        {continuationItems.length ? (
          <GlassSurface strength="strong" className="rounded-[30px] p-4">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-foreground">בקשות ועדכונים פעילים</div>
              </div>
            </div>
            <div className="space-y-3">
              {continuationItems.map((item, index) => (
                <ResidentListCard
                  key={item.id}
                  href={item.href}
                  title={item.label}
                  subtitle={item.detail}
                  icon={item.id.startsWith('ticket') ? Ticket : item.id.startsWith('notification') ? Bell : FileText}
                  accent={item.id.startsWith('ticket') ? 'warning' : 'info'}
                  meta={<span className="rounded-full border border-primary/12 bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary">{item.meta}</span>}
                  endSlot={<ArrowUpRight className="icon-directional h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />}
                  delay={index * 0.04}
                />
              ))}
            </div>
          </GlassSurface>
        ) : null}

        {primaryBuilding ? (
          <GlassSurface strength="strong" className="rounded-[30px] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">Building Preview</div>
                <div className="mt-1 text-base font-semibold text-foreground">{primaryBuilding.name}</div>
                <div className="mt-0.5 text-[12px] leading-5 text-secondary-foreground">{primaryBuilding.address}</div>
              </div>
              <span className="rounded-full border border-primary/14 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                דירה {primaryUnit?.number}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Link
                href="/resident/building"
                className="rounded-[22px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)] px-3 py-3 text-right transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card"
              >
                <div className="text-[10px] font-semibold text-secondary-foreground">שירותים ופרטים</div>
                <div className="mt-1 text-[15px] font-black text-foreground">בניין</div>
                <div className="mt-1 text-[11px] leading-4.5 text-secondary-foreground">אנשי קשר, מתקנים ומידע שוטף.</div>
              </Link>
              <Link
                href="/resident/payment-methods"
                className="rounded-[22px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)] px-3 py-3 text-right transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card"
              >
                <div className="text-[10px] font-semibold text-secondary-foreground">חיוב</div>
                <div className="mt-1 text-[15px] font-black text-foreground">אמצעי תשלום</div>
                <div className="mt-1 text-[11px] leading-4.5 text-secondary-foreground">כרטיסים, חיוב אוטומטי והגדרות חשבון.</div>
              </Link>
            </div>
          </GlassSurface>
        ) : null}

        {trendState ? (
          <div className="hidden md:block">
            <ResidentTrendCard
              title={trendState.title}
              subtitle={trendState.subtitle}
              metricLabel={trendState.metricLabel}
              metricValue={trendState.metricValue}
              points={trendState.points}
              insight={trendState.insight}
              tone={trendState.tone}
              summaryItems={trendState.summaryItems}
            />
          </div>
        ) : null}
      </motion.section>
      <motion.section {...residentScreenMotion(motionReduced, 0.1)} className="px-1">
        <div className="space-y-3">
          <div className="px-1 text-right">
            <div className="text-base font-semibold text-foreground">פעולות מהירות</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((item, index) => (
              <QuickActionTile
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                href={item.href}
                icon={item.icon}
                tone={item.tone}
                badge={item.badge}
                stateLabel={item.stateLabel}
                delay={index * 0.04}
              />
            ))}
          </div>
        </div>
      </motion.section>

      <AmsDrawer
        isOpen={quickAccessOpen}
        onOpenChange={setQuickAccessOpen}
        title="גישה מהירה"
        description="התשלומים, השירות והבניין במקום אחד."
        tone="light"
        size="md"
      >
        <div className="space-y-3 pb-2">
          {quickAccessItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex min-h-[72px] items-center gap-3 rounded-[22px] border px-4 py-3 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card',
                  item.tone === 'warning'
                    ? 'border-warning/16 bg-[linear-gradient(180deg,rgba(255,250,241,0.98)_0%,rgba(255,255,255,0.94)_100%)]'
                    : item.tone === 'success'
                      ? 'border-success/16 bg-[linear-gradient(180deg,rgba(245,252,247,0.98)_0%,rgba(255,255,255,0.94)_100%)]'
                      : 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)]',
                )}
                onClick={() => setQuickAccessOpen(false)}
              >
                <span
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border',
                    item.tone === 'warning'
                      ? 'border-warning/12 bg-warning/10 text-warning'
                      : item.tone === 'success'
                        ? 'border-success/12 bg-success/10 text-success'
                        : 'border-primary/12 bg-primary/10 text-primary',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.85} />
                </span>
                <span className="min-w-0 flex-1 text-right">
                  <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                  <span className="mt-0.5 block text-[12px] leading-5 text-secondary-foreground">{item.description}</span>
                </span>
                <ArrowUpRight className="icon-directional h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
              </Link>
            );
          })}
        </div>
      </AmsDrawer>
    </div>
  );
}

function HeroStatusBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function LaunchMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  tone?: 'default' | 'warning' | 'success';
}) {
  return (
    <div
      className={cn(
        'rounded-[22px] border px-3 py-3 text-right shadow-[0_10px_22px_rgba(44,28,9,0.05)]',
        tone === 'warning'
          ? 'border-warning/18 bg-[linear-gradient(180deg,rgba(255,251,241,0.98)_0%,rgba(255,255,255,0.94)_100%)]'
          : tone === 'success'
            ? 'border-success/18 bg-[linear-gradient(180deg,rgba(245,252,247,0.98)_0%,rgba(255,255,255,0.94)_100%)]'
            : 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)]',
      )}
    >
      <div className="text-[10px] font-semibold text-secondary-foreground">{label}</div>
      <div className="mt-1.5 truncate text-[15px] font-black text-foreground">
        <bdi>{value}</bdi>
      </div>
    </div>
  );
}
