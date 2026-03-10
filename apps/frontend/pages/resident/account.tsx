import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bell, CreditCard, FileText, MessageSquare, Ticket, Wrench } from 'lucide-react';
import { authFetch, downloadAuthenticatedFile, openAuthenticatedFile } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../components/ui/use-toast';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useLocale } from '../../lib/providers';
import { websocketService } from '../../lib/websocket';

type AccountContext = {
  user: { id: number; email: string; phone?: string | null; role: string };
  residentId: number | null;
  units: Array<{ id: number; number: string; building: { id: number; name: string; address: string } }>;
  notifications: Array<{ id: number; title: string; message: string; createdAt: string; read: boolean }>;
  documents: Array<{ id: number; name: string; category?: string | null; url: string; uploadedAt: string }>;
  tickets: Array<{ id: number; status: string; createdAt: string; unit: { number: string; building: { name: string } } }>;
  recentActivity: Array<{ id: number; summary: string; createdAt: string; severity: string }>;
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
    openTickets: number;
    unreadNotifications: number;
  };
  invoices: Array<{ id: number; amount: number; dueDate: string; status: string; description: string; receiptNumber?: string | null }>;
  ledger: Array<{ id: string; type: string; amount: number; createdAt: string; summary: string }>;
  communications: Array<{ id: number; subject?: string | null; message: string; createdAt: string }>;
};

