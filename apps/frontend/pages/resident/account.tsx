import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CreditCard, FileText, MessageSquare, Ticket, Wrench } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/use-toast';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useLocale } from '../../lib/providers';

type AccountContext = {
  user: { id: number; email: string; phone?: string | null; role: string };
  residentId: number | null;
  units: Array<{ id: number; number: string; building: { id: number; name: string; address: string } }>;
  notifications: Array<{ id: number; title: string; message: string; createdAt: string; read: boolean }>;
  documents: Array<{ id: number; name: string; category?: string | null; url: string; uploadedAt: string }>;
  tickets: Array<{ id: number; status: string; createdAt: string; unit: { number: string; building: { name: string } } }>;
  recentActivity: Array<{ id: number; summary: string; createdAt: string; severity: string }>;
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
  const { locale } = useLocale();
  const [context, setContext] = useState<AccountContext | null>(null);
  const [finance, setFinance] = useState<ResidentFinance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccount();
  }, []);

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
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">האזור האישי של הדייר</h1>
          <p className="text-sm text-muted-foreground">יתרה, מסמכים, קריאות שירות והודעות במקום אחד.</p>
        </div>
        <div className="flex gap-2">
          {context.residentId ? (
            <Button variant="outline" onClick={() => window.open(`/api/v1/invoices/ledger?residentId=${context.residentId}&format=csv`, '_blank')}>
              ייצוא דוח יתרה
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/settings">העדפות התראות</Link>
          </Button>
          <Button variant="outline" onClick={loadAccount}>רענון</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
            {(finance?.invoices || []).slice(0, 6).map((invoice) => (
              <div key={invoice.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">#{invoice.id} · {invoice.description}</div>
                    <div className="text-xs text-muted-foreground">פירעון: {formatDate(new Date(invoice.dueDate), locale)}</div>
                  </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(invoice.amount)}</div>
                      <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'OVERDUE' ? 'destructive' : 'warning'}>
                        {invoice.status}
                      </Badge>
                      {invoice.receiptNumber ? (
                        <div className="mt-2">
                          <Button size="sm" variant="outline" onClick={() => window.open(`/api/v1/invoices/${invoice.id}/receipt`, '_blank')}>
                            הורד קבלה
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
                <div className="flex items-center justify-between gap-3">
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
              <div key={entry.id} className="flex items-center justify-between rounded-lg border p-3">
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
