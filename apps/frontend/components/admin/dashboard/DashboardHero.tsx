import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { DashboardResponse } from './types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'בוקר טוב';
  if (hour < 17) return 'צהריים טובים';
  if (hour < 21) return 'ערב טוב';
  return 'לילה טוב';
}

export function DashboardHero({
  data,
  buildingId,
  range,
  setBuildingId,
  setRange,
  exportHref,
  occupancyRate,
}: {
  data: DashboardResponse;
  buildingId: string;
  range: string;
  setBuildingId: (value: string) => void;
  setRange: (value: string) => void;
  exportHref: string;
  occupancyRate: number;
}) {
  return (
    <section className="surface-hero overflow-hidden rounded-[30px] border border-white/10 text-white">
      <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                מרכז שליטה לפעילות השוטפת
              </Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                חלון דיווח: {data.filters.rangeLabel}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-white/70">{getGreeting()}</p>
              <h1 className="text-4xl font-black tracking-tight">לוח בקרה ניהולי</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200">
                {`כרגע יש ${data.portfolioKpis.openTickets} קריאות פתוחות, ${data.portfolioKpis.slaBreaches} חריגות SLA ויתרת חוב של `}
                <strong>{new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(data.portfolioKpis.unpaidBalance)}</strong>.
              </p>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                המדדים המבצעיים נשארים חיים, בעוד שהחלון שנבחר משפיע על סגירות, פעילות משתמשים, התראות ותחזוקה קרובה.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-white text-slate-950 hover:bg-slate-100">
              <Link href="/tickets">צפה בקריאות</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <Link href="/admin/configuration">מרכז הגדרות</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <a href={exportHref} target="_blank" rel="noreferrer">
                הפק דוח
                <ArrowUpRight className="ms-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" className="border-rose-300/30 bg-rose-500/10 text-white hover:bg-rose-500/20">
              <Link href="/admin/activity">יומן אודיט</Link>
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

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <HeroMetric label="תפוסה" value={`${occupancyRate}%`} sublabel={`${data.portfolioKpis.occupiedUnits} יחידות מאוכלסות`} />
            <HeroMetric label="נפתחו בטווח" value={data.portfolioKpis.createdInRange} sublabel={data.filters.rangeLabel} />
            <HeroMetric label="נסגרו בטווח" value={data.portfolioKpis.resolvedInRange} sublabel={`היום: ${data.portfolioKpis.resolvedToday}`} />
            <HeroMetric
              label="שימוש פעיל"
              value={data.systemAdmin.stats.activeUsersInRange}
              sublabel={`${data.systemAdmin.stats.activityEventsInRange} אירועים`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string | number;
  sublabel: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-300">{sublabel}</p>
    </div>
  );
}
