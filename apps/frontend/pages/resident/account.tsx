import { type ComponentType, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Bell,
  Building2,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  MessageSquare,
  Phone,
  Wrench,
} from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { PageHero } from '../../components/ui/page-hero';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { PrimaryActionCard } from '../../components/ui/primary-action-card';
import { SectionHeader } from '../../components/ui/section-header';
import { StatusBadge } from '../../components/ui/status-badge';
import { toast } from '../../components/ui/use-toast';
import { cn, formatCurrency, formatDate, getPriorityLabel, getStatusLabel, getTicketStatusTone, getUserRoleLabel } from '../../lib/utils';
import { useLocale } from '../../lib/providers';
import { websocketService } from '../../lib/websocket';

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
      amenities?: string[];
      managerName?: string | null;
      contactEmail?: string | null;
      contactPhone?: string | null;
      notes?: string | null;
      totalUnits?: number | null;
      floors?: number | null;
      isActive?: boolean;
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
    comments?: Array<{
      id: number;
      content: string;
      createdAt: string;
      author?: { email?: string | null; role?: string | null } | null;
    }>;
    workOrders?: Array<{
      id: number;
      status: string;
      createdAt: string;
      supplier?: { name?: string | null } | null;
    }>;
  }>;
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
  invoices: Array<{
    id: number;
    amount: number;
    dueDate: string;
    issueDate?: string;
    paidAt?: string | null;
    status: string;
    description: string;
    receiptNumber?: string | null;
    history?: Array<{ id: number; kind: string; status: string; amount: number; createdAt: string }>;
  }>;
  ledger: Array<{ id: string; type: string; amount: number; createdAt: string; summary: string }>;
  communications: Array<{ id: number; subject?: string | null; message: string; createdAt: string }>;
};

type TimelineTone = 'neutral' | 'active' | 'success' | 'warning' | 'danger';

type TicketTimelineEvent = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  tone: TimelineTone;
};

const payableStatuses = new Set(['UNPAID', 'OVERDUE']);
const ticketProgress = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] as const;

function getTicketProgressIndex(status: string) {
  const normalized = status.toUpperCase();
  const index = ticketProgress.indexOf(normalized as (typeof ticketProgress)[number]);
  return index === -1 ? 0 : index;
}

