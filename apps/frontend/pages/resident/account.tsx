import { type ComponentType, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bell, Building2, ClipboardList, CreditCard, FileText, Ticket } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { PrimaryActionCard } from '../../components/ui/primary-action-card';
import { StatusBadge } from '../../components/ui/status-badge';
import { toast } from '../../components/ui/use-toast';
import { useLocale } from '../../lib/providers';
import { formatCurrency, formatDate, getPriorityLabel, getStatusLabel, getTicketStatusTone } from '../../lib/utils';

type AccountContext = {
  user: { id: number; email: string; phone?: string | null; role: string };
  residentId: number | null;
  units: Array<{
    id: number;
    number: string;
    building: {
      id: number;
      name: string;
      address: string;
    };
  }>;
  notifications: Array<{ id: number; title: string; message: string; createdAt: string; read: boolean }>;
  documents: Array<{ id: number; name: string; category?: string | null; url: string; uploadedAt: string }>;
  tickets: Array<{
    id: number;
    status: string;
    severity?: string | null;
    description?: string | null;
    createdAt: string;
    unit: { number: string; building: { name: string } };
  }>;
};

type ResidentFinance = {
  summary: {
    currentBalance: number;
    unpaidInvoices: number;
    overdueInvoices: number;
    openTickets: number;
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
};

type PaymentMethod = {
  id: number;
  provider: string;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  isDefault: boolean;
};

type ResidentShortcutItem = {
  id: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
  badge?: string | number;
};

const payableStatuses = new Set(['UNPAID', 'OVERDUE']);

function translateCardBrand(value?: string | null) {
  const labels: Record<string, string> = {
    visa: 'ויזה',
    mastercard: 'מאסטרקארד',
    ישראכרט: 'ישראכרט',
    isracard: 'ישראכרט',
    amex: 'אמריקן אקספרס',
    diners: 'דיינרס',
    tranzila: 'טרנזילה',
    stripe: 'סטרייפ',
  };
  if (!value) return 'כרטיס שמור';
  return labels[value.toLowerCase()] || value;
}

export default function ResidentAccountPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [context, setContext] = useState<AccountContext | null>(null);
  const [finance, setFinance] = useState<ResidentFinance | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadAccount();
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    if (router.asPath.includes('#payments-section')) {
      void router.replace('/payments/resident');
      return;
    }

    const section = typeof router.query.section === 'string' ? router.query.section : '';
    if (section === 'building') {
      void router.replace('/resident/building');
    }
  }, [router.isReady, router.asPath, router.query.section]);

  async function loadAccount() {
    try {
      setLoading(true);
      setError(null);
      const contextResponse = await authFetch('/api/v1/users/account');
      if (!contextResponse.ok) {
        throw new Error(await contextResponse.text());
      }
      const nextContext = await contextResponse.json();
      setContext(nextContext);

      if (!nextContext.residentId) {
        setFinance(null);
        setPaymentMethods([]);
        return;
      }

      const [financeResponse, methodsResponse] = await Promise.all([
        authFetch(`/api/v1/invoices/account/${nextContext.residentId}`),
        authFetch('/api/v1/payments/methods'),
      ]);

      if (!financeResponse.ok) {
        throw new Error(await financeResponse.text());
      }

      setFinance(await financeResponse.json());
      setPaymentMethods(methodsResponse.ok ? await methodsResponse.json() : []);
    } catch (nextError) {
      console.error(nextError);
      setError('לא ניתן לטעון כעת את דף הבית לדייר. נסו שוב בעוד רגע.');
      toast({ title: 'טעינת דף הבית נכשלה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const nextPaymentDue = useMemo(
    () =>
      [...(finance?.invoices ?? [])]
        .filter((invoice) => payableStatuses.has(invoice.status))
        .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())[0],
    [finance],
  );

  if (loading || !context) {
    if (!loading && error) {
      return <InlineErrorPanel title="דף הבית לא נטען" description={error} onRetry={() => void loadAccount()} />;
    }
    return <DetailPanelSkeleton />;
  }

  const primaryUnit = context.units[0] ?? null;
  const primaryBuilding = primaryUnit?.building ?? null;
  const openTickets = context.tickets.filter((ticket) => ticket.status !== 'RESOLVED');
  const unreadNotifications = context.notifications.filter((item) => !item.read);
  const primaryPaymentMethod = paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0] ?? null;
  const visibleTickets = openTickets.slice(0, 2);
  const paymentCardTitle = nextPaymentDue ? `לתשלום ${formatCurrency(nextPaymentDue.amount)}` : 'החשבון מעודכן';
  const paymentCardDescription = nextPaymentDue
    ? `${nextPaymentDue.description} · מועד ${formatDate(nextPaymentDue.dueDate, locale)}`
    : 'אין כרגע חיוב פתוח. אפשר לעבור למסך התשלומים עבור קבלות, כרטיסים וכרטסת.';
  const paymentMethodLabel = primaryPaymentMethod
    ? `${translateCardBrand(primaryPaymentMethod.brand || primaryPaymentMethod.provider)} •••• ${primaryPaymentMethod.last4 || '••••'}`
    : 'ללא כרטיס שמור';
  const residentShortcutItems: ResidentShortcutItem[] = [
    {
      id: 'payments',
      label: 'תשלומים',
      description: nextPaymentDue ? `לתשלום ${formatCurrency(nextPaymentDue.amount)}` : 'חיובים, קבלות וכרטיסים',
      href: '/payments/resident',
      icon: CreditCard,
      badge: nextPaymentDue ? 'חדש' : undefined,
    },
    {
      id: 'requests',
      label: 'בקשות',
      description: 'היסטוריה וטפסים לדייר',
      href: '/resident/requests',
      icon: ClipboardList,
      badge: openTickets.length || undefined,
    },
    {
      id: 'documents',
      label: 'מסמכים',
      description: `${context.documents.length} קבצים זמינים`,
      href: '/documents',
      icon: FileText,
    },
    {
      id: 'building',
      label: 'הבניין שלי',
      description: primaryBuilding?.name || 'אנשי קשר והנחיות',
      href: '/resident/building',
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-4 pb-16 sm:space-y-6 lg:pb-0">
      <CompactStatusStrip
        roleLabel={primaryBuilding?.name ? `דייר · ${primaryBuilding.name}` : 'דייר'}
        icon={<Building2 className="h-4 w-4" strokeWidth={1.75} />}
        metrics={[
          { id: 'balance', label: 'יתרה', value: Math.round(finance?.summary.currentBalance ?? 0), tone: finance?.summary.currentBalance ? 'warning' : 'success' },
          { id: 'tickets', label: 'קריאות', value: openTickets.length, tone: openTickets.length ? 'warning' : 'success' },
        ]}
      />

      <PrimaryActionCard
        eyebrow="תשלום וחשבון"
        title={paymentCardTitle}
        description={paymentCardDescription}
        ctaLabel={nextPaymentDue ? 'לתשלום' : 'למסך תשלומים'}
        href="/payments/resident"
        tone={nextPaymentDue?.status === 'OVERDUE' ? 'danger' : nextPaymentDue ? 'warning' : 'success'}
        secondaryAction={
          <Button variant="outline" size="sm" asChild>
            <Link href="/resident/building">הבניין שלי</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3" aria-label="פעולות מהירות לדייר">
        {residentShortcutItems.map((item) => (
          <ResidentShortcutTile key={item.id} item={item} />
        ))}
      </section>

      <section aria-label="כרטיס תשלום ראשי">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              אמצעי תשלום ראשי
            </CardTitle>
            <CardDescription>גישה מהירה לחיובים, קבלות וכרטיס השמור שלך.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-subtle-border bg-muted/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">כרטיס ראשי</div>
                  <div className="mt-2 text-lg font-semibold text-foreground">{paymentMethodLabel}</div>
                  <div className="mt-1 text-sm leading-6 text-muted-foreground">
                    {primaryPaymentMethod
                      ? `תוקף ${primaryPaymentMethod.expMonth || '--'}/${primaryPaymentMethod.expYear || '--'}`
                      : 'אפשר להוסיף או לעדכן כרטיס במסך התשלומים הייעודי.'}
                  </div>
                </div>
                {primaryPaymentMethod?.isDefault ? <Badge variant="success">ברירת מחדל</Badge> : <Badge variant="outline">תשלום ידני</Badge>}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-subtle-border bg-background p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">יתרה נוכחית</div>
                <div className="mt-2 text-2xl font-black text-foreground">{formatCurrency(finance?.summary.currentBalance ?? 0)}</div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">
                  {nextPaymentDue ? `החיוב הקרוב בתאריך ${formatDate(nextPaymentDue.dueDate, locale)}` : 'אין כרגע חיובים פתוחים.'}
                </div>
              </div>
              <div className="rounded-[20px] border border-subtle-border bg-background p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">עדכונים חדשים</div>
                <div className="mt-2 text-2xl font-black text-foreground">{unreadNotifications.length}</div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">
                  {unreadNotifications[0]?.title || 'כל ההודעות האחרונות כבר נקראו.'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-label="הקריאות שלי">
        <Card variant="elevated">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Ticket className="h-5 w-5 text-primary" />
                My Tickets
              </CardTitle>
              <CardDescription>הצצה מהירה לקריאות הפעילות, בלי היסטוריה ארוכה במסך הבית.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/resident/requests">כל הבקשות</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleTickets.length ? (
              visibleTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-[22px] border border-subtle-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={getStatusLabel(ticket.status, 'he')} tone={getTicketStatusTone(ticket.status)} />
                        <Badge variant="outline">קריאה #{ticket.id}</Badge>
                        {ticket.severity ? <Badge variant={ticket.severity === 'URGENT' ? 'warning' : 'outline'}>{getPriorityLabel(ticket.severity)}</Badge> : null}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{ticket.unit.building.name} · דירה {ticket.unit.number}</div>
                        <div className="mt-1 text-sm leading-6 text-muted-foreground">
                          {ticket.description?.trim() || 'פנייה פתוחה בטיפול הצוות.'}
                        </div>
                        <div className="mt-1 text-xs text-tertiary">נפתחה ב-{formatDate(ticket.createdAt, locale)}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/tickets/${ticket.id}`}>פרטים</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                type="action"
                size="sm"
                title="אין כרגע קריאות פתוחות"
                description="אם נדרשת תחזוקה או שירות, אפשר לפתוח קריאה חדשה ישירות מהנייד."
                action={{ label: 'פתח קריאה', onClick: () => router.push('/create-call') }}
              />
            )}

            <div className="flex items-center justify-between rounded-[20px] border border-dashed border-subtle-border bg-muted/15 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bell className="h-4 w-4 text-primary" />
                {unreadNotifications.length ? `${unreadNotifications.length} התראות חדשות ממתינות במרכז ההתראות.` : 'אין כרגע התראות חדשות.'}
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/notifications">עדכונים</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ResidentShortcutTile({ item }: { item: ResidentShortcutItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="group flex min-h-[146px] flex-col rounded-[28px] border border-subtle-border bg-card/96 p-4 text-start shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/26 hover:shadow-raised active:translate-y-0"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary/14 bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.96),rgba(255,255,255,0.72)_42%,rgba(212,168,8,0.18)_43%,rgba(212,168,8,0.1)_100%)] text-primary shadow-[0_12px_28px_rgba(18,24,38,0.08),inset_0_1px_0_rgba(255,255,255,0.85)]">
          <Icon className="h-6 w-6" />
        </span>
        {item.badge !== undefined ? (
          <span className="rounded-full border border-primary/16 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {item.badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="text-base font-semibold text-foreground">{item.label}</div>
        <div className="line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</div>
      </div>
      <div className="mt-auto pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">פתח</div>
    </Link>
  );
}
