import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bell, Building2, ClipboardList, CreditCard, FileText, MessageCircle, Ticket } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { useLocale } from '../../lib/providers';
import { formatCurrency, formatDate, getPriorityLabel, getStatusLabel, getTicketStatusTone } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { MobileActionHub } from '../../components/ui/mobile-action-hub';
import { MobilePriorityInbox, type MobilePriorityInboxItem } from '../../components/ui/mobile-priority-inbox';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { PrimaryActionCard } from '../../components/ui/primary-action-card';
import { StatusBadge } from '../../components/ui/status-badge';

type AccountContext = {
  user: { id: number; email: string; role: string };
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
    paidAt?: string | null;
    status: string;
    description: string;
  }>;
};

const payableStatuses = new Set(['UNPAID', 'OVERDUE']);

export default function ResidentAccountPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [context, setContext] = useState<AccountContext | null>(null);
  const [finance, setFinance] = useState<ResidentFinance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    if (router.query.section === 'building') {
      void router.replace('/resident/building');
      return;
    }

    if (router.query.section === 'methods') {
      void router.replace('/resident/payment-methods');
      return;
    }

    void loadAccount();
  }, [router.isReady, router.query.section]);

  async function loadAccount() {
    try {
      setLoading(true);
      setError(null);
      const accountRes = await authFetch('/api/v1/users/account');
      if (!accountRes.ok) {
        throw new Error(await accountRes.text());
      }

      const nextContext = (await accountRes.json()) as AccountContext;
      setContext(nextContext);

      if (!nextContext.residentId) {
        setFinance(null);
        return;
      }

      const financeRes = await authFetch(`/api/v1/invoices/account/${nextContext.residentId}`);
      if (!financeRes.ok) {
        throw new Error(await financeRes.text());
      }

      setFinance(await financeRes.json());
    } catch (nextError) {
      console.error(nextError);
      setError('לא ניתן לטעון כעת את האזור האישי.');
    } finally {
      setLoading(false);
    }
  }

  const primaryUnit = context?.units[0] ?? null;
  const primaryBuilding = primaryUnit?.building ?? null;
  const residentName = context?.user?.email?.split('@')[0] || 'דייר';
  const openTickets = useMemo(() => (context?.tickets ?? []).filter((ticket) => ticket.status !== 'RESOLVED'), [context?.tickets]);
  const unreadNotifications = useMemo(() => (context?.notifications ?? []).filter((item) => !item.read), [context?.notifications]);
  const recentDocuments = useMemo(() => [...(context?.documents ?? [])].slice(0, 2), [context?.documents]);
  const nextPaymentDue = useMemo(
    () =>
      [...(finance?.invoices ?? [])]
        .filter((invoice) => payableStatuses.has(invoice.status))
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0],
    [finance?.invoices],
  );

  const actionItems = [
    {
      id: 'pay',
      label: 'תשלום',
      description: nextPaymentDue ? 'שלם עכשיו' : 'צפה בחיובים',
      href: '/payments/resident',
      icon: CreditCard,
      badge: finance?.summary.unpaidInvoices ? finance.summary.unpaidInvoices : undefined,
      accent: nextPaymentDue ? ('warning' as const) : ('primary' as const),
      emphasize: Boolean(nextPaymentDue),
    },
    {
      id: 'request',
      label: 'בקשה חדשה',
      description: 'פנייה מהירה',
      href: '/resident/requests?view=new',
      icon: ClipboardList,
      accent: 'primary' as const,
      emphasize: !nextPaymentDue,
    },
    {
      id: 'call',
      label: 'קריאה / תקלה',
      description: 'דיווח עם צילום',
      href: '/create-call',
      icon: Ticket,
      badge: openTickets.length || undefined,
      accent: openTickets.length ? ('warning' as const) : ('neutral' as const),
    },
    {
      id: 'documents',
      label: 'מסמכים',
      description: 'קבצים ועדכונים',
      href: '/documents',
      icon: FileText,
      badge: recentDocuments.length || undefined,
      accent: 'info' as const,
    },
    {
      id: 'building',
      label: 'הבניין שלי',
      description: primaryBuilding?.name || 'פרטים ואנשי קשר',
      href: '/resident/building',
      icon: Building2,
      accent: 'neutral' as const,
    },
    {
      id: 'contact',
      label: 'צור קשר',
      description: 'תמיכה וניהול',
      href: '/support',
      icon: MessageCircle,
      accent: 'neutral' as const,
    },
  ];

  const activeItems: MobilePriorityInboxItem[] = [];
  if (nextPaymentDue) {
    activeItems.push({
      id: `invoice-${nextPaymentDue.id}`,
      status: nextPaymentDue.status === 'OVERDUE' ? 'פיגור' : 'לתשלום',
      tone: nextPaymentDue.status === 'OVERDUE' ? 'danger' : 'warning',
      title: nextPaymentDue.description,
      reason: `${formatCurrency(nextPaymentDue.amount, 'ILS', locale)} · עד ${formatDate(nextPaymentDue.dueDate, locale)}`,
      href: '/payments/resident',
      ctaLabel: 'שלם עכשיו',
    });
  }
  if (openTickets[0]) {
    activeItems.push({
      id: `ticket-${openTickets[0].id}`,
      status: getStatusLabel(openTickets[0].status, 'he'),
      tone: getTicketStatusTone(openTickets[0].status),
      title: `קריאה #${openTickets[0].id}`,
      reason: openTickets[0].description?.trim() || `${openTickets[0].unit.building.name} · דירה ${openTickets[0].unit.number}`,
      meta: formatDate(openTickets[0].createdAt, locale),
      href: '/resident/requests?view=history',
      ctaLabel: 'עקוב',
    });
  }

  if (loading) return <DetailPanelSkeleton />;
  if (error || !context) {
    return (
      <InlineErrorPanel
        title="האזור האישי לא נטען"
        description={error || 'לא נמצאו נתונים'}
        onRetry={() => void loadAccount()}
      />
    );
  }

  return (
    <div dir="rtl" className="space-y-4 text-right sm:space-y-6">
      <CompactStatusStrip
        roleLabel={primaryBuilding ? `${primaryBuilding.name} · דירה ${primaryUnit?.number}` : 'האזור האישי'}
        icon={<Building2 className="h-4 w-4" strokeWidth={1.75} />}
        metrics={[
          {
            id: 'tickets',
            label: 'קריאות',
            value: openTickets.length,
            tone: openTickets.length ? 'warning' : 'success',
            onClick: () => void router.push('/resident/requests?view=history'),
          },
          {
            id: 'balance',
            label: 'לתשלום',
            value: finance?.summary.unpaidInvoices || finance?.summary.currentBalance ? formatCurrency(finance?.summary.currentBalance ?? 0, 'ILS', locale) : 'שולם',
            tone: nextPaymentDue ? 'warning' : 'success',
            onClick: () => void router.push('/payments/resident'),
          },
        ]}
      />

      <section className="space-y-3">
        <div className="rounded-[28px] bg-[linear-gradient(180deg,rgba(37,99,235,0.08)_0%,rgba(255,255,255,0.9)_100%)] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">שלום {residentName}</div>
          <h1 className="mt-2 text-2xl font-black leading-tight text-foreground">מה תרצה לעשות עכשיו?</h1>
          <p className="mt-1 text-sm text-secondary-foreground">
            {primaryBuilding ? `${primaryBuilding.name} · ${primaryBuilding.address}` : 'כל הפעולות החשובות במקום אחד'}
          </p>
        </div>

        <PrimaryActionCard
          eyebrow={nextPaymentDue ? 'לתשלום עכשיו' : 'החשבון שלך'}
          title={nextPaymentDue ? formatCurrency(nextPaymentDue.amount, 'ILS', locale) : 'הכול מעודכן'}
          description={
            nextPaymentDue
              ? `${nextPaymentDue.description} · עד ${formatDate(nextPaymentDue.dueDate, locale)}`
              : openTickets.length
                ? `${openTickets.length} קריאות פתוחות למעקב`
                : 'אין כרגע חיוב פתוח. אפשר לפתוח בקשה או קריאה חדשה.'
          }
          ctaLabel={nextPaymentDue ? 'שלם עכשיו' : 'בקשה חדשה'}
          href={nextPaymentDue ? '/payments/resident' : '/resident/requests?view=new'}
          tone={nextPaymentDue?.status === 'OVERDUE' ? 'danger' : nextPaymentDue ? 'warning' : 'success'}
          secondaryAction={
            <Button variant="outline" size="sm" asChild>
              <Link href="/resident/building">הבניין שלי</Link>
            </Button>
          }
        />
      </section>

      <MobileActionHub
        mobileHomeEffect
        title="פעולות מהירות"
        subtitle="הכול קצר, ברור ולחיץ"
        items={actionItems}
      />

      <Card variant="elevated" className="overflow-hidden rounded-[28px] border-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,1)_100%)]">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">מצב מהיר</h2>
              <p className="text-sm text-secondary-foreground">ללא גלילה ארוכה</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-secondary-foreground">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">{openTickets.length} קריאות</span>
              <span className="rounded-full bg-muted px-2.5 py-1 font-semibold">{unreadNotifications.length} עדכונים</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <QuickMetric label="פתוחות" value={openTickets.length} href="/resident/requests?view=history" />
            <QuickMetric label="לתשלום" value={finance?.summary.unpaidInvoices ?? 0} href="/payments/resident" />
            <QuickMetric label="מסמכים" value={context.documents.length} href="/documents" />
          </div>
        </CardContent>
      </Card>

      <MobilePriorityInbox
        title="פעיל עכשיו"
        subtitle="הפריטים שכנראה תרצה לפתוח עכשיו"
        items={activeItems.slice(0, 2)}
        emptyTitle="אין משהו דחוף כרגע"
        emptyDescription="כשתיפתח קריאה, יופיע חיוב או ייכנס עדכון חדש, נראה אותו כאן."
      />

      <section className="grid gap-3 md:grid-cols-2">
        <Card variant="muted" className="rounded-[24px] border-subtle-border/80">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">מסמכים אחרונים</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/documents">לכל המסמכים</Link>
              </Button>
            </div>

            {recentDocuments.length ? (
              recentDocuments.map((document) => (
                <Link
                  key={document.id}
                  href="/documents"
                  className="flex items-center justify-between rounded-[20px] border border-subtle-border bg-background px-3 py-3 transition hover:border-primary/25"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{document.name}</div>
                    <div className="text-xs text-secondary-foreground">{formatDate(document.uploadedAt, locale)}</div>
                  </div>
                  <FileText className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
                </Link>
              ))
            ) : (
              <EmptyState type="empty" size="sm" title="אין מסמכים חדשים" description="כשהצוות יעלה מסמך חדש, הוא יופיע כאן." />
            )}
          </CardContent>
        </Card>

        <Card variant="muted" className="rounded-[24px] border-subtle-border/80">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">קריאות במעקב</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/resident/requests?view=history">למעקב</Link>
              </Button>
            </div>

            {openTickets.slice(0, 2).length ? (
              openTickets.slice(0, 2).map((ticket) => (
                <Link
                  key={ticket.id}
                  href="/resident/requests?view=history"
                  className="block rounded-[20px] border border-subtle-border bg-background p-3 transition hover:border-primary/25"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={getStatusLabel(ticket.status, 'he')} tone={getTicketStatusTone(ticket.status)} />
                        {ticket.severity ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">{getPriorityLabel(ticket.severity)}</span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-foreground">קריאה #{ticket.id}</div>
                      <div className="mt-1 line-clamp-2 text-xs text-secondary-foreground">
                        {ticket.description?.trim() || `${ticket.unit.building.name} · דירה ${ticket.unit.number}`}
                      </div>
                    </div>
                    <Ticket className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState type="action" size="sm" title="אין קריאות פתוחות" description="אם יש תקלה, אפשר לפתוח קריאה חדשה בלחיצה אחת." action={{ label: 'פתח קריאה', onClick: () => void router.push('/create-call') }} />
            )}
          </CardContent>
        </Card>
      </section>

      <div className="flex items-center justify-center gap-2 text-center text-xs text-secondary-foreground">
        <Bell className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
        {unreadNotifications.length ? `${unreadNotifications.length} עדכונים חדשים מחכים לך` : 'כל העדכונים האחרונים נקראו'}
      </div>
    </div>
  );
}

function QuickMetric({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="rounded-[20px] border border-subtle-border bg-background px-3 py-3 transition hover:border-primary/25">
      <div className="text-lg font-black text-foreground">
        <bdi>{value}</bdi>
      </div>
      <div className="mt-1 text-xs font-medium text-secondary-foreground">{label}</div>
    </Link>
  );
}
