import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Building2,
  CircleAlert,
  CreditCard,
  FileWarning,
  Info,
  ShieldCheck,
  Siren,
  Ticket,
  Users,
  Wrench,
} from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from '../../components/ui/use-toast';
import { formatCurrency, formatDate } from '../../lib/utils';

interface DashboardResponse {
  filters: {
    selectedBuildingId: number | null;
    range: string;
    buildings: Array<{ id: number; name: string }>;
  };
  portfolioKpis: {
    openTickets: number;
    urgentTickets: number;
    slaBreaches: number;
    unpaidBalance: number;
    overdueInvoices: number;
    occupiedUnits: number;
    vacantUnits: number;
    resolvedToday: number;
  };
  attentionItems: Array<{
    id: string;
    tone: 'danger' | 'warning' | 'calm';
    title: string;
    value: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  }>;
  ticketTrends: {
    ticketsByStatus: Record<string, number>;
    monthlyTrend: Array<{ month: string; count: number }>;
    buildingLoad: Array<{
      buildingId: number;
      buildingName: string;
      openTickets: number;
      urgentTickets: number;
      inProgressTickets: number;
      slaBreaches: number;
    }>;
  };
  collectionsSummary: {
    unpaidBalance: number;
    overdueInvoices: number;
    pendingInvoices: number;
    topDebtors: Array<{
      residentId: number;
      residentName: string;
      amount: number;
      overdueCount: number;
    }>;
  };
  maintenanceSummary: {
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
    upcoming: Array<{
      id: number;
      title: string;
      priority: string;
      nextOccurrence: string | null;
      buildingName: string;
      assignedTo: string | null;
    }>;
  };
  recentNotifications: Array<{
    id: number;
    title: string;
    message: string;
    type: string | null;
    read: boolean;
    createdAt: string;
    buildingName: string | null;
  }>;
  buildingRiskList: Array<{
    buildingId: number;
    buildingName: string;
    address: string;
    managerName: string | null;
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    openTickets: number;
    urgentTickets: number;
    inProgressTickets: number;
    slaBreaches: number;
    unpaidAmount: number;
    overdueInvoices: number;
    upcomingMaintenance: number;
    complianceExpiries: number;
    lastManagerActivity: string | null;
    riskScore: number;
  }>;
  systemAdmin: {
    stats: {
      totalUsers: number;
      totalBuildings: number;
      openTickets: number;
      unpaidInvoices: number;
      activeTechs: number;
    };
    health: Record<string, string>;
    roleCounts: Record<string, number>;
    users: Array<{
      id: number;
      email: string;
      role: string;
      tenantId: number;
      phone?: string | null;
      createdAt: string;
    }>;
    recentImpersonationEvents: Array<{
      id: number;
      action: string;
      targetRole?: string | null;
      reason?: string | null;
      createdAt: string;
    }>;
  };
}

const attentionToneClasses = {
  danger: 'border-rose-200 bg-rose-50/90 text-rose-950',
  warning: 'border-amber-200 bg-amber-50/90 text-amber-950',
  calm: 'border-slate-200 bg-slate-50/90 text-slate-900',
};

const attentionToneIcons = {
  danger: AlertTriangle,
  warning: CircleAlert,
  calm: Info,
};

const kpiCards = [
  { key: 'openTickets', title: 'קריאות פתוחות', icon: Ticket, accent: 'border-t-slate-400', iconBg: 'bg-slate-900' },
  { key: 'urgentTickets', title: 'דחופות', icon: Siren, accent: 'border-t-rose-500', iconBg: 'bg-rose-600' },
  { key: 'slaBreaches', title: 'חריגות SLA', icon: AlertTriangle, accent: 'border-t-amber-500', iconBg: 'bg-amber-600' },
  { key: 'unpaidBalance', title: 'יתרת חוב', icon: CreditCard, accent: 'border-t-slate-400', iconBg: 'bg-slate-900' },
  { key: 'overdueInvoices', title: 'חשבוניות בפיגור', icon: FileWarning, accent: 'border-t-amber-500', iconBg: 'bg-amber-600' },
  { key: 'vacantUnits', title: 'יחידות פנויות', icon: Building2, accent: 'border-t-slate-400', iconBg: 'bg-slate-900' },
] as const;

