import { useEffect, useMemo, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { SectionHeader } from '../../components/ui/section-header';
import { Button } from '../../components/ui/button';
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

  if (loading || !data) {
    if (!loading && error) {
      return <InlineErrorPanel title="מרכז הבקרה לא נטען" description={error} onRetry={loadDashboard} />;
    }

    return <DashboardPageSkeleton />;
  }

  return (
    <div className="space-y-5 sm:space-y-8">
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

      {error ? (
        <InlineErrorPanel
          className="border-warning/40 bg-warning/5 text-foreground"
          title="מוצגים הנתונים האחרונים שהצליחו להיטען"
          description={error}
          onRetry={loadDashboard}
        />
      ) : null}

      <DashboardHero
        data={data}
        buildingId={buildingId}
        range={range}
        setBuildingId={setBuildingId}
        setRange={setRange}
        exportHref={exportHref}
        occupancyRate={occupancyRate}
      />

      <div className="md:hidden">
        <MobilePriorityInbox
          title={t('adminDashboard.mobile.triageTitle')}
          subtitle={t('adminDashboard.mobile.triageSubtitle')}
          items={mobilePriorityItems}
        />

        <div className="grid gap-4">
          <Card variant="elevated">
            <CardHeader>
              <SectionHeader
                title={t('adminDashboard.mobile.portfolioHealthTitle')}
                subtitle={t('adminDashboard.mobile.portfolioHealthSubtitle')}
                meta={t('adminDashboard.mobile.overview')}
              />
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <CompactMetric label={t('adminDashboard.mobile.openTicketsMetric')} value={data.portfolioKpis.openTickets} />
              <CompactMetric label={t('adminDashboard.mobile.slaBreachesMetric')} value={data.portfolioKpis.slaBreaches} />
              <CompactMetric label={t('adminDashboard.mobile.unpaidBalanceMetric')} value={formatCurrency(data.portfolioKpis.unpaidBalance)} />
              <CompactMetric label={t('adminDashboard.mobile.occupancyMetric')} value={`${occupancyRate}%`} />
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <SectionHeader
                title={t('adminDashboard.mobile.decisionShortcutsTitle')}
                subtitle={t('adminDashboard.mobile.decisionShortcutsSubtitle')}
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

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>{t('adminDashboard.mobile.systemAlertsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <details className="rounded-[20px] border border-subtle-border bg-background/88 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">{t('adminDashboard.mobile.systemHealthTitle')}</summary>
                <div className="mt-3 space-y-2">
                  {Object.values(data.systemAdmin.health).map((item) => (
                    <div key={item.label} className="rounded-2xl border border-subtle-border bg-muted/20 px-3 py-2.5">
                      <div className="text-sm font-medium text-foreground">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.value} · {item.description}</div>
                    </div>
                  ))}
                </div>
              </details>
              <details className="rounded-[20px] border border-subtle-border bg-background/88 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">{t('adminDashboard.mobile.sensitiveActivityTitle')}</summary>
                <div className="mt-3 space-y-2">
                  <div className="rounded-2xl border border-subtle-border bg-muted/20 px-3 py-2.5 text-sm text-foreground">
                    {t('adminDashboard.mobile.impersonationEvents', { count: data.systemAdmin.recentImpersonationEvents.length })}
                  </div>
                  <div className="rounded-2xl border border-subtle-border bg-muted/20 px-3 py-2.5 text-sm text-foreground">
                    {t('adminDashboard.mobile.approvalsCurrentlyWaiting', { count: data.systemAdmin.stats.pendingApprovals })}
                  </div>
                </div>
              </details>
            </CardContent>
          </Card>
        </div>
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

function CompactMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[20px] border border-subtle-border bg-background/88 p-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-tertiary">{label}</div>
      <div className="mt-1 text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}
