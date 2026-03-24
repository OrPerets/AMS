import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpLeft, BellRing, CalendarClock, CheckCircle2, ChevronDown, CreditCard, Download, Receipt, ShieldCheck, TriangleAlert, Wallet, WalletCards } from 'lucide-react';
import { authFetch, downloadAuthenticatedFile, getCurrentUserId, getEffectiveRole } from '../../lib/auth';
import { formatCurrency, formatDate, humanizeEnum } from '../../lib/utils';
import { toast } from '../../components/ui/use-toast';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { EmptyState } from '../../components/ui/empty-state';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { PrimaryActionCard } from '../../components/ui/primary-action-card';
import { AmsDisclosure } from '../../components/ui/ams-disclosure';
import { AmsDrawer } from '../../components/ui/ams-drawer';
import { AmsTabs } from '../../components/ui/ams-tabs';
import { useLocale } from '../../lib/providers';
import { triggerHaptic } from '../../lib/mobile';
import { setResumeState } from '../../lib/engagement';

type AccountContext = {
  user: { id: number; email: string };
  residentId: number | null;
  units: Array<{ id: number; number: string; building: { name: string } }>;
};

type PaymentMethod = {
  id: number;
  provider: string;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  isDefault: boolean;
  networkTokenized: boolean;
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

function translateCardBrand(value?: string | null) {
  const labels: Record<string, string> = {
    visa: 'ויזה',
    mastercard: 'מאסטרקארד',
    isracard: 'ישראכרט',
    tranzila: 'טרנזילה',
    stripe: 'סטרייפ',
  };
  if (!value) return 'כרטיס שמור';
  return labels[value.toLowerCase()] || value;
}

export default function ResidentPaymentsPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const reducedMotion = useReducedMotion();
  const [context, setContext] = useState<AccountContext | null>(null);
  const [finance, setFinance] = useState<ResidentFinance | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'history' | 'methods'>('open');
  const [paymentDrawerInvoiceId, setPaymentDrawerInvoiceId] = useState<number | null>(null);
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
        window.location.href = result.redirectUrl;
        return;
      }

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

  function toggleInvoice(invoiceId: number) {
    setExpandedInvoiceIds((current) =>
      current.includes(invoiceId) ? current.filter((id) => id !== invoiceId) : [...current, invoiceId],
    );
  }

  return (
    <div dir="rtl" className="space-y-4 pb-4 text-right sm:space-y-6">
      <div className="space-y-3">
        <CompactStatusStrip
          roleLabel={primaryBuilding ? `דייר · ${primaryBuilding}` : 'דייר'}
          icon={<CreditCard className="h-4 w-4" strokeWidth={1.75} />}
          metrics={[
            { id: 'balance', label: 'יתרה', value: Math.round(finance.summary.currentBalance), tone: finance.summary.currentBalance > 0 ? 'warning' : 'success' },
            { id: 'unpaid', label: 'פתוחים', value: finance.summary.unpaidInvoices, tone: finance.summary.unpaidInvoices > 0 ? 'warning' : 'success' },
          ]}
          tone="resident"
        />

        <motion.section
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
        >
          <div className="relative overflow-hidden rounded-[32px] border border-white/50 bg-[radial-gradient(circle_at_top_left,rgba(226,186,111,0.32),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_28%),linear-gradient(140deg,rgba(32,24,16,0.98)_0%,rgba(64,42,14,0.96)_48%,rgba(198,145,55,0.94)_100%)] p-4 text-white shadow-[0_28px_70px_rgba(44,28,9,0.24)] sm:p-5">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-5 top-4 h-20 w-20 rounded-full border border-white/12" />
              <div className="absolute right-10 top-0 h-24 w-24 rounded-b-[32px] rounded-t-full bg-white/8" />
              <div className="absolute bottom-0 left-10 h-16 w-32 rounded-t-full bg-white/10 blur-2xl" />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white/80">
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.85} />
                    מרכז תשלומים
                  </div>
                  <div>
                    <p className="text-sm text-white/72">{heroBalanceLabel}</p>
                    <h1 className="mt-1 text-[34px] font-black leading-none tracking-[-0.03em] sm:text-[40px]">
                      <bdi>{formatCurrency(finance.summary.currentBalance)}</bdi>
                    </h1>
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/12 bg-white/10 px-3 py-2 text-right backdrop-blur-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">חיוב קרוב</div>
                  <div className="mt-1 text-sm font-semibold text-white">{nextDueLabel}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <HeroStatChip icon={<Wallet className="h-4 w-4" strokeWidth={1.75} />} label="פתוחים" value={finance.summary.unpaidInvoices} />
                <HeroStatChip icon={<TriangleAlert className="h-4 w-4" strokeWidth={1.75} />} label="בפיגור" value={finance.summary.overdueInvoices} />
                <HeroStatChip icon={<BellRing className="h-4 w-4" strokeWidth={1.75} />} label="התראות" value={finance.summary.unreadNotifications} />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={nextPaymentDue ? () => setPaymentDrawerInvoiceId(nextPaymentDue.id) : () => void router.push('/resident/account')}
                  className="flex min-h-[58px] items-center justify-center gap-2 rounded-[24px] border border-white/16 bg-white/12 px-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm transition hover:bg-white/16"
                >
                  <ArrowUpLeft className="h-4 w-4" strokeWidth={1.9} />
                  {nextPaymentDue ? 'תשלום מיידי' : 'חזרה לחשבון'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('methods')}
                  className="flex min-h-[58px] items-center justify-center gap-2 rounded-[24px] border border-white/16 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] px-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(18,12,6,0.18)] transition hover:bg-white/18"
                >
                  <WalletCards className="h-4 w-4" strokeWidth={1.9} />
                  אמצעי תשלום
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: reducedMotion ? 0 : 0.06, ease: 'easeOut' }}
      >
        <div className="grid grid-cols-3 gap-2.5">
          <ActionTile
            icon={<Receipt className="h-5 w-5" strokeWidth={1.8} />}
            title="חשבוניות"
            subtitle={openInvoices.length ? `${openInvoices.length} פתוחות` : 'הכל שולם'}
            onClick={() => setActiveTab('open')}
          />
          <ActionTile
            icon={<Download className="h-5 w-5" strokeWidth={1.8} />}
            title="קבלות"
            subtitle={historyEntries.length ? 'היסטוריה אחרונה' : 'אין עדיין'}
            onClick={() => setActiveTab('history')}
          />
          <ActionTile
            icon={<CreditCard className="h-5 w-5" strokeWidth={1.8} />}
            title="כרטיסים"
            subtitle={primaryMethod ? 'כרטיס ראשי' : 'לא הוגדר'}
            onClick={() => setActiveTab('methods')}
          />
        </div>
      </motion.section>

      {/* <PrimaryActionCard
        eyebrow="חיוב הבא"
        title={nextPaymentDue ? `${nextPaymentDue.description}` : 'אין כרגע תשלום פתוח'}
        description={
          nextPaymentDue
            ? `${formatCurrency(nextPaymentDue.amount)} · לפירעון ב-${formatDate(nextPaymentDue.dueDate, locale)}`
            : 'החשבון שלך מעודכן, וכל התשלומים סגורים כרגע.'
        }
        ctaLabel={nextPaymentDue ? 'פתח תשלום' : 'חזרה לחשבון'}
        href={nextPaymentDue ? undefined : '/resident/account'}
        onClick={nextPaymentDue ? () => setPaymentDrawerInvoiceId(nextPaymentDue.id) : undefined}
        tone={heroStatusTone}
        visualStyle="resident"
        className="border-s-[5px]"
      /> */}

      <AmsTabs
        ariaLabel="Resident payments"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as 'open' | 'history' | 'methods')}
        className="w-full text-right"
        listClassName="grid-cols-3 gap-1.5 rounded-[24px] border border-primary/10 bg-[linear-gradient(180deg,rgba(255,251,245,0.96)_0%,rgba(255,255,255,0.92)_100%)] p-1.5"
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
                          onPay={() => setPaymentDrawerInvoiceId(invoice.id)}
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
                <div className="overflow-hidden rounded-[28px] border border-primary/12 bg-[linear-gradient(160deg,rgba(255,249,240,0.96)_0%,rgba(255,255,255,0.95)_46%,rgba(240,248,255,0.94)_100%)] p-4 shadow-[0_18px_36px_rgba(44,28,9,0.08)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/72">מצב חשבון</div>
                      <div className="mt-1 font-semibold text-foreground">חיוב אוטומטי</div>
                      <div className="mt-1 text-sm text-secondary-foreground">תשלום עתידי דרך הכרטיס הראשי השמור בחשבון.</div>
                    </div>
                    <Switch checked={autopayEnabled} onCheckedChange={(checked) => void toggleAutopay(checked)} aria-label="הפעלת חיוב אוטומטי" />
                  </div>
                </div>

                {paymentMethods.length ? (
                  paymentMethods.map((method) => (
                    <div key={method.id} className="rounded-[26px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] p-4 shadow-[0_14px_28px_rgba(44,28,9,0.05)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/68">כרטיס שמור</div>
                          <div className="mt-1 font-semibold text-foreground">
                            {translateCardBrand(method.brand || method.provider)} •••• {method.last4 || '••••'}
                          </div>
                          <div className="mt-1 text-sm text-secondary-foreground">
                            תוקף {method.expMonth || '--'}/{method.expYear || '--'}
                          </div>
                        </div>
                        {method.isDefault ? <Badge variant="success">ראשי</Badge> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    type="action"
                    size="sm"
                    title="אין כרטיס שמור"
                    description="אפשר לפנות לתמיכה או להיכנס למסך שיטות תשלום."
                    action={{ label: 'שיטות תשלום', onClick: () => void router.push('/resident/payment-methods'), variant: 'outline' }}
                  />
                )}
              </div>
            ),
          },
        ]}
      />

      <AmsDrawer
        isOpen={Boolean(paymentDrawerInvoiceId)}
        onOpenChange={(open) => {
          if (!open) setPaymentDrawerInvoiceId(null);
        }}
        title="תשלום מאובטח"
        description={selectedInvoice ? `${selectedInvoice.description} · ${formatCurrency(selectedInvoice.amount)}` : 'אישור ותשלום בכרטיס הראשי.'}
        headerClassName="text-right"
        bodyClassName="text-right"
        footer={(onClose) => (
          <div className="w-full space-y-2">
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
            <Button variant="outline" size="sm" className="w-full rounded-full" onClick={onClose}>
              בטל
            </Button>
          </div>
        )}
      >
        {selectedInvoice ? (
          <div dir="rtl" className="space-y-3 text-right">
            <div className="grid grid-cols-2 gap-2">
              <QuickMetric label="סכום" value={formatCurrency(selectedInvoice.amount)} />
              <QuickMetric label="מועד" value={formatDate(selectedInvoice.dueDate, locale)} />
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/6 p-3.5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/48">אמצעי תשלום</div>
              <div className="mt-2 text-sm font-semibold text-inverse-text">
                {primaryMethod
                  ? `${translateCardBrand(primaryMethod.brand || primaryMethod.provider)} •••• ${primaryMethod.last4 || '••••'}`
                  : 'לא נמצא כרטיס ראשי'}
              </div>
              <div className="mt-1 text-xs leading-5 text-white/64">
                {primaryMethod ? 'האישור ייפתח דרך ספק הסליקה המאובטח.' : 'אפשר להמשיך למסך שיטות תשלום או לפנות לתמיכה.'}
              </div>
            </div>
            <div className="flex items-start justify-between gap-4 rounded-[22px] border border-white/10 bg-white/6 p-3.5">
              <div>
                <div className="font-semibold text-inverse-text">חיוב אוטומטי</div>
                <div className="text-sm text-white/64">אפשר להפעיל או לעצור ישירות מהמסך הזה.</div>
              </div>
              <Switch checked={autopayEnabled} onCheckedChange={(checked) => void toggleAutopay(checked)} aria-label="הפעלת חיוב אוטומטי במסך תשלום" />
            </div>
            <div className="rounded-[22px] border border-primary/12 bg-primary/10 px-3.5 py-3 text-sm text-white/74">
              פרטי הכרטיס לא נשמרים במסך זה. לחיצה על אישור תעביר למסלול התשלום המאובטח של AMS.
            </div>
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

function HeroStatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-[22px] border border-white/14 bg-white/10 px-3 py-3 text-right text-white backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 text-white/72">
        <span className="text-[11px] font-semibold">{label}</span>
        <span className="text-white/70">{icon}</span>
      </div>
      <div className="mt-2 text-lg font-black tabular-nums text-white">
        <bdi>{value}</bdi>
      </div>
    </div>
  );
}

function ActionTile({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[118px] flex-col items-center justify-center rounded-[28px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] px-3 py-4 text-center shadow-[0_16px_30px_rgba(44,28,9,0.05)] transition hover:-translate-y-0.5 hover:border-primary/18"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-primary/12 bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="mt-3 text-sm font-semibold text-foreground">{title}</span>
      <span className="mt-1 max-w-full text-[11px] leading-4 text-secondary-foreground">{subtitle}</span>
    </button>
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
            <div className="bg-white/74 px-4 py-3">
              <div className="text-[11px] font-semibold text-secondary-foreground">מזהה / קבלה</div>
              <div className="mt-1 text-sm font-medium text-foreground">{invoice.receiptNumber ? `#${invoice.receiptNumber}` : 'יופק לאחר תשלום'}</div>
            </div>
            <div className="bg-white/74 px-4 py-3">
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
