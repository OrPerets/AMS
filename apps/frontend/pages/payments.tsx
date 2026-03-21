import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, Plus, Receipt, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/router';
import { authFetch, downloadAuthenticatedFile, getEffectiveRole, openAuthenticatedFile } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from '../components/ui/use-toast';
import { formatCurrency, formatDate } from '../lib/utils';
import { useLocale } from '../lib/providers';

type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE';

interface InvoiceHistoryEntry {
  kind: 'PAYMENT' | 'REFUND';
  id: number;
  status: string;
  amount: number;
  createdAt: string;
}

interface InvoiceRow {
  id: number;
  residentId: number;
  residentName: string;
  amount: number;
  description: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  type: string;
  paymentMethod: string | null;
  paidAt: string | null;
  receiptNumber: string | null;
  history: InvoiceHistoryEntry[];
  reminderState?: 'NONE' | 'UPCOMING' | 'SENT' | 'PROMISED' | 'ESCALATED';
  collectionStatus?: 'CURRENT' | 'PAST_DUE' | 'IN_COLLECTIONS' | 'PROMISE_TO_PAY' | 'RESOLVED';
  promiseToPayDate?: string | null;
  collectionNotes?: string | null;
  buildingName?: string | null;
  agingBucket?: string;
  lastReminderAt?: string | null;
}

interface CollectionsSummary {
  totals: {
    invoiceCount: number;
    unpaidCount: number;
    overdueCount: number;
    outstandingBalance: number;
    delinquencyRate: number;
    billedThisMonth: number;
    collectedThisMonth: number;
  };
  aging: Record<string, number>;
  topDebtors: Array<{
    residentId: number;
    residentName: string;
    buildingName: string | null;
    amount: number;
    overdueCount: number;
    promiseToPayDate: string | null;
  }>;
  followUps: Array<{
    invoiceId: number;
    residentId: number;
    residentName: string;
    buildingName: string | null;
    collectionStatus: string;
    reminderState: string;
    promiseToPayDate: string | null;
    lastReminderAt: string | null;
    collectionNotes: string | null;
  }>;
}

interface RecurringInvoiceRow {
  id: number;
  residentId: number;
  residentName: string;
  title?: string | null;
  recurrence: string;
  amount: number;
  active: boolean;
  nextRunAt: string;
  lastRunAt?: string | null;
  dueDaysAfterIssue: number;
  lateFeeAmount: number;
}

interface ResidentOption {
  id: number;
  user: {
    id: number;
    email: string;
    phone: string | null;
  };
  units: {
    id: number;
    number: string;
    building: {
      id: number;
      name: string;
      address: string;
    };
  }[];
}

const statusLabel: Record<InvoiceStatus, string> = {
  PENDING: 'ממתין',
  PAID: 'שולם',
  OVERDUE: 'באיחור',
};

