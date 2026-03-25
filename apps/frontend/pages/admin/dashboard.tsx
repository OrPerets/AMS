import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, ShieldAlert, Users } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { DashboardPageSkeleton } from '../../components/ui/page-states';
import { toast } from '../../components/ui/use-toast';
import { formatCurrency, formatDate } from '../../lib/utils';
import { AttentionGrid } from '../../components/admin/dashboard/AttentionGrid';
import { DashboardHero } from '../../components/admin/dashboard/DashboardHero';
import { KpiGrid } from '../../components/admin/dashboard/KpiGrid';
import { OperationalGrid } from '../../components/admin/dashboard/OperationalGrid';
import { RiskAndSystemGrid } from '../../components/admin/dashboard/RiskAndSystemGrid';
import { DashboardResponse } from '../../components/admin/dashboard/types';
import { MobileContextBar } from '../../components/ui/mobile-context-bar';
import { MobilePriorityInbox } from '../../components/ui/mobile-priority-inbox';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { PrimaryActionCard } from '../../components/ui/primary-action-card';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { SectionHeader } from '../../components/ui/section-header';
import { Button } from '../../components/ui/button';
import { MobileInsightWidget } from '../../components/ui/mobile-insight-widget';
import Link from 'next/link';
import { useLocale } from '../../lib/providers';

