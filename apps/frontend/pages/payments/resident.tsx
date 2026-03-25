import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpLeft, CalendarClock, CheckCircle2, ChevronDown, CreditCard, Download, Receipt, ShieldCheck, WalletCards } from 'lucide-react';
import { authFetch, downloadAuthenticatedFile, getCurrentUserId, getEffectiveRole } from '../../lib/auth';
import { cn, formatCurrency, formatDate, humanizeEnum } from '../../lib/utils';
import { toast } from '../../components/ui/use-toast';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { EmptyState } from '../../components/ui/empty-state';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { AmsDrawer } from '../../components/ui/ams-drawer';
import { AmsTabs } from '../../components/ui/ams-tabs';
import { ResidentPaymentMethodsPanel, translateResidentCardBrand, type ResidentPaymentMethod } from '../../components/resident/payment-methods-panel';
import { ResidentHero } from '../../components/resident/resident-hero';
import { useLocale } from '../../lib/providers';
import { triggerHaptic } from '../../lib/mobile';
import { setResumeState } from '../../lib/engagement';

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
  const [context, setContext] = useState<AccountContext | null>(null);
  const [finance, setFinance] = useState<ResidentFinance | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<ResidentPaymentMethod[]>([]);
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'history' | 'methods'>('open');
  const [paymentDrawerInvoiceId, setPaymentDrawerInvoiceId] = useState<number | null>(null);
  const [paymentFlowStep, setPaymentFlowStep] = useState<1 | 2 | 3>(1);
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<number[]>([]);

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

      if (result.redirectUrl) {
        setPaymentFlowStep(3);
        triggerHaptic('success');
        window.setTimeout(() => {
          window.location.href = result.redirectUrl;
        }, reducedMotion ? 120 : 650);
        return;
      }

      setPaymentFlowStep(3);
      toast({
        title: 'נדרש אימות נוסף',
        description: 'נפתח בקרוב טופס תשלום מאובטח להשלמת העסקה.',
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
        description: 'אמצעי התשלום החדש זמין עכשיו במסלול התשלום.',
      });
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

  if (loading) return <DetailPanelSkeleton />;
  if (error || !context || !finance) {
    return <InlineErrorPanel title="מסך התשלומים לא נטען" description={error || 'לא נמצאו נתונים'} onRetry={() => void loadPage()} />;
  }

  const primaryMethod = paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0] ?? null;
  const selectedInvoice = sortedInvoices.find((invoice) => invoice.id === paymentDrawerInvoiceId) ?? nextPaymentDue ?? null;
  const openInvoices = sortedInvoices.filter((invoice) => payableStatuses.has(invoice.status));
  const historyEntries = finance.ledger.slice(0, 10);
  const heroBalanceLabel = finance.summary.currentBalance > 0 ? 'יתרה לתשלום' : 'החשבון מאוזן';
  const heroStatusTone = finance.summary.overdueInvoices > 0 ? 'danger' : finance.summary.unpaidInvoices > 0 ? 'warning' : 'success';
  const nextDueLabel = nextPaymentDue ? formatDate(nextPaymentDue.dueDate, locale) : 'אין מועד פתוח';
  const primaryBuilding = context.units[0]?.building?.name;
  const invoiceStack = openInvoices.slice(0, 3);
  const paymentProcessSteps = [
    { step: 1 as const, title: 'סקירה', subtitle: selectedInvoice ? 'חיוב ואמצעי תשלום' : 'בחירת חיוב' },
    { step: 2 as const, title: 'אישור', subtitle: 'בדיקה אחרונה לפני חיוב' },
    { step: 3 as const, title: 'מעבר', subtitle: 'פותחים את המסלול המאובטח' },
  ];

  function toggleInvoice(invoiceId: number) {
    setExpandedInvoiceIds((current) =>
      current.includes(invoiceId) ? current.filter((id) => id !== invoiceId) : [...current, invoiceId],
    );
  }

  function openPaymentFlow(invoiceId: number, step: 1 | 2 | 3 = 1) {
    setPaymentDrawerInvoiceId(invoiceId);
    setPaymentFlowStep(step);
    triggerHaptic('light');
  }

  function advancePaymentFlow(step: 1 | 2 | 3) {
    setPaymentFlowStep(step);
    triggerHaptic(step === 2 ? 'warning' : step === 3 ? 'success' : 'light');
  }

  return (
    <div dir="rtl" className="space-y-4 pb-4 text-right sm:space-y-6">
      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <ResidentHero
          eyebrow="מרכז תשלומים"
          eyebrowIcon={<ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.85} />}
          title="מרכז תשלומים"
          subtitle="חיוב ברור למעלה, מסלול קצר לאישור, וכל השאר זמין רק כשצריך."
          badge={<div className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white">חשבון דייר</div>}
          floatingCard={
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/72">{heroBalanceLabel}</div>
                  <div className="mt-2 text-[38px] font-black leading-none tracking-[-0.03em] text-foreground sm:text-[40px]">
                    <bdi>{formatCurrency(finance.summary.currentBalance)}</bdi>
                  </div>
                  <div className="mt-2 text-[14px] leading-6 text-secondary-foreground">
                    {nextPaymentDue ? `${nextPaymentDue.description} · עד ${nextDueLabel}` : 'אין חיוב פתוח כרגע. אפשר לבדוק היסטוריה או לעדכן את אמצעי התשלום.'}
                  </div>
                </div>
                <HeroStatusBadge
                  icon={<CalendarClock className="h-4 w-4" strokeWidth={1.85} />}
                  label={nextPaymentDue ? 'חיוב קרוב' : 'מצב תקין'}
                />
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                <HeroStatChip label="פתוחים" value={finance.summary.unpaidInvoices} />
                <HeroStatChip label="בפיגור" value={finance.summary.overdueInvoices} tone="warning" />
                <HeroStatChip label="כרטיס ראשי" value={primaryMethod ? `•••• ${primaryMethod.last4 || '••••'}` : 'לא הוגדר'} />
              </div>
            </div>
          }
          bodyClassName="pt-0"
        >
          <div className="space-y-3">
            <button
              type="button"
              onClick={nextPaymentDue ? () => openPaymentFlow(nextPaymentDue.id) : () => setActiveTab('history')}
              className="gold-sheen-button flex min-h-[58px] w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold"
              data-accent-sheen="true"
            >
              <ArrowUpLeft className="h-4 w-4" strokeWidth={1.9} />
              {nextPaymentDue ? 'שלם עכשיו' : 'פתח היסטוריית תשלומים'}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
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
          </div>
        </ResidentHero>
      </motion.section>

      {invoiceStack.length ? (
        <motion.section
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: reducedMotion ? 0 : 0.08, ease: 'easeOut' }}
          className="rounded-[28px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] p-3.5 shadow-[0_16px_30px_rgba(44,28,9,0.05)]"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[16px] font-semibold text-foreground">החיובים הבאים</div>
              <div className="mt-1 text-[12px] text-secondary-foreground">כל שורה פותחת תשלום או פירוט חשבונית.</div>
            </div>
            <Button variant="outline" size="sm" className="rounded-full px-3 text-[12px]" onClick={() => setActiveTab('open')}>
              פתח הכל
            </Button>
          </div>
          <div className="space-y-2.5">
            {invoiceStack.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                onClick={() => openPaymentFlow(invoice.id)}
                className="flex w-full items-center justify-between gap-3 rounded-[22px] border border-subtle-border bg-white/88 px-3.5 py-3 text-right transition hover:-translate-y-0.5 hover:border-primary/18"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-foreground">{invoice.description}</div>
                  <div className="mt-1 text-[12px] text-secondary-foreground">{formatDate(invoice.dueDate, locale)} · {translateInvoiceStatus(invoice.status)}</div>
                </div>
                <div className="text-[15px] font-black text-foreground tabular-nums">
                  <bdi>{formatCurrency(invoice.amount)}</bdi>
                </div>
              </button>
            ))}
          </div>
        </motion.section>
      ) : null}

      <div id="resident-payments-tabs">
        <AmsTabs
          ariaLabel="Resident payments"
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
                  <EmptyState type="empty" size="sm" title="אין כרגע חשבוניות להצגה" description="כאשר יופיע חיוב חדש, נראה אותו כאן." />
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
                    <motion.div
                      key={entry.id}
                      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.24, delay: reducedMotion ? 0 : index * 0.03, ease: 'easeOut' }}
                    >
                      <LedgerRow entry={entry} locale={locale} />
                    </motion.div>
                  ))
                ) : (
                  <EmptyState type="empty" size="sm" title="עדיין אין היסטוריית תשלומים" description="לאחר תשלום ראשון נציג כאן קבלות וחיובים קודמים." />
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
                  <ResidentPaymentMethodsPanel
                    paymentMethods={paymentMethods}
                    autopayEnabled={autopayEnabled}
                    primaryBuilding={primaryBuilding}
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
            setPaymentDrawerInvoiceId(null);
            setPaymentFlowStep(1);
          }
        }}
        title="תשלום מאובטח"
        description={
          selectedInvoice
            ? `${selectedInvoice.description} · ${formatCurrency(selectedInvoice.amount)} · שלב ${paymentFlowStep} מתוך 3`
            : 'סקירה קצרה ואז מעבר למסלול התשלום המאובטח.'
        }
        headerClassName="text-right"
        bodyClassName="text-right"
        footer={(onClose) => (
          <div className="w-full space-y-2">
            {paymentFlowStep === 1 ? (
              <Button
                size="lg"
                className="min-h-[52px] w-full"
                disabled={!selectedInvoice}
                onClick={() => {
                  if (!primaryMethod) {
                    setActiveTab('methods');
                    onClose();
                    setPaymentDrawerInvoiceId(null);
                    setPaymentFlowStep(1);
                    void router.push('/resident/payment-methods?addCard=1');
                    return;
                  }
                  advancePaymentFlow(2);
                }}
              >
                {primaryMethod ? 'המשך לאישור תשלום' : 'הוסף כרטיס ראשי'}
              </Button>
            ) : null}
            {paymentFlowStep === 2 ? (
              <>
                <Button
                  size="lg"
                  className="min-h-[52px] w-full"
                  disabled={!selectedInvoice || processingInvoiceId === selectedInvoice.id}
                  onClick={() => {
                    if (!selectedInvoice) return;
                    void initiatePayment(selectedInvoice.id);
                  }}
                >
                  {selectedInvoice && processingInvoiceId === selectedInvoice.id ? 'מעבד...' : 'אישור ותשלום'}
                </Button>
                <Button variant="outline" size="sm" className="w-full rounded-full" onClick={() => advancePaymentFlow(1)}>
                  חזרה לסקירה
                </Button>
              </>
            ) : null}
            {paymentFlowStep === 3 ? (
              <Button variant="outline" size="sm" className="w-full rounded-full" onClick={onClose}>
                סגור
              </Button>
            ) : null}
            {paymentFlowStep !== 3 ? (
              <Button variant="outline" size="sm" className="w-full rounded-full" onClick={onClose}>
                בטל
              </Button>
            ) : null}
          </div>
        )}
      >
        {selectedInvoice ? (
          <div dir="rtl" className="space-y-3 text-right">
            <PaymentFlowProgress currentStep={paymentFlowStep} items={paymentProcessSteps} />
            <AnimatePresence initial={false} mode="wait">
              {paymentFlowStep === 1 ? (
                <motion.div
                  key="resident-payment-review"
                  initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                  animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="space-y-3"
                >
                  <div className="overflow-hidden rounded-[24px] border border-[rgba(224,182,89,0.22)] bg-[linear-gradient(180deg,rgba(224,182,89,0.16)_0%,rgba(255,255,255,0.05)_100%)] p-4 shadow-[0_18px_36px_rgba(44,28,9,0.08)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f0d48b]/72">תשלום נבחר</div>
                        <div className="mt-2 text-lg font-semibold text-inverse-text">{selectedInvoice.description}</div>
                        <div className="mt-1 text-sm text-white/66">{translateInvoiceStatus(selectedInvoice.status)} · עד {formatDate(selectedInvoice.dueDate, locale)}</div>
                      </div>
                      <Badge variant={selectedInvoice.status === 'OVERDUE' ? 'warning' : 'outline'}>{selectedInvoice.status === 'OVERDUE' ? 'בפיגור' : 'מוכן לאישור'}</Badge>
                    </div>
                    <div className="mt-4 text-[34px] font-black leading-none tracking-[-0.03em] text-inverse-text">
                      <bdi>{formatCurrency(selectedInvoice.amount)}</bdi>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <DrawerSignal label="סטטוס" value={translateInvoiceStatus(selectedInvoice.status)} />
                    <DrawerSignal label="קבלה" value={selectedInvoice.receiptNumber || 'אחרי תשלום'} />
                    <DrawerSignal label="דרך" value={primaryMethod ? 'כרטיס שמור' : 'נדרש כרטיס'} />
                  </div>

                  <MethodChoiceTile
                    title={primaryMethod ? `${translateResidentCardBrand(primaryMethod.brand || primaryMethod.provider)} •••• ${primaryMethod.last4 || '••••'}` : 'אין כרטיס ראשי'}
                    subtitle={
                      primaryMethod
                        ? autopayEnabled
                          ? 'הכרטיס הראשי משמש גם למסלול האוטומטי.'
                          : 'זה הכרטיס שישמש לתשלום הידני הבא.'
                        : 'יש לעבור למסך שיטות תשלום כדי להוסיף כרטיס לפני אישור.'
                    }
                    badge={primaryMethod ? (autopayEnabled ? 'ראשי + אוטומטי' : 'ראשי') : 'חסר'}
                    active={Boolean(primaryMethod)}
                  />

                  <div className="flex items-start justify-between gap-4 rounded-[22px] border border-white/10 bg-white/6 p-3.5">
                    <div>
                      <div className="font-semibold text-inverse-text">חיוב אוטומטי</div>
                      <div className="text-sm text-white/64">אפשר להדליק או לעצור בלי לצאת ממסך התשלום.</div>
                    </div>
                    <Switch checked={autopayEnabled} onCheckedChange={(checked) => void toggleAutopay(checked)} aria-label="הפעלת חיוב אוטומטי במסך תשלום" />
                  </div>
                </motion.div>
              ) : null}

              {paymentFlowStep === 2 ? (
                <motion.div
                  key="resident-payment-confirm"
                  initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                  animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="space-y-3"
                >
                  <div className="rounded-[22px] border border-[rgba(224,182,89,0.22)] bg-[linear-gradient(180deg,rgba(224,182,89,0.16)_0%,rgba(255,255,255,0.04)_100%)] px-3.5 py-3 text-sm text-white/78">
                    אישור עכשיו יעביר אותך למסלול התשלום המאובטח של AMS. פרטי הכרטיס לא נשמרים במסך הזה.
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-white/48">
                      <span>סיכום סופי</span>
                      <span>לפני אישור</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-sm text-white/70">
                        <span>{selectedInvoice.description}</span>
                        <bdi className="font-semibold text-inverse-text">{formatCurrency(selectedInvoice.amount)}</bdi>
                      </div>
                      <div className="flex items-center justify-between text-sm text-white/70">
                        <span>מועד חיוב</span>
                        <span className="font-semibold text-inverse-text">{formatDate(selectedInvoice.dueDate, locale)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-white/70">
                        <span>אמצעי תשלום</span>
                        <span className="font-semibold text-inverse-text">{primaryMethod ? `•••• ${primaryMethod.last4 || '••••'}` : 'לא הוגדר'}</span>
                      </div>
                    </div>
                    <div className="gold-divider-line mt-4 h-px w-full" />
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-white/70">סה״כ</span>
                      <bdi className="text-2xl font-black text-[#f0d48b]">{formatCurrency(selectedInvoice.amount)}</bdi>
                    </div>
                  </div>
                  <MethodChoiceTile
                    title={primaryMethod ? `${translateResidentCardBrand(primaryMethod.brand || primaryMethod.provider)} •••• ${primaryMethod.last4 || '••••'}` : 'אין כרטיס'}
                    subtitle="אפשר לחזור שלב אחד אחורה אם צריך לעדכן את אמצעי התשלום לפני החיוב."
                    badge="מוכן לחיוב"
                    active
                  />
                </motion.div>
              ) : null}

              {paymentFlowStep === 3 ? (
                <motion.div
                  key="resident-payment-redirect"
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  <div className="flex flex-col items-center justify-center rounded-[26px] border border-[rgba(224,182,89,0.22)] bg-[linear-gradient(180deg,rgba(224,182,89,0.18)_0%,rgba(255,255,255,0.05)_100%)] px-5 py-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(224,182,89,0.18)] text-[#f0d48b]">
                      <CheckCircle2 className="h-8 w-8" strokeWidth={1.9} />
                    </div>
                    <div className="mt-4 text-lg font-semibold text-inverse-text">מעבירים אותך למסלול המאובטח</div>
                    <div className="mt-2 max-w-[18rem] text-sm leading-6 text-white/64">
                      הסכום אומת והמערכת פותחת את אישור הסליקה עבור {selectedInvoice.description}.
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <QuickMetric label="סה״כ" value={formatCurrency(selectedInvoice.amount)} />
                    <QuickMetric label="כרטיס" value={primaryMethod ? `•••• ${primaryMethod.last4 || '••••'}` : 'לא הוגדר'} />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </AmsDrawer>
    </div>
  );
}

function QuickMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[18px] border border-subtle-border bg-background px-3 py-3 text-right">
      <div className="text-sm font-bold text-foreground">
        <bdi>{value}</bdi>
      </div>
      <div className="mt-1 text-xs text-secondary-foreground">{label}</div>
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
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const active = currentStep === item.step;
        const complete = currentStep > item.step;
        return (
          <div
            key={item.step}
            className={cn(
              'rounded-[20px] border px-2.5 py-2.5 text-right',
              active || complete ? 'border-[rgba(224,182,89,0.28)] bg-[rgba(224,182,89,0.12)]' : 'border-white/10 bg-white/6',
            )}
          >
            <div className={cn('text-[10px] font-semibold uppercase tracking-[0.16em]', active || complete ? 'text-white' : 'text-white/48')}>
              {complete ? 'בוצע' : `שלב ${item.step}`}
            </div>
            <div className="mt-1 text-[13px] font-semibold text-inverse-text">{item.title}</div>
            <div className="mt-0.5 text-[11px] leading-4 text-white/64">{item.subtitle}</div>
          </div>
        );
      })}
    </div>
  );
}

function DrawerSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/6 px-3 py-2.5 text-right">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/48">{label}</div>
      <div className="mt-1 text-[13px] font-semibold text-inverse-text">{value}</div>
    </div>
  );
}

function MethodChoiceTile({
  title,
  subtitle,
  badge,
  active,
}: {
  title: string;
  subtitle: string;
  badge: string;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[22px] border p-3.5',
        active ? 'border-[rgba(224,182,89,0.24)] bg-[rgba(224,182,89,0.12)]' : 'border-white/10 bg-white/6',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-inverse-text">{title}</div>
          <div className="mt-1 text-xs leading-5 text-white/64">{subtitle}</div>
        </div>
        <div className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] font-semibold text-white/74">{badge}</div>
      </div>
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

  return (
    <div className="overflow-hidden rounded-[30px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] text-right shadow-[0_18px_36px_rgba(44,28,9,0.06)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-4 pb-4 pt-4 text-right"
        aria-expanded={expanded}
      >
        <div className={`text-xl font-black tabular-nums ${amountToneClass}`}>
          <bdi>{formatCurrency(invoice.amount)}</bdi>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'OVERDUE' ? 'destructive' : 'outline'}>
                  {translateInvoiceStatus(invoice.status)}
                </Badge>
                <span className="text-sm font-semibold text-foreground">{invoice.description}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-end gap-3 text-[12px] text-secondary-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.75} />
                  פירעון {formatDate(invoice.dueDate, locale)}
                </span>
                {invoice.issueDate ? <span>הונפק {formatDate(invoice.issueDate, locale)}</span> : null}
              </div>
            </div>
            <ChevronDown
              className={`mt-0.5 h-4 w-4 shrink-0 text-secondary-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
              strokeWidth={1.9}
            />
          </div>
        </div>
      </button>

      {expanded ? (
        <>
          <div className="grid grid-cols-2 gap-px bg-subtle-border/70 text-right">
            <div className="bg-[linear-gradient(180deg,rgba(255,251,245,0.9)_0%,rgba(255,255,255,0.74)_100%)] px-4 py-3">
              <div className="text-[11px] font-semibold text-secondary-foreground">מזהה / קבלה</div>
              <div className="mt-1 text-sm font-medium text-foreground">{invoice.receiptNumber ? `#${invoice.receiptNumber}` : 'יופק לאחר תשלום'}</div>
            </div>
            <div className="bg-[linear-gradient(180deg,rgba(255,251,245,0.9)_0%,rgba(255,255,255,0.74)_100%)] px-4 py-3">
              <div className="text-[11px] font-semibold text-secondary-foreground">סטטוס</div>
              <div className="mt-1 text-sm font-medium text-foreground">{translateInvoiceStatus(invoice.status)}</div>
            </div>
          </div>

          <div className="flex flex-wrap justify-start gap-2 px-4 py-4">
            {isPayable ? (
              <Button size="sm" className="rounded-full" onClick={onPay} disabled={isProcessing}>
                {isProcessing ? 'מעבד...' : 'פתח תשלום'}
              </Button>
            ) : null}
            {onDownload ? (
              <Button size="sm" variant="outline" className="rounded-full" onClick={onDownload}>
                <Download className="me-2 h-4 w-4" strokeWidth={1.75} />
                הורדת קבלה
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function LedgerRow({
  entry,
  locale,
}: {
  entry: ResidentFinance['ledger'][number];
  locale: string;
}) {
  const isPositive = entry.amount >= 0;

  return (
    <div className="flex items-center justify-between gap-3 rounded-[24px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] px-4 py-3.5 text-right shadow-[0_12px_24px_rgba(44,28,9,0.04)]">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            isPositive ? 'bg-success/12 text-success' : 'bg-destructive/10 text-destructive'
          }`}
        >
          {isPositive ? <CheckCircle2 className="h-5 w-5" strokeWidth={1.9} /> : <Receipt className="h-5 w-5" strokeWidth={1.9} />}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{entry.summary}</div>
          <div className="mt-1 text-[12px] text-secondary-foreground">{formatDate(entry.createdAt, locale)}</div>
        </div>
      </div>
      <div className={`text-base font-black tabular-nums ${isPositive ? 'text-success' : 'text-foreground'}`}>
        <bdi>{formatCurrency(entry.amount)}</bdi>
      </div>
    </div>
  );
}
