import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { FilterBar } from '../../ui/filter-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { AmsFilterTabs } from '../../ui/ams-filter-tabs';
import { AmsMetricProgress } from '../../ui/ams-metric-progress';
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
      <div className="grid gap-4 p-3.5 sm:gap-5 sm:p-5 lg:grid-cols-[1.08fr_0.92fr] lg:gap-6 lg:p-6">
        <div className="space-y-3.5 sm:space-y-4">
          <div className="space-y-2.5 sm:space-y-3">
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
              <h1 className="max-w-[12ch] text-[1.45rem] font-black leading-[1.06] tracking-[-0.02em] sm:text-[1.95rem] lg:text-[2.65rem]">לוח בקרה ניהולי</h1>
              <p className="max-w-2xl text-[13px] leading-[1.55] text-white/80 sm:text-sm sm:leading-6">
                {`${data.portfolioKpis.openTickets} קריאות פתוחות · ${data.portfolioKpis.slaBreaches} חריגות SLA · חוב `}
                <strong>{new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(data.portfolioKpis.unpaidBalance)}</strong>
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/6 p-3.5 shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/56">Primary action</div>
                <div className="mt-1 text-lg font-black leading-none text-white">פתח מוקד טיפול חי</div>
                <div className="mt-1.5 text-xs leading-5 text-white/70">
                  מסלול קצר לקריאות, יצוא דוח והמשך להגדרות בלי לעזוב את ההקשר.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/48">SLA pressure</div>
                <div className="mt-1 text-xl font-black tabular-nums text-primary">{data.portfolioKpis.slaBreaches}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button asChild size="sm" className="bg-white text-slate-950 hover:bg-slate-100 sm:h-10 sm:px-4">
                <Link href="/tickets">צפה בקריאות</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10 sm:h-10 sm:px-4">
                <a href={exportHref} target="_blank" rel="noreferrer">
                  הפק דוח
                  <ArrowUpRight className="icon-directional ms-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10 sm:h-10 sm:px-4">
                <Link href="/admin/configuration">הגדרות</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-rose-300/30 bg-rose-500/10 text-white hover:bg-rose-500/20 sm:h-10 sm:px-4">
                <Link href="/admin/activity">אודיט</Link>
              </Button>
            </div>
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
              <AmsFilterTabs
                ariaLabel="בחירת טווח זמן"
                selectedKey={range}
                onSelectionChange={setRange}
                size="sm"
                fullWidth
                items={[
                  { key: '7d', label: '7 ימים' },
                  { key: '30d', label: '30 ימים' },
                  { key: '90d', label: '90 ימים' },
                ]}
                className="pb-0"
              />
            </div>
          </FilterBar>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <AmsMetricProgress
              label="תפוסה"
              value={`${occupancyRate}%`}
              progress={occupancyRate}
              hint={`${data.portfolioKpis.occupiedUnits} מאוכלסות`}
              tone={occupancyRate >= 92 ? 'success' : occupancyRate >= 80 ? 'warning' : 'danger'}
              variant="dark"
            />
            <AmsMetricProgress
              label="SLA"
              value={data.portfolioKpis.slaBreaches}
              progress={Math.max(10, 100 - Math.min(data.portfolioKpis.slaBreaches * 18, 90))}
              hint="חריגות פתוחות"
              tone={data.portfolioKpis.slaBreaches > 0 ? 'danger' : 'success'}
              variant="dark"
            />
            <AmsMetricProgress
              label="קצב סגירה"
              value={data.portfolioKpis.resolvedInRange}
              progress={Math.min(100, data.portfolioKpis.createdInRange ? (data.portfolioKpis.resolvedInRange / Math.max(data.portfolioKpis.createdInRange, 1)) * 100 : 100)}
              hint={`היום: ${data.portfolioKpis.resolvedToday}`}
              tone={data.portfolioKpis.resolvedInRange >= data.portfolioKpis.createdInRange ? 'success' : 'warning'}
              variant="dark"
            />
            <AmsMetricProgress
              label="שימוש"
              value={data.systemAdmin.stats.activeUsersInRange}
              progress={Math.min(100, Math.round((data.systemAdmin.stats.activeUsersInRange / Math.max(data.systemAdmin.stats.activityEventsInRange || 1, 1)) * 100 * 8))}
              hint={`${data.systemAdmin.stats.activityEventsInRange} אירועים`}
              tone="default"
              variant="dark"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
