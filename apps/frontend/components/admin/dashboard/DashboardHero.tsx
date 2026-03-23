import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { FilterBar } from '../../ui/filter-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { DashboardResponse } from './types';
import { useLocale } from '../../../lib/providers';

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
  const { t } = useLocale();
  const reducedMotion = useReducedMotion();
  const [showGreeting, setShowGreeting] = React.useState(!reducedMotion);
  const greeting = getGreeting();

  React.useEffect(() => {
    if (reducedMotion) {
      setShowGreeting(false);
      return;
    }

    setShowGreeting(true);
    const timeout = window.setTimeout(() => setShowGreeting(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [greeting, reducedMotion]);

  return (
    <section className="dark-surface surface-hero overflow-hidden rounded-2xl border border-white/10 text-white sm:rounded-[28px]">
      <div className="grid gap-4 p-3.5 sm:gap-5 sm:p-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:p-8">
        <div className="space-y-3.5 sm:space-y-5">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-white/20 bg-white/10 text-[11px] text-white sm:text-xs">
                מרכז שליטה
              </Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {data.filters.rangeLabel}
              </span>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <AnimatePresence initial={false}>
                {showGreeting ? (
                  <motion.p
                    key={greeting}
                    initial={{ opacity: 0, y: 8, height: 20 }}
                    animate={{ opacity: 1, y: 0, height: 20 }}
                    exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                    className="overflow-hidden text-xs font-medium text-white/78 sm:text-sm"
                  >
                    {greeting}
                  </motion.p>
                ) : null}
              </AnimatePresence>
              <h1 className="max-w-[14ch] text-[1.5rem] font-black leading-[1.08] tracking-[-0.02em] sm:text-[2.15rem] lg:text-5xl">לוח בקרה ניהולי</h1>
              <p className="max-w-2xl text-[13px] leading-[1.55] text-white/80 sm:text-sm sm:leading-7">
                {`${data.portfolioKpis.openTickets} קריאות פתוחות · ${data.portfolioKpis.slaBreaches} חריגות SLA · חוב `}
                <strong>{new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(data.portfolioKpis.unpaidBalance)}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button asChild size="sm" className="bg-white text-slate-950 hover:bg-slate-100 sm:h-11 sm:px-5 sm:text-sm">
              <Link href="/tickets">צפה בקריאות</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10 sm:h-11 sm:px-5 sm:text-sm">
              <a href={exportHref} target="_blank" rel="noreferrer">
                הפק דוח
                <ArrowUpRight className="icon-directional ms-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="hidden border-white/20 bg-white/5 text-white hover:bg-white/10 sm:inline-flex sm:h-11 sm:px-5 sm:text-sm">
              <Link href="/admin/configuration">הגדרות</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="hidden border-rose-300/30 bg-rose-500/10 text-white hover:bg-rose-500/20 sm:inline-flex sm:h-11 sm:px-5 sm:text-sm">
              <Link href="/admin/activity">אודיט</Link>
            </Button>
          </div>
        </div>

        <div className="sticky top-16 space-y-3 self-start sm:static">
          <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-[11px] text-white/75">
            {buildingId === 'all' ? t('adminDashboard.mobile.allBuildings') : t('adminDashboard.mobile.buildingLabel', { id: buildingId })} · {data.filters.rangeLabel}
          </div>
          <FilterBar className="border-white/10 bg-black/15 sm:border-white/10 sm:bg-black/15">
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">בניין</p>
              <Select value={buildingId} onValueChange={setBuildingId}>
                <SelectTrigger className="h-9 border-white/10 bg-slate-950/30 text-xs text-white sm:text-sm">
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

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">טווח</p>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="h-9 border-white/10 bg-slate-950/30 text-xs text-white sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 ימים</SelectItem>
                  <SelectItem value="30d">30 ימים</SelectItem>
                  <SelectItem value="90d">90 ימים</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FilterBar>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
            <HeroMetric label="תפוסה" value={`${occupancyRate}%`} sublabel={`${data.portfolioKpis.occupiedUnits} מאוכלסות`} />
            <HeroMetric label="נפתחו" value={data.portfolioKpis.createdInRange} sublabel={data.filters.rangeLabel} />
            <HeroMetric label="נסגרו" value={data.portfolioKpis.resolvedInRange} sublabel={`היום: ${data.portfolioKpis.resolvedToday}`} />
            <HeroMetric label="שימוש" value={data.systemAdmin.stats.activeUsersInRange} sublabel={`${data.systemAdmin.stats.activityEventsInRange} אירועים`} />
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
    <div className="rounded-xl border border-white/10 bg-black/15 p-2.5 sm:rounded-2xl sm:p-3.5">
      <p className="text-[10px] font-medium text-white/60 sm:text-[11px]">{label}</p>
      <p className="mt-0.5 text-lg font-bold leading-none sm:mt-1 sm:text-2xl">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-white/72 sm:mt-1.5 sm:text-xs sm:leading-5">{sublabel}</p>
    </div>
  );
}