export default function PaymentsPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | InvoiceStatus>('ALL');
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoiceRow[]>([]);
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [collectionsSummary, setCollectionsSummary] = useState<CollectionsSummary | null>(null);
  const [residentQuery, setResidentQuery] = useState('');
  const [recurringResidentQuery, setRecurringResidentQuery] = useState('');
  const [newInvoice, setNewInvoice] = useState({
    residentId: '',
    items: [{ description: '', quantity: '1', unitPrice: '' }],
  });
  const [recurring, setRecurring] = useState({
    residentId: '',
    recurrence: 'monthly',
    items: [{ description: '', quantity: '1', unitPrice: '' }],
  });

  async function loadInvoices() {
    setLoading(true);
    try {
      const res = await authFetch('/api/v1/invoices');
      if (!res.ok) throw new Error(await res.text());
      setInvoices(await res.json());
    } catch (error) {
      console.error(error);
      toast({ title: t('payments.loadFailed'), variant: 'destructive' });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecurringInvoices() {
    try {
      const res = await authFetch('/api/v1/recurring-invoices');
      if (!res.ok) throw new Error(await res.text());
      setRecurringInvoices(await res.json());
    } catch (error) {
      console.error(error);
      toast({ title: t('payments.recurringLoadFailed'), variant: 'destructive' });
      setRecurringInvoices([]);
    }
  }

  async function loadResidents() {
    try {
      const res = await authFetch('/api/v1/users/residents');
      if (!res.ok) throw new Error(await res.text());
      setResidents(await res.json());
    } catch (error) {
      console.error(error);
      toast({ title: t('payments.residentsLoadFailed'), variant: 'destructive' });
      setResidents([]);
    }
  }

  async function loadCollectionsSummary() {
    try {
      const res = await authFetch('/api/v1/invoices/collections/summary');
      if (!res.ok) throw new Error(await res.text());
      setCollectionsSummary(await res.json());
    } catch (error) {
      console.error(error);
      setCollectionsSummary(null);
    }
  }

  useEffect(() => {
    setRole(getEffectiveRole());
  }, [router.pathname]);

  useEffect(() => {
    if (role === null) return;

    if (role === 'RESIDENT') {
      router.replace('/resident/account');
      return;
    }

    if (!['ADMIN', 'PM', 'ACCOUNTANT'].includes(role)) {
      router.replace('/home');
      return;
    }

    loadInvoices();
    loadRecurringInvoices();
    loadResidents();
    loadCollectionsSummary();
  }, [role, router]);

  const filteredInvoices = useMemo(
    () => invoices.filter((invoice) => statusFilter === 'ALL' || invoice.status === statusFilter),
    [invoices, statusFilter],
  );

  const stats = useMemo(() => {
    return {
      total: invoices.length,
      pendingAmount: invoices.filter((invoice) => invoice.status !== 'PAID').reduce((sum, invoice) => sum + invoice.amount, 0),
      overdueCount: invoices.filter((invoice) => invoice.status === 'OVERDUE').length,
      paidAmount: invoices.filter((invoice) => invoice.status === 'PAID').reduce((sum, invoice) => sum + invoice.amount, 0),
    };
  }, [invoices]);

  const filteredResidents = useMemo(() => {
    const query = residentQuery.trim().toLowerCase();
    if (!query) return residents;
    return residents.filter((resident) => {
      const haystack = [
        resident.user.email,
        resident.user.phone ?? '',
        ...resident.units.flatMap((unit) => [unit.number, unit.building.name, unit.building.address]),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [residentQuery, residents]);

  const filteredRecurringResidents = useMemo(() => {
    const query = recurringResidentQuery.trim().toLowerCase();
    if (!query) return residents;
    return residents.filter((resident) => {
      const haystack = [
        resident.user.email,
        resident.user.phone ?? '',
        ...resident.units.flatMap((unit) => [unit.number, unit.building.name, unit.building.address]),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [recurringResidentQuery, residents]);

  const computeTotal = (items: { quantity: string; unitPrice: string }[]) =>
    items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);

  async function settleInvoice(invoiceId: number) {
    setSettlingId(invoiceId);
    try {
      const res = await authFetch(`/api/v1/invoices/${invoiceId}/settle`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: `חשבונית #${invoiceId} סולקה` });
      await loadInvoices();
      await openAuthenticatedFile(`/api/v1/invoices/${invoiceId}/receipt`);
    } catch (error) {
      console.error(error);
      toast({ title: 'סליקת התשלום נכשלה', variant: 'destructive' });
    } finally {
      setSettlingId(null);
    }
  }

  async function submitInvoice() {
    setSubmitting(true);
    try {
      const res = await authFetch('/api/v1/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId: Number(newInvoice.residentId),
          items: newInvoice.items.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.unitPrice || 0),
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'החשבונית נוצרה' });
      setNewInvoice({ residentId: '', items: [{ description: '', quantity: '1', unitPrice: '' }] });
      await loadInvoices();
    } catch (error) {
      console.error(error);
      toast({ title: 'יצירת החשבונית נכשלה', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRecurring() {
    setSubmitting(true);
    try {
      const res = await authFetch('/api/v1/recurring-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId: Number(recurring.residentId),
          recurrence: recurring.recurrence,
          items: recurring.items.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.unitPrice || 0),
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'החיוב המחזורי נשמר' });
      setRecurring({ residentId: '', recurrence: 'monthly', items: [{ description: '', quantity: '1', unitPrice: '' }] });
      await loadRecurringInvoices();
    } catch (error) {
      console.error(error);
      toast({ title: 'שמירת החיוב המחזורי נכשלה', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleRecurringInvoice(id: number, active: boolean) {
    try {
      const res = await authFetch(`/api/v1/recurring-invoices/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: active ? 'החיוב הופעל' : 'החיוב הושהה' });
      await loadRecurringInvoices();
    } catch (error) {
      console.error(error);
      toast({ title: 'עדכון החיוב המחזורי נכשל', variant: 'destructive' });
    }
  }

  async function runRecurringNow(id: number) {
    try {
      const res = await authFetch(`/api/v1/recurring-invoices/${id}/run`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'החיוב הופק בהצלחה' });
      await Promise.all([loadInvoices(), loadRecurringInvoices()]);
    } catch (error) {
      console.error(error);
      toast({ title: 'הפקת החיוב נכשלה', variant: 'destructive' });
    }
  }

  async function updateCollections(
    invoiceId: number,
    payload: Partial<Pick<InvoiceRow, 'reminderState' | 'collectionStatus' | 'promiseToPayDate' | 'collectionNotes'>>,
  ) {
    try {
      const res = await authFetch(`/api/v1/invoices/${invoiceId}/collections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'סטטוס הגבייה עודכן' });
      await Promise.all([loadInvoices(), loadCollectionsSummary()]);
    } catch (error) {
      console.error(error);
      toast({ title: 'עדכון הגבייה נכשל', variant: 'destructive' });
    }
  }

  function renderItemsEditor(
    items: { description: string; quantity: string; unitPrice: string }[],
    setItems: (items: { description: string; quantity: string; unitPrice: string }[]) => void,
  ) {
    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-xl border p-3 md:grid-cols-5 md:border-0 md:p-0">
            <Input
              className="md:col-span-2"
              placeholder="תיאור"
              value={item.description}
              onChange={(event) => {
                const next = [...items];
                next[index] = { ...item, description: event.target.value };
                setItems(next);
              }}
            />
            <Input
              type="number"
              placeholder="כמות"
              value={item.quantity}
              onChange={(event) => {
                const next = [...items];
                next[index] = { ...item, quantity: event.target.value };
                setItems(next);
              }}
            />
            <Input
              type="number"
              placeholder="מחיר יחידה"
              value={item.unitPrice}
              onChange={(event) => {
                const next = [...items];
                next[index] = { ...item, unitPrice: event.target.value };
                setItems(next);
              }}
            />
            <div className="flex items-center text-sm font-medium md:justify-end">{formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setItems([...items, { description: '', quantity: '1', unitPrice: '' }])}
        >
          <Plus className="me-2 h-4 w-4" />
          הוסף שורה
        </Button>
      </div>
    );
  }

  function residentLabel(resident: ResidentOption) {
    const unitText = resident.units.length
      ? resident.units.map((unit) => `${unit.building.address} / דירה ${unit.number}`).join(' | ')
      : 'ללא דירה משויכת';

    return `${resident.user.email} · ${unitText}`;
  }

  if (role === null || role === 'RESIDENT' || !['ADMIN', 'PM', 'ACCOUNTANT'].includes(role)) {
    return <div className="p-6 text-sm text-muted-foreground">{t('payments.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{t('payments.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('payments.description')}</p>
        </div>
        <div className="page-header-actions">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => downloadAuthenticatedFile('/api/v1/invoices?format=csv', 'invoices.csv')}>
            <Download className="me-2 h-4 w-4" />
            יצוא חשבוניות
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => downloadAuthenticatedFile('/api/v1/invoices/unpaid?format=csv', 'unpaid-invoices.csv')}>
            <Download className="me-2 h-4 w-4" />
            יצוא יתרות פתוחות
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={loadInvoices} disabled={loading}>
            <RefreshCw className="me-2 h-4 w-4" />
            רענון
          </Button>
        </div>
      </div>

      <Card className="border-primary/10 bg-primary/5">
        <CardHeader>
          <CardTitle>{t('payments.trustTitle')}</CardTitle>
          <CardDescription>{t('payments.trustDescription')}</CardDescription>
        </CardHeader>
      </Card>

      <div className="page-kpi-grid">
        <Card><CardHeader><CardTitle>חשבוניות</CardTitle></CardHeader><CardContent>{stats.total}</CardContent></Card>
        <Card><CardHeader><CardTitle>פתוחות</CardTitle></CardHeader><CardContent>{formatCurrency(stats.pendingAmount)}</CardContent></Card>
        <Card><CardHeader><CardTitle>באיחור</CardTitle></CardHeader><CardContent>{stats.overdueCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>שולמו</CardTitle></CardHeader><CardContent>{formatCurrency(stats.paidAmount)}</CardContent></Card>
      </div>

      {collectionsSummary && (
        <div className="page-kpi-grid">
          <Card><CardHeader><CardTitle>יתרת חוב</CardTitle></CardHeader><CardContent>{formatCurrency(collectionsSummary.totals.outstandingBalance)}</CardContent></Card>
          <Card><CardHeader><CardTitle>שיעור פיגור</CardTitle></CardHeader><CardContent>{collectionsSummary.totals.delinquencyRate}%</CardContent></Card>
          <Card><CardHeader><CardTitle>חויב החודש</CardTitle></CardHeader><CardContent>{formatCurrency(collectionsSummary.totals.billedThisMonth)}</CardContent></Card>
          <Card><CardHeader><CardTitle>נגבה החודש</CardTitle></CardHeader><CardContent>{formatCurrency(collectionsSummary.totals.collectedThisMonth)}</CardContent></Card>
        </div>
      )}

      {collectionsSummary && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>דוח התיישנות חוב</CardTitle>
              <CardDescription>חלוקת יתרות לפי ותק הפיגור.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {Object.entries(collectionsSummary.aging).map(([bucket, amount]) => (
                <div key={bucket} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>{bucket}</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>חייבים מובילים</CardTitle>
              <CardDescription>מעקב גבייה עבור הדיירים עם היתרות הגבוהות ביותר.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {collectionsSummary.topDebtors.map((debtor) => (
                <div key={debtor.residentId} className="rounded-lg border px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{debtor.residentName}</span>
                    <span>{formatCurrency(debtor.amount)}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {debtor.buildingName ?? 'ללא בניין'} • {debtor.overdueCount} פריטים בפיגור
                    {debtor.promiseToPayDate ? ` • הבטיח עד ${formatDate(new Date(debtor.promiseToPayDate), locale)}` : ''}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {stats.overdueCount > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              קיימות חשבוניות באיחור
            </CardTitle>
            <CardDescription>סינון וגבייה זמינים ישירות מהטבלה.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setStatusFilter('OVERDUE')}>הצג איחורים בלבד</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>רשימת תשלומים</CardTitle>
          <CardDescription>
            היסטוריה מלאה של סטטוסים, אמצעי תשלום וקבלות.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant={statusFilter === 'ALL' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('ALL')}>הכל</Button>
            <Button variant={statusFilter === 'PENDING' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('PENDING')}>ממתינות</Button>
            <Button variant={statusFilter === 'OVERDUE' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('OVERDUE')}>באיחור</Button>
            <Button variant={statusFilter === 'PAID' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('PAID')}>שולמו</Button>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="rounded-xl border p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">#{invoice.id} · {invoice.description}</div>
                    <div className="text-muted-foreground">{invoice.residentName}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      פירעון: {formatDate(new Date(invoice.dueDate), locale)} · {invoice.buildingName ?? 'ללא בניין'}
                    </div>
                  </div>
                  <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'OVERDUE' ? 'destructive' : 'warning'}>
                    {statusLabel[invoice.status]}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-muted-foreground">סכום</span><div className="font-medium text-sm">{formatCurrency(invoice.amount)}</div></div>
                  <div><span className="text-muted-foreground">גבייה</span><div className="font-medium text-sm">{invoice.collectionStatus ?? 'CURRENT'}</div></div>
                </div>
                {invoice.history.length > 0 && (
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {invoice.history.slice(0, 2).map((entry) => (
                      <div key={`${entry.kind}-${entry.id}`}>
                        {entry.kind === 'PAYMENT' ? 'תשלום' : 'החזר'} {formatCurrency(entry.amount)} · {entry.status}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {invoice.status !== 'PAID' && (
                    <Button size="sm" onClick={() => settleInvoice(invoice.id)} disabled={settlingId === invoice.id}>
                      {settlingId === invoice.id ? 'מסלק...' : 'סליקה'}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openAuthenticatedFile(`/api/v1/invoices/${invoice.id}/receipt`)}>
                    <Receipt className="me-2 h-4 w-4" />
                    קבלה
                  </Button>
                </div>
              </div>
            ))}
            {!loading && filteredInvoices.length === 0 && (
              <div className="py-6 text-center text-muted-foreground">אין חשבוניות להצגה.</div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">חשבונית</th>
                  <th className="py-2">דייר</th>
                  <th className="py-2">סכום</th>
                  <th className="py-2">פירעון</th>
                  <th className="py-2">סטטוס</th>
                  <th className="py-2">גבייה</th>
                  <th className="py-2">היסטוריה</th>
                  <th className="py-2">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b align-top">
                    <td className="py-3 pe-4">
                      <div className="font-medium">#{invoice.id}</div>
                      <div className="text-muted-foreground">{invoice.description}</div>
                    </td>
                    <td className="py-3 pe-4">{invoice.residentName}</td>
                    <td className="py-3 pe-4">{formatCurrency(invoice.amount)}</td>
                    <td className="py-3 pe-4">
                      <div>{formatDate(new Date(invoice.dueDate), locale)}</div>
                      <div className="text-xs text-muted-foreground">הונפק: {formatDate(new Date(invoice.issueDate), locale)}</div>
                    </td>
                    <td className="py-3 pe-4">
                      <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'OVERDUE' ? 'destructive' : 'warning'}>
                        {statusLabel[invoice.status]}
                      </Badge>
                      <div className="mt-1 text-xs text-muted-foreground">{invoice.buildingName ?? 'ללא בניין'}</div>
                    </td>
                    <td className="py-3 pe-4">
                      <div className="space-y-1 text-xs">
                        <div>תזכורת: {invoice.reminderState ?? 'NONE'}</div>
                        <div>סטטוס: {invoice.collectionStatus ?? 'CURRENT'}</div>
                        {invoice.promiseToPayDate && <div>הבטחה: {formatDate(new Date(invoice.promiseToPayDate), locale)}</div>}
                        {invoice.lastReminderAt && <div>תזכורת אחרונה: {formatDate(new Date(invoice.lastReminderAt), locale)}</div>}
                        {invoice.collectionNotes && <div>הערה: {invoice.collectionNotes}</div>}
                      </div>
                    </td>
                    <td className="py-3 pe-4">
                      {invoice.history.length === 0 ? (
                        <span className="text-muted-foreground">ללא תנועות</span>
                      ) : (
                        <div className="space-y-1">
                          {invoice.history.slice(0, 2).map((entry) => (
                            <div key={`${entry.kind}-${entry.id}`} className="text-xs text-muted-foreground">
                              {entry.kind === 'PAYMENT' ? 'תשלום' : 'החזר'} {formatCurrency(entry.amount)} · {entry.status}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {invoice.status !== 'PAID' && (
                          <Button size="sm" onClick={() => settleInvoice(invoice.id)} disabled={settlingId === invoice.id}>
                            {settlingId === invoice.id ? 'מסלק...' : 'סליקה'}
                          </Button>
                        )}
                        {invoice.status === 'OVERDUE' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => updateCollections(invoice.id, { reminderState: 'SENT', collectionStatus: 'PAST_DUE' })}>
                              נשלחה תזכורת
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateCollections(invoice.id, {
                                  reminderState: 'PROMISED',
                                  collectionStatus: 'PROMISE_TO_PAY',
                                  promiseToPayDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                  collectionNotes: 'הבטחת תשלום נרשמה בממשק הגבייה',
                                })
                              }
                            >
                              הבטחת תשלום
                            </Button>
                          </>
                        )}
                        <Button variant="outline" size="sm" onClick={() => openAuthenticatedFile(`/api/v1/invoices/${invoice.id}/receipt`)}>
                          <Receipt className="me-2 h-4 w-4" />
                          קבלה
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-muted-foreground">אין חשבוניות להצגה.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {collectionsSummary && (
          <Card>
            <CardHeader>
              <CardTitle>ציר מעקב גבייה</CardTitle>
              <CardDescription>תזכורות, הבטחות תשלום והערות מעקב אחרונות.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {collectionsSummary.followUps.length === 0 && <div className="text-sm text-muted-foreground">אין פעולות מעקב פעילות.</div>}
              {collectionsSummary.followUps.map((item) => (
                <div key={item.invoiceId} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">#{item.invoiceId} · {item.residentName}</span>
                    <Badge variant="outline">{item.collectionStatus}</Badge>
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    {item.buildingName ?? 'ללא בניין'} • תזכורת {item.reminderState}
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    {item.lastReminderAt ? `עודכן לאחרונה ${formatDate(new Date(item.lastReminderAt), locale)}` : 'טרם נשלחה תזכורת'}
                    {item.promiseToPayDate ? ` • הבטחה עד ${formatDate(new Date(item.promiseToPayDate), locale)}` : ''}
                  </div>
                  {item.collectionNotes && <div className="mt-2">{item.collectionNotes}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>חשבונית חדשה</CardTitle>
            <CardDescription>הפקת חיוב חד-פעמי כולל שורות ותמחור.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="חיפוש לפי אימייל, כתובת או דירה"
              value={residentQuery}
              onChange={(event) => setResidentQuery(event.target.value)}
            />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={newInvoice.residentId}
              onChange={(event) => setNewInvoice({ ...newInvoice, residentId: event.target.value })}
            >
              <option value="">בחר דייר</option>
              {filteredResidents.map((resident) => (
                <option key={resident.id} value={resident.id}>
                  {residentLabel(resident)}
                </option>
              ))}
            </select>
            <Input
              placeholder="מזהה דייר"
              value={newInvoice.residentId}
              readOnly
            />
            {renderItemsEditor(newInvoice.items, (items) => setNewInvoice({ ...newInvoice, items }))}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-medium">סה"כ: {formatCurrency(computeTotal(newInvoice.items))}</div>
              <Button className="w-full sm:w-auto" onClick={submitInvoice} disabled={submitting || !newInvoice.residentId}>צור חשבונית</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>חיוב מחזורי</CardTitle>
            <CardDescription>הגדרת תשלום חודשי, רבעוני או שנתי.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="חיפוש לפי אימייל, כתובת או דירה"
              value={recurringResidentQuery}
              onChange={(event) => setRecurringResidentQuery(event.target.value)}
            />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={recurring.residentId}
              onChange={(event) => setRecurring({ ...recurring, residentId: event.target.value })}
            >
              <option value="">בחר דייר</option>
              {filteredRecurringResidents.map((resident) => (
                <option key={resident.id} value={resident.id}>
                  {residentLabel(resident)}
                </option>
              ))}
            </select>
            <Input
              placeholder="מזהה דייר"
              value={recurring.residentId}
              readOnly
            />
            <Input
              placeholder="monthly | quarterly | yearly"
              value={recurring.recurrence}
              onChange={(event) => setRecurring({ ...recurring, recurrence: event.target.value })}
            />
            {renderItemsEditor(recurring.items, (items) => setRecurring({ ...recurring, items }))}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-medium">סה"כ: {formatCurrency(computeTotal(recurring.items))}</div>
              <Button className="w-full sm:w-auto" onClick={submitRecurring} disabled={submitting || !recurring.residentId}>שמור מחזורי</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>חיובים מחזוריים פעילים</CardTitle>
          <CardDescription>שליטה על חיובים חודשיים, עצירה זמנית והפקה ידנית לצורך בדיקה.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 md:hidden">
            {recurringInvoices.map((invoice) => (
              <div key={invoice.id} className="rounded-xl border p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{invoice.title || `חיוב #${invoice.id}`}</div>
                    <div className="text-muted-foreground">{invoice.residentName}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {invoice.recurrence} · הרצה הבאה {formatDate(new Date(invoice.nextRunAt), locale)}
                    </div>
                  </div>
                  <Badge variant={invoice.active ? 'success' : 'secondary'}>{invoice.active ? 'פעיל' : 'מושהה'}</Badge>
                </div>
                <div className="mt-2 font-medium">{formatCurrency(invoice.amount)}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => runRecurringNow(invoice.id)}>
                    הפק עכשיו
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleRecurringInvoice(invoice.id, !invoice.active)}>
                    {invoice.active ? 'השהה' : 'הפעל'}
                  </Button>
                </div>
              </div>
            ))}
            {!recurringInvoices.length && (
              <div className="py-6 text-center text-muted-foreground">אין חיובים מחזוריים.</div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">דייר</th>
                  <th className="py-2">שם חיוב</th>
                  <th className="py-2">מחזור</th>
                  <th className="py-2">סכום</th>
                  <th className="py-2">הרצה הבאה</th>
                  <th className="py-2">סטטוס</th>
                  <th className="py-2">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {recurringInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b">
                    <td className="py-3 pe-4">{invoice.residentName}</td>
                    <td className="py-3 pe-4">{invoice.title || `חיוב #${invoice.id}`}</td>
                    <td className="py-3 pe-4">{invoice.recurrence}</td>
                    <td className="py-3 pe-4">{formatCurrency(invoice.amount)}</td>
                    <td className="py-3 pe-4">{formatDate(new Date(invoice.nextRunAt), locale)}</td>
                    <td className="py-3 pe-4">
                      <Badge variant={invoice.active ? 'success' : 'secondary'}>{invoice.active ? 'פעיל' : 'מושהה'}</Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => runRecurringNow(invoice.id)}>
                          הפק עכשיו
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleRecurringInvoice(invoice.id, !invoice.active)}>
                          {invoice.active ? 'השהה' : 'הפעל'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!recurringInvoices.length && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">אין חיובים מחזוריים.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