export default function AdminDashboardPage() {
  const { t } = useLocale();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buildingId, setBuildingId] = useState('all');
  const [range, setRange] = useState('30d');

  useEffect(() => {
    void loadDashboard();
  }, [buildingId, range]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams();
      if (buildingId !== 'all') query.set('buildingId', buildingId);
      query.set('range', range);
      const response = await authFetch(`/api/v1/dashboard/overview?${query.toString()}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setData(await response.json());
    } catch {
      setError('לא ניתן לטעון כעת את מרכז הבקרה הניהולי. בדוק את החיבור או נסה שוב בעוד רגע.');
      toast({
        title: 'טעינת הדשבורד נכשלה',
        description: 'לא ניתן לטעון כעת את מרכז הבקרה הניהולי.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const exportHref = useMemo(() => {
    const query = new URLSearchParams();
    if (buildingId !== 'all') query.set('buildingId', buildingId);
    return `/api/v1/dashboard/export${query.toString() ? `?${query.toString()}` : ''}`;
  }, [buildingId]);

  const occupancyRate = useMemo(() => {
    if (!data) return 0;
    const totalUnits = data.portfolioKpis.occupiedUnits + data.portfolioKpis.vacantUnits;
    if (!totalUnits) return 0;
    return Math.round((data.portfolioKpis.occupiedUnits / totalUnits) * 100);
  }, [data]);
  const mobilePriorityItems = useMemo(() => {
    if (!data) return [];
    return data.attentionItems.slice(0, 4).map((item) => ({
      id: item.id,
      status: item.tone === 'danger' ? t('status.needsAction') : item.tone === 'warning' ? t('status.atRisk') : t('status.updated'),
      tone: item.tone === 'danger' ? 'danger' as const : item.tone === 'warning' ? 'warning' as const : 'active' as const,
      title: item.title,
      reason: item.description,
      meta: item.value,
      href: item.ctaHref,
      ctaLabel: item.ctaLabel,
    }));
  }, [data, t]);
  const monthlyTrend = useMemo(() => data?.ticketTrends.monthlyTrend.slice(-6).map((item) => item.count) ?? [], [data]);
  const controlPulse = useMemo(() => {
    if (!data) return [];
    return [
      data.portfolioKpis.openTickets,
      data.portfolioKpis.urgentTickets,
      data.portfolioKpis.slaBreaches,
      data.systemAdmin.stats.pendingApprovals,
      data.maintenanceSummary.overdue,
      data.systemAdmin.stats.activeUsersInRange,
    ];
  }, [data]);
  const healthSnapshot = useMemo(() => {
    if (!data) return { critical: 0, warning: 0, healthy: 0, pulse: [] as number[] };
    const values = Object.values(data.systemAdmin.health);
    const critical = values.filter((item) => item.status === 'critical').length;
    const warning = values.filter((item) => item.status === 'warning').length;
    const healthy = values.filter((item) => item.status === 'healthy').length;
    return {
      critical,
      warning,
      healthy,
      pulse: values.map((item) => (item.status === 'critical' ? 100 : item.status === 'warning' ? 62 : 28)),
    };
  }, [data]);

  if (loading || !data) {
    if (!loading && error) {
      return <InlineErrorPanel title="מרכז הבקרה לא נטען" description={error} onRetry={loadDashboard} />;
    }

    return <DashboardPageSkeleton />;
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      {error ? (
        <InlineErrorPanel
          className="border-warning/40 bg-warning/5 text-foreground"
          title="מוצגים הנתונים האחרונים שהצליחו להיטען"
          description={error}
          onRetry={loadDashboard}
        />
      ) : null}

      <div className="space-y-3 md:hidden">
        <CompactStatusStrip
          roleLabel={t('adminDashboard.mobile.roleLabel')}
          metrics={[
            { id: 'tickets', label: 'קריאות', value: data.portfolioKpis.openTickets, tone: data.portfolioKpis.openTickets > 0 ? 'warning' : 'success' },
            { id: 'sla', label: 'SLA', value: data.portfolioKpis.slaBreaches, tone: data.portfolioKpis.slaBreaches > 0 ? 'danger' : 'success' },
          ]}
        />

        <PrimaryActionCard
          mobileHomeEffect
          eyebrow="פעולה ראשית"
          title={
            data.portfolioKpis.slaBreaches
              ? `${data.portfolioKpis.slaBreaches} חריגות SLA פתוחות`
              : `${data.portfolioKpis.openTickets} קריאות פתוחות`
          }
          description={
            data.portfolioKpis.slaBreaches
              ? `${data.systemAdmin.stats.pendingApprovals} אישורים ממתינים ו-${data.portfolioKpis.openTickets} קריאות פעילות דורשים התערבות.`
              : 'פתח את מוקד הקריאות כדי לשייך, להסלים או לסגור צווארי בקבוק.'
          }
          ctaLabel="פתח מוקד"
          href="/tickets"
          tone={data.portfolioKpis.slaBreaches > 0 ? 'danger' : 'warning'}
        />

        <section className="space-y-3" aria-label="מדדי שליטה">
          <div className="grid grid-cols-2 gap-3">
            <MobileInsightWidget
              title={t('adminDashboard.mobile.openTicketsMetric')}
              value={data.portfolioKpis.openTickets}
              hint={`${data.portfolioKpis.urgentTickets} דחופות עכשיו`}
              tone={data.portfolioKpis.openTickets > 0 ? 'warning' : 'success'}
              href="/tickets"
              sparkline={monthlyTrend}
              pulse={data.portfolioKpis.urgentTickets > 0}
            />
            <MobileInsightWidget
              title={t('adminDashboard.mobile.slaBreachesMetric')}
              value={data.portfolioKpis.slaBreaches}
              hint={`${data.systemAdmin.stats.pendingApprovals} אישורים פתוחים`}
              tone={data.portfolioKpis.slaBreaches > 0 ? 'danger' : 'success'}
              href="/admin/activity"
              sparkline={controlPulse}
              pulse={data.portfolioKpis.slaBreaches > 0}
            />
            <MobileInsightWidget
              title={t('adminDashboard.mobile.occupancyMetric')}
              value={`${occupancyRate}%`}
              hint={`${data.portfolioKpis.occupiedUnits} יחידות מאוכלסות`}
              tone={occupancyRate >= 92 ? 'success' : occupancyRate >= 80 ? 'warning' : 'danger'}
              href="/admin/dashboard"
              ringProgress={occupancyRate}
            />
            <MobileInsightWidget
              title="בריאות מערכת"
              value={healthSnapshot.critical ? `${healthSnapshot.critical} קריטי` : `${healthSnapshot.warning} אזהרות`}
              hint={`${healthSnapshot.healthy} תקינים · ${data.systemAdmin.recentImpersonationEvents.length} אירועי אודיט`}
              tone={healthSnapshot.critical ? 'danger' : healthSnapshot.warning ? 'warning' : 'success'}
              href="/admin/activity"
              sparkline={healthSnapshot.pulse}
              pulse={healthSnapshot.critical > 0}
            />
          </div>

          <MobileInsightWidget
            className="min-h-[138px]"
            title="קצב טיפול"
            value={`${data.portfolioKpis.resolvedInRange}/${Math.max(data.portfolioKpis.createdInRange, 1)}`}
            hint={`החודש: ${data.portfolioKpis.resolvedToday} נסגרו היום · ${data.maintenanceSummary.dueToday} לביצוע היום`}
            tone={data.portfolioKpis.resolvedInRange >= data.portfolioKpis.createdInRange ? 'success' : 'warning'}
            href="/admin/dashboard"
            sparkline={monthlyTrend}
            ringProgress={Math.min(100, data.portfolioKpis.createdInRange ? Math.round((data.portfolioKpis.resolvedInRange / data.portfolioKpis.createdInRange) * 100) : 100)}
          />
        </section>

        <MobilePriorityInbox
          title={t('adminDashboard.mobile.triageTitle')}
          subtitle={t('adminDashboard.mobile.triageSubtitle')}
          items={mobilePriorityItems}
        />

        <div className="grid gap-3">
          <Card variant="elevated">
            <CardHeader className="pb-3">
              <SectionHeader
                title={t('adminDashboard.mobile.decisionShortcutsTitle')}
                subtitle="מסלולים קצרים למסכי ההכרעה בלי להעמיס כפתורים קטנים."
                meta={t('adminDashboard.mobile.actNow')}
              />
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button asChild><Link href="/tickets">{t('adminDashboard.mobile.assign')}</Link></Button>
              <Button asChild variant="outline"><Link href="/admin/activity">{t('adminDashboard.mobile.escalate')}</Link></Button>
              <Button asChild variant="outline"><a href={exportHref} target="_blank" rel="noreferrer">{t('adminDashboard.mobile.export')}</a></Button>
              <Button asChild variant="outline"><Link href="/admin/notifications">{t('adminDashboard.mobile.notify')}</Link></Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <MobileInsightWidget
              title="משתמשים פעילים"
              value={data.systemAdmin.stats.activeUsersInRange}
              hint={`${data.systemAdmin.stats.activityEventsInRange} אירועים בטווח`}
              tone="info"
              href="/admin/activity"
              sparkline={[data.systemAdmin.stats.totalUsers, data.systemAdmin.stats.activeUsersInRange, data.systemAdmin.stats.activityEventsInRange]}
              badge={<Users className="h-5 w-5 text-info" strokeWidth={1.75} />}
            />
            <MobileInsightWidget
              title="תחזוקה"
              value={data.maintenanceSummary.overdue}
              hint={`${data.maintenanceSummary.dueToday} לביצוע היום`}
              tone={data.maintenanceSummary.overdue > 0 ? 'warning' : 'success'}
              href="/maintenance"
              sparkline={[data.maintenanceSummary.overdue, data.maintenanceSummary.dueToday, data.maintenanceSummary.dueInRange]}
              badge={<ShieldAlert className="h-5 w-5 text-warning" strokeWidth={1.75} />}
            />
            <MobileInsightWidget
              className="col-span-2"
              title="מעקב בקרה"
              value={formatCurrency(data.portfolioKpis.unpaidBalance)}
              hint={`${data.collectionsSummary.overdueInvoices} חשבוניות בפיגור · ${data.collectionsSummary.pendingInvoices} ממתינות`}
              tone={data.collectionsSummary.overdueInvoices > 0 ? 'warning' : 'default'}
              href="/payments"
              sparkline={[
                data.collectionsSummary.pendingInvoices,
                data.collectionsSummary.overdueInvoices,
                data.systemAdmin.stats.pendingApprovals,
                data.portfolioKpis.slaBreaches,
              ]}
              badge={<BarChart3 className="h-5 w-5 text-primary" strokeWidth={1.75} />}
            />
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <MobileContextBar
          roleLabel={t('adminDashboard.mobile.roleLabel')}
          contextLabel={buildingId === 'all' ? t('adminDashboard.mobile.allBuildings') : t('adminDashboard.mobile.buildingLabel', { id: buildingId })}
          syncLabel={t('adminDashboard.mobile.windowLabel', { value: range })}
          lastUpdated={formatDate(new Date())}
          chips={[
            `${data.filters.rangeLabel}`,
            t('adminDashboard.mobile.openTickets', { count: data.portfolioKpis.openTickets }),
            t('adminDashboard.mobile.approvalsWaiting', { count: data.systemAdmin.stats.pendingApprovals }),
          ]}
        />
      </div>
      <div className="hidden md:block">
        <DashboardHero
          data={data}
          buildingId={buildingId}
          range={range}
          setBuildingId={setBuildingId}
          setRange={setRange}
          exportHref={exportHref}
          occupancyRate={occupancyRate}
        />
      </div>

      <div className="hidden md:block">
        <KpiGrid data={data} />
      </div>
      <div className="hidden md:block">
        <AttentionGrid data={data} />
      </div>
      <div className="hidden md:block">
        <OperationalGrid data={data} formatDate={(value) => formatDate(new Date(value))} />
      </div>
      <div className="hidden md:block">
        <RiskAndSystemGrid
          data={data}
          formatCurrency={formatCurrency}
          formatDate={(value) => formatDate(new Date(value))}
        />
      </div>
    </div>
  );
}
