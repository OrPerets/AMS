import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Bell, Building2, ClipboardList, CreditCard, FileText, ShieldCheck, Ticket, UserRound } from 'lucide-react';
import { authFetch, getAccessToken, getCurrentUserId, getEffectiveRole } from '../../lib/auth';
import { cn, formatCurrency, formatDate, getTicketStatusTone } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';
import { GlassSurface } from '../../components/ui/glass-surface';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { QuickActionTile } from '../../components/ui/quick-action-tile';
import { ResidentListCard } from '../../components/ui/resident-list-card';
import { ResidentHero } from '../../components/resident/resident-hero';
import { ResidentFreshnessStrip } from '../../components/resident/resident-freshness-strip';
import { ResidentTrendCard } from '../../components/resident/resident-trend-card';
import { buildResidentTrendState } from '../../components/resident/resident-view-models';
import { residentScreenMotion } from '../../components/resident/motion';
import { getResumeState, setResumeState } from '../../lib/engagement';
import { trackResumeClick } from '../../lib/analytics';
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
  const [context, setContext] = useState<AccountContext | null>(null);
  const [finance, setFinance] = useState<ResidentFinance | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
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
      setLastUpdatedAt(Date.now());
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
  const paymentConfidenceItems = [
    {
      id: 'secure',
      label: 'תשלום מאובטח',
      value: 'מוצפן ומאומת',
      icon: <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} />,
    },
    {
      id: 'due-date',
      label: nextPaymentDue ? 'מועד חיוב' : 'סטטוס חשבון',
      value: nextPaymentDue ? formatDate(nextPaymentDue.dueDate, locale) : finance?.summary.currentBalance ? 'יתרה פתוחה' : 'הכול מעודכן',
      icon: <CreditCard className="h-3.5 w-3.5" strokeWidth={1.8} />,
    },
    {
      id: 'sync',
      label: 'אישור ועדכון',
      value: lastUpdatedAt ? 'קבלה ומעקב מידיים' : 'ממתין לסנכרון',
      icon: <Bell className="h-3.5 w-3.5" strokeWidth={1.8} />,
    },
  ];
  const residentTimeline = nextPaymentDue
    ? [
        { id: 'due', title: 'חיוב פתוח', detail: nextPaymentDue.description, state: nextPaymentDue.status === 'OVERDUE' ? 'warning' as const : 'default' as const },
        { id: 'payment', title: 'תשלום ואישור', detail: 'לאחר התשלום תקבל קבלה והסטטוס יתעדכן מיד.', state: 'default' as const },
        { id: 'followup', title: 'סגירת מעקב', detail: liveConnected ? 'החשבון מחובר להתראות חיות.' : 'החשבון יעדכן סטטוס בסנכרון הבא.', state: liveConnected ? 'success' as const : 'default' as const },
      ]
    : [
        { id: 'clear', title: 'החשבון בשליטה', detail: 'אין כרגע חיוב דחוף פתוח.', state: 'success' as const },
        { id: 'notifications', title: 'עדכונים', detail: unreadNotifications.length ? `${unreadNotifications.length} עדכונים מחכים לקריאה.` : 'אין עדכונים דחופים.', state: unreadNotifications.length ? 'default' as const : 'success' as const },
        { id: 'support', title: 'שירות', detail: openTickets.length ? `יש ${openTickets.length} קריאות פתוחות למעקב.` : 'אפשר לפתוח בקשה חדשה בכל רגע.', state: openTickets.length ? 'warning' as const : 'default' as const },
      ];

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
    <div dir="rtl" className="mx-auto w-full max-w-md space-y-4 pb-24 text-right sm:max-w-4xl sm:space-y-6">
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
                <ArrowLeft className="icon-directional ms-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </motion.div>
      ) : null}

      <motion.section {...residentScreenMotion(motionReduced)}>
        <ResidentHero
          eyebrow="מרכז השליטה האישי"
          title={labels.home}
          subtitle={undefined}
          badge={<div className="rounded-full border border-primary/12 bg-white/76 px-3 py-1.5 text-xs font-semibold text-primary">חשבון דייר</div>}
          floatingCard={
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/72">
                    {primaryBuilding?.name || labels.home}
                  </div>
                  <h1 className="mt-1 text-[26px] font-black leading-[1.02] tracking-[-0.02em] text-foreground">{residentName}</h1>
                  <p className="mt-1 text-[13px] leading-6 text-secondary-foreground">{heroSubline}</p>
                </div>
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[radial-gradient(circle_at_30%_30%,rgba(255,244,220,0.96),rgba(221,174,80,0.94)_38%,rgba(101,70,28,1)_100%)] text-white shadow-[0_12px_24px_rgba(207,146,50,0.18)]">
                  <UserRound className="h-9 w-9" strokeWidth={1.8} />
                </div>
              </div>

              <div className="gold-sheen-surface rounded-[26px] p-4" data-accent-sheen="true">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold tracking-[0.16em] text-secondary-foreground">דופק החשבון</div>
                    <div className="mt-2 text-[34px] font-black leading-none text-foreground">
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
          <div className="space-y-2.5">
            <Link
              href={residentPrimaryAction.href}
              className="gold-sheen-button flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full px-4 text-base font-semibold shadow-raised"
              data-accent-sheen="true"
            >
              {residentPrimaryAction.ctaLabel}
              <ArrowUpRight className="icon-directional h-4 w-4" strokeWidth={1.85} />
            </Link>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {paymentConfidenceItems.map((item) => (
                <div
                  key={item.id}
                  className="flex min-h-[44px] items-center gap-2 rounded-[18px] border border-primary/12 bg-white/72 px-3 py-2 text-right"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-secondary-foreground">{item.label}</div>
                    <div className="truncate text-[12px] font-semibold text-foreground">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ResidentHero>
      </motion.section>

      <motion.section
        {...residentScreenMotion(motionReduced, 0.05)}
        className="space-y-3"
      >
        <ResidentFreshnessStrip
          connected={liveConnected}
          lastUpdatedAt={lastUpdatedAt}
          unreadCount={unreadNotifications.length}
        />
        <GlassSurface className="rounded-[26px] p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">מסלול החשבון</div>
              <div className="mt-0.5 text-[11px] text-secondary-foreground">ברור מה קורה עכשיו ומה קורה מיד אחרי הפעולה.</div>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-foreground">Client service</div>
          </div>
          <div className="mt-3 space-y-2.5">
            {residentTimeline.map((item, index) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold',
                      item.state === 'warning'
                        ? 'bg-warning/14 text-warning'
                        : item.state === 'success'
                          ? 'bg-success/14 text-success'
                          : 'bg-primary/10 text-primary',
                    )}
                  >
                    {index + 1}
                  </span>
                  {index < residentTimeline.length - 1 ? <span className="mt-1 h-6 w-px bg-border" /> : null}
                </div>
                <div className="min-w-0 pt-1">
                  <div className="text-[13px] font-semibold text-foreground">{item.title}</div>
                  <div className="mt-0.5 text-[12px] leading-5 text-secondary-foreground">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassSurface>
      </motion.section>

      <motion.section {...residentScreenMotion(motionReduced, 0.1)} className="px-1">
        <div className="space-y-3">
          <div className="px-1 text-right">
            <div className="text-base font-semibold text-foreground">פעולות מהירות</div>
            <div className="mt-0.5 text-xs text-secondary-foreground">הקיצורים החשובים לדייר, בלי לעבור בין מסכים.</div>
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
                <div className="mt-0.5 text-xs text-secondary-foreground">הדברים שעדיין דורשים מעקב או קריאה.</div>
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
