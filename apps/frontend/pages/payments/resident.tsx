import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CreditCard, Download, Receipt, ShieldCheck } from 'lucide-react';
import { authFetch, downloadAuthenticatedFile } from '../../lib/auth';
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
import { useLocale } from '../../lib/providers';
import { triggerHaptic } from '../../lib/mobile';

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

  useEffect(() => {
    void loadPage();
  }, []);

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

  if (loading) return <DetailPanelSkeleton />;
  if (error || !context || !finance) {
    return <InlineErrorPanel title="מסך התשלומים לא נטען" description={error || 'לא נמצאו נתונים'} onRetry={() => void loadPage()} />;
  }

  const primaryBuilding = context.units[0]?.building?.name;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="md:hidden space-y-3">
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
              : 'החשבון שלך מעודכן. אפשר לעבור לכרטסת או למסמכים.'
          }
          ctaLabel={nextPaymentDue ? 'שלם עכשיו' : 'חזור לחשבון'}
          href={nextPaymentDue ? undefined : '/resident/account'}
          onClick={nextPaymentDue ? () => void initiatePayment(nextPaymentDue.id) : undefined}
          tone={nextPaymentDue?.status === 'OVERDUE' ? 'danger' : nextPaymentDue ? 'warning' : 'success'}
        />
      </div>

      <div className="hidden md:block">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>תשלומי דייר</CardTitle>
            <CardDescription>מסך ייעודי לחיובים, קבלות וכרטיסים שמורים.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={1.75} />
              חיוב אוטומטי ואמצעי תשלום
            </CardTitle>
            <CardDescription>הסבר ברור על איך הכרטיס נשמר ומתי המערכת תחייב אוטומטית.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-subtle-border bg-muted/30 p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">חיוב אוטומטי</div>
                  <div className="text-sm leading-6 text-secondary-foreground">
                    כשהאפשרות פעילה, חשבוניות עתידיות יחויבו דרך הכרטיס הראשי שנשמר אצל ספק הסליקה.
                  </div>
                </div>
                <Switch checked={autopayEnabled} onCheckedChange={(checked) => void toggleAutopay(checked)} aria-label="הפעלת חיוב אוטומטי" />
              </div>
            </div>

            {paymentMethods.length ? (
              paymentMethods.map((method) => (
                <div key={method.id} className="rounded-2xl border border-subtle-border bg-background p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-foreground">
                        {translateCardBrand(method.brand || method.provider)} •••• {method.last4 || '••••'}
                      </div>
                      <div className="text-sm text-secondary-foreground">
                        תוקף {method.expMonth || '--'}/{method.expYear || '--'}{method.networkTokenized ? ' · נשמר בצורה מאובטחת' : ''}
                      </div>
                    </div>
                    {method.isDefault ? <Badge variant="success">כרטיס ראשי</Badge> : null}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                type="action"
                size="sm"
                title="עדיין אין כרטיס שמור"
                description="כדי להפעיל חיוב אוטומטי נדרש קודם להוסיף אמצעי תשלום דרך הטופס המאובטח."
                action={{ label: 'פתח פנייה לצוות', onClick: () => router.push('/support'), variant: 'outline' }}
              />
            )}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" strokeWidth={1.75} />
              חשבוניות וקבלות
            </CardTitle>
            <CardDescription>סטטוסים ברורים לכל תשלום, כולל גישה מהירה להורדות.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {finance.invoices.length ? (
              finance.invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-2xl border border-subtle-border bg-background p-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-foreground">{invoice.description}</div>
                        <div className="text-sm text-secondary-foreground">
                          {formatCurrency(invoice.amount)} · פירעון {formatDate(invoice.dueDate, locale)}
                        </div>
                      </div>
                      <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'OVERDUE' ? 'destructive' : 'outline'}>
                        {translateInvoiceStatus(invoice.status)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {payableStatuses.has(invoice.status) ? (
                        <Button size="sm" onClick={() => void initiatePayment(invoice.id)} disabled={processingInvoiceId === invoice.id}>
                          {processingInvoiceId === invoice.id ? 'מעבד...' : 'שלם עכשיו'}
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
                </div>
              ))
            ) : (
              <EmptyState type="empty" size="sm" title="אין כרגע חשבוניות להצגה" description="כאשר תופיע דרישת תשלום חדשה או קבלה, היא תופיע כאן." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="muted">
        <CardHeader>
          <CardTitle>כרטסת אחרונה</CardTitle>
          <CardDescription>תנועות אחרונות בחשבון, בשפה ברורה.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {finance.ledger.slice(0, 10).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 rounded-2xl border border-subtle-border bg-background px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-foreground">{entry.summary}</div>
                <div className="text-[12px] leading-5 text-secondary-foreground">{formatDate(entry.createdAt, locale)}</div>
              </div>
              <div className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(entry.amount)}</div>
            </div>
          ))}
          <div className="pt-2">
            <Button variant="outline" asChild>
              <Link href="/resident/account">חזור לאזור האישי</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
