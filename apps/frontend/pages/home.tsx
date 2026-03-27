import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, Building2, ClipboardList, Sparkles, Ticket } from 'lucide-react';
import { ROLE_SELECTION_ROUTE, authFetch, getAuthSnapshot, getCurrentUserId, getEffectiveRole } from '../lib/auth';
import { getRoleCapabilities } from '../lib/role-capabilities';
import { trackEvent } from '../lib/analytics';
import { setLastModule, addRecentAction } from '../lib/engagement';
import { formatCurrency, formatDate } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { MobileCardSkeleton } from '../components/ui/page-states';
import { toast } from '../components/ui/use-toast';
import type { MobilePriorityInboxItem } from '../components/ui/mobile-priority-inbox';
import { RoleHomeShell, homeIcons, type HomePrimaryAction, type HomeQuickAction, type HomeStatusMetric, type RoleKey } from '../components/home/shared';
import { AdminMobileHome, buildAdminFallback, type AdminMobileHomeData } from '../components/home/AdminMobileHome';
import { AccountantMobileHome, buildAccountantFallback, type AccountantMobileHomeData } from '../components/home/AccountantMobileHome';
import { PmMobileHome, buildPmFallback, type PmMobileHomeData } from '../components/home/PmMobileHome';
import { TechMobileHome, buildTechFallback, type TechMobileHomeData } from '../components/home/TechMobileHome';
import type { DashboardResponse } from '../components/admin/dashboard/types';

type UserNotificationSnapshot = Array<{
  id?: number;
  read?: boolean;
  title?: string;
  createdAt?: string;
}>;

type TicketsSnapshot = {
  summary?: {
    open?: number;
    inProgress?: number;
  };
  meta?: {
    total?: number;
  };
  riskSummary?: {
    atRisk?: number;
    dueToday?: number;
    breached?: number;
  };
  items?: Array<{
    id?: number;
    severity?: 'NORMAL' | 'HIGH' | 'URGENT';
    status?: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
    title?: string;
    buildingName?: string;
    building?: { name?: string };
    unitNumber?: string | number;
    unit?: { number?: string | number };
    createdAt?: string;
    updatedAt?: string;
    category?: string;
  }>;
};

type MaintenanceExceptionsSnapshot = {
  summary?: {
    unverifiedMaintenance?: number;
    openWorkOrders?: number;
  };
};

type OperationsCalendarSnapshot = {
  summary?: {
    total?: number;
  };
  items?: Array<{
    id: string;
    type: 'SCHEDULE' | 'MAINTENANCE' | 'CONTRACT' | 'INVOICE' | 'NOTICE' | 'VOTE' | 'COMPLIANCE';
    date: string;
    title: string;
    description: string;
    buildingName: string;
    priority: string;
    href?: string;
  }>;
};

type WorkOrderSnapshot = Array<{
  id: number;
  ticket: {
    id: number;
    assignedToId?: number;
    severity: 'NORMAL' | 'HIGH' | 'URGENT';
    status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
    title?: string;
    description?: string;
  };
  dueTime?: string;
  assignedAt?: string;
  estimatedDuration?: number;
  location?: {
    building?: string;
    address?: string;
    floor?: number;
  };
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
}>;

type BuildingSnapshot = Array<{
  id: number;
  name: string;
  status?: string;
}>;

type ResidentRequestsSnapshot = Array<{
  requestKey: string;
  subject: string;
  requestType: string;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CLOSED';
  statusNotes?: string | null;
}>;

type InvoiceSummarySnapshot = {
  summary?: {
    currentBalance?: number;
    unpaidInvoices?: number;
    overdueInvoices?: number;
    openTickets?: number;
    unreadNotifications?: number;
    dueDate?: string;
  };
  tickets?: Array<{
    id?: number;
    title?: string;
    status?: string;
    updatedAt?: string;
  }>;
};

type InvoiceRow = {
  id: number;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate: string;
  createdAt: string;
  buildingName?: string | null;
  residentName?: string;
  collectionStatus?: string;
  reminderState?: string;
  promiseToPayDate?: string | null;
};

type CollectionsSummary = {
  totals: {
    invoiceCount: number;
    unpaidCount: number;
    overdueCount: number;
    outstandingBalance: number;
    delinquencyRate: number;
    billedThisMonth: number;
    collectedThisMonth: number;
  };
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
};

type BudgetSnapshot = Array<{
  id: number;
  name: string;
  amount: number;
  actualSpent: number;
  variance: number;
  alertLevel?: 'normal' | 'warning' | 'critical';
}>;

type HomeBlueprintState =
  | { kind: 'ADMIN'; data: AdminMobileHomeData }
  | { kind: 'PM'; data: PmMobileHomeData }
  | { kind: 'TECH'; data: TechMobileHomeData }
  | { kind: 'ACCOUNTANT'; data: AccountantMobileHomeData }
  | { kind: 'RESIDENT'; data: ResidentHomeData };

