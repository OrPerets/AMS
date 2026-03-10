import { useEffect, useMemo, useState } from 'react';
import { Download, ReceiptText } from 'lucide-react';
import { authFetch, downloadAuthenticatedFile } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { toast } from '../../components/ui/use-toast';
import { formatCurrency, formatDate } from '../../lib/utils';

interface Invoice {
  id: number;
  residentId: number;
  residentName?: string;
  amount: number;
  dueDate?: string;
  status: string;
  paymentMethod?: string | null;
  history?: Array<{ kind: string; id: number; status: string; amount: number; createdAt: string }>;
}

export default function UnpaidInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [residentId, setResidentId] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [residentId]);

  async function load() {
    try {
      setLoading(true);
      const query = residentId ? `?residentId=${residentId}` : '';
      const response = await authFetch(`/api/v1/invoices/unpaid${query}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setInvoices(await response.json());
    } catch {
      toast({
        title: 'טעינת חשבוניות נכשלה',
        description: 'לא ניתן לטעון את החשבוניות הפתוחות.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function markSelectedAsPaid() {
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          authFetch(`/api/v1/invoices/${id}/confirm`, { method: 'POST' }),
        ),
      );
      setSelected(new Set());
      toast({ title: 'החשבוניות עודכנו' });
      await load();
    } catch {
      toast({
        title: 'העדכון נכשל',
        description: 'לא ניתן לסמן את כל החשבוניות כמשולמות.',
        variant: 'destructive',
      });
    }
  }

  const totalOpenAmount = useMemo(
    () => invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
    [invoices],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">חשבוניות שלא שולמו</h1>
          <p className="text-muted-foreground">מעקב, סימון תשלום, וייצוא של חשבוניות פתוחות.</p>
        </div>
        <div className="flex gap-2">
          <Input
            className="w-48"
            placeholder="סינון לפי דייר"
            value={residentId}
            onChange={(event) => setResidentId(event.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => {
              const query = residentId ? `?residentId=${residentId}&format=csv` : '?format=csv';
              downloadAuthenticatedFile(`/api/v1/invoices/unpaid${query}`, 'unpaid-invoices.csv');
            }}
          >
            <Download className="me-2 h-4 w-4" />
            יצוא
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>חשבוניות פתוחות</CardDescription>
            <CardTitle>{invoices.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>סכום פתוח</CardDescription>
            <CardTitle>{formatCurrency(totalOpenAmount)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>פעולות</CardDescription>
            <CardTitle className="text-base">
              <Button onClick={markSelectedAsPaid} disabled={selected.size === 0}>
                <ReceiptText className="me-2 h-4 w-4" />
                סמן כשולם
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>טבלת מעקב</CardTitle>
          <CardDescription>כולל תאריך יעד, אמצעי תשלום אחרון והיסטוריית חיובים.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>מספר</TableHead>
                <TableHead>דייר</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>תאריך יעד</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>מעקב תשלום</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(invoice.id)}
                      onChange={(event) => {
                        const next = new Set(selected);
                        if (event.target.checked) next.add(invoice.id);
                        else next.delete(invoice.id);
                        setSelected(next);
                      }}
                    />
                  </TableCell>
                  <TableCell>#{invoice.id}</TableCell>
                  <TableCell>
                    <div>
                      <p>{invoice.residentName || `דייר ${invoice.residentId}`}</p>
                      <p className="text-xs text-muted-foreground">מזהה דייר #{invoice.residentId}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</TableCell>
                  <TableCell>{invoice.status}</TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      <p>{invoice.paymentMethod || 'ידני / ללא אמצעי תשלום'}</p>
                      <p>{invoice.history?.length || 0} אירועים</p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!loading && invoices.length === 0 && (
            <p className="pt-4 text-sm text-muted-foreground">אין כרגע חשבוניות פתוחות עבור הסינון שנבחר.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