export default function ResidentAccountPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [context, setContext] = useState<AccountContext | null>(null);
  const [finance, setFinance] = useState<ResidentFinance | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<number | null>(null);
  const [paymentAttempts, setPaymentAttempts] = useState<Record<number, { intentId: number; status: string; attemptedAt: string }>>({});
  const [paymentBanner, setPaymentBanner] = useState<{ title: string; description: string; variant: 'success' | 'warning' | 'destructive' } | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [newCard, setNewCard] = useState({ provider: 'tranzila', token: '', brand: '', last4: '', expMonth: '', expYear: '' });

  useEffect(() => {
    loadAccount();
  }, []);

  useEffect(() => {
    const handleNewNotification = () => {
      loadAccount();
    };

    websocketService.on('new_notification', handleNewNotification);
    return () => {
      websocketService.off('new_notification', handleNewNotification);
    };
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    const rawIntentId = router.query.intentId || router.query.paymentIntentId || router.query.payment_intent || router.query.paymentId;
    if (!rawIntentId) return;

    const intentId = Number(Array.isArray(rawIntentId) ? rawIntentId[0] : rawIntentId);
    if (!Number.isFinite(intentId)) return;

    refreshIntentStatus(intentId, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.intentId, router.query.paymentIntentId, router.query.payment_intent, router.query.paymentId]);

  const payableStatuses = useMemo(() => new Set(['UNPAID', 'OVERDUE']), []);

  function translateInvoiceStatus(status: string) {
    const labels: Record<string, string> = {
      PAID: 'שולם',
      OVERDUE: 'בפיגור',
      UNPAID: 'טרם שולם',
      PENDING: 'ממתין לתשלום',
    };
    return labels[status] || status;
  }

  function translateIntentStatus(status: string) {
    const labels: Record<string, string> = {
      SUCCEEDED: 'הושלם',
      PROCESSING: 'בטיפול',
      FAILED: 'נכשל',
      REQUIRES_ACTION: 'נדרש אימות',
      REQUIRES_PAYMENT_METHOD: 'נדרש אמצעי תשלום',
      REQUIRES_CONFIRMATION: 'ממתין לאישור',
      CANCELED: 'בוטל',
    };
    return labels[status] || status;
  }

  function translateCardBrand(value?: string | null) {
    const labels: Record<string, string> = {
      visa: 'ויזה',
      mastercard: 'מאסטרקארד',
      ישראכרט: 'ישראכרט',
      isracard: 'ישראכרט',
      amex: 'אמריקן אקספרס',
      diners: 'דיינרס',
      tranzila: 'טרנזילה',
      stripe: 'Stripe',
    };
    if (!value) return 'כרטיס שמור';
    return labels[value.toLowerCase()] || value;
  }

  function mapPaymentStatus(status: string) {
    if (status === 'SUCCEEDED') {
      return {
        title: 'התשלום הושלם בהצלחה',
        description: 'החשבונית סומנה כמשולמת וקבלה תהיה זמינה בעוד רגע.',
        variant: 'success' as const,
      };
    }
    if (status === 'PROCESSING' || status === 'REQUIRES_ACTION') {
      return {
        title: 'התשלום בבדיקה',
        description: 'קיבלנו את ניסיון התשלום ונעדכן את הסטטוס מיד לאחר אישור חברת האשראי.',
        variant: 'warning' as const,
      };
    }
    return {
      title: 'התשלום נכשל',
      description: 'לא ניתן היה להשלים את התשלום. ניתן לנסות שוב באמצעות הכפתור "שלם עכשיו".',
      variant: 'destructive' as const,
    };
  }

  async function refreshIntentStatus(intentId: number, fromCallback = false) {
    try {
      const paymentResponse = await authFetch(`/api/v1/payments/${intentId}`);
      if (!paymentResponse.ok) {
        throw new Error(await paymentResponse.text());
      }
      const payment = await paymentResponse.json();
      const nextStatus = String(payment.status || 'PROCESSING');

      setPaymentAttempts((current) => ({
        ...current,
        [payment.invoiceId]: {
          intentId,
          status: nextStatus,
          attemptedAt: payment.updatedAt || payment.createdAt || new Date().toISOString(),
        },
      }));

      const banner = mapPaymentStatus(nextStatus);
      setPaymentBanner(banner);
      toast({ title: banner.title, description: banner.description, variant: banner.variant === 'destructive' ? 'destructive' : 'default' });

      if (fromCallback && payment.invoiceId) {
        await loadAccount();
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'עדכון סטטוס תשלום נכשל', variant: 'destructive' });
    }
  }

  async function initiatePayment(invoiceId: number) {
    if (processingInvoiceId === invoiceId) return;

    try {
      setProcessingInvoiceId(invoiceId);
      const response = await authFetch(`/api/v1/invoices/${invoiceId}/pay`, { method: 'POST' });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      const attemptedAt = new Date().toISOString();
      const intentId = Number(result.intentId);

      if (Number.isFinite(intentId)) {
        setPaymentAttempts((current) => ({
          ...current,
          [invoiceId]: { intentId, status: 'PROCESSING', attemptedAt },
        }));
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      if (result.clientSecret) {
        setPaymentBanner({
          title: 'נדרש אימות אשראי נוסף',
          description: 'נפתח בקרוב טופס תשלום מאובטח להשלמת העסקה.',
          variant: 'warning',
        });
        toast({
          title: 'אימות נוסף נדרש',
          description: 'כרגע התשלום המוטמע עדיין לא זמין. נסה/י שוב או השלם/י בתשלום המאובטח.',
        });
      }

      if (Number.isFinite(intentId)) {
        await refreshIntentStatus(intentId);
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'יצירת תשלום נכשלה', variant: 'destructive' });
    } finally {
      setProcessingInvoiceId(null);
    }
  }


  async function loadPaymentSettings() {
    try {
      const methodsRes = await authFetch('/api/v1/payments/methods');
      if (methodsRes.ok) {
        setPaymentMethods(await methodsRes.json());
      }

      const autopayRes = await authFetch('/api/v1/payments/autopay');
      if (autopayRes.ok) {
        const prefs = await autopayRes.json();
        setAutopayEnabled(Boolean(prefs.autopayEnabled));
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function addCard() {
    if (!newCard.token) {
      toast({ title: 'יש להזין טוקן תשלום', variant: 'destructive' });
      return;
    }
    const response = await authFetch('/api/v1/payments/methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: newCard.provider,
        token: newCard.token,
        brand: newCard.brand || undefined,
        last4: newCard.last4 || undefined,
        expMonth: newCard.expMonth ? Number(newCard.expMonth) : undefined,
        expYear: newCard.expYear ? Number(newCard.expYear) : undefined,
        networkTokenized: true,
      }),
    });

    if (!response.ok) {
      toast({ title: 'שמירת כרטיס נכשלה', variant: 'destructive' });
      return;
    }

    setNewCard({ provider: 'tranzila', token: '', brand: '', last4: '', expMonth: '', expYear: '' });
    toast({ title: 'כרטיס נשמר בהצלחה' });
    await loadPaymentSettings();
  }

  async function setDefaultCard(id: number) {
    const response = await authFetch(`/api/v1/payments/methods/${id}/default`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      toast({ title: 'עדכון ברירת מחדל נכשל', variant: 'destructive' });
      return;
    }
    await loadPaymentSettings();
  }

  async function removeCard(id: number) {
    const response = await authFetch(`/api/v1/payments/methods/${id}/remove`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      toast({ title: 'מחיקת כרטיס נכשלה', variant: 'destructive' });
      return;
    }
    await loadPaymentSettings();
  }

  async function toggleAutopay(enabled: boolean) {
    const response = await authFetch('/api/v1/payments/autopay', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (!response.ok) {
      toast({ title: 'עדכון חיוב אוטומטי נכשל', variant: 'destructive' });
      return;
    }
    setAutopayEnabled(enabled);
  }

  async function loadAccount() {
    try {
      setLoading(true);
      const contextResponse = await authFetch('/api/v1/users/account');
      if (!contextResponse.ok) {
        throw new Error(await contextResponse.text());
      }
      const nextContext = await contextResponse.json();
      setContext(nextContext);

      if (nextContext.residentId) {
        const financeResponse = await authFetch(`/api/v1/invoices/account/${nextContext.residentId}`);
        if (!financeResponse.ok) {
          throw new Error(await financeResponse.text());
        }
        setFinance(await financeResponse.json());
        await loadPaymentSettings();
      } else {
        setFinance(null);
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'טעינת האזור האישי נכשלה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  if (loading || !context) {
    return <div className="p-6 text-sm text-muted-foreground">טוען אזור אישי...</div>;
  }

  const summary = finance?.summary;
  const publishedDocuments = context.documents.filter((document) =>
    ['meeting_summary', 'signed_protocol', 'regulation', 'committee_decision'].includes(String(document.category || '').toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">האזור האישי של הדייר</h1>
          <p className="text-sm text-muted-foreground">יתרה, מסמכים, קריאות שירות והודעות במקום אחד.</p>
        </div>
        <div className="page-header-actions">
          {context.residentId ? (
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => downloadAuthenticatedFile(`/api/v1/invoices/ledger?residentId=${context.residentId}&format=csv`, 'resident-ledger.csv')}>
              ייצוא דוח יתרה
            </Button>
          ) : null}
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/settings">העדפות התראות</Link>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={loadAccount}>רענון</Button>
        </div>
      </div>

      <div className="page-kpi-grid">
        <Card><CardHeader><CardTitle>יתרה נוכחית</CardTitle></CardHeader><CardContent>{formatCurrency(summary?.currentBalance ?? 0)}</CardContent></Card>
        <Card><CardHeader><CardTitle>חשבוניות פתוחות</CardTitle></CardHeader><CardContent>{summary?.unpaidInvoices ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle>קריאות פתוחות</CardTitle></CardHeader><CardContent>{summary?.openTickets ?? context.tickets.filter((ticket) => ticket.status !== 'RESOLVED').length}</CardContent></Card>
        <Card><CardHeader><CardTitle>התראות שלא נקראו</CardTitle></CardHeader><CardContent>{summary?.unreadNotifications ?? context.notifications.filter((item) => !item.read).length}</CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> תשלומים וחשבוניות</CardTitle>
            <CardDescription>סטטוס הגבייה האחרון וקבלות זמינות.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentBanner ? (
              <div className={`rounded-lg border p-3 text-sm ${paymentBanner.variant === 'success' ? 'border-green-300 bg-green-50' : paymentBanner.variant === 'destructive' ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}`}>
                <div className="font-medium">{paymentBanner.title}</div>
                <div className="text-xs text-muted-foreground">{paymentBanner.description}</div>
              </div>
            ) : null}

            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">כרטיסים שמורים וחיוב אוטומטי</div>
                  <div className="text-xs text-muted-foreground">ניהול כרטיס ברירת מחדל וגבייה אוטומטית לחשבוניות מחזוריות.</div>
                </div>
                <Button size="sm" className="w-full sm:w-auto" variant={autopayEnabled ? 'default' : 'outline'} onClick={() => toggleAutopay(!autopayEnabled)}>
                  {autopayEnabled ? 'חיוב אוטומטי פעיל' : 'הפעל חיוב אוטומטי'}
                </Button>
              </div>

              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex flex-col gap-3 rounded border p-2 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">{translateCardBrand(method.brand || method.provider)} •••• {method.last4 || 'XXXX'}</div>
                      <div className="text-muted-foreground">
                        תוקף {method.expMonth || '--'}/{method.expYear || '--'}{method.networkTokenized ? ' · נשמר באופן מאובטח' : ''}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!method.isDefault ? <Button size="sm" variant="outline" onClick={() => setDefaultCard(method.id)}>ברירת מחדל</Button> : <Badge variant="success">ברירת מחדל</Badge>}
                      <Button size="sm" variant="outline" onClick={() => removeCard(method.id)}>הסר</Button>
                    </div>
                  </div>
                ))}
                {!paymentMethods.length ? <div className="text-xs text-muted-foreground">אין כרטיסים שמורים.</div> : null}
              </div>

              <div className="rounded-lg border border-dashed p-3">
                <div className="mb-3">
                  <div className="font-medium">הוספת כרטיס חדש</div>
                  <div className="text-xs text-muted-foreground">המזהה המאובטח מתקבל מספק הסליקה. אין צורך להזין מספר כרטיס מלא או קוד אבטחה.</div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="card-brand">סוג הכרטיס</Label>
                    <Input id="card-brand" placeholder="למשל: ויזה" value={newCard.brand} onChange={(e) => setNewCard((c) => ({ ...c, brand: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="card-last4">4 ספרות אחרונות</Label>
                    <Input id="card-last4" inputMode="numeric" maxLength={4} placeholder="1234" value={newCard.last4} onChange={(e) => setNewCard((c) => ({ ...c, last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="card-exp-month">חודש תפוגה</Label>
                    <Input id="card-exp-month" inputMode="numeric" placeholder="MM" value={newCard.expMonth} onChange={(e) => setNewCard((c) => ({ ...c, expMonth: e.target.value.replace(/\D/g, '').slice(0, 2) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="card-exp-year">שנת תפוגה</Label>
                    <Input id="card-exp-year" inputMode="numeric" placeholder="YYYY" value={newCard.expYear} onChange={(e) => setNewCard((c) => ({ ...c, expYear: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="card-token">מזהה מאובטח של הכרטיס</Label>
                    <Input id="card-token" placeholder="הדבק/י כאן את המזהה המאובטח שקיבלת מטופס הסליקה" value={newCard.token} onChange={(e) => setNewCard((c) => ({ ...c, token: e.target.value }))} />
                  </div>
                </div>
              </div>
              <Button size="sm" onClick={addCard}>הוסף כרטיס שמור</Button>
            </div>
            {(finance?.invoices || []).slice(0, 6).map((invoice) => (
              <div key={invoice.id} className="rounded-lg border p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium">#{invoice.id} · {invoice.description}</div>
                    <div className="text-xs text-muted-foreground">פירעון: {formatDate(new Date(invoice.dueDate), locale)}</div>
                  </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(invoice.amount)}</div>
                      <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'OVERDUE' ? 'destructive' : 'warning'}>
                        {translateInvoiceStatus(invoice.status)}
                      </Badge>
                      {invoice.receiptNumber ? (
                        <div className="mt-2">
                          <Button size="sm" variant="outline" onClick={() => openAuthenticatedFile(`/api/v1/invoices/${invoice.id}/receipt`)}>
                            הורד קבלה
                          </Button>
                        </div>
                      ) : null}
                      {paymentAttempts[invoice.id] ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <div>ניסיון תשלום: #{paymentAttempts[invoice.id].intentId}</div>
                          <div>סטטוס עדכני: {translateIntentStatus(paymentAttempts[invoice.id].status)}</div>
                          <div>עודכן: {formatDate(new Date(paymentAttempts[invoice.id].attemptedAt), locale)}</div>
                        </div>
                      ) : null}
                      {payableStatuses.has(invoice.status) ? (
                        <div className="mt-2 flex justify-start sm:justify-end">
                          <Button
                            size="sm"
                            onClick={() => initiatePayment(invoice.id)}
                            disabled={processingInvoiceId === invoice.id}
                          >
                            {processingInvoiceId === invoice.id ? 'מעבד...' : paymentAttempts[invoice.id]?.status === 'FAILED' ? 'נסה שוב' : 'שלם עכשיו'}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Ticket className="h-4 w-4" /> קריאות שירות</CardTitle>
            <CardDescription>מעקב אחרי פניות פתוחות ופעילות אחרונה.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {context.tickets.slice(0, 6).map((ticket) => (
              <div key={ticket.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">קריאה #{ticket.id}</div>
                    <div className="text-xs text-muted-foreground">{ticket.unit.building.name} · דירה {ticket.unit.number}</div>
                  </div>
                  <Badge variant={ticket.status === 'RESOLVED' ? 'success' : 'warning'}>{ticket.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> התראות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {context.notifications.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.message}</div>
                  </div>
                  {!item.read && <Badge variant="warning">חדש</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> מסמכים והחלטות בניין</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {context.documents.slice(0, 6).map((document) => (
              <a key={document.id} href={document.url} target="_blank" rel="noreferrer" className="block rounded-lg border p-3 hover:bg-muted/40">
                <div className="font-medium">{document.name}</div>
                <div className="text-xs text-muted-foreground">{document.category || 'מסמך'} · {formatDate(new Date(document.uploadedAt), locale)}</div>
              </a>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> פעילות אחרונה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(finance?.communications || []).slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="font-medium">{item.subject || 'הודעה'}</div>
                <div className="text-xs text-muted-foreground">{item.message}</div>
              </div>
            ))}
            {context.recentActivity.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm">{item.summary}</div>
                  <Badge variant={item.severity === 'CRITICAL' ? 'destructive' : item.severity === 'WARNING' ? 'warning' : 'outline'}>
                    {item.severity}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{formatDate(new Date(item.createdAt), locale)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {publishedDocuments.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> פרסומי ועד והנהלה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {publishedDocuments.slice(0, 6).map((document) => (
              <a key={document.id} href={document.url} target="_blank" rel="noreferrer" className="block rounded-lg border p-3 hover:bg-muted/40">
                <div className="font-medium">{document.name}</div>
                <div className="text-xs text-muted-foreground">{document.category || 'מסמך'} · {formatDate(new Date(document.uploadedAt), locale)}</div>
              </a>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {finance?.ledger?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wrench className="h-4 w-4" /> תנועות אחרונות בחשבון</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {finance.ledger.slice(0, 10).map((entry) => (
              <div key={entry.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">{entry.type}</div>
                  <div className="text-xs text-muted-foreground">{entry.summary}</div>
                </div>
                <div className="text-right">
                  <div className={entry.amount < 0 ? 'text-green-700' : ''}>{formatCurrency(entry.amount)}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(new Date(entry.createdAt), locale)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
