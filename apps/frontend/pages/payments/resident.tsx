import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CreditCard, Download, Receipt, ShieldCheck, Wallet } from 'lucide-react';
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
  const [context, setContext] = useState<AccountContext | null>(null);
  const [finance, setFinance] = useState<ResidentFinance | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'history' | 'methods'>('open');
  const [paymentDrawerInvoiceId, setPaymentDrawerInvoiceId] = useState<number | null>(null);

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
  const primaryMethod = paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0] ?? null;
  const selectedInvoice = sortedInvoices.find((invoice) => invoice.id === paymentDrawerInvoiceId) ?? nextPaymentDue ?? null;

  if (loading) return <DetailPanelSkeleton />;
  if (error || !context || !finance) {
    return <InlineErrorPanel title="מסך התשלומים לא נטען" description={error || 'לא נמצאו נתונים'} onRetry={() => void loadPage()} />;
  }

  const primaryBuilding = context.units[0]?.building?.name;

  return (
    <div dir="rtl" className="space-y-4 text-right sm:space-y-6">
      <div className="space-y-3">
        <CompactStatusStrip
          roleLabel={primaryBuilding ? `דייר · ${primaryBuilding}` : 'דייר'}
          icon={<CreditCard className="h-4 w-4" strokeWidth={1.75} />}
          metrics={[
            { id: 'balance', label: 'יתרה', value: Math.round(finance.summary.currentBalance), tone: finance.summary.currentBalance > 0 ? 'warning' : 'success' },
            { id: 'unpaid', label: 'פתוחים', value: finance.summary.unpaidInvoices, tone: finance.summary.unpaidInvoices > 0 ? 'warning' : 'success' },
          ]}
        />

        <PrimaryActionCard
          eyebrow="תשלום מיידי"
          title={nextPaymentDue ? `לתשלום ${formatCurrency(nextPaymentDue.amount)}` : 'אין כרגע תשלום פתוח'}
          description={
            nextPaymentDue
              ? `${nextPaymentDue.description} · מועד ${formatDate(nextPaymentDue.dueDate, locale)}`
              : 'החשבון שלך מעודכן.'
          }
          ctaLabel={nextPaymentDue ? 'שלם עכשיו' : 'חזור לחשבון'}
          href={nextPaymentDue ? undefined : '/resident/account'}
          onClick={nextPaymentDue ? () => setPaymentDrawerInvoiceId(nextPaymentDue.id) : undefined}
          tone={nextPaymentDue?.status === 'OVERDUE' ? 'danger' : nextPaymentDue ? 'warning' : 'success'}
          className="border-s-[5px] shadow-[0_24px_58px_rgba(84,58,15,0.16)]"
        />
      </div>

      <Card variant="elevated" className="rounded-[28px] border-0 bg-[linear-gradient(180deg,rgba(37,99,235,0.08)_0%,rgba(255,255,255,1)_100%)]">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-foreground">מרכז תשלומים</h1>
              <p className="text-sm text-secondary-foreground">פתוחים, היסטוריה וכרטיסים במסך אחד.</p>
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
              {finance.summary.unpaidInvoices ? `${finance.summary.unpaidInvoices} פתוחים` : 'מעודכן'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <QuickMetric label="יתרה" value={formatCurrency(finance.summary.currentBalance)} />
            <QuickMetric label="פתוחים" value={finance.summary.unpaidInvoices} />
            <QuickMetric label="בפיגור" value={finance.summary.overdueInvoices} />
          </div>
        </CardContent>
      </Card>

      <AmsTabs
        ariaLabel="Resident payments"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as 'open' | 'history' | 'methods')}
        listClassName="grid-cols-3 gap-1.5"
        panelClassName="pt-3"
        items={[
          {
            key: 'open',
            title: 'פתוחים',
            badge: finance.summary.unpaidInvoices || null,
            icon: <Receipt className="h-4 w-4" strokeWidth={1.75} />,
            content: (
              <div className="space-y-3">
                {sortedInvoices.length ? (
                  <AmsDisclosure
                    defaultExpandedKeys={nextPaymentDue ? [`invoice-${nextPaymentDue.id}`] : []}
                    items={sortedInvoices.map((invoice) => ({
                      key: `invoice-${invoice.id}`,
                      title: (
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{invoice.description}</span>
                          <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'OVERDUE' ? 'destructive' : 'outline'}>
                            {translateInvoiceStatus(invoice.status)}
                          </Badge>
                        </div>
                      ),
                      subtitle: `${formatCurrency(invoice.amount)} · פירעון ${formatDate(invoice.dueDate, locale)}`,
                      startContent: <Wallet className="h-4 w-4 text-primary" strokeWidth={1.75} />,
                      content: (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <QuickMetric label="סטטוס" value={translateInvoiceStatus(invoice.status)} />
                            <QuickMetric label="סכום" value={formatCurrency(invoice.amount)} />
                          </div>
                          <div className="rounded-[18px] border border-subtle-border bg-background px-3 py-3 text-sm text-secondary-foreground">
                            {invoice.issueDate ? `הונפק ב-${formatDate(invoice.issueDate, locale)}.` : 'חיוב זמין לתשלום.'} {invoice.receiptNumber ? `קבלה #${invoice.receiptNumber}.` : ''}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {payableStatuses.has(invoice.status) ? (
                              <Button size="sm" onClick={() => setPaymentDrawerInvoiceId(invoice.id)} disabled={processingInvoiceId === invoice.id}>
                                {processingInvoiceId === invoice.id ? 'מעבד...' : 'פתח תשלום'}
                              </Button>
                            ) : null}
                            {invoice.receiptNumber ? (
                              <Button size="sm" variant="outline" onClick={() => downloadAuthenticatedFile(`/api/v1/invoices/${invoice.id}/receipt`, `receipt-${invoice.receiptNumber}.pdf`)}>
                                <Download className="me-2 h-4 w-4" strokeWidth={1.75} />
                                קבלה
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ),
                    }))}
                  />
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
                  finance.ledger.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-3 rounded-[20px] border border-subtle-border bg-background px-3 py-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{entry.summary}</div>
                        <div className="text-[12px] leading-5 text-secondary-foreground">{formatDate(entry.createdAt, locale)}</div>
                      </div>
                      <div className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(entry.amount)}</div>
                    </div>
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
                <div className="flex items-start justify-between gap-4 rounded-[22px] border border-subtle-border bg-background p-3.5">
                  <div>
                    <div className="font-semibold text-foreground">חיוב אוטומטי</div>
                    <div className="text-sm text-secondary-foreground">תשלום עתידי דרך הכרטיס הראשי.</div>
                  </div>
                  <Switch checked={autopayEnabled} onCheckedChange={(checked) => void toggleAutopay(checked)} aria-label="הפעלת חיוב אוטומטי" />
                </div>

                {paymentMethods.length ? (
                  paymentMethods.map((method) => (
                    <div key={method.id} className="rounded-[22px] border border-subtle-border bg-background p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-foreground">
                            {translateCardBrand(method.brand || method.provider)} •••• {method.last4 || '••••'}
                          </div>
                          <div className="text-sm text-secondary-foreground">
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
          <div className="space-y-3">
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
    <div className="rounded-[18px] border border-subtle-border bg-background px-3 py-3">
      <div className="text-sm font-bold text-foreground">
        <bdi>{value}</bdi>
      </div>
      <div className="mt-1 text-xs text-secondary-foreground">{label}</div>
    </div>
  );
}
