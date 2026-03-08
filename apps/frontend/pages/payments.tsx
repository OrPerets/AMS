import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, Plus, Receipt, RefreshCw } from 'lucide-react';
import { authFetch } from '../lib/auth';
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
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | InvoiceStatus>('ALL');
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [residents, setResidents] = useState<ResidentOption[]>([]);
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
      toast({ title: 'טעינת התשלומים נכשלה', variant: 'destructive' });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadResidents() {
    try {
      const res = await authFetch('/api/v1/users/residents');
      if (!res.ok) throw new Error(await res.text());
      setResidents(await res.json());
    } catch (error) {
      console.error(error);
      toast({ title: 'טעינת הדיירים נכשלה', variant: 'destructive' });
      setResidents([]);
    }
  }

  useEffect(() => {
    loadInvoices();
    loadResidents();
  }, []);

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
      window.open(`/api/v1/invoices/${invoiceId}/receipt`, '_blank');
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
    } catch (error) {
      console.error(error);
      toast({ title: 'שמירת החיוב המחזורי נכשלה', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  function renderItemsEditor(
    items: { description: string; quantity: string; unitPrice: string }[],
    setItems: (items: { description: string; quantity: string; unitPrice: string }[]) => void,
  ) {
    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-5">
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
            <div className="flex items-center text-sm font-medium">{formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</div>
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">תשלומים</h1>
          <p className="text-sm text-muted-foreground">חשבוניות, סליקה, קבלות והיסטוריית תשלומים במקום אחד.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/api/v1/invoices/unpaid?format=csv', '_blank')}>
            <Download className="me-2 h-4 w-4" />
            יצוא CSV
          </Button>
          <Button variant="outline" onClick={loadInvoices} disabled={loading}>
            <RefreshCw className="me-2 h-4 w-4" />
            רענון
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>חשבוניות</CardTitle></CardHeader><CardContent>{stats.total}</CardContent></Card>
        <Card><CardHeader><CardTitle>פתוחות</CardTitle></CardHeader><CardContent>{formatCurrency(stats.pendingAmount)}</CardContent></Card>
        <Card><CardHeader><CardTitle>באיחור</CardTitle></CardHeader><CardContent>{stats.overdueCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>שולמו</CardTitle></CardHeader><CardContent>{formatCurrency(stats.paidAmount)}</CardContent></Card>
      </div>

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
          <div className="flex gap-2">
            <Button variant={statusFilter === 'ALL' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('ALL')}>הכל</Button>
            <Button variant={statusFilter === 'PENDING' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('PENDING')}>ממתינות</Button>
            <Button variant={statusFilter === 'OVERDUE' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('OVERDUE')}>באיחור</Button>
            <Button variant={statusFilter === 'PAID' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('PAID')}>שולמו</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">חשבונית</th>
                  <th className="py-2">דייר</th>
                  <th className="py-2">סכום</th>
                  <th className="py-2">פירעון</th>
                  <th className="py-2">סטטוס</th>
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
                        <Button variant="outline" size="sm" onClick={() => window.open(`/api/v1/invoices/${invoice.id}/receipt`, '_blank')}>
                          <Receipt className="me-2 h-4 w-4" />
                          קבלה
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">אין חשבוניות להצגה.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
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
            <div className="flex items-center justify-between">
              <div className="font-medium">סה"כ: {formatCurrency(computeTotal(newInvoice.items))}</div>
              <Button onClick={submitInvoice} disabled={submitting || !newInvoice.residentId}>צור חשבונית</Button>
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
            <div className="flex items-center justify-between">
              <div className="font-medium">סה"כ: {formatCurrency(computeTotal(recurring.items))}</div>
              <Button onClick={submitRecurring} disabled={submitting || !recurring.residentId}>שמור מחזורי</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
