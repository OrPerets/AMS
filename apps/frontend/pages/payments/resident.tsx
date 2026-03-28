import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpLeft, CalendarClock, CheckCircle2, ChevronDown, CreditCard, Download, Receipt, ShieldCheck, WalletCards, X } from 'lucide-react';
import { authFetch, downloadAuthenticatedFile, getAccessToken, getCurrentUserId, getEffectiveRole } from '../../lib/auth';
import { cn, formatCurrency, formatDate, humanizeEnum } from '../../lib/utils';
import { toast } from '../../components/ui/use-toast';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { EmptyState } from '../../components/ui/empty-state';
import { GlassSurface } from '../../components/ui/glass-surface';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ResidentListCard } from '../../components/ui/resident-list-card';
import { Switch } from '../../components/ui/switch';
import { AmsDrawer } from '../../components/ui/ams-drawer';
import { AmsTabs } from '../../components/ui/ams-tabs';
import { ResidentPaymentMethodsPanel, type ResidentPaymentMethod } from '../../components/resident/payment-methods-panel';
import { ResidentFreshnessStrip } from '../../components/resident/resident-freshness-strip';
import { ResidentHero } from '../../components/resident/resident-hero';
import { ResidentStepSummaryTiles } from '../../components/resident/resident-step-summary-tiles';
import { residentScreenMotion, residentStepMotion, residentSuccessMotion } from '../../components/resident/motion';
import { useLocale } from '../../lib/providers';
import { triggerHaptic } from '../../lib/mobile';
import { getRouteTransitionTokensByKey } from '../../lib/route-transition-contract';
import { setResumeState } from '../../lib/engagement';
import { websocketService } from '../../lib/websocket';

type AccountContext = {
  user: { id: number; email: string };
  residentId: number | null;
  units: Array<{ id: number; number: string; building: { name: string } }>;
};

type ResidentFinance = {
  summary: {
    currentBalance: number;
    unpaidInvoices: number;
    overdueInvoices: number;
    unreadNotifications: number;
  };
  invoices: Array<{
    id: number;
    amount: number;
    dueDate: string;
    issueDate?: string;
    paidAt?: string | null;
    status: string;
    description: string;
    receiptNumber?: string | null;
  }>;
  ledger: Array<{ id: string; type: string; amount: number; createdAt: string; summary: string }>;
};

const payableStatuses = new Set(['UNPAID', 'OVERDUE']);

function translateInvoiceStatus(status: string) {
  const labels: Record<string, string> = {
    PAID: 'שולם',
    OVERDUE: 'בפיגור',
    UNPAID: 'טרם שולם',
    PENDING: 'ממתין לתשלום',
  };
  return labels[status] || humanizeEnum(status);
}