type ResidentHomeData = {
  statusMetrics: HomeStatusMetric[];
  primaryAction: HomePrimaryAction;
  quickActions: HomeQuickAction[];
  inboxItems: MobilePriorityInboxItem[];
};

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleKey>('RESIDENT');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blueprint, setBlueprint] = useState<HomeBlueprintState | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    setMounted(true);
    setRole((getEffectiveRole() as RoleKey) || 'RESIDENT');
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const authSnapshot = getAuthSnapshot();
    const effectiveRole = (authSnapshot.role as RoleKey | null) || 'RESIDENT';
    setRole(effectiveRole);

    if (!authSnapshot.isAuthenticated) {
      const next = encodeURIComponent(router.asPath || '/home');
      void router.replace(`/login?next=${next}`);
      return;
    }

    const capabilities = getRoleCapabilities(effectiveRole);

    if (capabilities?.role === 'RESIDENT') {
      void router.replace('/resident/account');
      return;
    }

    if (!capabilities?.canAccessAms) {
      void router.replace(ROLE_SELECTION_ROUTE);
      return;
    }

    setLastModule('ams', authSnapshot.userId, effectiveRole);
    addRecentAction({ id: 'home-visit', label: 'דף הבית', href: '/home', screen: 'home', role: effectiveRole }, authSnapshot.userId);
    void loadBlueprint(effectiveRole);
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted || !currentUserId) return;
    const key = `amit-onboarding:v8:${currentUserId}:${role}`;
    const seen = window.localStorage.getItem(key);
    setOnboardingOpen(!seen);
  }, [currentUserId, mounted, role]);

  async function loadBlueprint(activeRole: RoleKey) {
    try {
      setLoading(true);
      setBlueprint(await buildHomeBlueprint(activeRole, currentUserId));
    } catch (error) {
      console.error(error);
      toast({
        title: 'טעינת דף הבית נכשלה',
        description: 'תצורת הגיבוי הופעלה כדי שתוכל להמשיך לעבוד במסלולים הראשיים.',
        variant: 'destructive',
      });
      setBlueprint(buildFallbackBlueprint(activeRole));
    } finally {
      setLoading(false);
    }
  }

  const onboardingSteps = useMemo(() => getOnboardingSteps(role), [role]);

  function completeOnboarding() {
    if (currentUserId && typeof window !== 'undefined') {
      window.localStorage.setItem(`amit-onboarding:v8:${currentUserId}:${role}`, new Date().toISOString());
    }
    setOnboardingOpen(false);
    trackEvent('onboarding_complete', { role });
    toast({
      title: 'מסלול הפתיחה נשמר',
      description: 'המסך הראשי ימשיך לפתוח עבורך את הבלופרינט המתאים לכל תפקיד.',
      variant: 'success',
    });
  }

  if (!mounted || loading || !blueprint) {
    return <MobileCardSkeleton cards={4} />;
  }

  if (role === 'RESIDENT') {
    return <MobileCardSkeleton cards={4} />;
  }

  return (
    <div className="space-y-3 sm:space-y-8">
      {renderBlueprint(blueprint)}

      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent className="mx-3 max-w-lg border-white/10 bg-slate-950/95 text-white shadow-modal backdrop-blur-xl sm:mx-auto sm:max-w-2xl dark-surface">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-white sm:text-lg">
              <Sparkles className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              מסלול פתיחה
            </DialogTitle>
            <DialogDescription className="text-xs text-white/65 sm:text-sm">
              שלושה צעדים קצרים כדי להיכנס ישר לבלופרינט הנכון.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2.5 sm:gap-3">
            {onboardingSteps.map((step, index) => (
              <div key={step.title} className="rounded-xl border border-white/10 bg-white/6 p-3 sm:rounded-[22px] sm:p-4">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-sm font-semibold text-primary sm:h-10 sm:w-10 sm:rounded-2xl sm:text-base">
                    {index + 1}
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="text-sm font-semibold text-white sm:text-base">{step.title}</div>
                    <div className="text-xs leading-5 text-white/65 sm:text-sm sm:leading-7">{step.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-3">
            <Button variant="outline" size="sm" className="border-white/10 bg-white/6 text-white hover:bg-white/12 sm:h-11 sm:px-5 sm:text-sm" onClick={() => setOnboardingOpen(false)}>
              אחר כך
            </Button>
            <Button size="sm" className="sm:h-11 sm:px-5 sm:text-sm" onClick={completeOnboarding}>
              הפעל חוויה מותאמת
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function renderBlueprint(blueprint: HomeBlueprintState) {
  switch (blueprint.kind) {
    case 'ADMIN':
      return <AdminMobileHome data={blueprint.data} />;
    case 'PM':
      return <PmMobileHome data={blueprint.data} />;
    case 'TECH':
      return <TechMobileHome data={blueprint.data} />;
    case 'ACCOUNTANT':
      return <AccountantMobileHome data={blueprint.data} />;
    case 'RESIDENT':
      return <ResidentMobileHome data={blueprint.data} />;
  }
}

function ResidentMobileHome({ data }: { data: ResidentHomeData }) {
  return (
    <RoleHomeShell
      roleLabel="דייר"
      roleKey="RESIDENT"
      statusMetrics={data.statusMetrics}
      primaryAction={data.primaryAction}
      quickActions={data.quickActions}
      inboxTitle="הקריאות שלי"
      inboxSubtitle="מצב החשבון, פתיחת פניות וסטטוס טיפול בלי לצאת מהמסך הראשי."
      inboxItems={data.inboxItems}
      emptyTitle="אין קריאות פתוחות"
      emptyDescription="צריך משהו? אפשר לפתוח קריאת תחזוקה חדשה או לעבור למסמכים."
      emptyAction={{ label: 'פתח קריאה חדשה', href: '/create-call' }}
    />
  );
}

async function buildHomeBlueprint(role: RoleKey, currentUserId: number | null): Promise<HomeBlueprintState> {
  switch (role) {
    case 'ADMIN':
    case 'MASTER':
      return { kind: 'ADMIN', data: await buildAdminHomeData() };
    case 'PM':
      return { kind: 'PM', data: await buildPmHomeData() };
    case 'TECH':
      return { kind: 'TECH', data: await buildTechHomeData(currentUserId) };
    case 'ACCOUNTANT':
      return { kind: 'ACCOUNTANT', data: await buildAccountantHomeData() };
    case 'RESIDENT':
    default:
      return { kind: 'RESIDENT', data: await buildResidentHomeData(currentUserId) };
  }
}

function buildFallbackBlueprint(role: RoleKey): HomeBlueprintState {
  switch (role) {
    case 'ADMIN':
    case 'MASTER':
      return { kind: 'ADMIN', data: buildAdminFallback() };
    case 'PM':
      return { kind: 'PM', data: buildPmFallback() };
    case 'TECH':
      return { kind: 'TECH', data: buildTechFallback() };
    case 'ACCOUNTANT':
      return { kind: 'ACCOUNTANT', data: buildAccountantFallback() };
    case 'RESIDENT':
    default:
      return { kind: 'RESIDENT', data: buildResidentFallback() };
  }
}

async function buildAdminHomeData(): Promise<AdminMobileHomeData> {
  const [dashboard, tickets, exceptions, operations] = await Promise.all([
    fetchRequiredJson<DashboardResponse>('/api/v1/dashboard/overview?range=30d'),
    fetchOptionalJson<TicketsSnapshot>('/api/v1/tickets?view=dispatch&limit=40'),
    fetchOptionalJson<MaintenanceExceptionsSnapshot>('/api/v1/maintenance/exceptions'),
    fetchOptionalJson<OperationsCalendarSnapshot>('/api/v1/operations/calendar'),
  ]);

  const occupancyRate = getOccupancyRate(dashboard.portfolioKpis.occupiedUnits, dashboard.portfolioKpis.vacantUnits);
  const unassignedCount = tickets?.items?.filter((item) => item.status === 'OPEN').length ?? 0;
  const unverifiedMaintenance = exceptions?.summary?.unverifiedMaintenance ?? dashboard.maintenanceSummary.overdue ?? 0;
  const calendarEvents = operations?.summary?.total ?? 0;
  const monthlyLoad = dashboard.ticketTrends.monthlyTrend.slice(-6).map((item) => item.count);
  const controlPulse = [
    dashboard.portfolioKpis.openTickets,
    dashboard.portfolioKpis.urgentTickets,
    dashboard.portfolioKpis.slaBreaches,
    dashboard.systemAdmin.stats.pendingApprovals,
    unverifiedMaintenance,
    calendarEvents,
  ];
  const priorityItems: MobilePriorityInboxItem[] = [
    {
      id: 'sla-breach',
      status: 'חריגת SLA',
      tone: dashboard.portfolioKpis.slaBreaches > 0 ? 'danger' : 'success',
      title: dashboard.attentionItems[0]?.title ?? `${dashboard.portfolioKpis.slaBreaches} חריגות SLA פתוחות`,
      reason: dashboard.attentionItems[0]?.description ?? 'הקריאות שבחריגה דורשות שיוך או הסלמה מיידית.',
      meta: dashboard.attentionItems[0]?.value ?? `${dashboard.portfolioKpis.slaBreaches} חריגות`,
      href: '/tickets',
      ctaLabel: 'טפל',
    },
    {
      id: 'pending-approvals',
      status: 'ממתינה לאישור',
      tone: dashboard.systemAdmin.stats.pendingApprovals > 0 ? 'warning' : 'active',
      title: `${dashboard.systemAdmin.stats.pendingApprovals} אישורים ממתינים`,
      reason: 'בקשות דייר או הצעות מחיר שמחכות להחלטה ניהולית.',
      meta: unassignedCount ? `${unassignedCount} קריאות ממתינות לשיוך` : 'ללא עומס פתוח',
      href: '/communications',
      ctaLabel: 'אשר',
    },
    {
      id: 'maintenance-exceptions',
      status: 'תחזוקה',
      tone: unverifiedMaintenance > 0 ? 'warning' : 'success',
      title: `${unverifiedMaintenance} פעולות לא מאומתות`,
      reason: 'ביצועים שבועיים שטרם נסגרו ועלולים ליצור פער בקרה שקט.',
      meta: `${dashboard.maintenanceSummary.dueToday} לביצוע היום`,
      href: '/maintenance',
      ctaLabel: 'בדוק',
    },
  ];

  return {
    statusMetrics: [
      {
        id: 'tickets',
        label: 'קריאות',
        value: dashboard.portfolioKpis.openTickets,
        tone: dashboard.portfolioKpis.openTickets > 0 ? 'warning' : 'success',
        href: '/tickets',
        trendLabel: `${dashboard.portfolioKpis.resolvedToday} נסגרו היום`,
        sparkline: monthlyLoad,
      },
      {
        id: 'sla',
        label: 'SLA',
        value: dashboard.portfolioKpis.slaBreaches,
        tone: dashboard.portfolioKpis.slaBreaches > 0 ? 'danger' : 'success',
        href: '/admin/dashboard',
        trendLabel: dashboard.portfolioKpis.slaBreaches > 0 ? `${dashboard.systemAdmin.stats.pendingApprovals} אישורים פתוחים` : 'ללא חריגה פתוחה',
        sparkline: controlPulse,
        emphasis: dashboard.portfolioKpis.slaBreaches > 0,
      },
    ],
    primaryAction: {
      eyebrow: 'מוקד בקרה',
      title: dashboard.portfolioKpis.slaBreaches > 0 ? `${dashboard.portfolioKpis.slaBreaches} חריגות SLA פתוחות` : 'שליטה תפעולית מלאה',
      description: dashboard.portfolioKpis.slaBreaches > 0
        ? `${unassignedCount} קריאות עדיין לא שויכו · ${dashboard.systemAdmin.stats.pendingApprovals} אישורים ממתינים להחלטה.`
        : `${unassignedCount} קריאות פתוחות · ${unverifiedMaintenance} חריגות תחזוקה לבדיקה לפני שהעומס עולה.`,
      ctaLabel: dashboard.portfolioKpis.slaBreaches > 0 ? 'פתח מוקד בקרה' : 'בדוק חריגים',
      href: '/tickets',
      tone: dashboard.portfolioKpis.slaBreaches > 0 ? 'danger' : 'warning',
      secondaryAction: { label: 'מערכת ובקרה', href: '/admin/dashboard' },
    },
    pulseMetrics: [
      {
        id: 'sla-pulse',
        label: 'SLA',
        value: dashboard.portfolioKpis.slaBreaches,
        meta: dashboard.portfolioKpis.slaBreaches > 0 ? 'חריגות פתוחות' : 'ללא חריגה',
        tone: dashboard.portfolioKpis.slaBreaches > 0 ? 'danger' : 'success',
      },
      {
        id: 'approvals-pulse',
        label: 'אישורים',
        value: dashboard.systemAdmin.stats.pendingApprovals,
        meta: 'ממתינים להכרעה',
        tone: dashboard.systemAdmin.stats.pendingApprovals > 0 ? 'warning' : 'default',
      },
      {
        id: 'ops-pulse',
        label: 'יומן',
        value: calendarEvents,
        meta: 'אירועים קרובים',
        tone: calendarEvents > 0 ? 'default' : 'success',
      },
    ],
    quickActions: [
      {
        id: 'tickets',
        title: 'מוקד קריאות',
        value: dashboard.portfolioKpis.openTickets,
        previewValue: dashboard.portfolioKpis.urgentTickets ? `${dashboard.portfolioKpis.urgentTickets} דחוף` : dashboard.portfolioKpis.openTickets,
        subtitle: 'פתוחות עכשיו',
        href: '/tickets',
        icon: homeIcons.ticket,
        tone: dashboard.portfolioKpis.openTickets > 0 ? 'warning' : 'success',
        microViz: monthlyLoad,
        fullCardTap: true,
      },
      {
        id: 'control',
        title: 'בקרה מערכתית',
        value: `${occupancyRate}%`,
        previewValue: `${occupancyRate}%`,
        subtitle: 'תפוסה פעילה',
        href: '/admin/dashboard',
        icon: homeIcons.dashboard,
        microViz: [dashboard.portfolioKpis.occupiedUnits, dashboard.portfolioKpis.vacantUnits, dashboard.systemAdmin.stats.totalBuildings],
        fullCardTap: true,
      },
      {
        id: 'approvals',
        title: 'אישורים',
        value: dashboard.systemAdmin.stats.pendingApprovals,
        previewValue: dashboard.systemAdmin.stats.pendingApprovals,
        subtitle: 'ממתינים',
        href: '/communications',
        icon: homeIcons.notifications,
        tone: dashboard.systemAdmin.stats.pendingApprovals > 0 ? 'warning' : 'default',
        microViz: [dashboard.systemAdmin.stats.pendingApprovals, unassignedCount, dashboard.portfolioKpis.slaBreaches],
        fullCardTap: true,
      },
      {
        id: 'maintenance',
        title: 'תחזוקה',
        value: unverifiedMaintenance,
        previewValue: unverifiedMaintenance,
        subtitle: 'חריגים לבדיקה',
        href: '/maintenance',
        icon: homeIcons.maintenance,
        tone: unverifiedMaintenance > 0 ? 'warning' : 'success',
        microViz: [unverifiedMaintenance, dashboard.maintenanceSummary.dueToday, dashboard.maintenanceSummary.dueInRange],
        fullCardTap: true,
      },
    ],
    contextPreview: {
      eyebrow: 'Control Center',
      title: 'תמונת מערכת מהירה',
      subtitle: 'המוקדים שחייבים תשומת לב לפני מעבר בין מסכים.',
      items: [
        {
          id: 'preview-sla',
          label: 'SLA',
          value: dashboard.portfolioKpis.slaBreaches,
          meta: dashboard.portfolioKpis.slaBreaches > 0 ? 'חריגות פתוחות' : 'ללא חריגה פתוחה',
          href: '/admin/dashboard',
          icon: homeIcons.dashboard,
          tone: dashboard.portfolioKpis.slaBreaches > 0 ? 'danger' : 'success',
        },
        {
          id: 'preview-open',
          label: 'קריאות',
          value: dashboard.portfolioKpis.openTickets,
          meta: unassignedCount ? `${unassignedCount} ממתינות לשיוך` : 'התור בשליטה',
          href: '/tickets',
          icon: homeIcons.ticket,
          tone: dashboard.portfolioKpis.openTickets > 0 ? 'warning' : 'success',
        },
        {
          id: 'preview-approvals',
          label: 'אישורים',
          value: dashboard.systemAdmin.stats.pendingApprovals,
          meta: 'ממתינים לטיפול',
          href: '/admin/approvals',
          icon: homeIcons.notifications,
          tone: dashboard.systemAdmin.stats.pendingApprovals > 0 ? 'warning' : 'default',
        },
        {
          id: 'preview-maintenance',
          label: 'תחזוקה',
          value: unverifiedMaintenance,
          meta: `${dashboard.maintenanceSummary.dueToday} לביצוע היום`,
          href: '/maintenance',
          icon: homeIcons.maintenance,
          tone: unverifiedMaintenance > 0 ? 'warning' : 'success',
        },
      ],
    },
    launcher: {
      title: 'קיצורי בקרה',
      description: 'פתיחת המוקדים השכיחים בלי לחפש אותם בתפריטים.',
      ctaLabel: 'פתח קיצורים',
      items: [
        { id: 'launch-tickets', title: 'מוקד קריאות', description: 'תור השיוך והחריגים המבצעיים.', href: '/tickets', icon: homeIcons.ticket, tone: 'warning' },
        { id: 'launch-approvals', title: 'אישורים', description: 'אישורי דיירים, ספקים וחריגות.', href: '/admin/approvals', icon: homeIcons.notifications },
        { id: 'launch-maintenance', title: 'תחזוקה', description: 'פעולות לא מאומתות ועומס יומי.', href: '/maintenance', icon: homeIcons.maintenance },
        { id: 'launch-calendar', title: 'יומן תפעול', description: 'אירועי לו"ז, חוזים ופירעונות.', href: '/operations/calendar', icon: homeIcons.calendar },
      ],
    },
    priorityItems,
  };
}

async function buildPmHomeData(): Promise<PmMobileHomeData> {
  const [tickets, buildings, operations, residentRequests, notifications] = await Promise.all([
    fetchRequiredJson<TicketsSnapshot>('/api/v1/tickets?view=dispatch&limit=40'),
    fetchOptionalJson<BuildingSnapshot>('/api/v1/buildings'),
    fetchOptionalJson<OperationsCalendarSnapshot>('/api/v1/operations/calendar'),
    fetchOptionalJson<ResidentRequestsSnapshot>('/api/v1/communications/resident-requests'),
    Promise.resolve<UserNotificationSnapshot | null>(null),
  ]);

  const newTickets = tickets.items?.filter((item) => item.status === 'OPEN').length ?? tickets.summary?.open ?? 0;
  const urgentCount = tickets.items?.filter((item) => item.severity === 'URGENT' && item.status !== 'RESOLVED').length ?? 0;
  const activeBuildings = buildings?.filter((building) => building.status !== 'INACTIVE').length ?? buildings?.length ?? 0;
  const calendarEvents = operations?.summary?.total ?? 0;
  const pendingRequests = residentRequests?.filter((request) => request.status === 'SUBMITTED' || request.status === 'IN_REVIEW').length ?? 0;
  const vendorMessages = notifications?.filter((item) => !item.read).length ?? 0;

  return {
    statusMetrics: [
      { id: 'tickets', label: 'קריאות', value: newTickets, tone: newTickets > 0 ? 'warning' : 'success', href: '/tickets' },
      { id: 'urgent', label: 'דחוף', value: urgentCount, tone: urgentCount > 0 ? 'danger' : 'success', href: '/tickets' },
    ],
    primaryAction: {
      eyebrow: 'מסלול שיוך',
      title: urgentCount > 0 ? `שייך עכשיו ${urgentCount} קריאות דחופות` : `פתח תור שיוך ל-${newTickets} קריאות חדשות`,
      description: `${pendingRequests} בקשות דייר ממתינות לסקירה · ${activeBuildings} בניינים פעילים · ${calendarEvents} פריטים קרובים ביומן.`,
      ctaLabel: urgentCount > 0 ? 'שייך קריאות דחופות' : 'פתח תור שיוך',
      href: '/tickets',
      tone: urgentCount > 0 ? 'danger' : 'warning',
      secondaryAction: { label: 'מסך בניינים', href: '/buildings' },
    },
    pulseMetrics: [
      { id: 'pm-tickets', label: 'קריאות', value: newTickets, meta: 'חדשות לשיוך', tone: newTickets > 0 ? 'warning' : 'success' },
      { id: 'pm-requests', label: 'בקשות', value: pendingRequests, meta: 'ממתינות', tone: pendingRequests > 0 ? 'warning' : 'default' },
      { id: 'pm-calendar', label: 'יומן', value: calendarEvents, meta: 'קרוב לביצוע', tone: calendarEvents > 0 ? 'default' : 'success' },
    ],
    quickActions: [
      { id: 'tickets', title: 'תור קריאות', value: newTickets, subtitle: 'חדשות לשיוך', href: '/tickets', icon: homeIcons.ticket, tone: newTickets > 0 ? 'warning' : 'success' },
      { id: 'buildings', title: 'בניינים', value: activeBuildings, subtitle: 'מצב נכסים', href: '/buildings', icon: homeIcons.dashboard },
      { id: 'requests', title: 'בקשות דייר', value: pendingRequests, subtitle: 'ממתינות', href: '/communications', icon: homeIcons.notifications, tone: pendingRequests > 0 ? 'warning' : 'default' },
      { id: 'calendar', title: 'יומן תפעול', value: calendarEvents, subtitle: 'קרוב לביצוע', href: '/operations/calendar', icon: homeIcons.calendar },
    ],
    contextPreview: {
      eyebrow: 'Property Pulse',
      title: 'מוקדי הנכס',
      subtitle: 'שיוך, דיירים ובניינים בשכבה אחת.',
      items: [
        { id: 'pm-preview-tickets', label: 'קריאות', value: newTickets, meta: urgentCount ? `${urgentCount} דחופות` : 'ללא דחוף', href: '/tickets', icon: homeIcons.ticket, tone: urgentCount ? 'danger' : newTickets ? 'warning' : 'success' },
        { id: 'pm-preview-buildings', label: 'בניינים', value: activeBuildings, meta: 'פעילים במעקב', href: '/buildings', icon: homeIcons.dashboard },
        { id: 'pm-preview-requests', label: 'דיירים', value: pendingRequests, meta: 'בקשות ממתינות', href: '/communications', icon: homeIcons.notifications, tone: pendingRequests ? 'warning' : 'default' },
        { id: 'pm-preview-calendar', label: 'יומן', value: calendarEvents, meta: vendorMessages ? `${vendorMessages} התראות` : 'ללא עומס חריג', href: '/operations/calendar', icon: homeIcons.calendar },
      ],
    },
    launcher: {
      title: 'קיצורי מנהל נכס',
      description: 'המסכים שנפתחים הכי הרבה במהלך היום.',
      ctaLabel: 'פתח קיצורים',
      items: [
        { id: 'pm-launch-tickets', title: 'תור שיוך', description: 'כל הקריאות החדשות והדחופות במקום אחד.', href: '/tickets', icon: homeIcons.ticket, tone: urgentCount > 0 ? 'danger' : 'warning' },
        { id: 'pm-launch-buildings', title: 'בניינים', description: 'תמונת מצב של הנכסים והיחידות.', href: '/buildings', icon: homeIcons.dashboard },
        { id: 'pm-launch-residents', title: 'בקשות דייר', description: 'פניות, מסמכים ואישורים פתוחים.', href: '/communications', icon: homeIcons.notifications },
        { id: 'pm-launch-calendar', title: 'יומן תפעול', description: 'משימות, ספקים ולוחות זמנים קרובים.', href: '/operations/calendar', icon: homeIcons.calendar },
      ],
    },
    priorityItems: [
      {
        id: 'urgent-ticket',
        status: 'דחוף',
        tone: urgentCount > 0 ? 'danger' : 'success',
        title: urgentCount > 0 ? `יש ${urgentCount} קריאות דחופות לשיוך` : 'אין קריאה דחופה פתוחה',
        reason: urgentCount > 0 ? 'פתח את תור הקריאות כדי לשייך מיידית ולמנוע חריגה.' : 'כל הקריאות הדחופות כבר בטיפול.',
        meta: newTickets ? `${newTickets} חדשות בתור` : 'תור מאוזן',
        href: '/tickets',
        ctaLabel: 'שייך',
      },
      {
        id: 'resident-requests',
        status: 'בקשות דייר',
        tone: pendingRequests > 0 ? 'warning' : 'active',
        title: `${pendingRequests} בקשות דייר ממתינות`,
        reason: 'חניה, מעבר דירה ומסמכים מחכים לאישור או תשובה ראשונה.',
        meta: pendingRequests ? '1-3 ימים' : 'אין עיכוב',
        href: '/communications',
        ctaLabel: 'סקור',
      },
      {
        id: 'calendar-ops',
        status: 'לוח זמנים',
        tone: calendarEvents > 0 ? 'active' : 'success',
        title: calendarEvents > 0 ? `${calendarEvents} פריטים קרובים ביומן` : 'היומן התפעולי מאוזן',
        reason: calendarEvents > 0 ? 'משימות קרובות, מעקב ספקים ולוחות זמנים שדורשים החלטה מוקדמת.' : 'אין כרגע אירועי קצה בלוח התפעול.',
        meta: activeBuildings ? `${activeBuildings} בניינים פעילים` : 'ללא עומס',
        href: '/operations/calendar',
        ctaLabel: 'פתח יומן',
      },
    ],
  };
}

async function buildTechHomeData(currentUserId: number | null): Promise<TechMobileHomeData> {
  if (!currentUserId) return buildTechFallback();

  const [orders, notifications] = await Promise.all([
    fetchRequiredJson<WorkOrderSnapshot>('/api/v1/work-orders'),
    fetchOptionalJson<UserNotificationSnapshot>(`/api/v1/notifications/user/${currentUserId}`),
  ]);

  const assignedOrders = orders.filter((order) => order.ticket.assignedToId === currentUserId || !order.ticket.assignedToId);
  const activeOrders = assignedOrders.filter((order) => order.status !== 'RESOLVED');
  const urgentOrders = activeOrders.filter((order) => order.ticket.severity === 'URGENT');
  const unreadNotifications = notifications?.filter((item) => !item.read).length ?? 0;
  const nextJob = [...activeOrders].sort((left, right) => severityRank(right.ticket.severity) - severityRank(left.ticket.severity))[0];

  return {
    statusMetrics: [
      { id: 'jobs', label: 'משימות', value: activeOrders.length, tone: activeOrders.length > 0 ? 'warning' : 'success', href: '/tech/jobs' },
      { id: 'urgent', label: 'דחוף', value: urgentOrders.length, tone: urgentOrders.length > 0 ? 'danger' : 'success', href: '/tech/jobs' },
    ],
    primaryAction: {
      eyebrow: 'המשימה הבאה',
      title: nextJob ? `המשך לטיפול ב-${nextJob.ticket.title || 'משימת שטח'}` : 'אין כרגע משימה דחופה',
      description: nextJob
        ? `${getSeverityLabel(nextJob.ticket.severity)} · ${nextJob.location?.building || 'בניין לא צוין'}${nextJob.location?.floor ? ` · קומה ${nextJob.location.floor}` : ''} · ${formatRelativeAge(nextJob.assignedAt || nextJob.dueTime)}`
        : 'תור העבודות פתוח עבורך. אפשר לפתוח עבודה, לעדכן סטטוס או להמשיך לחודש הגינון.',
      ctaLabel: nextJob ? 'המשך למשימה' : 'פתח תור עבודות',
      href: nextJob ? `/work-orders/${nextJob.id}` : '/tech/jobs',
      tone: urgentOrders.length > 0 ? 'danger' : 'warning',
      secondaryAction: { label: 'עדכן סטטוס', href: '/tickets?mine=true' },
    },
    pulseMetrics: [
      { id: 'tech-jobs', label: 'משימות', value: activeOrders.length, meta: 'להיום', tone: activeOrders.length > 0 ? 'warning' : 'success' },
      { id: 'tech-urgent', label: 'דחוף', value: urgentOrders.length, meta: 'בראש התור', tone: urgentOrders.length > 0 ? 'danger' : 'success' },
      { id: 'tech-notifications', label: 'עדכון', value: unreadNotifications, meta: unreadNotifications ? 'התראות חדשות' : 'שקט בשטח', tone: unreadNotifications ? 'warning' : 'default' },
    ],
    quickActions: [
      { id: 'jobs', title: 'עבודות', value: activeOrders.length, subtitle: 'היום', href: '/tech/jobs', icon: homeIcons.maintenance, tone: activeOrders.length > 0 ? 'warning' : 'success' },
      { id: 'gardens', title: 'גינון', value: 'חודשי', subtitle: 'תוכנית', href: '/gardens', icon: homeIcons.calendar },
      { id: 'supervision', title: 'פיקוח', value: urgentOrders.length > 0 ? 'חם' : 'שגרה', subtitle: 'דוח שטח', href: '/supervision-report', icon: homeIcons.supervision, tone: urgentOrders.length > 0 ? 'warning' : 'default' },
      { id: 'status', title: 'עדכן', value: unreadNotifications > 0 ? `${unreadNotifications}+` : 'סטטוס', subtitle: 'שלי', href: '/tickets?mine=true', icon: homeIcons.ticket, tone: unreadNotifications > 0 ? 'warning' : 'default' },
    ],
    contextPreview: {
      eyebrow: 'Next Stop',
      title: nextJob ? 'התחנה הבאה מוכנה' : 'תמונת שטח רגועה',
      subtitle: nextJob ? 'המיקום, ה-SLA והגיבוי התפעולי לפני היציאה.' : 'אין כרגע משימה חמה, אבל כלי השטח זמינים.',
      items: [
        {
          id: 'tech-preview-next',
          label: 'התחנה',
          value: nextJob?.location?.building || 'ללא שיבוץ',
          meta: nextJob?.location?.floor ? `קומה ${nextJob.location.floor}` : nextJob ? 'ללא קומה מוגדרת' : 'העבודה הבאה תופיע כאן',
          href: nextJob ? `/work-orders/${nextJob.id}` : '/tech/jobs',
          icon: homeIcons.maintenance,
          tone: urgentOrders.length > 0 ? 'danger' : 'default',
        },
        {
          id: 'tech-preview-sla',
          label: 'SLA',
          value: nextJob?.dueTime ? formatDueWindow(nextJob.dueTime) : 'ללא SLA',
          meta: nextJob ? getSeverityLabel(nextJob.ticket.severity) : 'אין משימה דחופה',
          href: '/tech/jobs',
          icon: homeIcons.ticket,
          tone: urgentOrders.length > 0 ? 'warning' : 'default',
        },
        {
          id: 'tech-preview-gardens',
          label: 'גינון',
          value: 'חודשי',
          meta: 'מסלול קבוע',
          href: '/gardens',
          icon: homeIcons.calendar,
        },
        {
          id: 'tech-preview-supervision',
          label: 'פיקוח',
          value: unreadNotifications > 0 ? `${unreadNotifications}+` : 'מוכן',
          meta: 'עדכונים וגיבוי שטח',
          href: '/tickets?mine=true',
          icon: homeIcons.supervision,
          tone: unreadNotifications > 0 ? 'warning' : 'success',
        },
      ],
    },
    launcher: {
      title: 'קיצורי שטח',
      description: 'הפעולה הבאה בלי לחפש בתפריטים.',
      ctaLabel: 'פתח קיצורים',
      items: [
        { id: 'tech-launch-jobs', title: 'תור העבודות', description: 'כל המשימות הפעילות להיום.', href: '/tech/jobs', icon: homeIcons.maintenance, tone: activeOrders.length ? 'warning' : 'default' },
        { id: 'tech-launch-status', title: 'עדכון סטטוס', description: 'דיווח מיידי על הגעה, טיפול או סיום.', href: '/tickets?mine=true', icon: homeIcons.ticket },
        { id: 'tech-launch-gardens', title: 'מסלול גינון', description: 'תכנית החודש ותחנת העבודה הבאה.', href: '/gardens', icon: homeIcons.calendar },
        { id: 'tech-launch-supervision', title: 'דוח פיקוח', description: 'פתיחת דוח שטח כשצריך גיבוי מסודר.', href: '/supervision-report', icon: homeIcons.supervision },
      ],
    },
    queueItems: activeOrders.slice(0, 4).map((order) => ({
      id: `job-${order.id}`,
      status: getSeverityLabel(order.ticket.severity),
      tone: order.ticket.severity === 'URGENT' ? 'danger' : order.ticket.severity === 'HIGH' ? 'warning' : 'active',
      title: `#${order.ticket.id} ${order.ticket.title || 'משימת שטח'}`,
      reason: `${order.location?.building || 'בניין'}${order.location?.floor ? ` · קומה ${order.location.floor}` : ''} · ${order.dueTime ? `SLA ${formatDueWindow(order.dueTime)}` : 'ללא SLA'}`,
      meta: order.status === 'IN_PROGRESS' ? 'בתהליך' : 'מוכן להתחלה',
      href: `/work-orders/${order.id}`,
      ctaLabel: 'פתח',
    })),
  };
}

async function buildAccountantHomeData(): Promise<AccountantMobileHomeData> {
  const [invoices, collectionsSummary, budgets, operations] = await Promise.all([
    fetchRequiredJson<InvoiceRow[]>('/api/v1/invoices'),
    fetchOptionalJson<CollectionsSummary>('/api/v1/invoices/collections/summary'),
    fetchOptionalJson<BudgetSnapshot>('/api/v1/budgets'),
    fetchOptionalJson<OperationsCalendarSnapshot>('/api/v1/operations/calendar'),
  ]);

  const summary = collectionsSummary?.totals;
  const outstandingBalance = summary?.outstandingBalance ?? invoices.filter((invoice) => invoice.status !== 'PAID').reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueCount = summary?.overdueCount ?? invoices.filter((invoice) => invoice.status === 'OVERDUE').length;
  const over60Count = collectionsSummary?.topDebtors.filter((item) => item.overdueCount >= 2).length ?? 0;
  const todayPayments = summary?.collectedThisMonth ?? 0;
  const atRiskBudgets = budgets?.filter((budget) => budget.alertLevel && budget.alertLevel !== 'normal').length ?? 0;
  const payoffEvents = operations?.items?.filter((item) => item.type === 'INVOICE' || item.type === 'CONTRACT').length ?? 0;
  const topDebtor = collectionsSummary?.topDebtors[0];
  const nextVendorPayment = operations?.items?.find((item) => item.type === 'CONTRACT' || item.type === 'INVOICE');

  return {
    statusMetrics: [
      { id: 'collection', label: 'לגבייה', value: formatCurrency(outstandingBalance), tone: overdueCount > 0 ? 'warning' : 'success', href: '/payments' },
      { id: 'overdue', label: 'פיגורים', value: overdueCount, tone: overdueCount > 0 ? 'danger' : 'success', href: '/payments' },
    ],
    primaryAction: {
      eyebrow: 'Collection Card',
      title: 'גבייה שוטפת',
      description: `${formatCurrency(outstandingBalance)} יתרת חוב כוללת · ${overdueCount} חשבונות בפיגור · ${over60Count} מעל 60 יום.`,
      ctaLabel: 'פתח רשימת גבייה',
      href: '/payments',
      tone: overdueCount > 0 ? 'danger' : 'warning',
    },
    pulseMetrics: [
      { id: 'acc-balance', label: 'לגבייה', value: formatCurrency(outstandingBalance), meta: 'יתרה פתוחה', tone: overdueCount > 0 ? 'warning' : 'success' },
      { id: 'acc-overdue', label: 'פיגורים', value: overdueCount, meta: 'דורש מעקב', tone: overdueCount > 0 ? 'danger' : 'success' },
      { id: 'acc-budgets', label: 'תקציב', value: atRiskBudgets, meta: 'חריגות', tone: atRiskBudgets > 0 ? 'warning' : 'default' },
    ],
    quickActions: [
      { id: 'payments', title: 'תשלומים', value: formatCurrency(todayPayments), subtitle: 'היום', href: '/payments', icon: homeIcons.payments },
      { id: 'budgets', title: 'תקציבים', value: atRiskBudgets, subtitle: 'חריגות', href: '/finance/budgets', icon: homeIcons.reports, tone: atRiskBudgets > 0 ? 'warning' : 'success' },
      { id: 'reports', title: 'דוחות', value: 'חודשי', subtitle: '📊', href: '/finance/reports', icon: homeIcons.dashboard },
      { id: 'calendar', title: 'יומן', value: payoffEvents, subtitle: 'פירעון', href: '/operations/calendar', icon: homeIcons.calendar },
    ],
    contextPreview: {
      eyebrow: 'Collections Pulse',
      title: 'דופק הגבייה',
      subtitle: 'מה חייב להתקדם לפני סוף היום.',
      items: [
        {
          id: 'acc-preview-balance',
          label: 'לגבייה',
          value: formatCurrency(outstandingBalance),
          meta: `${overdueCount} חשבונות בפיגור`,
          href: '/payments',
          icon: homeIcons.payments,
          tone: overdueCount > 0 ? 'warning' : 'success',
        },
        {
          id: 'acc-preview-top',
          label: 'חייב מוביל',
          value: topDebtor ? formatCurrency(topDebtor.amount) : '₪0',
          meta: topDebtor ? `${topDebtor.residentName}${topDebtor.buildingName ? ` · ${topDebtor.buildingName}` : ''}` : 'אין חייב חם כרגע',
          href: '/payments',
          icon: homeIcons.notifications,
          tone: topDebtor ? 'warning' : 'success',
        },
        {
          id: 'acc-preview-budget',
          label: 'תקציב',
          value: atRiskBudgets,
          meta: 'מסגרות בחריגה',
          href: '/finance/budgets',
          icon: homeIcons.reports,
          tone: atRiskBudgets > 0 ? 'warning' : 'success',
        },
        {
          id: 'acc-preview-calendar',
          label: 'פירעון',
          value: payoffEvents,
          meta: nextVendorPayment?.title || 'אין אירוע קרוב',
          href: nextVendorPayment?.href || '/operations/calendar',
          icon: homeIcons.calendar,
        },
      ],
    },
    launcher: {
      title: 'קיצורי כספים',
      description: 'מעבר קצר למסכי הגבייה, התקציב והדוחות.',
      ctaLabel: 'פתח קיצורים',
      items: [
        { id: 'acc-launch-payments', title: 'רשימת גבייה', description: 'יתרות פתוחות, פיגורים והבטחות תשלום.', href: '/payments', icon: homeIcons.payments, tone: overdueCount > 0 ? 'warning' : 'default' },
        { id: 'acc-launch-budgets', title: 'בדיקת תקציבים', description: 'חריגות וסטטוס הוצאות מול תכנון.', href: '/finance/budgets', icon: homeIcons.reports },
        { id: 'acc-launch-reports', title: 'דוחות פיננסיים', description: 'תמונת חודש, מגמות וייצוא.', href: '/finance/reports', icon: homeIcons.dashboard },
        { id: 'acc-launch-calendar', title: 'יומן פירעונות', description: 'חוזים, חשבוניות ומועדים קרובים.', href: '/operations/calendar', icon: homeIcons.calendar },
      ],
    },
    attentionItems: [
      {
        id: 'overdue-attention',
        status: 'פיגור',
        tone: over60Count > 0 ? 'danger' : 'warning',
        title: `${over60Count} חשבונות מעל 60 יום פיגור`,
        reason: topDebtor ? `סכום כולל ${formatCurrency(topDebtor.amount)} · ${topDebtor.residentName}${topDebtor.buildingName ? ` · ${topDebtor.buildingName}` : ''}` : 'דורש הסלמה ומעקב גבייה מרוכז.',
        meta: 'דורש הסלמה',
        href: '/payments',
        ctaLabel: 'טפל',
      },
      {
        id: 'vendor-payment',
        status: 'פירעון קרוב',
        tone: nextVendorPayment ? 'warning' : 'active',
        title: nextVendorPayment ? nextVendorPayment.title : 'אין פירעון ספק קרוב',
        reason: nextVendorPayment ? `${nextVendorPayment.buildingName} · ${nextVendorPayment.description}` : 'היומן לא מציג כרגע חוזה או חשבונית דחופה.',
        meta: nextVendorPayment?.date ? formatDate(new Date(nextVendorPayment.date)) : 'ללא מועד קרוב',
        href: nextVendorPayment?.href || '/operations/calendar',
        ctaLabel: 'סקור',
      },
    ],
  };
}

async function buildResidentHomeData(currentUserId: number | null): Promise<ResidentHomeData> {
  if (!currentUserId) return buildResidentFallback();

  const data = await fetchRequiredJson<InvoiceSummarySnapshot>(`/api/v1/invoices/account/${currentUserId}`);
  const dueBalance = data.summary?.currentBalance ?? 0;
  const unpaidInvoices = data.summary?.unpaidInvoices ?? 0;
  const dueDate = data.summary?.dueDate ? formatDate(new Date(data.summary.dueDate)) : 'ללא מועד';
  const openTickets = data.summary?.openTickets ?? 0;

  return {
    statusMetrics: [
      { id: 'building', label: 'חשבון', value: formatCurrency(dueBalance), tone: unpaidInvoices > 0 ? 'warning' : 'success', href: '/resident/account' },
      { id: 'tickets', label: 'קריאות', value: openTickets, tone: openTickets > 0 ? 'warning' : 'success', href: '/resident/account' },
    ],
    primaryAction: {
      eyebrow: 'מצב חשבון',
      title: 'יתרה לתשלום',
      description: `${formatCurrency(dueBalance)} · ${unpaidInvoices} חיובים פתוחים · מועד ${dueDate}`,
      ctaLabel: 'שלם עכשיו',
      href: '/payments/resident',
      tone: unpaidInvoices > 0 ? 'warning' : 'success',
      secondaryAction: { label: 'פרטי חשבון', href: '/resident/account' },
    },
    quickActions: [
      { id: 'requests', title: 'בקשה', value: 'חדשה', subtitle: 'פתיחה מהירה', href: '/resident/requests', icon: ClipboardList },
      { id: 'ticket', title: 'קריאה', value: 'תחזוקה', subtitle: 'דיווח מיידי', href: '/create-call', icon: Ticket },
      { id: 'docs', title: 'מסמכים', value: data.summary?.unreadNotifications ?? 0, subtitle: 'חדשים', href: '/documents', icon: Bell },
      { id: 'building', title: 'הבניין', value: 'שלי', subtitle: 'מידע ויצירת קשר', href: '/resident/account?section=building', icon: Building2 },
    ],
    inboxItems: (data.tickets || []).slice(0, 2).map((ticket, index) => ({
      id: `resident-ticket-${ticket.id || index}`,
      status: ticket.status === 'RESOLVED' ? 'נפתרה' : ticket.status === 'IN_PROGRESS' ? 'בטיפול' : 'פתוחה',
      tone: ticket.status === 'RESOLVED' ? 'success' : ticket.status === 'IN_PROGRESS' ? 'active' : 'warning',
      title: ticket.title || `קריאה #${ticket.id || index + 1}`,
      reason: ticket.updatedAt ? `עודכן ${formatDate(new Date(ticket.updatedAt))}` : 'צפה בפרטי הקריאה והטיפול.',
      href: '/resident/account',
      ctaLabel: 'צפה בפרטים',
    })),
  };
}

function buildResidentFallback(): ResidentHomeData {
  return {
    statusMetrics: [
      { id: 'balance', label: 'חשבון', value: '₪0', tone: 'success', href: '/resident/account' },
      { id: 'tickets', label: 'קריאות', value: 0, tone: 'success', href: '/resident/account' },
    ],
    primaryAction: {
      eyebrow: 'מצב חשבון',
      title: 'פתח את האזור האישי',
      description: 'מסלולי תשלום, קריאות ומסמכים זמינים גם כאשר הסיכום האישי לא נטען.',
      ctaLabel: 'פרטי חשבון',
      href: '/resident/account',
      tone: 'warning',
      secondaryAction: { label: 'שלם עכשיו', href: '/payments/resident' },
    },
    quickActions: [
      { id: 'requests', title: 'בקשה', value: 'חדשה', subtitle: 'פתיחה מהירה', href: '/resident/requests', icon: ClipboardList },
      { id: 'ticket', title: 'קריאה', value: 'תחזוקה', subtitle: 'דיווח מיידי', href: '/create-call', icon: Ticket },
      { id: 'docs', title: 'מסמכים', value: 0, subtitle: 'חדשים', href: '/documents', icon: Bell },
      { id: 'building', title: 'הבניין', value: 'שלי', subtitle: 'מידע ויצירת קשר', href: '/resident/account?section=building', icon: Building2 },
    ],
    inboxItems: [],
  };
}

async function fetchRequiredJson<T>(path: string): Promise<T> {
  const response = await authFetch(path);
  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function fetchOptionalJson<T>(path: string): Promise<T | null> {
  try {
    return await fetchRequiredJson<T>(path);
  } catch {
    return null;
  }
}

function getOccupancyRate(occupiedUnits: number, vacantUnits: number) {
  const totalUnits = occupiedUnits + vacantUnits;
  if (!totalUnits) return 0;
  return Math.round((occupiedUnits / totalUnits) * 100);
}

function severityRank(severity: 'NORMAL' | 'HIGH' | 'URGENT') {
  switch (severity) {
    case 'URGENT':
      return 3;
    case 'HIGH':
      return 2;
    default:
      return 1;
  }
}

function getSeverityLabel(severity: 'NORMAL' | 'HIGH' | 'URGENT') {
  switch (severity) {
    case 'URGENT':
      return '🔴 דחוף';
    case 'HIGH':
      return '🟡 גבוה';
    default:
      return '🔵 רגיל';
  }
}

function formatDueWindow(value?: string) {
  if (!value) return 'לא הוגדר';
  const due = new Date(value);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) return 'עבר';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours <= 0) {
    return `${Math.max(1, Math.floor(diffMs / (1000 * 60)))}ד`;
  }
  return `${diffHours}ש`;
}

function formatRelativeAge(value?: string) {
  if (!value) return 'ללא זמן הקצאה';
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  return `נפתח לפני ${diffHours} שעות`;
}

function getOnboardingSteps(role: RoleKey) {
  const shared = [
    {
      title: 'התחל מהכרטיס העליון',
      description: 'סטטוס קצר למעלה, פעולה ראשית אחת, ואז 2×2 קיצורים שממשיכים לזרימת העבודה שלך.',
    },
    {
      title: 'השתמש בארבעת הקיצורים',
      description: 'כל קיצור מייצג מסלול עבודה קבוע מהבלופרינט של התפקיד שלך — לא תפריט כללי.',
    },
  ];

  const roleSpecific: Record<RoleKey, { title: string; description: string }> = {
    ADMIN: { title: 'פתור SLA לפני כל דבר אחר', description: 'הבלופרינט הניהולי פותח תחילה חריגות, אישורים וחריגות תחזוקה.' },
    PM: { title: 'שייך ואז סקור בניינים', description: 'קודם משייכים קריאות חדשות, אחר כך יורדים לבניינים, ליומן ולספקים.' },
    TECH: { title: 'התחל עבודה ועדכן מהשטח', description: 'המסך מציג את המשימה הבאה ואת תור היום כדי שתוכל לזוז בלי לחפש.' },
    RESIDENT: { title: 'שלם או פתח פנייה', description: 'המסך משאיר את החשבון, הקריאות והבקשות באותה שכבת פתיחה.' },
    ACCOUNTANT: { title: 'פעל לפי גבייה ופיגורים', description: 'קודם פותחים רשימת גבייה, אחר כך בודקים חריגות תקציב ודוחות.' },
    MASTER: { title: 'התחל מהבלופרינט הניהולי', description: 'כמנהל-על, דף הבית נפתח דרך מסלול הבקרה והחריגות של ADMIN.' },
  };

  return [...shared, roleSpecific[role]];
}
