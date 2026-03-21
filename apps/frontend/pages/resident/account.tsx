import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Download,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { authFetch, downloadAuthenticatedFile, openAuthenticatedFile } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { MobileActionBar } from '../../components/ui/mobile-action-bar';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { PageHero } from '../../components/ui/page-hero';
import { SectionHeader } from '../../components/ui/section-header';
import { Switch } from '../../components/ui/switch';
import { StatusBadge } from '../../components/ui/status-badge';
import { toast } from '../../components/ui/use-toast';
import { formatCurrency, formatDate, getPriorityLabel, getStatusLabel, getTicketStatusTone, getUserRoleLabel, humanizeEnum } from '../../lib/utils';
import { useLocale } from '../../lib/providers';
import { websocketService } from '../../lib/websocket';
import { triggerHaptic } from '../../lib/mobile';

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

function translateInvoiceStatus(status: string) {
  const labels: Record<string, string> = {
    PAID: 'שולם',
    OVERDUE: 'בפיגור',
    UNPAID: 'טרם שולם',
    PENDING: 'ממתין לתשלום',
  };
  return labels[status] || humanizeEnum(status);
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
  return labels[status] || humanizeEnum(status);
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
    stripe: 'סטרייפ',
  };
  if (!value) return 'כרטיס שמור';
  return labels[value.toLowerCase()] || value;
}

function translateLedgerType(type: string) {
  const labels: Record<string, string> = {
    INVOICE: 'חשבונית',
    PAYMENT: 'תשלום',
    REFUND: 'זיכוי',
    CREDIT: 'זיכוי',
    DEBIT: 'חיוב',
    LATE_FEE: 'עמלת פיגור',
    ADJUSTMENT: 'התאמה',
  };

  return labels[type?.toUpperCase()] || humanizeEnum(type);
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
    description: 'לא ניתן היה להשלים את התשלום. אפשר לנסות שוב ישירות מהחשבונית.',
    variant: 'destructive' as const,
  };
}