export default function ResidentPaymentsPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const reducedMotion = useReducedMotion();
  const motionReduced = Boolean(reducedMotion);
  const transitionTokens = getRouteTransitionTokensByKey('payments');
  const iconLayoutId = reducedMotion ? undefined : transitionTokens.icon;
  const badgeLayoutId = reducedMotion ? undefined : transitionTokens.badge;
  const titleLayoutId = reducedMotion ? undefined : transitionTokens.title;
  const [context, setContext] = useState<AccountContext | null>(null);
  const [finance, setFinance] = useState<ResidentFinance | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<ResidentPaymentMethod[]>([]);
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<number | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'history' | 'methods'>('open');
  const [paymentDrawerInvoiceId, setPaymentDrawerInvoiceId] = useState<number | null>(null);
  const [paymentFlowStep, setPaymentFlowStep] = useState<1 | 2 | 3>(1);
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<number[]>([]);
  const [methodsAutoOpen, setMethodsAutoOpen] = useState(false);

  useEffect(() => {
    setResumeState({ screen: 'resident', href: '/payments/resident', label: 'מרכז תשלומים', role: getEffectiveRole() || 'RESIDENT', userId: getCurrentUserId() });
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const section = typeof router.query.section === 'string' ? router.query.section : '';
    if (section === 'methods') {
      setActiveTab('methods');
      void router.replace('/payments/resident', undefined, { shallow: true });
      return;
    }
    void loadPage();
  }, [router.isReady, router.query.section]);

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);
      const contextRes = await authFetch('/api/v1/users/account');
      if (!contextRes.ok) throw new Error(await contextRes.text());
      const nextContext = await contextRes.json();
      setContext(nextContext);

      if (!nextContext.residentId) {
        throw new Error('missing resident context');
      }

      const [financeRes, methodsRes, autopayRes] = await Promise.all([
        authFetch(`/api/v1/invoices/account/${nextContext.residentId}`),
        authFetch('/api/v1/payments/methods'),
        authFetch('/api/v1/payments/autopay'),
      ]);

      if (!financeRes.ok) throw new Error(await financeRes.text());
      setFinance(await financeRes.json());
      setPaymentMethods(methodsRes.ok ? await methodsRes.json() : []);

      if (autopayRes.ok) {
        const prefs = await autopayRes.json();
        setAutopayEnabled(Boolean(prefs.autopayEnabled));
      }
      setLastUpdatedAt(Date.now());
    } catch (nextError) {
      console.error(nextError);
      setError('לא ניתן לטעון כרגע את מסך התשלומים. נסו שוב בעוד רגע.');
    } finally {
      setLoading(false);
    }
  }

  async function initiatePayment(invoiceId: number) {
    if (processingInvoiceId === invoiceId) return;
    try {
      setProcessingInvoiceId(invoiceId);
      const response = await authFetch(`/api/v1/invoices/${invoiceId}/pay`, { method: 'POST' });
      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();
      setPaymentRedirectUrl(result.redirectUrl || null);
      setPaymentFlowStep(3);
      setLastUpdatedAt(Date.now());
      triggerHaptic('success');
      toast({
        title: result.redirectUrl ? 'המסלול המאובטח מוכן' : 'התשלום נוצר',
        description: result.redirectUrl ? 'אפשר להמשיך.' : 'התשלום מוכן.',
      });
    } catch (nextError) {
      console.error(nextError);
      toast({ title: 'יצירת תשלום נכשלה', variant: 'destructive' });
    } finally {
      setProcessingInvoiceId(null);
    }
  }

  async function toggleAutopay(enabled: boolean) {
    try {
      const response = await authFetch('/api/v1/payments/autopay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error(await response.text());
      setAutopayEnabled(enabled);
      setLastUpdatedAt(Date.now());
      triggerHaptic('success');
      toast({
        title: enabled ? 'חיוב אוטומטי הופעל' : 'חיוב אוטומטי הושהה',
        description: enabled ? 'חשבוניות עתידיות יחויבו דרך הכרטיס הראשי.' : 'התשלומים יישארו ידניים עד להפעלה מחדש.',
      });
    } catch (nextError) {
      console.error(nextError);
      toast({ title: 'עדכון חיוב אוטומטי נכשל', variant: 'destructive' });
    }
  }

  async function addPaymentMethod(payload: {
    provider: string;
    token: string;
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    networkTokenized?: boolean;
    isDefault?: boolean;
  }) {
    try {
      const response = await authFetch('/api/v1/payments/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
      setPaymentMethods((current) => {
        const nextMethod: ResidentPaymentMethod = {
          id: Date.now(),
          provider: payload.provider,
          brand: payload.brand,
          last4: payload.last4,
          expMonth: payload.expMonth,
          expYear: payload.expYear,
          networkTokenized: Boolean(payload.networkTokenized),
          isDefault: payload.isDefault ?? current.length === 0,
        };
        return [nextMethod, ...current.map((method) => ({ ...method, isDefault: nextMethod.isDefault ? false : method.isDefault }))];
      });
      triggerHaptic('success');
      toast({
        title: 'הכרטיס נשמר',
        description: 'הכרטיס זמין עכשיו.',
      });
      setLastUpdatedAt(Date.now());
      await loadPage();
    } catch (nextError) {
      console.error(nextError);
      toast({ title: 'שמירת כרטיס נכשלה', variant: 'destructive' });
      throw nextError;
    }
  }

  async function setDefaultCard(id: number) {
    try {
      const response = await authFetch(`/api/v1/payments/methods/${id}/default`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error(await response.text());
      setPaymentMethods((current) => current.map((method) => ({ ...method, isDefault: method.id === id })));
      toast({ title: 'הכרטיס הראשי עודכן' });
      setLastUpdatedAt(Date.now());
      await loadPage();
    } catch (nextError) {
      console.error(nextError);
      toast({ title: 'עדכון ברירת המחדל נכשל', variant: 'destructive' });
      throw nextError;
    }
  }

  async function removeCard(id: number) {
    try {
      const response = await authFetch(`/api/v1/payments/methods/${id}/remove`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error(await response.text());
      setPaymentMethods((current) => {
        const nextMethods = current.filter((method) => method.id !== id);
        if (nextMethods.length > 0 && !nextMethods.some((method) => method.isDefault)) {
          nextMethods[0] = { ...nextMethods[0], isDefault: true };
        }
        return [...nextMethods];
      });
      toast({ title: 'הכרטיס הוסר' });
      setLastUpdatedAt(Date.now());
      await loadPage();
    } catch (nextError) {
      console.error(nextError);
      toast({ title: 'מחיקת הכרטיס נכשלה', variant: 'destructive' });
      throw nextError;
    }
  }

  const nextPaymentDue = useMemo(
    () =>
      [...(finance?.invoices ?? [])]
        .filter((invoice) => payableStatuses.has(invoice.status))
        .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())[0],
    [finance],
  );
  const sortedInvoices = useMemo(
    () =>
      [...(finance?.invoices ?? [])].sort(
        (left, right) =>
          Number(payableStatuses.has(right.status)) - Number(payableStatuses.has(left.status)) ||
          new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime(),
      ),
    [finance?.invoices],
  );

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    websocketService.connect(token);
    setLiveConnected(websocketService.isConnected());

    const handleNewNotification = () => {
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
  if (error || !context || !finance) {
    return <InlineErrorPanel title="מסך התשלומים לא נטען" description={error || 'לא נמצאו נתונים'} onRetry={() => void loadPage()} />;
  }

  const primaryMethod = paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0] ?? null;
  const selectedInvoice = sortedInvoices.find((invoice) => invoice.id === paymentDrawerInvoiceId) ?? nextPaymentDue ?? null;
  const historyEntries = finance.ledger.slice(0, 10);
  const heroBalanceLabel = finance.summary.currentBalance > 0 ? 'יתרה לתשלום' : 'החשבון מאוזן';
  const nextDueLabel = nextPaymentDue ? formatDate(nextPaymentDue.dueDate, locale) : 'אין מועד פתוח';
  const primaryBuilding = context.units[0]?.building?.name;
  const paymentProcessSteps = [
    { step: 1 as const, title: 'סקירה', subtitle: 'חיוב וכרטיס' },
    { step: 2 as const, title: 'אישור', subtitle: 'בדיקה לפני חיוב' },
  ];
  const paymentLaneItems = selectedInvoice
    ? [
        {
          id: 'lane-amount',
          label: 'לתשלום',
          value: formatCurrency(selectedInvoice.amount),
          tone: selectedInvoice.status === 'OVERDUE' ? ('warning' as const) : ('default' as const),
        },
        {
          id: 'lane-method',
          label: 'כרטיס',
          value: primaryMethod ? `•••• ${primaryMethod.last4 || '••••'}` : 'חסר',
          tone: primaryMethod ? ('success' as const) : ('warning' as const),
        },
        {
          id: 'lane-receipt',
          label: 'קבלה',
          value: selectedInvoice.receiptNumber || 'אחרי אישור',
        },
      ]
    : [
        {
          id: 'lane-balance',
          label: 'יתרה',
          value: formatCurrency(finance.summary.currentBalance),
          tone: finance.summary.currentBalance > 0 ? ('warning' as const) : ('success' as const),
        },
        { id: 'lane-history', label: 'היסטוריה', value: finance.ledger.length || 0 },
        {
          id: 'lane-method-ready',
          label: 'כרטיס',
          value: primaryMethod ? 'מוכן' : 'חסר',
          tone: primaryMethod ? ('success' as const) : ('warning' as const),
        },
      ];

  function toggleInvoice(invoiceId: number) {
    setExpandedInvoiceIds((current) =>
      current.includes(invoiceId) ? current.filter((id) => id !== invoiceId) : [...current, invoiceId],
    );
  }

  function openPaymentFlow(invoiceId: number, step: 1 | 2 | 3 = 1) {
    setPaymentDrawerInvoiceId(invoiceId);
    setPaymentFlowStep(step);
    setPaymentRedirectUrl(null);
    setMethodsAutoOpen(false);
    triggerHaptic('light');
  }

  function advancePaymentFlow(step: 1 | 2 | 3) {
    setPaymentFlowStep(step);
    triggerHaptic(step === 2 ? 'warning' : step === 3 ? 'success' : 'light');
  }

  function closePaymentFlow() {
    setPaymentDrawerInvoiceId(null);
    setPaymentFlowStep(1);
    setPaymentRedirectUrl(null);
  }

  return (
    <div className="space-y-4 pb-4 text-right sm:space-y-6">
      <motion.section {...residentScreenMotion(motionReduced)}>
        <ResidentHero
          eyebrow="תשלומים"
          eyebrowIcon={
            <motion.span
              layoutId={iconLayoutId}
              initial={motionReduced ? { opacity: 0.94 } : false}
              animate={motionReduced ? { opacity: 1 } : undefined}
              transition={motionReduced ? { duration: 0.2, ease: 'easeOut' } : undefined}
              className="inline-flex"
            >
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.85} />
            </motion.span>
          }
          title={
            <motion.span
              layoutId={titleLayoutId}
              initial={motionReduced ? { opacity: 0.94 } : false}
              animate={motionReduced ? { opacity: 1 } : undefined}
              transition={motionReduced ? { duration: 0.2, ease: 'easeOut' } : undefined}
              className="inline-block"
            >
              מרכז תשלומים
            </motion.span>
          }
          subtitle={undefined}
          badge={
            <motion.div
              layoutId={badgeLayoutId}
              initial={motionReduced ? { opacity: 0.92 } : false}
              animate={motionReduced ? { opacity: 1 } : undefined}
              transition={motionReduced ? { duration: 0.2, ease: 'easeOut' } : undefined}
              className="rounded-full border border-primary/12 bg-white/76 px-3 py-1.5 text-xs font-semibold text-primary"
            >
              חשבון דייר
            </motion.div>
          }
          floatingCard={
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.12em] text-primary/72">{heroBalanceLabel}</div>
                  <div className="mt-2 text-[38px] font-black leading-none tracking-[-0.03em] text-foreground sm:text-[40px]">
                    <bdi>{formatCurrency(finance.summary.currentBalance)}</bdi>
                  </div>
                  <div className="mt-2 text-[14px] leading-6 text-secondary-foreground">
                    {nextPaymentDue ? `${nextPaymentDue.description} · עד ${nextDueLabel}` : 'אין חיוב פתוח'}
                  </div>
                </div>
                <HeroStatusBadge
                  icon={<CalendarClock className="h-4 w-4" strokeWidth={1.85} />}
                  label={nextPaymentDue ? 'חיוב קרוב' : 'מצב תקין'}
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <HeroStatChip label="פתוחים" value={finance.summary.unpaidInvoices} />
                <HeroStatChip label="בפיגור" value={finance.summary.overdueInvoices} tone="warning" />
                <HeroStatChip label="כרטיס" value={primaryMethod ? `•••• ${primaryMethod.last4 || '••••'}` : 'חסר'} />
              </div>
            </div>
          }
          bodyClassName="pt-0"
        >
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={nextPaymentDue ? () => openPaymentFlow(nextPaymentDue.id) : () => setActiveTab('history')}
              className="gold-sheen-button flex min-h-[58px] w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold"
              data-accent-sheen="true"
            >
              <ArrowUpLeft className="icon-directional h-4 w-4" strokeWidth={1.9} />
              {nextPaymentDue ? 'שלם עכשיו' : 'היסטוריה'}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('methods')}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-primary/14 bg-white/76 px-4 text-sm font-semibold text-foreground transition hover:bg-white"
              >
                <WalletCards className="h-4 w-4" strokeWidth={1.9} />
                אמצעי תשלום
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('open')}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-primary/14 bg-white/76 px-4 text-sm font-semibold text-foreground transition hover:bg-white"
              >
                <Receipt className="h-4 w-4" strokeWidth={1.9} />
                כל החיובים
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <CompactLaneChip
                label="כרטיס"
                value={primaryMethod ? `•••• ${primaryMethod.last4 || '••••'}` : 'חסר'}
                tone={primaryMethod ? 'success' : 'warning'}
              />
              <CompactLaneChip
                label="אוטומטי"
                value={autopayEnabled ? 'פעיל' : 'ידני'}
                tone={autopayEnabled ? 'success' : 'default'}
              />
              <CompactLaneChip label="היסטוריה" value={historyEntries.length} tone="default" />
            </div>
          </div>
        </ResidentHero>
      </motion.section>

      <motion.section {...residentScreenMotion(motionReduced, 0.06)} className="space-y-3">
        {/* <ResidentFreshnessStrip
          connected={liveConnected}
          lastUpdatedAt={lastUpdatedAt}
          unreadCount={finance.summary.unreadNotifications}
        /> */}

        <GlassSurface strength="strong" className="rounded-[30px] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold tracking-[0.12em] text-primary/72">לתשלום</div>
              <h2 className="mt-1 line-clamp-1 text-[20px] font-semibold text-foreground">
                {selectedInvoice ? selectedInvoice.description : 'אין כרגע חיוב פתוח'}
              </h2>
              <div className="mt-1 text-[13px] leading-5 text-secondary-foreground">
                {selectedInvoice
                  ? `${formatDate(selectedInvoice.dueDate, locale)} · ${translateInvoiceStatus(selectedInvoice.status)}`
                  : 'קבלות וכרטיסים'}
              </div>
            </div>
            <Badge variant={selectedInvoice ? 'warning' : 'outline'}>{selectedInvoice ? 'מוכן' : 'שקט'}</Badge>
          </div>

          <ResidentStepSummaryTiles className="mt-3" items={paymentLaneItems} />

          <div className="mt-4 grid grid-cols-1 gap-2">
            <Button
              size="lg"
              className="min-h-[56px] w-full"
              onClick={selectedInvoice ? () => openPaymentFlow(selectedInvoice.id) : () => setActiveTab('history')}
            >
              {selectedInvoice ? 'תשלום מיידי' : 'פתח היסטוריית תשלומים'}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              {primaryMethod ? (
                <Button variant="outline" size="lg" className="min-h-[50px] rounded-full" onClick={() => setActiveTab('methods')}>
                  החלף כרטיס
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  className="min-h-[50px] rounded-full"
                  onClick={() => {
                    setActiveTab('methods');
                    setMethodsAutoOpen(true);
                  }}
                >
                  הוסף כרטיס
                </Button>
              )}
              <Button variant="ghost" size="lg" className="min-h-[50px] rounded-full" onClick={() => setActiveTab('history')}>
                קבלות קודמות
              </Button>
            </div>
          </div>
        </GlassSurface>
      </motion.section>

      <div id="resident-payments-tabs">
        <AmsTabs
          ariaLabel="תשלומי דייר"
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as 'open' | 'history' | 'methods')}
          className="w-full text-right"
          listClassName="grid-cols-3 gap-1.5"
          panelClassName="pt-3 text-right"
          items={[
            {
              key: 'open',
              title: 'פתוחים',
              badge: finance.summary.unpaidInvoices || null,
              icon: <Receipt className="h-4 w-4" strokeWidth={1.75} />,
              content: (
                <div className="space-y-3">
                  {sortedInvoices.length ? (
                    <div className="space-y-3">
                      {sortedInvoices.map((invoice, index) => (
                        <motion.div
                          key={invoice.id}
                          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                          transition={{ duration: 0.24, delay: reducedMotion ? 0 : index * 0.04, ease: 'easeOut' }}
                        >
                          <InvoiceShowcaseCard
                            invoice={invoice}
                            locale={locale}
                            expanded={expandedInvoiceIds.includes(invoice.id)}
                            isProcessing={processingInvoiceId === invoice.id}
                            onToggle={() => toggleInvoice(invoice.id)}
                            onPay={() => openPaymentFlow(invoice.id)}
                            onDownload={
                              invoice.receiptNumber
                                ? () => downloadAuthenticatedFile(`/api/v1/invoices/${invoice.id}/receipt`, `receipt-${invoice.receiptNumber}.pdf`)
                                : undefined
                            }
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState type="empty" size="sm" title="אין חיובים פתוחים" description="חיוב חדש יופיע כאן" />
                  )}
                </div>
              ),
            },
            {
              key: 'history',
              title: 'היסטוריה',
              icon: <Receipt className="h-4 w-4" strokeWidth={1.75} />,
              content: (
                <div className="space-y-2">
                  {finance.ledger.length ? (
                    historyEntries.map((entry, index) => (
                      <LedgerRow key={entry.id} entry={entry} locale={locale} delay={index * 0.03} />
                    ))
                  ) : (
                    <EmptyState type="empty" size="sm" title="אין היסטוריה עדיין" description="התשלום הראשון יופיע כאן" />
                  )}
                </div>
              ),
            },
            {
              key: 'methods',
              title: 'כרטיסים',
              badge: primaryMethod ? 'ראשי' : null,
              icon: <CreditCard className="h-4 w-4" strokeWidth={1.75} />,
              content: (
                <div className="space-y-3">
                  {primaryMethod ? (
                    <GlassSurface className="rounded-[26px] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-semibold tracking-[0.12em] text-primary/72">כרטיס ראשי</div>
                          <div className="mt-2 text-lg font-semibold text-foreground">{primaryMethod.brand || 'כרטיס שמור'} •••• {primaryMethod.last4 || '••••'}</div>
                          <div className="mt-1 text-sm text-secondary-foreground">
                            {primaryMethod.expMonth && primaryMethod.expYear ? `בתוקף עד ${String(primaryMethod.expMonth).padStart(2, '0')}/${String(primaryMethod.expYear).slice(-2)}` : 'מוכן לחיוב'}
                          </div>
                        </div>
                        <Badge variant="success">פעיל לתשלום</Badge>
                      </div>
                    </GlassSurface>
                  ) : null}
                  <ResidentPaymentMethodsPanel
                    paymentMethods={paymentMethods}
                    autopayEnabled={autopayEnabled}
                    primaryBuilding={primaryBuilding}
                    autoOpenAddFlow={methodsAutoOpen}
                    onAutoOpenHandled={() => setMethodsAutoOpen(false)}
                    onToggleAutopay={toggleAutopay}
                    onAddPaymentMethod={addPaymentMethod}
                    onSetDefault={setDefaultCard}
                    onRemove={removeCard}
                    embedded
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      <AmsDrawer
        isOpen={Boolean(paymentDrawerInvoiceId)}
        onOpenChange={(open) => {
          if (!open) {
            closePaymentFlow();
          }
        }}
        title="תשלום מאובטח"
        description={
          selectedInvoice
            ? `${selectedInvoice.description} · ${formatCurrency(selectedInvoice.amount)}`
            : 'סקירה קצרה'
        }
        tone="light"
        size="full"
        className="max-h-[100dvh] rounded-none md:max-h-[100dvh] md:rounded-none"
        headerClassName="text-right"
        bodyClassName="text-right"
        footer={(onClose) => (
          <div className="w-full space-y-2">
            {paymentFlowStep === 1 ? (
              <button
                type="button"
                className="gold-sheen-button flex min-h-[52px] w-full items-center justify-center rounded-full px-4 text-base font-semibold disabled:opacity-50"
                data-accent-sheen="true"
                disabled={!selectedInvoice}
                onClick={() => {
                  if (!primaryMethod) {
                    setMethodsAutoOpen(true);
                    setActiveTab('methods');
                    onClose();
                    closePaymentFlow();
                    return;
                  }
                  advancePaymentFlow(2);
                }}
              >
                {primaryMethod ? 'המשך לאישור תשלום' : 'הוסף כרטיס ראשי'}
              </button>
            ) : null}
            {paymentFlowStep === 2 ? (
              <>
                <button
                  type="button"
                  className="gold-sheen-button flex min-h-[52px] w-full items-center justify-center rounded-full px-4 text-base font-semibold disabled:opacity-50"
                  data-accent-sheen="true"
                  disabled={!selectedInvoice || processingInvoiceId === selectedInvoice?.id}
                  onClick={() => {
                    if (!selectedInvoice) return;
                    void initiatePayment(selectedInvoice.id);
                  }}
                >
                  {selectedInvoice && processingInvoiceId === selectedInvoice.id ? 'מעבד...' : 'אישור ותשלום'}
                </button>
                <Button variant="outline" size="sm" className="w-full rounded-full min-h-[52px]" onClick={() => advancePaymentFlow(1)}>
                  חזרה לסקירה
                </Button>
              </>
            ) : null}
            {paymentFlowStep === 3 ? (
              <>
                <button
                  type="button"
                  className="gold-sheen-button flex min-h-[52px] w-full items-center justify-center rounded-full px-4 text-base font-semibold"
                  data-accent-sheen="true"
                  onClick={() => {
                    if (paymentRedirectUrl) {
                      window.location.assign(paymentRedirectUrl);
                      return;
                    }
                    onClose();
                    closePaymentFlow();
                  }}
                >
                  {paymentRedirectUrl ? 'המשך למסלול המאובטח' : 'חזרה למסך התשלומים'}
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full min-h-[52px]"
                  onClick={() => {
                    onClose();
                    setActiveTab('history');
                  }}
                >
                  פתח היסטוריה
                </Button>
              </>
            ) : null}
            {paymentFlowStep !== 3 ? (
              <Button variant="ghost" size="sm" className="min-h-[52px] w-full rounded-full text-secondary-foreground" onClick={onClose}>
                בטל
              </Button>
            ) : null}
          </div>
        )}
      >
        {selectedInvoice ? (
          <div className="space-y-4 text-right">
            <div className="flex items-center justify-between gap-3 rounded-[26px] border border-subtle-border bg-background/90 px-4 py-3">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.12em] text-secondary-foreground">תשלום</div>
                <div className="mt-1 text-[17px] font-semibold text-foreground">{selectedInvoice.description}</div>
              </div>
              <button
                type="button"
                onClick={closePaymentFlow}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-subtle-border bg-white text-secondary-foreground shadow-sm"
                aria-label="סגירת מסלול התשלום"
              >
                <X className="h-4.5 w-4.5" strokeWidth={1.9} />
              </button>
            </div>
            {paymentFlowStep !== 3 ? <PaymentFlowProgress currentStep={paymentFlowStep} items={paymentProcessSteps} /> : null}
            <AnimatePresence initial={false} mode="wait">
              {paymentFlowStep === 1 ? (
                <motion.div
                  key="resident-payment-review"
                  {...residentStepMotion(motionReduced)}
                  className="space-y-3"
                >
                  <div className="overflow-hidden rounded-[28px] border border-primary/14 bg-[linear-gradient(180deg,rgba(255,249,240,0.98)_0%,rgba(255,255,255,0.96)_100%)] p-5 shadow-[0_18px_36px_rgba(44,28,9,0.08)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold tracking-[0.12em] text-primary/72">תשלום נבחר</div>
                        <div className="mt-2 text-lg font-semibold text-foreground">{selectedInvoice.description}</div>
                        <div className="mt-1 text-sm text-secondary-foreground">
                          {translateInvoiceStatus(selectedInvoice.status)} · <bdi>{formatDate(selectedInvoice.dueDate, locale)}</bdi>
                        </div>
                      </div>
                      <Badge variant={selectedInvoice.status === 'OVERDUE' ? 'warning' : 'outline'}>{selectedInvoice.status === 'OVERDUE' ? 'בפיגור' : 'מוכן לאישור'}</Badge>
                    </div>
                    <div className="mt-4 text-[34px] font-black leading-none tracking-[-0.03em] text-foreground">
                      <bdi>{formatCurrency(selectedInvoice.amount)}</bdi>
                    </div>
                  </div>

                  <ResidentStepSummaryTiles
                    items={[
                      {
                        id: 'drawer-status',
                        label: 'סטטוס',
                        value: translateInvoiceStatus(selectedInvoice.status),
                        tone: selectedInvoice.status === 'OVERDUE' ? ('warning' as const) : ('default' as const),
                      },
                      { id: 'drawer-receipt', label: 'קבלה', value: selectedInvoice.receiptNumber || 'אחרי תשלום' },
                      {
                        id: 'drawer-method',
                        label: 'דרך',
                        value: primaryMethod ? `•••• ${primaryMethod.last4 || '••••'}` : 'נדרש כרטיס',
                        tone: primaryMethod ? ('success' as const) : ('warning' as const),
                      },
                    ]}
                    surface="light"
                  />

                  <div className="flex items-start justify-between gap-4 rounded-[24px] border border-subtle-border bg-background/90 p-4">
                    <div>
                      <div className="font-semibold text-foreground">כרטיס</div>
                      <div className="text-sm text-secondary-foreground">
                        {primaryMethod ? `הכרטיס הראשי הוא •••• ${primaryMethod.last4 || '••••'}.` : 'אין עדיין כרטיס שמור.'}
                      </div>
                    </div>
                    <Switch checked={autopayEnabled} onCheckedChange={(checked) => void toggleAutopay(checked)} aria-label="הפעלת חיוב אוטומטי במסך תשלום" />
                  </div>
                </motion.div>
              ) : null}

              {paymentFlowStep === 2 ? (
                <motion.div
                  key="resident-payment-confirm"
                  {...residentStepMotion(motionReduced)}
                  className="space-y-3"
                >
                  <div className="rounded-[24px] border border-primary/14 bg-[linear-gradient(180deg,rgba(255,249,240,0.98)_0%,rgba(255,255,255,0.96)_100%)] px-4 py-3.5 text-sm text-secondary-foreground">
                    אישור קצר לפני המעבר למסוף המאובטח.
                  </div>
                  <div className="rounded-[24px] border border-subtle-border bg-background/90 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-secondary-foreground">
                      <span>סיכום סופי</span>
                      <span>לפני אישור</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-sm text-secondary-foreground">
                        <span>{selectedInvoice.description}</span>
                        <bdi className="font-semibold text-foreground">{formatCurrency(selectedInvoice.amount)}</bdi>
                      </div>
                      <div className="flex items-center justify-between text-sm text-secondary-foreground">
                        <span>מועד</span>
                        <bdi className="font-semibold text-foreground">{formatDate(selectedInvoice.dueDate, locale)}</bdi>
                      </div>
                      <div className="flex items-center justify-between text-sm text-secondary-foreground">
                        <span>כרטיס</span>
                        <span className="font-semibold text-foreground">{primaryMethod ? `•••• ${primaryMethod.last4 || '••••'}` : 'לא הוגדר'}</span>
                      </div>
                    </div>
                    <div className="gold-divider-line mt-4 h-px w-full" />
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-secondary-foreground">סה״כ</span>
                      <bdi className="text-2xl font-black text-primary">{formatCurrency(selectedInvoice.amount)}</bdi>
                    </div>
                  </div>
                  <ResidentStepSummaryTiles
                    items={[
                      {
                        id: 'confirm-method',
                        label: 'כרטיס',
                        value: primaryMethod ? `•••• ${primaryMethod.last4 || '••••'}` : 'לא הוגדר',
                        tone: primaryMethod ? ('success' as const) : ('warning' as const),
                      },
                      {
                        id: 'confirm-autopay',
                        label: 'אוטומטי',
                        value: autopayEnabled ? 'פעיל' : 'ידני',
                        tone: autopayEnabled ? ('success' as const) : ('default' as const),
                      },
                      {
                        id: 'confirm-next',
                        label: 'השלב הבא',
                        value: 'אישור תשלום',
                      },
                    ]}
                    surface="light"
                  />
                </motion.div>
              ) : null}

              {paymentFlowStep === 3 ? (
                <motion.div
                  key="resident-payment-redirect"
                  {...residentSuccessMotion(motionReduced)}
                  className="space-y-4"
                >
                  <div className="flex flex-col items-center justify-center rounded-[30px] border border-primary/20 bg-[linear-gradient(180deg,rgba(255,248,230,0.98)_0%,rgba(255,255,255,0.96)_100%)] px-5 py-10 text-center shadow-[0_22px_48px_rgba(207,146,50,0.12)]">
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <CheckCircle2 className="h-10 w-10" strokeWidth={2} />
                      </div>
                    </div>
                    <div className="mt-6 text-xl font-bold text-foreground">
                      {paymentRedirectUrl ? 'מוכן להמשך' : 'התשלום נקלט'}
                    </div>
                    <div className="mt-2 max-w-[18rem] text-[15px] leading-6 text-secondary-foreground">
                      {paymentRedirectUrl
                        ? 'נשאר אישור אחד.'
                        : 'הקבלה תופיע בעוד רגע.'}
                    </div>
                  </div>
                  <ResidentStepSummaryTiles
                    items={[
                      { id: 'success-total', label: 'סה״כ', value: formatCurrency(selectedInvoice.amount), tone: 'success' },
                      { id: 'success-card', label: 'כרטיס', value: primaryMethod ? `•••• ${primaryMethod.last4 || '••••'}` : 'לא הוגדר' },
                      {
                        id: 'success-next',
                        label: 'השלב הבא',
                        value: paymentRedirectUrl ? 'מעבר לסליקה' : 'סיום',
                        tone: paymentRedirectUrl ? 'warning' : 'success',
                      },
                    ]}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </AmsDrawer>
    </div>
  );
}

function HeroStatusBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/12 bg-primary/8 px-3 py-1.5 text-[11px] font-semibold text-primary">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function CompactLaneChip({
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
        'rounded-[18px] border px-3 py-2 text-right',
        tone === 'warning'
          ? 'border-warning/18 bg-[linear-gradient(180deg,rgba(255,248,236,0.98)_0%,rgba(255,255,255,0.92)_100%)]'
          : tone === 'success'
            ? 'border-success/18 bg-[linear-gradient(180deg,rgba(244,252,247,0.98)_0%,rgba(255,255,255,0.92)_100%)]'
            : 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)]',
      )}
    >
      <div className="text-[10px] font-semibold text-secondary-foreground">{label}</div>
      <div className="mt-1 text-[13px] font-semibold text-foreground">
        <bdi>{value}</bdi>
      </div>
    </div>
  );
}

function HeroStatChip({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  tone?: 'default' | 'warning';
}) {
  return (
    <div
      className={cn(
        'rounded-[22px] border px-3 py-3 text-right',
        tone === 'warning'
          ? 'border-warning/18 bg-[linear-gradient(180deg,rgba(255,251,240,0.98)_0%,rgba(255,255,255,0.94)_100%)]'
          : 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)]',
      )}
    >
      <div className="text-[11px] font-semibold text-secondary-foreground">{label}</div>
      <div className="mt-2 text-lg font-black tabular-nums text-foreground">
        <bdi>{value}</bdi>
      </div>
    </div>
  );
}

