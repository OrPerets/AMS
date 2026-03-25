import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Bell, Building2, ClipboardList, CreditCard, FileText, MapPinned, MessageCircle, ShieldCheck, Ticket, UserRound } from 'lucide-react';
import { authFetch, getAccessToken, getCurrentUserId, getEffectiveRole } from '../../lib/auth';
import { cn, formatCurrency, formatDate, getTicketStatusTone } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { MobileActionHub, type MobileActionHubItem } from '../../components/ui/mobile-action-hub';
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
  const locale = 'he';
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

  const hubItems: MobileActionHubItem[] = [
    {
      id: 'pay',
      label: nextPaymentDue ? 'שלם עכשיו' : 'מרכז תשלומים',
      description: nextPaymentDue ? 'חיוב פתוח' : 'יתרה וקבלות',
      href: '/payments/resident',
      icon: CreditCard,
      badge: finance?.summary.unpaidInvoices || undefined,
      accent: nextPaymentDue ? 'warning' : 'primary',
      priority: 'primary',
      previewValue: finance ? formatCurrency(finance.summary.currentBalance) : undefined,
    },
    {
      id: 'request-new',
      label: 'בקשה חדשה',
      description: 'פתיחה מהירה',
      href: '/resident/requests?view=new',
      icon: ClipboardList,
      accent: 'primary',
    },
    {
      id: 'request-history',
      label: 'מעקב בקשות',
      description: openTickets.length ? 'בטיפול' : 'היסטוריה',
      href: '/resident/requests?view=history',
      icon: Ticket,
      badge: openTickets.length || undefined,
      accent: openTickets.length ? 'warning' : 'neutral',
    },
    {
      id: 'building',
      label: primaryBuilding?.name || 'הבניין שלי',
      description: primaryBuilding?.address || 'פרטים ושירותים',
      href: '/resident/building',
      icon: Building2,
      accent: 'neutral',
    },
    {
      id: 'updates',
      label: 'עדכונים',
      description: unreadNotifications.length ? `${unreadNotifications.length} חדשים` : 'שקט',
      href: '/notifications',
      icon: Bell,
      badge: unreadNotifications.length || undefined,
      accent: unreadNotifications.length ? 'info' : 'neutral',
      priority: 'utility',
    },
    {
      id: 'documents',
      label: 'מסמכים',
      description: 'חוזים וקבלות',
      href: '/documents',
      icon: FileText,
      accent: 'neutral',
      priority: 'utility',
    },
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
                <ArrowLeft className="ms-1.5 h-3.5 w-3.5" />
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
          badge={<div className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white">חשבון דייר</div>}
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
                    <div className="text-[11px] font-semibold tracking-[0.16em] text-secondary-foreground">{spotlight.label}</div>
                    <div className="mt-2 text-[34px] font-black leading-none text-foreground">
                      <bdi>{spotlight.value}</bdi>
                    </div>
                  </div>
                  <HeroStatusBadge
                    icon={nextPaymentDue ? <CreditCard className="h-4 w-4" strokeWidth={1.8} /> : <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />}
                    label={nextPaymentDue ? 'לתשלום' : 'מבט מהיר'}
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
      </motion.section>

      <motion.section {...residentScreenMotion(motionReduced, 0.1)} className="px-1">
        <MobileActionHub
          title="פעולות מהירות"
          items={hubItems}
          layout="hierarchy"
        />
      </motion.section>

      <motion.section {...residentScreenMotion(motionReduced, 0.15)} className="space-y-3">
        <div className="grid grid-cols-3 gap-2.5">
          <LaunchMetric label="יתרה" value={formatCurrency(finance?.summary.currentBalance ?? 0)} tone={finance?.summary.currentBalance ? 'warning' : 'success'} />
          <LaunchMetric label="פתוחים" value={finance?.summary.unpaidInvoices ?? 0} tone={finance?.summary.unpaidInvoices ? 'warning' : 'default'} />
          <LaunchMetric label="קריאות" value={openTickets.length} tone={openTickets.length ? 'default' : 'success'} />
        </div>

        {continuationItems.length ? (
          <div className="overflow-hidden rounded-[28px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] shadow-[0_16px_36px_rgba(44,28,9,0.07)]">
            <div className="flex items-center justify-between border-b border-subtle-border/70 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-foreground">להמשך מהיר</div>
              </div>
              <Link href={continuationItems[0].href} className="text-xs font-semibold text-primary">
                פתח
              </Link>
            </div>
            <div className="divide-y divide-subtle-border/70">
              {continuationItems.map((item) => (
                <Link key={item.id} href={item.href} className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-primary/5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground">{item.label}</span>
                      <span className="rounded-full border border-primary/12 bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary">{item.meta}</span>
                    </div>
                    <div className="mt-1 line-clamp-1 text-[12px] text-secondary-foreground">{item.detail}</div>
                  </div>
                  <ArrowUpRight className="icon-directional h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                </Link>
              ))}
            </div>
          </div>
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