function csvEscape(value: string | number | null | undefined) {
  const normalized = String(value ?? '');
  if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function downloadCsv(filename: string, rows: Array<Array<string | number | null | undefined>>) {
  if (typeof window === 'undefined') return;
  const content = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function scrollToSection(id: string) {
  if (typeof document === 'undefined') return;
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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

function getBuildingGuidance(notes?: string | null) {
  if (!notes?.trim()) {
    return [
      'במקרה חירום מחוץ לשעות הפעילות מומלץ ליצור קשר עם נציג הבניין או לפתוח קריאה דחופה.',
      'מסמכי ועד, פרוטוקולים ועדכונים שוטפים זמינים באזור המסמכים.',
    ];
  }

  return notes
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

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

    const rawIntentId = router.query.intentId || router.query.paymentIntentId || router.query.payment_intent || router.query.paymentId;
    if (!rawIntentId) return;

    const intentId = Number(Array.isArray(rawIntentId) ? rawIntentId[0] : rawIntentId);
    if (!Number.isFinite(intentId)) return;

    void refreshIntentStatus(intentId, true);
  }, [router.isReady, router.query.intentId, router.query.paymentIntentId, router.query.payment_intent, router.query.paymentId]);

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
      if (banner.variant === 'success') {
        triggerHaptic('success');
      }

      if (fromCallback && payment.invoiceId) {
        await loadAccount();
      }
    } catch (nextError) {
      console.error(nextError);
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
          description: 'כרגע התשלום המוטמע עדיין לא זמין. נסו שוב או השלימו בתשלום המאובטח.',
        });
      }

      if (Number.isFinite(intentId)) {
        await refreshIntentStatus(intentId);
      }
    } catch (nextError) {
      console.error(nextError);
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
      } else {
        setPaymentMethods([]);
      }

      const autopayRes = await authFetch('/api/v1/payments/autopay');
      if (autopayRes.ok) {
        const prefs = await autopayRes.json();
        setAutopayEnabled(Boolean(prefs.autopayEnabled));
      }
    } catch (nextError) {
      console.error(nextError);
    }
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
    triggerHaptic('success');
    toast({
      title: enabled ? 'חיוב אוטומטי הופעל' : 'חיוב אוטומטי הושהה',
      description: enabled ? 'חשבוניות עתידיות יחויבו דרך הכרטיס הראשי השמור שלך.' : 'תשלומים יישארו ידניים עד להפעלה מחדש.',
    });
  }

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
        const financeResponse = await authFetch(`/api/v1/invoices/account/${nextContext.residentId}`);
        if (!financeResponse.ok) {
          throw new Error(await financeResponse.text());
        }
        setFinance(await financeResponse.json());
        await loadPaymentSettings();
      } else {
        setFinance(null);
      }
    } catch (nextError) {
      console.error(nextError);
      setError('לא ניתן לטעון כעת את האזור האישי. נסו שוב בעוד רגע או פנו לתמיכה אם הבעיה נמשכת.');
      toast({ title: 'טעינת האזור האישי נכשלה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function exportAnnualStatement(year: number) {
    if (!finance) return;
    const rows: Array<Array<string | number | null | undefined>> = [
      ['קטגוריה', 'תאריך', 'פרטים', 'סכום', 'סטטוס'],
      ...finance.invoices
        .filter((invoice) => new Date(invoice.issueDate || invoice.dueDate).getFullYear() === year)
        .map((invoice) => ['חשבונית', invoice.issueDate || invoice.dueDate, invoice.description, invoice.amount, translateInvoiceStatus(invoice.status)]),
      ...finance.ledger
        .filter((entry) => new Date(entry.createdAt).getFullYear() === year)
        .map((entry) => ['תנועת חשבון', entry.createdAt, entry.summary, entry.amount, translateLedgerType(entry.type)]),
    ];

    if (rows.length === 1) {
      toast({ title: 'לא נמצאו תנועות לשנה שנבחרה', variant: 'destructive' });
      return;
    }

    downloadCsv(`resident-statement-${year}.csv`, rows);
    toast({ title: 'הדוח השנתי הוכן להורדה', description: `נוצר קובץ CSV עבור שנת ${year}.` });
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
  const buildingGuidance = getBuildingGuidance(primaryBuilding?.notes);
  const recentUpdatesCount = context.documents.slice(0, 4).length + context.recentActivity.slice(0, 4).length;
  const currentYear = new Date().getFullYear();
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

  return (
    <div className="space-y-5 sm:space-y-8 pb-28 lg:pb-0">
      <PageHero
        className="resident-landing-hero"
        kicker="שירות עצמי לדייר"
        eyebrow={<StatusBadge label="האזור האישי" tone="finance" />}
        title="האזור האישי של הדייר"
        description={`שלום ${accountDisplayName}, ריכזנו במקום אחד את מה שצריך לדעת עכשיו: תשלום קרוב, פניות פתוחות, מסמכים חדשים ופרטי הבניין.`}
        actions={
          <>
            <Button variant="hero" asChild>
              <Link href="/create-call">פתח קריאת שירות</Link>
            </Button>
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" asChild>
              <Link href="/resident/requests">בקשות דייר</Link>
            </Button>
            {context.residentId ? (
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() => downloadAuthenticatedFile(`/api/v1/invoices/ledger?residentId=${context.residentId}&format=csv`, 'resident-ledger.csv')}
              >
                ייצוא דוח יתרה
              </Button>
            ) : null}
          </>
        }
        aside={
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            <SummaryCard label="פניות פתוחות" value={openTickets.length} description="קריאות שירות שממתינות לעדכון" />
            <SummaryCard
              label="תשלום קרוב"
              value={nextPaymentDue ? formatCurrency(nextPaymentDue.amount) : 'מעודכן'}
              description={nextPaymentDue ? formatDate(nextPaymentDue.dueDate, locale) : 'אין חיוב קרוב'}
            />
            <SummaryCard label="התראות שלא נקראו" value={unreadNotifications.length} description="הודעות ועד ועדכוני מערכת" />
            <SummaryCard label="מסמכים ופעילות" value={recentUpdatesCount} description="מסמכים חדשים ועדכונים אחרונים" />
          </div>
        }
      />

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card variant="featured">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              מה חשוב עכשיו
            </CardTitle>
            <CardDescription>הבדלה ברורה בין מה שדחוף, מה רק לידיעה, ומה כבר מאחוריך.</CardDescription>
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
              סיכום אישי
            </CardTitle>
            <CardDescription>פרטים אישיים, יחידות משויכות ופעולות מהירות שממשיכות איתך גם במובייל.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-5">
            <div className="grid gap-2.5 sm:gap-4 md:grid-cols-2">
              <div className="rounded-xl sm:rounded-[20px] border border-subtle-border bg-muted/30 p-3 sm:p-4">
                <div className="text-xs sm:text-sm font-semibold text-foreground">{context.user.email}</div>
                <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Badge variant="finance">{getUserRoleLabel(context.user.role)}</Badge>
                  {context.user.phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {context.user.phone}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="rounded-xl sm:rounded-[20px] border border-subtle-border bg-muted/30 p-3 sm:p-4">
                <div className="text-xs sm:text-sm font-semibold text-foreground">דירות ובניינים</div>
                <div className="mt-1.5 sm:mt-2 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                  {context.units.map((unit) => (
                    <div key={unit.id}>
                      {unit.building.name} · דירה {unit.number}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              <Button variant="outline" size="sm" className="justify-between sm:h-11 sm:px-5 sm:text-sm" asChild>
                <Link href="/settings">העדפות</Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-between sm:h-11 sm:px-5 sm:text-sm" asChild>
                <Link href="/resident/requests">בקשות דייר</Link>
              </Button>
              <Button variant="outline" size="sm" className="col-span-2 sm:col-span-1 justify-between sm:h-11 sm:px-5 sm:text-sm" onClick={() => void loadAccount()}>
                רענן נתונים
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <section id="payments-section" className="space-y-3 sm:space-y-4">
        <SectionHeader
          title="תשלומים"
          subtitle="מה לתשלום, מה שולם, ואיך נראית ההיסטוריה בלי מונחים טכניים מיותרים."
          meta={summary?.currentBalance ? `יתרה פתוחה ${formatCurrency(summary.currentBalance)}` : 'ללא יתרה פתוחה'}
          actions={
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => exportAnnualStatement(currentYear)}>
                <Download className="me-2 h-4 w-4" />
                דוח שנתי {currentYear}
              </Button>
              {context.residentId ? (
                <Button variant="outline" onClick={() => downloadAuthenticatedFile(`/api/v1/invoices/ledger?residentId=${context.residentId}&format=csv`, 'resident-ledger.csv')}>
                  ייצוא כרטסת מלאה
                </Button>
              ) : null}
            </div>
          }
        />

        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                חיוב אוטומטי ואמצעי תשלום
              </CardTitle>
              <CardDescription>הסבר ברור על איך הכרטיס נשמר ומתי המערכת תחייב אוטומטית.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentBanner ? (
                <div
                  className={`rounded-[22px] border p-4 text-sm ${
                    paymentBanner.variant === 'success'
                      ? 'border-success/25 bg-success/10'
                      : paymentBanner.variant === 'destructive'
                        ? 'border-destructive/25 bg-destructive/10'
                        : 'border-warning/25 bg-warning/10'
                  }`}
                >
                  <div className="font-semibold text-foreground">{paymentBanner.title}</div>
                  <div className="mt-1 leading-6 text-muted-foreground">{paymentBanner.description}</div>
                </div>
              ) : null}

              <div className="rounded-[22px] border border-subtle-border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-semibold text-foreground">חיוב אוטומטי</div>
                    <div className="text-sm leading-6 text-muted-foreground">
                      כשהאפשרות פעילה, חשבוניות עתידיות יחויבו דרך הכרטיס הראשי שנשמר אצל ספק הסליקה.
                    </div>
                    <div className="text-xs text-tertiary">אפשר להשהות בכל רגע. פרטי הכרטיס המלאים אינם נשמרים במסך הזה.</div>
                  </div>
                  <Switch checked={autopayEnabled} onCheckedChange={(checked) => void toggleAutopay(checked)} aria-label="הפעלת חיוב אוטומטי" />
                </div>
              </div>

              <div className="space-y-3">
                {paymentMethods.length ? (
                  paymentMethods.map((method) => (
                    <div key={method.id} className="rounded-[22px] border border-subtle-border bg-background p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">
                            {translateCardBrand(method.brand || method.provider)} •••• {method.last4 || '••••'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            תוקף {method.expMonth || '--'}/{method.expYear || '--'}{method.networkTokenized ? ' · נשמר בצורה מאובטחת' : ''}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {method.isDefault ? (
                            <Badge variant="success">כרטיס ראשי</Badge>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => void setDefaultCard(method.id)}>
                              קבע כברירת מחדל
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => void removeCard(method.id)}>
                            הסר
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    type="action"
                    size="sm"
                    title="עדיין אין כרטיס שמור"
                    description="כדי להפעיל חיוב אוטומטי בצורה מאובטחת נדרש קודם להוסיף אמצעי תשלום דרך הטופס המאובטח של צוות הגבייה."
                    action={{ label: 'פתח פנייה לצוות', onClick: () => router.push('/support'), variant: 'outline' }}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                היסטוריית חשבוניות ותשלומים
              </CardTitle>
              <CardDescription>סטטוסים ותאריכים ברורים לכל תשלום, כולל גישה מהירה לקבלות.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!finance?.invoices?.length ? (
                <EmptyState
                  type="empty"
                  size="sm"
                  title="אין כרגע חשבוניות להצגה"
                  description="כאשר תופיע דרישת תשלום חדשה או קבלה, היא תופיע כאן עם סטטוס ברור וציר זמן."
                />
              ) : null}

              {(finance?.invoices || []).map((invoice) => (
                <div key={invoice.id} className="rounded-[22px] border border-subtle-border bg-background p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={translateInvoiceStatus(invoice.status)} tone={getTicketStatusTone(invoice.status)} />
                        <Badge variant="outline">חשבונית #{invoice.id}</Badge>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{invoice.description}</div>
                        <div className="mt-1 text-sm leading-6 text-muted-foreground">
                          הופקה {formatDate(invoice.issueDate || invoice.dueDate, locale)} · לפירעון {formatDate(invoice.dueDate, locale)}
                        </div>
                      </div>
                      {invoice.history?.length ? (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-tertiary">מה קרה בתשלום הזה</div>
                          {invoice.history.slice(0, 3).map((entry) => (
                            <div key={`${invoice.id}-${entry.kind}-${entry.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-subtle-border/70 bg-muted/20 px-3 py-2 text-sm">
                              <div className="text-foreground">
                                {entry.kind === 'PAYMENT'
                                  ? `ניסיון תשלום · ${translateIntentStatus(entry.status)}`
                                  : entry.kind === 'REFUND'
                                    ? 'בוצע זיכוי'
                                    : entry.kind === 'LATE_FEE'
                                      ? 'נוספה עמלת פיגור'
                                      : 'בוצעה התאמה'}
                              </div>
                              <div className="text-muted-foreground">
                                {formatDate(entry.createdAt, locale)} · {formatCurrency(entry.amount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2 sm:space-y-3 lg:w-56 lg:text-end">
                      <div className="text-xl sm:text-2xl font-black text-foreground">{formatCurrency(invoice.amount)}</div>
                      {invoice.receiptNumber ? (
                        <Button size="sm" variant="outline" className="w-full lg:w-auto" onClick={() => openAuthenticatedFile(`/api/v1/invoices/${invoice.id}/receipt`)}>
                          הורד קבלה
                        </Button>
                      ) : null}
                      {paymentAttempts[invoice.id] ? (
                        <div className="rounded-2xl border border-subtle-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                          <div>ניסיון אחרון #{paymentAttempts[invoice.id].intentId}</div>
                          <div>{translateIntentStatus(paymentAttempts[invoice.id].status)}</div>
                          <div>{formatDate(paymentAttempts[invoice.id].attemptedAt, locale)}</div>
                        </div>
                      ) : null}
                      {payableStatuses.has(invoice.status) ? (
                        <Button
                          className="w-full lg:w-auto"
                          onClick={() => void initiatePayment(invoice.id)}
                          disabled={processingInvoiceId === invoice.id}
                        >
                          {processingInvoiceId === invoice.id ? 'מעבד...' : paymentAttempts[invoice.id]?.status === 'FAILED' ? 'נסה שוב' : 'שלם עכשיו'}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3 sm:space-y-4">
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
          subtitle="אנשי קשר, הנחיות חירום ושירותי הבניין."
          meta={primaryBuilding?.name || 'פרטי בניין'}
        />

        <Card variant="elevated">
          <CardContent className="grid gap-6 p-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="rounded-[22px] border border-subtle-border bg-muted/20 p-4">
                <div className="font-semibold text-foreground">{primaryBuilding?.name || 'הבניין הראשי שלך'}</div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">{primaryBuilding?.address || 'כתובת תופיע כאן לאחר שיושלם שיוך ליחידה.'}</div>
                {primaryBuilding ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {primaryBuilding.totalUnits ? <Badge variant="outline">{primaryBuilding.totalUnits} יחידות</Badge> : null}
                    {primaryBuilding.floors ? <Badge variant="outline">{primaryBuilding.floors} קומות</Badge> : null}
                    <Badge variant={primaryBuilding.isActive === false ? 'warning' : 'success'}>{primaryBuilding.isActive === false ? 'לא פעיל' : 'פעיל'}</Badge>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[22px] border border-subtle-border bg-background p-4">
                <div className="text-sm font-semibold text-foreground">אנשי קשר</div>
                <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {primaryBuilding?.managerName || 'מנהל/ת בניין יעודכן בקרוב'}
                  </div>
                  {primaryBuilding?.contactPhone ? (
                    <a href={`tel:${primaryBuilding.contactPhone}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                      <Phone className="h-4 w-4 text-primary" />
                      {primaryBuilding.contactPhone}
                    </a>
                  ) : null}
                  {primaryBuilding?.contactEmail ? (
                    <a href={`mailto:${primaryBuilding.contactEmail}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                      <Mail className="h-4 w-4 text-primary" />
                      {primaryBuilding.contactEmail}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-subtle-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  הנחיות וחירום
                </div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  {buildingGuidance.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-2xl border border-subtle-border/70 bg-muted/20 px-3 py-2">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] border border-subtle-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Wrench className="h-4 w-4 text-primary" />
                  שירותים ומתקנים
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {primaryBuilding?.amenities?.length ? (
                    primaryBuilding.amenities.map((amenity) => (
                      <Badge key={amenity} variant="finance">
                        {amenity}
                      </Badge>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">עדיין לא הוגדרו מתקנים לבניין זה.</div>
                  )}
                </div>
              </div>

              <div className="rounded-[22px] border border-subtle-border bg-background p-4 md:col-span-2">
                <div className="text-sm font-semibold text-foreground">פעולות מהירות לבניין</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Button variant="outline" asChild>
                    <Link href="/documents">כל המסמכים</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/notifications">מרכז ההתראות</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/support">פנייה לתמיכה</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <MobileActionBar
        title={nextPaymentDue ? `לתשלום כעת ${formatCurrency(nextPaymentDue.amount)}` : 'כל החשבוניות מעודכנות'}
        description="פתיחה מהירה של התשלום, קריאת שירות ובקשות דייר בלי לחפש בתוך המסך."
        aside={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/resident/requests">בקשות דייר</Link>
          </Button>
        }
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Button onClick={() => (nextPaymentDue ? void initiatePayment(nextPaymentDue.id) : scrollToSection('payments-section'))} disabled={Boolean(nextPaymentDue && processingInvoiceId === nextPaymentDue.id)}>
            {nextPaymentDue ? 'שלם עכשיו' : 'צפה בתשלומים'}
          </Button>
          <Button variant="outline" onClick={() => void router.push('/create-call')}>
            פתח קריאה
          </Button>
        </div>
      </MobileActionBar>
    </div>
  );
}

function SummaryCard({ label, value, description }: { label: string; value: string | number; description: string }) {
  return (
    <div className="rounded-xl sm:rounded-[20px] border border-white/12 bg-white/7 p-2.5 sm:p-3.5">
      <div className="text-[10px] sm:text-xs tracking-[0.12em] text-white/65">{label}</div>
      <div className="mt-1 text-lg font-black text-white sm:mt-2 sm:text-2xl">{value}</div>
      <div className="mt-0.5 text-[11px] text-white/75 sm:mt-1 sm:text-sm">{description}</div>
    </div>
  );
}