function PaymentFlowProgress({
  currentStep,
  items,
}: {
  currentStep: 1 | 2 | 3;
  items: Array<{ step: 1 | 2 | 3; title: string; subtitle: string }>;
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const active = currentStep === item.step;
        const complete = currentStep > item.step;
        return (
          <div
            key={item.step}
            className={cn(
              'rounded-[20px] border px-2.5 py-2.5 text-right',
              active || complete ? 'border-primary/18 bg-primary/8' : 'border-subtle-border bg-background/90',
            )}
          >
            <div className={cn('text-[10px] font-semibold', active || complete ? 'text-primary' : 'text-muted-foreground')}>
              {complete ? 'בוצע' : `שלב ${item.step}`}
            </div>
            <div className="mt-1 text-[13px] font-semibold text-foreground">{item.title}</div>
            <div className="mt-0.5 text-[11px] leading-4 text-secondary-foreground">{item.subtitle}</div>
          </div>
        );
      })}
    </div>
  );
}

function InvoiceShowcaseCard({
  invoice,
  locale,
  expanded,
  isProcessing,
  onToggle,
  onPay,
  onDownload,
}: {
  invoice: ResidentFinance['invoices'][number];
  locale: string;
  expanded: boolean;
  isProcessing: boolean;
  onToggle: () => void;
  onPay: () => void;
  onDownload?: () => void;
}) {
  const isPayable = payableStatuses.has(invoice.status);
  const amountToneClass =
    invoice.status === 'OVERDUE'
      ? 'text-destructive'
      : invoice.status === 'PAID'
        ? 'text-success'
        : 'text-foreground';
  const iconAccent =
    invoice.status === 'OVERDUE' ? 'warning' : invoice.status === 'PAID' ? 'success' : 'default';

  return (
    <GlassSurface className="overflow-hidden rounded-[28px] text-right">
      <button
        type="button"
        onClick={isPayable ? onPay : onToggle}
        className="flex w-full items-center justify-between gap-3 p-3.5 text-right"
        aria-expanded={isPayable ? undefined : expanded}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
              iconAccent === 'warning'
                ? 'border-warning/18 bg-warning/10 text-warning'
                : iconAccent === 'success'
                  ? 'border-success/18 bg-success/10 text-success'
                  : 'border-primary/14 bg-primary/10 text-primary',
            )}
          >
            {invoice.status === 'PAID' ? <CheckCircle2 className="h-5 w-5" strokeWidth={2} /> : <Receipt className="h-5 w-5" strokeWidth={2} />}
          </span>
          <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-foreground">{invoice.description}</span>
            <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'OVERDUE' ? 'destructive' : 'outline'} className="text-[10px] px-2 py-0">
              {translateInvoiceStatus(invoice.status)}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-secondary-foreground">
            <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.75} />
            <bdi>{formatDate(invoice.dueDate, locale)}</bdi>
          </div>
        </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-[18px] font-black tabular-nums ${amountToneClass}`}>
            <bdi>{formatCurrency(invoice.amount)}</bdi>
          </div>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-subtle-border bg-white text-secondary-foreground">
            {isPayable ? <ArrowUpLeft className="icon-directional h-4 w-4" strokeWidth={2} /> : <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} strokeWidth={2} />}
          </span>
        </div>
      </button>

      {isPayable && !expanded ? (
        <div className="flex items-center justify-between border-t border-subtle-border/60 bg-white/50 px-3.5 py-2">
          <button
            type="button"
            onClick={onToggle}
            className="text-[11px] font-semibold text-primary"
          >
            פרטים
          </button>
          <span className="text-[11px] text-secondary-foreground/80">לתשלום מהיר</span>
        </div>
      ) : null}

      {expanded ? (
        <div className="space-y-3 border-t border-subtle-border/60 bg-white/50 p-4">
          <ResidentStepSummaryTiles
            items={[
              { id: 'inv-id', label: 'מזהה', value: invoice.receiptNumber ? `#${invoice.receiptNumber}` : '—', hint: 'מספר קבלה' },
              { id: 'inv-date', label: 'הונפק', value: invoice.issueDate ? formatDate(invoice.issueDate, locale) : '—' },
              { id: 'inv-status', label: 'מצב', value: translateInvoiceStatus(invoice.status), tone: invoice.status === 'OVERDUE' ? 'warning' : invoice.status === 'PAID' ? 'success' : 'default' },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            {isPayable ? (
              <Button size="sm" className="flex-1 rounded-full h-10" onClick={onPay} disabled={isProcessing}>
                {isProcessing ? 'מעבד...' : 'שלם עכשיו'}
              </Button>
            ) : null}
            {onDownload ? (
              <Button size="sm" variant="outline" className="flex-1 rounded-full h-10" onClick={onDownload}>
                <Download className="me-2 h-4 w-4" strokeWidth={1.75} />
                הורדת קבלה
              </Button>
            ) : null}
            {isPayable ? (
               <Button size="sm" variant="ghost" className="rounded-full h-10" onClick={onToggle}>
                 סגור
               </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </GlassSurface>
  );
}

function LedgerRow({
  entry,
  locale,
  delay = 0,
}: {
  entry: ResidentFinance['ledger'][number];
  locale: string;
  delay?: number;
}) {
  const isPositive = entry.amount >= 0;

  return (
    <ResidentListCard
      title={entry.summary}
      subtitle={formatDate(entry.createdAt, locale)}
      icon={isPositive ? CheckCircle2 : Receipt}
      accent={isPositive ? 'success' : 'default'}
      delay={delay}
      endSlot={
        <div className={cn('text-[15px] font-black tabular-nums', isPositive ? 'text-success' : 'text-foreground')}>
          <bdi>{formatCurrency(entry.amount)}</bdi>
        </div>
      }
    />
  );
}
