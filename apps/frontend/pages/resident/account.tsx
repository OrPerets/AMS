import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Bell, Building2, ClipboardList, CreditCard, FileText, MessageCircle, Ticket } from 'lucide-react';
import { authFetch, getCurrentUserId, getEffectiveRole } from '../../lib/auth';
import { useLocale } from '../../lib/providers';
import { formatCurrency, formatDate, getStatusLabel, getTicketStatusTone } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { MobileActionHub } from '../../components/ui/mobile-action-hub';
import { MobilePriorityInbox, type MobilePriorityInboxItem } from '../../components/ui/mobile-priority-inbox';
import { AmsDisclosure } from '../../components/ui/ams-disclosure';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { PrimaryActionCard } from '../../components/ui/primary-action-card';
import { getResumeState, setResumeState } from '../../lib/engagement';
import { trackResumeClick } from '../../lib/analytics';

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
  const newestDocument = recentDocuments[0] ?? null;
  const newestNotification = unreadNotifications[0] ?? null;
  const labels = locale === 'en'
    ? {
        home: 'My account',
        activeNow: 'Needs attention now',
        activeNowSubtitle: 'The next item to pay, track, or open.',
        actions: 'Quick actions',
        recentDocs: 'Recent documents',
        allDocs: 'All documents',
        noUrgent: 'Nothing urgent right now',
        noUrgentDesc: 'When a charge, request, or new update appears, it will show here first.',
        docsEmpty: 'No recent documents',
        docsEmptyDesc: 'New committee files and updates will appear here.',
        updatesReady: '{{count}} new updates are waiting',
        updatesClear: 'You are up to date',
      }
    : {
        home: 'האזור האישי',
        activeNow: 'פעיל עכשיו',
        activeNowSubtitle: 'הפריט הבא שכדאי לשלם, לעקוב אחריו או לפתוח.',
        actions: 'פעולות מהירות',
        recentDocs: 'מסמכים אחרונים',
        allDocs: 'לכל המסמכים',
        noUrgent: 'אין משהו דחוף כרגע',
        noUrgentDesc: 'כשתיפתח קריאה, יופיע חיוב או ייכנס עדכון חדש, נראה אותו כאן.',
        docsEmpty: 'אין מסמכים חדשים',
        docsEmptyDesc: 'כשהצוות יעלה מסמך חדש, הוא יופיע כאן.',
        updatesReady: '{{count}} עדכונים חדשים מחכים לך',
        updatesClear: 'כל העדכונים האחרונים נקראו',
      };
  const nextPaymentDue = useMemo(
    () =>
      [...(finance?.invoices ?? [])]
        .filter((invoice) => payableStatuses.has(invoice.status))
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0],
    [finance?.invoices],
  );

  const residentPrimaryAction = (() => {
    if (nextPaymentDue) {
      return {
        eyebrow: nextPaymentDue.status === 'OVERDUE' ? 'לתשלום מיידי' : 'חיוב קרוב',
        title: formatCurrency(nextPaymentDue.amount, 'ILS', locale),
        description: `${nextPaymentDue.description} · עד ${formatDate(nextPaymentDue.dueDate, locale)}`,
        ctaLabel: 'שלם עכשיו',
        href: '/payments/resident',
        tone: nextPaymentDue.status === 'OVERDUE' ? ('danger' as const) : ('warning' as const),
      };
    }

    if (openTickets[0]) {
      return {
        eyebrow: 'מעקב קריאה',
        title: `קריאה #${openTickets[0].id}`,
        description: openTickets[0].description?.trim() || `${openTickets[0].unit.building.name} · דירה ${openTickets[0].unit.number}`,
        ctaLabel: 'עקוב אחרי הקריאה',
        href: '/resident/requests?view=history',
        tone: getTicketStatusTone(openTickets[0].status) === 'danger' ? ('danger' as const) : ('default' as const),
      };
    }

    if (newestDocument) {
      return {
        eyebrow: 'מסמך חדש',
        title: newestDocument.name,
        description: `עלה ב-${formatDate(newestDocument.uploadedAt, locale)} ונמצא במסמכים שלך.`,
        ctaLabel: 'פתח מסמכים',
        href: '/documents',
        tone: 'default' as const,
      };
    }

    if (newestNotification) {
      return {
        eyebrow: 'עדכון חדש',
        title: newestNotification.title,
        description: newestNotification.message,
        ctaLabel: 'פתח עדכונים',
        href: '/notifications',
        tone: 'default' as const,
      };
    }

    return {
      eyebrow: 'הכול בשליטה',
      title: 'אין משהו דחוף כרגע',
      description: 'אפשר לפתוח בקשה חדשה, לדווח על תקלה או לבדוק מסמכים ועדכונים אחרונים.',
      ctaLabel: 'בקשה חדשה',
      href: '/resident/requests?view=new',
      tone: 'success' as const,
    };
  })();

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
      priority: 'primary' as const,
    },
    {
      id: 'request',
      label: 'בקשה חדשה',
      description: 'פנייה מהירה',
      href: '/resident/requests?view=new',
      icon: ClipboardList,
      accent: 'primary' as const,
      emphasize: !nextPaymentDue,
      priority: 'secondary' as const,
    },
    {
      id: 'call',
      label: openTickets.length ? 'מעקב קריאות' : 'קריאה / תקלה',
      description: openTickets.length ? 'בדוק סטטוס קיים' : 'דיווח עם צילום',
      href: openTickets.length ? '/resident/requests?view=history' : '/create-call',
      icon: Ticket,
      badge: openTickets.length || undefined,
      accent: openTickets.length ? ('warning' as const) : ('neutral' as const),
      priority: 'secondary' as const,
    },
    {
      id: 'documents',
      label: 'מסמכים',
      description: 'קבצים ועדכונים',
      href: '/documents',
      icon: FileText,
      badge: recentDocuments.length || undefined,
      accent: 'info' as const,
      priority: 'utility' as const,
    },
    {
      id: 'contact',
      label: primaryBuilding ? 'הבניין שלי' : 'צור קשר',
      description: primaryBuilding?.name || 'תמיכה וניהול',
      href: primaryBuilding ? '/resident/building' : '/support',
      icon: primaryBuilding ? Building2 : MessageCircle,
      accent: 'neutral' as const,
      priority: 'utility' as const,
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

  const userId = getCurrentUserId();
  const role = getEffectiveRole();
  const resumeState = useMemo(() => getResumeState('resident', userId, role), [userId, role]);
  const showResume = resumeState && resumeState.href !== '/resident/account' && resumeState.href !== router.asPath;
  const unreadNotificationsSummary = unreadNotifications.length
    ? `${unreadNotifications.length} עדכונים חדשים`
    : 'הכול נקרא';

  useEffect(() => {
    if (!loading && context) {
      setResumeState({ screen: 'resident', href: '/resident/account', label: 'האזור האישי', role: role || 'RESIDENT', userId });
    }
  }, [loading, context, role, userId]);

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
    <div dir="rtl" className="space-y-3 text-right sm:space-y-6">
      {showResume ? (
        <Card variant="muted" className="rounded-2xl border-primary/15 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">המשך מאיפה שעצרת</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{resumeState.label}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              onClick={() => trackResumeClick('resident', resumeState.href)}
            >
              <Link href={resumeState.href}>
                המשך
                <ArrowLeft className="ms-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <CompactStatusStrip
        roleLabel={primaryBuilding ? `${primaryBuilding.name} · דירה ${primaryUnit?.number}` : labels.home}
        icon={<Building2 className="h-4 w-4" strokeWidth={1.75} />}
        tone="resident"
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

      {/* <PrimaryActionCard
        eyebrow={`${residentName} · ${residentPrimaryAction.eyebrow}`}
        title={residentPrimaryAction.title}
        description={residentPrimaryAction.description}
        ctaLabel={residentPrimaryAction.ctaLabel}
        href={residentPrimaryAction.href}
        tone={residentPrimaryAction.tone}
        visualStyle="resident"
        className="border-s-[5px] shadow-[0_24px_58px_rgba(84,58,15,0.16)]"
        
      /> */}

      <MobileActionHub
        mobileHomeEffect
        title={labels.actions}
        subtitle=""
        items={actionItems}
        layout="hierarchy"
      />

      <MobilePriorityInbox
        title={labels.activeNow}
        subtitle={labels.activeNowSubtitle}
        items={activeItems.slice(0, 2)}
        emptyTitle={labels.noUrgent}
        emptyDescription={labels.noUrgentDesc}
      />

      <AmsDisclosure
        items={[
          {
            key: 'documents',
            title: labels.recentDocs,
            subtitle: recentDocuments.length ? `${recentDocuments.length} מסמכים זמינים` : labels.docsEmpty,
            startContent: <FileText className="h-4 w-4 text-primary" strokeWidth={1.75} />,
            content: recentDocuments.length ? (
              <div className="space-y-2">
                {recentDocuments.map((document) => (
                  <Link
                    key={document.id}
                    href="/documents"
                    className="flex items-center justify-between rounded-2xl border border-subtle-border bg-background/88 px-3 py-2.5 transition hover:border-primary/20"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{document.name}</div>
                      <div className="text-xs text-secondary-foreground">{formatDate(document.uploadedAt, locale)}</div>
                    </div>
                    <span className="text-xs font-semibold text-primary">{labels.allDocs}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState type="empty" size="sm" title={labels.docsEmpty} description={labels.docsEmptyDesc} />
            ),
          },
          {
            key: 'updates',
            title: 'עדכונים',
            subtitle: unreadNotificationsSummary,
            startContent: <Bell className="h-4 w-4 text-primary" strokeWidth={1.75} />,
            content: (
              <div className="space-y-3">
                <div className="rounded-2xl border border-subtle-border bg-background/88 p-3">
                  <div className="text-sm font-semibold text-foreground">
                    {newestNotification?.title || (unreadNotifications.length ? labels.updatesReady.replace('{{count}}', String(unreadNotifications.length)) : labels.updatesClear)}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-secondary-foreground">
                    {newestNotification?.message || 'כל ההתראות, האישורים והעדכונים האחרונים מרוכזים במסך אחד.'}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-full px-4" asChild>
                  <Link href="/notifications">פתח עדכונים</Link>
                </Button>
              </div>
            ),
          },
          {
            key: 'building',
            title: primaryBuilding ? 'הבניין שלי' : 'קשר ומידע',
            subtitle: primaryBuilding?.name || 'תמיכה וניהול',
            startContent: <Building2 className="h-4 w-4 text-primary" strokeWidth={1.75} />,
            content: primaryBuilding ? (
              <div className="space-y-2">
                <Link href="/resident/building" className="block rounded-2xl border border-subtle-border bg-background/88 p-3 transition hover:border-primary/20">
                  <div className="text-sm font-semibold text-foreground">{primaryBuilding.name}</div>
                  <div className="mt-1 text-xs leading-5 text-secondary-foreground">{primaryBuilding.address}</div>
                </Link>
                <Link href="/support" className="block rounded-2xl border border-subtle-border bg-background/88 p-3 transition hover:border-primary/20">
                  <div className="text-sm font-semibold text-foreground">תמיכה וניהול</div>
                  <div className="mt-1 text-xs leading-5 text-secondary-foreground">
                    {newestNotification?.title || 'שאלות, עדכונים ופנייה לצוות הניהול.'}
                  </div>
                </Link>
              </div>
            ) : (
              <EmptyState type="action" size="sm" title="אין מידע משלים" description="כשהבניין או פרטי התמיכה ייטענו, נראה אותם כאן." action={{ label: 'רענן', onClick: () => void loadAccount() }} />
            ),
          },
        ]}
      />
    </div>
  );
}