function getTicketTimeline(ticket: AccountContext['tickets'][number]): TicketTimelineEvent[] {
  const events: TicketTimelineEvent[] = [
    {
      id: `ticket-created-${ticket.id}`,
      title: 'הקריאה נפתחה',
      description: ticket.description?.trim() || 'קיבלנו את הפנייה והעברנו אותה לצוות הטיפול.',
      createdAt: ticket.createdAt,
      tone: 'warning' as const,
    },
    ...(ticket.workOrders ?? []).map((workOrder) => ({
      id: `work-order-${workOrder.id}`,
      title: workOrder.status === 'COMPLETED' ? 'הטיפול הושלם בשטח' : 'הוזמן ספק לטיפול',
      description: workOrder.supplier?.name
        ? `הספק ${workOrder.supplier.name} עודכן בסטטוס ${getStatusLabel(workOrder.status, 'he')}.`
        : `נוצרה הזמנת עבודה והסטטוס הוא ${getStatusLabel(workOrder.status, 'he')}.`,
      createdAt: workOrder.createdAt,
      tone: workOrder.status === 'COMPLETED' ? ('success' as const) : ('active' as const),
    })),
    ...(ticket.comments ?? []).map((comment) => ({
      id: `comment-${comment.id}`,
      title: 'עדכון מהצוות',
      description: comment.author?.email ? `${comment.content} · ${comment.author.email}` : comment.content,
      createdAt: comment.createdAt,
      tone: 'neutral' as const,
    })),
  ];

  return events.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export default function ResidentAccountPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [context, setContext] = useState<AccountContext | null>(null);
  const [finance, setFinance] = useState<ResidentFinance | null>(null);
  const [loading, setLoading] = useState(true);
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTickets, setExpandedTickets] = useState<Record<number, boolean>>({});

  useEffect(() => {
    void loadAccount();
  }, []);

  useEffect(() => {
    const handleNewNotification = () => {
      void loadAccount();
    };

    websocketService.on('new_notification', handleNewNotification);
    return () => {
      websocketService.off('new_notification', handleNewNotification);
    };
  }, []);

  useEffect(() => {
    if (!router.isReady) return;


    const section = typeof router.query.section === 'string' ? router.query.section : '';
    if (section === 'building') {
      void router.replace('/resident/building');
      return;
    }

    const rawIntentId = router.query.intentId || router.query.paymentIntentId || router.query.payment_intent || router.query.paymentId;
    if (rawIntentId) {
      void router.replace(`/payments/resident${router.asPath.includes('?') ? router.asPath.slice(router.asPath.indexOf('?')) : ''}`);
    }
  }, [router.asPath, router.isReady, router.query.intentId, router.query.paymentIntentId, router.query.payment_intent, router.query.paymentId, router.query.section]);

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

      if (nextContext.residentId) {
        const [financeResponse, autopayResponse] = await Promise.all([
          authFetch(`/api/v1/invoices/account/${nextContext.residentId}`),
          authFetch('/api/v1/payments/autopay'),
        ]);
        if (!financeResponse.ok) {
          throw new Error(await financeResponse.text());
        }
        setFinance(await financeResponse.json());
        if (autopayResponse.ok) {
          const prefs = await autopayResponse.json();
          setAutopayEnabled(Boolean(prefs.autopayEnabled));
        } else {
          setAutopayEnabled(false);
        }
      } else {
        setFinance(null);
        setAutopayEnabled(false);
      }
    } catch (nextError) {
      console.error(nextError);
      setError('לא ניתן לטעון כעת את האזור האישי. נסו שוב בעוד רגע או פנו לתמיכה אם הבעיה נמשכת.');
      toast({ title: 'טעינת האזור האישי נכשלה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }



  if (loading || !context) {
    if (!loading && error) {
      return <InlineErrorPanel title="האזור האישי לא נטען" description={error} onRetry={() => void loadAccount()} />;
    }
    return <DetailPanelSkeleton />;
  }

  const summary = finance?.summary;
  const openTickets = context.tickets.filter((ticket) => ticket.status !== 'RESOLVED');
  const unreadNotifications = context.notifications.filter((item) => !item.read);
  const nextPaymentDue = [...(finance?.invoices ?? [])]
    .filter((invoice) => payableStatuses.has(invoice.status))
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())[0];
  const publishedDocuments = context.documents.filter((document) =>
    ['meeting_summary', 'signed_protocol', 'regulation', 'committee_decision'].includes(String(document.category || '').toLowerCase()),
  );
  const primaryUnit = context.units[0] ?? null;
  const primaryBuilding = primaryUnit?.building ?? null;
  const accountDisplayName = context.user.email.split('@')[0];
  const attentionCards: Array<{ key: string; tone: TimelineTone; label: string; title: string; description: string }> = [
    nextPaymentDue
      ? {
          key: 'payment',
          tone: nextPaymentDue.status === 'OVERDUE' ? 'danger' : 'warning',
          label: nextPaymentDue.status === 'OVERDUE' ? 'דורש טיפול מיידי' : 'לתשלום קרוב',
          title: `תשלום ${formatCurrency(nextPaymentDue.amount)} עבור ${nextPaymentDue.description}`,
          description: `מועד פירעון ${formatDate(nextPaymentDue.dueDate, locale)}`,
        }
      : {
          key: 'payment',
          tone: 'success' as const,
          label: 'עודכן',
          title: 'אין כרגע תשלום ממתין',
          description: 'כל החשבוניות האחרונות מעודכנות או שולמו.',
        },
    openTickets[0]
      ? {
          key: 'ticket',
          tone: openTickets[0].status === 'OPEN' ? 'warning' : 'active',
          label: 'קריאת שירות',
          title: `קריאה #${openTickets[0].id} בסטטוס ${getStatusLabel(openTickets[0].status, 'he')}`,
          description: `${openTickets[0].unit.building.name} · דירה ${openTickets[0].unit.number}`,
        }
      : {
          key: 'ticket',
          tone: 'success' as const,
          label: 'שקט תפעולי',
          title: 'אין כרגע קריאות שירות פתוחות',
          description: 'אם משהו משתנה, אפשר לפתוח קריאה חדשה ישירות מהנייד.',
        },
    unreadNotifications[0]
      ? {
          key: 'notification',
          tone: 'active' as const,
          label: 'עדכון חדש',
          title: unreadNotifications[0].title,
          description: unreadNotifications[0].message,
        }
      : {
          key: 'notification',
          tone: 'neutral' as const,
          label: 'מעודכן',
        title: 'אין כרגע הודעות שלא נקראו',
        description: 'התראות חדשות והודעות ועד יופיעו כאן.',
      },
  ];
  const heroStatusItems = [
    {
      label: t('residentAccount.metric.balance'),
      value: summary ? formatCurrency(summary.currentBalance) : t('residentAccount.metric.notAvailable'),
      hint: nextPaymentDue ? t('residentAccount.metric.dueDate', { value: formatDate(nextPaymentDue.dueDate, locale) }) : t('residentAccount.metric.noUnpaidInvoice'),
    },
    {
      label: t('residentAccount.metric.openIssues'),
      value: String(openTickets.length),
      hint: openTickets[0] ? t('residentAccount.metric.openedAt', { value: formatDate(openTickets[0].createdAt, locale) }) : t('residentAccount.metric.noOpenIssue'),
    },
    {
      label: t('residentAccount.metric.unreadUpdates'),
      value: String(unreadNotifications.length),
      hint: unreadNotifications[0]?.title || t('residentAccount.metric.allReviewed'),
    },
  ];
  const residentShortcutItems: ResidentShortcutItem[] = [
    {
      id: 'notifications',
      label: 'עדכונים',
      description: unreadNotifications.length ? `${unreadNotifications.length} הודעות חדשות` : 'מרכז ההתראות והודעות הוועד',
      href: '/notifications',
      icon: Bell,
      badge: unreadNotifications.length || undefined,
    },
    {
      id: 'requests',
      label: 'בקשות',
      description: 'מעקב מסודר אחרי פניות שירות',
      href: '/resident/requests',
      icon: ClipboardList,
    },
    {
      id: 'payments',
      label: 'תשלומים',
      description: nextPaymentDue ? `לתשלום ${formatCurrency(nextPaymentDue.amount)}` : 'חיובים, קבלות וכרטסת',
      href: '/payments/resident',
      icon: CreditCard,
      badge: nextPaymentDue ? 'חדש' : undefined,
    },
    {
      id: 'service',
      label: 'שירות',
      description: openTickets.length ? `${openTickets.length} קריאות פעילות` : 'פתח קריאת שירות חדשה',
      href: openTickets.length ? '/tickets' : '/create-call',
      icon: Wrench,
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
      description: primaryBuilding?.name || 'אנשי קשר, הנחיות ומתקנים',
      href: '/resident/building',
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-6 pb-16 sm:space-y-8 lg:pb-0">
      <div className="space-y-3 md:hidden">
        <CompactStatusStrip
          roleLabel={primaryBuilding?.name ? `דייר · ${primaryBuilding.name}` : 'דייר'}
          icon={<Building2 className="h-4 w-4" strokeWidth={1.75} />}
          metrics={[
            { id: 'balance', label: 'יתרה', value: Math.round(summary?.currentBalance ?? 0), tone: summary?.currentBalance ? 'warning' : 'success' },
            { id: 'tickets', label: 'קריאות', value: openTickets.length, tone: openTickets.length ? 'warning' : 'success' },
          ]}
        />

        <PrimaryActionCard
          eyebrow="פעולה ראשית"
          title={nextPaymentDue ? `לתשלום ${formatCurrency(nextPaymentDue.amount)}` : 'החשבון מעודכן'}
          description={
            nextPaymentDue
              ? `2 חיובים פתוחים · מועד ${formatDate(nextPaymentDue.dueDate, locale)}`
              : 'אין יתרה לתשלום. אפשר לעקוב אחרי קריאות, מסמכים ופרטי הבניין.'
          }
          ctaLabel={nextPaymentDue ? 'שלם עכשיו' : 'פרטי חשבון'}
          href={nextPaymentDue ? '/payments/resident' : '/resident/building'}
          tone={nextPaymentDue?.status === 'OVERDUE' ? 'danger' : nextPaymentDue ? 'warning' : 'success'}
          secondaryAction={
            nextPaymentDue ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/resident/building">פרטי בניין</Link>
              </Button>
            ) : null
          }
        />
      </div>

      <div className="hidden md:block">
      <PageHero
        compact
        className="resident-landing-hero"
        kicker="פורטל דיירים"
        eyebrow={
          <>
            <StatusBadge label="בית הדייר" tone="finance" />
            {primaryBuilding?.name ? <Badge variant="outline" className="border-white/12 bg-white/8 text-white/82">{primaryBuilding.name}</Badge> : null}
          </>
        }
        title={`שלום ${accountDisplayName}, הכל מוכן עבורך במקום אחד`}
        description="תשלומים, בקשות, שירות ומסמכי בניין עם ניווט ברור, פחות עומס ופעולה מהירה מהמסך הראשון."
        actions={
          <>
            <Button asChild>
              <Link href="/resident/requests">בקשה חדשה</Link>
            </Button>
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" asChild>
              <Link href="/notifications">עדכונים</Link>
            </Button>
          </>
        }
      />
      </div>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="מצב חשבון מהיר">
        {heroStatusItems.map((item) => (
          <ResidentStatusCard key={item.label} label={item.label} value={item.value} description={item.hint} />
        ))}
      </section>

      <section className="space-y-3" aria-label="ניווט מהיר לדייר">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">ניווט מהיר</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              הפעולות החשובות של הדייר מרוכזות כאן, עם שפה פשוטה וגישה מיידית.
            </p>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            {autopayEnabled ? t('residentAccount.mobile.autopayActive') : t('residentAccount.mobile.manualPayment')}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {residentShortcutItems.map((item) => (
            <ResidentShortcutTile key={item.id} item={item} />
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card variant="featured">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              מה חדש היום
            </CardTitle>
            <CardDescription>עדכונים חשובים, מה דורש טיפול ומה כבר התקדם מאז הכניסה הקודמת.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2.5 sm:gap-3">
            {attentionCards.map((item) => (
              <div key={item.key} className="rounded-xl sm:rounded-[20px] border border-subtle-border bg-background/90 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 sm:space-y-1.5">
                    <StatusBadge label={item.label} tone={item.tone} />
                    <div className="text-sm sm:text-base font-semibold text-foreground">{item.title}</div>
                    <div className="text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">{item.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              פרופיל, חשבון וגישה מהירה
            </CardTitle>
            <CardDescription>מידע אישי ברור, פרטי היחידה וגישה שקטה להגדרות ולמסמכים בלי להעמיס על ראש המסך.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-5">
            <div className="rounded-[24px] border border-subtle-border bg-muted/24 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary/12 text-base font-bold text-primary shadow-sm">
                    {accountDisplayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="text-base font-semibold text-foreground">{context.user.email}</div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="finance">{getUserRoleLabel(context.user.role)}</Badge>
                      {context.user.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {context.user.phone}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings">העדפות חשבון</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-2.5 sm:gap-4 md:grid-cols-2">
              <div className="rounded-xl sm:rounded-[20px] border border-subtle-border bg-background p-3 sm:p-4">
                <div className="text-xs sm:text-sm font-semibold text-foreground">דירות ובניינים</div>
                <div className="mt-2 space-y-2 text-xs sm:text-sm text-muted-foreground">
                  {context.units.map((unit) => (
                    <div key={unit.id} className="rounded-[18px] border border-subtle-border/70 bg-muted/20 px-3 py-2.5">
                      {unit.building.name} · דירה {unit.number}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl sm:rounded-[20px] border border-subtle-border bg-background p-3 sm:p-4">
                <div className="text-xs sm:text-sm font-semibold text-foreground">תמונת מצב אישית</div>
                <div className="mt-2 space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="rounded-[18px] border border-subtle-border/70 bg-muted/20 px-3 py-2.5">
                    {autopayEnabled ? 'חיוב אוטומטי פעיל ומוכן לחשבוניות עתידיות.' : 'חיובים כרגע מתבצעים ידנית דרך האזור האישי.'}
                  </div>
                  <div className="rounded-[18px] border border-subtle-border/70 bg-muted/20 px-3 py-2.5">
                    {summary?.overdueInvoices ? `${summary.overdueInvoices} חשבוניות דורשות טיפול בהקדם.` : 'אין כרגע פיגורים או חריגות בחשבון.'}
                  </div>
                  <div className="rounded-[18px] border border-subtle-border/70 bg-muted/20 px-3 py-2.5">
                    {openTickets.length ? `יש ${openTickets.length} קריאות פתוחות במעקב.` : 'אין כרגע קריאות שירות פתוחות.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              <Button variant="outline" size="sm" className="justify-between sm:h-11 sm:px-5 sm:text-sm" asChild>
                <Link href="/settings">העדפות</Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-between sm:h-11 sm:px-5 sm:text-sm" asChild>
                <Link href="/documents">מסמכים</Link>
              </Button>
              <Button variant="outline" size="sm" className="col-span-2 sm:col-span-1 justify-between sm:h-11 sm:px-5 sm:text-sm" onClick={() => void loadAccount()}>
                רענן נתונים
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>



      <section className="space-y-3 sm:space-y-4 md:block">
        <SectionHeader
          title="תשלומים"
          subtitle="לתשלומים, קבלות, כרטסת ושיטות תשלום עברו למסכים ייעודיים בלי גלילה מיותרת."
          meta={summary?.currentBalance ? `יתרה פתוחה ${formatCurrency(summary.currentBalance)}` : 'ללא יתרה פתוחה'}
          actions={
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/payments/resident">למסך התשלומים</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/resident/payment-methods">לשיטות תשלום</Link>
              </Button>
            </div>
          }
        />
      </section>

      <section id="tickets-section" className="space-y-3 sm:space-y-4">
        <SectionHeader
          title="קריאות שירות"
          subtitle="סטטוס, שלבי טיפול והיסטוריה."
          meta={`${openTickets.length} פתוחות`}
        />

        {!context.tickets.length ? (
          <Card variant="elevated">
            <CardContent className="py-10">
              <EmptyState
                type="action"
                title="אין כרגע קריאות שירות"
                description="אם מתעוררת תקלה, אפשר לפתוח קריאה חדשה ולצרף תמונה כבר מהטלפון."
                action={{ label: 'פתח קריאה חדשה', onClick: () => router.push('/create-call') }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {context.tickets.map((ticket) => {
              const isExpanded = Boolean(expandedTickets[ticket.id]);
              const timeline = getTicketTimeline(ticket);
              const visibleTimeline = isExpanded ? timeline : timeline.slice(0, 3);

              return (
                <Card key={ticket.id} variant="elevated">
                  <CardContent className="space-y-6 p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge label={getStatusLabel(ticket.status, 'he')} tone={getTicketStatusTone(ticket.status)} />
                          <Badge variant="outline">קריאה #{ticket.id}</Badge>
                          {ticket.severity ? <Badge variant={ticket.severity === 'URGENT' ? 'warning' : 'outline'}>{getPriorityLabel(ticket.severity)}</Badge> : null}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{ticket.unit.building.name} · דירה {ticket.unit.number}</div>
                          <div className="mt-1 text-sm leading-6 text-muted-foreground">
                            נפתחה ב-{formatDate(ticket.createdAt, locale)}{ticket.description ? ` · ${ticket.description}` : ''}
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/tickets/${ticket.id}`}>פתח פרטי קריאה</Link>
                      </Button>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">שלבי טיפול</div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                        {ticketProgress.map((step, index) => {
                          const isActive = index <= getTicketProgressIndex(ticket.status);
                          return (
                            <div
                              key={`${ticket.id}-${step}`}
                              className={`rounded-xl sm:rounded-[18px] border px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm ${
                                isActive ? 'border-primary/25 bg-primary/10 text-foreground' : 'border-subtle-border bg-muted/20 text-muted-foreground'
                              }`}
                            >
                              <div className="text-[10px] sm:text-xs uppercase tracking-[0.16em] text-tertiary">שלב {index + 1}</div>
                              <div className="mt-0.5 sm:mt-1 font-semibold">{getStatusLabel(step, 'he')}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-tertiary">היסטוריית טיפול</div>
                      {visibleTimeline.map((event) => (
                        <div key={event.id} className="flex flex-col gap-3 rounded-[20px] border border-subtle-border bg-muted/20 px-4 py-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1.5">
                            <StatusBadge label={event.title} tone={event.tone} />
                            <div className="text-sm leading-6 text-muted-foreground">{event.description}</div>
                          </div>
                          <div className="text-sm font-medium text-foreground">{formatDate(event.createdAt, locale)}</div>
                        </div>
                      ))}

                      {timeline.length > 3 ? (
                        <Button
                          variant="ghost"
                          className="w-full justify-between rounded-[20px] border border-dashed border-subtle-border bg-background"
                          onClick={() => setExpandedTickets((current) => ({ ...current, [ticket.id]: !current[ticket.id] }))}
                        >
                          {isExpanded ? 'הצג פחות עדכונים' : `הצג עוד ${timeline.length - 3} עדכונים`}
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-4">
          <SectionHeader
            title="מסמכים ופרסומים"
            subtitle="מה חדש בבניין, אילו מסמכים פורסמו, ומה כבר זמין להורדה."
            meta={`${context.documents.length} מסמכים`}
          />

          <Card variant="elevated">
            <CardContent className="space-y-3 p-6">
              {context.documents.length ? (
                context.documents.slice(0, 6).map((document) => (
                  <a key={document.id} href={document.url} target="_blank" rel="noreferrer" className="block rounded-[20px] border border-subtle-border bg-background px-4 py-4 transition hover:border-primary/30 hover:bg-muted/20">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-foreground">{document.name}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {document.category || 'מסמך'} · {formatDate(document.uploadedAt, locale)}
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-primary" />
                    </div>
                  </a>
                ))
              ) : (
                <EmptyState
                  type="empty"
                  size="sm"
                  title="עדיין אין מסמכים זמינים"
                  description="כשהוועד או ההנהלה יפרסמו פרוטוקול, תקנון או החלטה חדשה, הם יופיעו כאן."
                />
              )}
            </CardContent>
          </Card>

          {publishedDocuments.length ? (
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  פרסומי ועד והנהלה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {publishedDocuments.slice(0, 4).map((document) => (
                  <a key={document.id} href={document.url} target="_blank" rel="noreferrer" className="block rounded-[20px] border border-subtle-border bg-background px-4 py-4 transition hover:border-primary/30 hover:bg-muted/20">
                    <div className="font-semibold text-foreground">{document.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{formatDate(document.uploadedAt, locale)}</div>
                  </a>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="התראות ופעילות"
            subtitle="הודעות שלא נקראו, עדכוני ועד, ותנועות אחרונות בחשבון ובבניין."
            meta={`${unreadNotifications.length} לא נקראו`}
          />

          <Card variant="elevated">
            <CardContent className="space-y-3 p-6">
              {context.notifications.length ? (
                context.notifications.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-[20px] border border-subtle-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-foreground">{item.title}</div>
                        <div className="mt-1 text-sm leading-6 text-muted-foreground">{item.message}</div>
                        <div className="mt-2 text-xs text-tertiary">{formatDate(item.createdAt, locale)}</div>
                      </div>
                      {!item.read ? <Badge variant="warning">חדש</Badge> : <Badge variant="outline">נקרא</Badge>}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  type="empty"
                  size="sm"
                  title="אין כרגע התראות חדשות"
                  description="כשתישלח הודעה חשובה מהוועד או תיווצר התראה חדשה, תוכל לראות אותה כאן מיד."
                />
              )}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                פעילות אחרונה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(finance?.communications || []).slice(0, 2).map((item) => (
                <div key={item.id} className="rounded-[20px] border border-subtle-border bg-background p-4">
                  <div className="font-semibold text-foreground">{item.subject || 'הודעה'}</div>
                  <div className="mt-1 text-sm leading-6 text-muted-foreground">{item.message}</div>
                  <div className="mt-2 text-xs text-tertiary">{formatDate(item.createdAt, locale)}</div>
                </div>
              ))}
              {context.recentActivity.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-[20px] border border-subtle-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm leading-6 text-foreground">{item.summary}</div>
                    <StatusBadge
                      label={item.severity === 'CRITICAL' ? 'קריטי' : item.severity === 'WARNING' ? 'אזהרה' : 'מידע'}
                      tone={item.severity === 'CRITICAL' ? 'danger' : item.severity === 'WARNING' ? 'warning' : 'neutral'}
                    />
                  </div>
                  <div className="mt-2 text-xs text-tertiary">{formatDate(item.createdAt, locale)}</div>
                </div>
              ))}
              {!finance?.communications?.length && !context.recentActivity.length ? (
                <EmptyState
                  type="empty"
                  size="sm"
                  title="עדיין אין פעילות להצגה"
                  description="כשתהיה תנועה חדשה בחשבון, הודעת ועד או עדכון טיפול, היא תופיע כאן."
                />
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>



      <section className="space-y-3 sm:space-y-4">
        <SectionHeader
          title="הבניין שלי"
          subtitle="פרטי הבניין עברו למסך ממוקד עם אנשי קשר, הנחיות ומתקנים."
          meta={primaryBuilding?.name || 'פרטי בניין'}
        />

        <Card variant="elevated">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="font-semibold text-foreground">{primaryBuilding?.name || 'הבניין הראשי שלך'}</div>
              <div className="text-sm leading-6 text-muted-foreground">
                למסך הבניין הייעודי עברו אנשי הקשר, הנחיות החירום ופעולות השירות המהירות.
              </div>
            </div>
            <Button asChild>
              <Link href="/resident/building">פתח את מסך הבניין</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}

function ResidentStatusCard({ label, value, description }: { label: string; value: string | number; description: string }) {
  return (
    <div className="rounded-[24px] border border-subtle-border bg-card/96 p-4 shadow-card">
      <div className="text-[10px] uppercase tracking-[0.2em] text-tertiary">{label}</div>
      <div className="mt-2 text-xl font-black text-foreground sm:text-2xl">{value}</div>
      <div className="mt-1 text-sm leading-6 text-muted-foreground">{description}</div>
    </div>
  );
}

type ResidentShortcutItem = {
  id: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
};

function ResidentShortcutTile({ item }: { item: ResidentShortcutItem }) {
  const Icon = item.icon;
  const className =
    'group flex min-h-[154px] flex-col rounded-[30px] border border-subtle-border bg-card/96 p-4 text-start shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/26 hover:shadow-raised active:translate-y-0';

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-primary/14 bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.96),rgba(255,255,255,0.72)_42%,rgba(212,168,8,0.18)_43%,rgba(212,168,8,0.1)_100%)] text-primary shadow-[0_12px_28px_rgba(18,24,38,0.08),inset_0_1px_0_rgba(255,255,255,0.85)]">
          <Icon className="h-7 w-7" />
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
      <div className="mt-auto pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">
        פתח
      </div>
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={item.onClick} className={cn(className, !item.onClick && 'pointer-events-none')}>
      {content}
    </button>
  );
}