const kpiDescriptions: Record<string, string> = {
  urgentTickets: 'אירועים שדורשים תגובה מיידית או הסלמה.',
  slaBreaches: 'קריאות שעברו את חלון הטיפול שהוגדר.',
  openTickets: 'עומס הקריאות הנוכחי בכל הפורטפוליו.',
  unpaidBalance: 'סך החובות הפתוחים שעדיין לא נגבו.',
  overdueInvoices: 'חשבוניות שכבר עברו את מועד היעד.',
  vacantUnits: 'יחידות ללא דייר פעיל כרגע.',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'בוקר טוב';
  if (hour < 17) return 'צהריים טובים';
  if (hour < 21) return 'ערב טוב';
  return 'לילה טוב';
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [buildingId, setBuildingId] = useState('all');
  const [range, setRange] = useState('30d');

  useEffect(() => {
    loadDashboard();
  }, [buildingId, range]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (buildingId !== 'all') query.set('buildingId', buildingId);
      query.set('range', range);
      const response = await authFetch(`/api/v1/dashboard/overview?${query.toString()}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setData(await response.json());
    } catch {
      toast({
        title: 'טעינת הדשבורד נכשלה',
        description: 'לא ניתן לטעון כעת את מרכז הבקרה הניהולי.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const heroDescription = useMemo(() => {
    if (!data) return '';
    return `כרגע יש ${data.portfolioKpis.openTickets} קריאות פתוחות, ${data.portfolioKpis.slaBreaches} חריגות SLA ויתרת חוב של ${formatCurrency(
      data.portfolioKpis.unpaidBalance,
    )}.`;
  }, [data]);

  const exportHref = useMemo(() => {
    const query = new URLSearchParams();
    if (buildingId !== 'all') query.set('buildingId', buildingId);
    return `/api/v1/dashboard/export${query.toString() ? `?${query.toString()}` : ''}`;
  }, [buildingId]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-[28px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-3xl" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-[440px] rounded-3xl" />
          <Skeleton className="h-[440px] rounded-3xl" />
        </div>
      </div>
    );
  }

  const occupancyRate =
    data.portfolioKpis.occupiedUnits + data.portfolioKpis.vacantUnits > 0
      ? Math.round(
          (data.portfolioKpis.occupiedUnits /
            (data.portfolioKpis.occupiedUnits + data.portfolioKpis.vacantUnits)) *
            100,
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* ── Hero ── */}
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_26%),linear-gradient(135deg,_#2a4f8a,_#3d6aab_48%,_#5e86c0)] text-white shadow-[0_30px_80px_-40px_rgba(42,79,138,0.35)]">
        <div className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                  מרכז שליטה לפעילות השוטפת
                </Badge>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  נתונים חיים
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-white/70">{getGreeting()}</p>
                <h1 className="text-4xl font-black tracking-tight">לוח בקרה ניהולי</h1>
                <p className="max-w-2xl text-base leading-7 text-slate-200">{heroDescription}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-white text-slate-950 hover:bg-slate-100">
                <Link href="/tickets">צפה בקריאות</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Link href="/communications">שלח הודעה</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                <a href={exportHref} target="_blank" rel="noreferrer">
                  הפק דוח
                </a>
              </Button>
              <Button asChild variant="outline" className="border-rose-300/30 bg-rose-500/10 text-white hover:bg-rose-500/20">
                <Link href="/tickets?openCreate=1">פתח תקלה חריגה</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-4 self-start rounded-[26px] border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">בניין</p>
                <Select value={buildingId} onValueChange={setBuildingId}>
                  <SelectTrigger className="border-white/10 bg-slate-950/30 text-white">
                    <SelectValue placeholder="כל הבניינים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הבניינים</SelectItem>
                    {data.filters.buildings.map((building) => (
                      <SelectItem key={building.id} value={String(building.id)}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">טווח זמן</p>
                <Select value={range} onValueChange={setRange}>
                  <SelectTrigger className="border-white/10 bg-slate-950/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 ימים</SelectItem>
                    <SelectItem value="30d">30 ימים</SelectItem>
                    <SelectItem value="90d">90 ימים</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs font-medium text-slate-400">יחידות מאוכלסות</p>
                <p className="mt-1.5 text-2xl font-bold">{data.portfolioKpis.occupiedUnits}</p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>תפוסה</span>
                    <span>{occupancyRate}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs font-medium text-slate-400">הושלמו היום</p>
                <p className="mt-1.5 text-2xl font-bold">{data.portfolioKpis.resolvedToday}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs font-medium text-slate-400">תחזוקה השבוע</p>
                <p className="mt-1.5 text-2xl font-bold">{data.maintenanceSummary.dueThisWeek}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map((card) => {
          const value =
            card.key === 'unpaidBalance'
              ? formatCurrency(data.portfolioKpis[card.key])
              : String(data.portfolioKpis[card.key]);
          const Icon = card.icon;
          return (
            <Card
              key={card.key}
              className={`group overflow-hidden rounded-[26px] border-t-[3px] border-slate-200 ${card.accent} shadow-[0_20px_50px_-36px_rgba(15,23,42,0.25)] transition-shadow hover:shadow-[0_25px_60px_-32px_rgba(15,23,42,0.35)]`}
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-5 py-5">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{card.title}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
                  </div>
                  <div className={`rounded-2xl ${card.iconBg} p-3 text-white transition-transform group-hover:scale-105`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-sm text-slate-500">
                  {kpiDescriptions[card.key]}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* ── Attention Items ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">דורש תשומת לב עכשיו</h2>
            <p className="mt-1 text-sm text-slate-500">פעולות חריגות, חובות, תחזוקה ותקלות שצריך לקדם מיד.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.attentionItems.map((item) => {
            const ToneIcon = attentionToneIcons[item.tone];
            return (
              <Card
                key={item.id}
                className={`group rounded-[24px] border ${attentionToneClasses[item.tone]} transition-transform hover:-translate-y-0.5 ${item.tone === 'danger' ? 'ring-1 ring-rose-300/50' : ''}`}
              >
                <CardHeader className="space-y-3 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <ToneIcon className={`h-5 w-5 ${item.tone === 'danger' ? 'text-rose-600' : item.tone === 'warning' ? 'text-amber-600' : 'text-slate-500'}`} />
                  </div>
                  <div className="text-3xl font-black">{item.value}</div>
                  <CardDescription className="text-current/70">{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="sm" variant="outline" className="w-full border-current/20 bg-white/50 transition-colors hover:bg-white/80">
                    <Link href={item.ctaHref}>
                      {item.ctaLabel}
                      <ArrowUpRight className="ms-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Building Load / Maintenance / Notifications ── */}
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr_0.85fr]">
        <Card className="rounded-[28px] border-slate-200">
          <CardHeader>
            <CardTitle>עומס קריאות לפי בניין</CardTitle>
            <CardDescription>מיפוי מהיר של מוקדי לחץ, דחיפות וחריגות SLA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.ticketTrends.buildingLoad.map((item) => {
              const totalTickets = item.openTickets + item.inProgressTickets + item.urgentTickets;
              return (
                <div key={item.buildingId} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:bg-slate-50">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">{item.buildingName}</p>
                      <p className="text-sm text-slate-500">{item.openTickets} קריאות פתוחות במצטבר</p>
                    </div>
                    <Badge variant={item.urgentTickets > 0 ? 'destructive' : 'secondary'}>
                      {item.urgentTickets} דחופות
                    </Badge>
                  </div>

                  {totalTickets > 0 && (
                    <div className="mb-3">
                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        {item.urgentTickets > 0 && (
                          <div
                            className="bg-rose-500 transition-all duration-500"
                            style={{ width: `${(item.urgentTickets / totalTickets) * 100}%` }}
                          />
                        )}
                        {item.inProgressTickets > 0 && (
                          <div
                            className="bg-amber-400 transition-all duration-500"
                            style={{ width: `${(item.inProgressTickets / totalTickets) * 100}%` }}
                          />
                        )}
                        {item.openTickets > 0 && (
                          <div
                            className="bg-slate-400 transition-all duration-500"
                            style={{ width: `${(item.openTickets / totalTickets) * 100}%` }}
                          />
                        )}
                      </div>
                      <div className="mt-1.5 flex gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> דחוף</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> בטיפול</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" /> פתוח</span>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-3">
                    <MetricPill label="בטיפול" value={item.inProgressTickets} />
                    <MetricPill label="חריגות SLA" value={item.slaBreaches} warning={item.slaBreaches > 0} />
                    <MetricPill label="פתוחות" value={item.openTickets} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200">
          <CardHeader>
            <CardTitle>משימות תחזוקה קרובות</CardTitle>
            <CardDescription>מועדים קרובים, מטפלים משויכים ופריטים שחרגו.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <MetricPill label="באיחור" value={data.maintenanceSummary.overdue} warning={data.maintenanceSummary.overdue > 0} />
              <MetricPill label="היום" value={data.maintenanceSummary.dueToday} />
              <MetricPill label="השבוע" value={data.maintenanceSummary.dueThisWeek} />
            </div>
            <div className="space-y-3">
              {data.maintenanceSummary.upcoming.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4 transition-colors hover:bg-slate-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.buildingName}</p>
                    </div>
                    <Badge variant={item.priority === 'CRITICAL' || item.priority === 'HIGH' ? 'warning' : 'outline'}>
                      {item.priority}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <span>{item.nextOccurrence ? formatDate(item.nextOccurrence) : 'ללא מועד'}</span>
                    <span className="text-slate-300">•</span>
                    <span>{item.assignedTo || 'ללא שיוך'}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200">
          <CardHeader>
            <CardTitle>אירועים ועדכונים</CardTitle>
            <CardDescription>התראות אחרונות, הודעות מנהליות ואירועים תפעוליים.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentNotifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50/60 ${!item.read ? 'border-s-[3px] border-s-blue-500' : ''}`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className={`font-semibold ${!item.read ? 'text-slate-950' : 'text-slate-700'}`}>{item.title}</p>
                  <Bell className={`h-4 w-4 ${!item.read ? 'text-blue-500' : 'text-slate-400'}`} />
                </div>
                <p className="text-sm leading-6 text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {item.buildingName ? `${item.buildingName} • ` : ''}
                  {new Date(item.createdAt).toLocaleString('he-IL')}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* ── Building Risk / Collections + System Admin ── */}
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[28px] border-slate-200">
          <CardHeader>
            <CardTitle>דירוג בריאות בניינים</CardTitle>
            <CardDescription>הבניינים המסוכנים ביותר למנהל, מדורגים לפי עומס, חוב, תחזוקה וציות.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.buildingRiskList.map((building, index) => {
              const riskClamped = Math.min(100, Math.max(0, building.riskScore));
              const riskColor =
                riskClamped > 70 ? 'bg-rose-500' : riskClamped > 40 ? 'bg-amber-500' : 'bg-emerald-500';
              const rankStyle =
                index === 0
                  ? 'bg-rose-600 text-white'
                  : index === 1
                    ? 'bg-amber-500 text-white'
                    : index === 2
                      ? 'bg-amber-300 text-amber-900'
                      : 'bg-slate-200 text-slate-600';
              return (
                <div key={building.buildingId} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${rankStyle}`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">{building.buildingName}</p>
                          <p className="text-sm text-slate-500">{building.address}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>ציון סיכון</span>
                          <span className="font-semibold">{building.riskScore}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full ${riskColor} transition-all duration-700`}
                            style={{ width: `${riskClamped}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <Badge variant={building.urgentTickets > 0 ? 'destructive' : 'secondary'}>
                          {building.urgentTickets} דחופות
                        </Badge>
                        <Badge variant={building.overdueInvoices > 0 ? 'warning' : 'outline'}>
                          {building.overdueInvoices} בפיגור
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <MiniStat label="קריאות" value={building.openTickets} />
                      <MiniStat label="חוב" value={formatCurrency(building.unpaidAmount)} />
                      <MiniStat label="תחזוקה" value={building.upcomingMaintenance} />
                      <MiniStat label="ציות" value={building.complianceExpiries} />
                      <MiniStat
                        label="פעילות אחרונה"
                        value={building.lastManagerActivity ? formatDate(building.lastManagerActivity) : 'ללא'}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-slate-200">
            <CardHeader>
              <CardTitle>מצב גבייה</CardTitle>
              <CardDescription>תמונת מצב מרוכזת של חובות ודיירים עם יתרות גבוהות.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <MetricPill label="יתרת חוב" value={formatCurrency(data.collectionsSummary.unpaidBalance)} />
                <MetricPill label="באיחור" value={data.collectionsSummary.overdueInvoices} warning={data.collectionsSummary.overdueInvoices > 0} />
                <MetricPill label="ממתינות" value={data.collectionsSummary.pendingInvoices} />
              </div>
              <div className="space-y-3">
                {data.collectionsSummary.topDebtors.map((debtor, idx) => {
                  const maxAmount = data.collectionsSummary.topDebtors[0]?.amount || 1;
                  const pct = Math.round((debtor.amount / maxAmount) * 100);
                  return (
                    <div key={debtor.residentId} className="rounded-2xl border border-slate-200 p-4 transition-colors hover:bg-slate-50/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{idx + 1}</span>
                          <div>
                            <p className="font-medium text-slate-950">{debtor.residentName}</p>
                            <p className="text-sm text-slate-500">{debtor.overdueCount} פריטים בפיגור</p>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-slate-950">{formatCurrency(debtor.amount)}</div>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <details className="group rounded-[28px] border border-slate-200 bg-white">
            <summary className="cursor-pointer list-none p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-950">כלי ניהול משניים</h3>
                  <p className="mt-1 text-sm text-slate-500">בריאות מערכת, משתמשים, תפקידים ויומן התחזות.</p>
                </div>
                <Badge variant="outline" className="transition-colors group-open:bg-slate-950 group-open:text-white">
                  הצג / הסתר
                </Badge>
              </div>
            </summary>
            <div className="space-y-6 px-6 pb-6">
              <div className="grid gap-4 md:grid-cols-3">
                <MetricPill label="משתמשים" value={data.systemAdmin.stats.totalUsers} />
                <MetricPill label="בניינים" value={data.systemAdmin.stats.totalBuildings} />
                <MetricPill label="טכנאים" value={data.systemAdmin.stats.activeTechs} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-3xl border-slate-200 bg-slate-50/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      בריאות מערכת
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(data.systemAdmin.health).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <span className="font-medium text-slate-800">{key}</span>
                        <Badge variant="success">{value}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200 bg-slate-50/60">
                  <CardHeader>
                    <CardTitle className="text-lg">פילוח תפקידים</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(data.systemAdmin.roleCounts).map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <span className="font-medium text-slate-800">{role}</span>
                        <span className="text-sm font-semibold text-slate-500">{count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-3xl border-slate-200 bg-slate-50/60">
                <CardHeader>
                  <CardTitle className="text-lg">משתמשים אחרונים ופעולות רגישות</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    {data.systemAdmin.users.map((user) => (
                      <div key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-950">{user.email}</p>
                          <Badge variant="outline">{user.role}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          Tenant {user.tenantId} • {user.phone || 'ללא טלפון'}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {data.systemAdmin.recentImpersonationEvents.map((event) => (
                      <div key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="font-medium text-slate-950">
                          {event.action} {event.targetRole ? `→ ${event.targetRole}` : ''}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{event.reason || 'ללא סיבה מתועדת'}</p>
                        <p className="mt-2 text-xs text-slate-400">{new Date(event.createdAt).toLocaleString('he-IL')}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}

function MetricPill({ label, value, warning = false }: { label: string; value: string | number; warning?: boolean }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 transition-colors ${
        warning
          ? 'border-amber-200 bg-amber-50 hover:bg-amber-100/60'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1.5 text-lg font-black ${warning ? 'text-amber-900' : 'text-slate-950'}`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:bg-slate-50">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1.5 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}
