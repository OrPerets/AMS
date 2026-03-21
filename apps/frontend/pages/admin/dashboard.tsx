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

export default function AdminDashboardPage() {
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

  if (loading || !data) {
    if (!loading && error) {
      return <InlineErrorPanel title="מרכז הבקרה לא נטען" description={error} onRetry={loadDashboard} />;
    }

    return <DashboardPageSkeleton />;
  }

  return (
    <div className="space-y-8">
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

      <KpiGrid data={data} />
      <AttentionGrid data={data} />
      <OperationalGrid data={data} formatDate={(value) => formatDate(new Date(value))} />
      <RiskAndSystemGrid
        data={data}
        formatCurrency={formatCurrency}
        formatDate={(value) => formatDate(new Date(value))}
      />
    </div>
  );
}
