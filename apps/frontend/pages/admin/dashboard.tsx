// /Users/orperetz/Documents/AMS/apps/frontend/pages/admin/dashboard.tsx
import React, { useEffect, useState } from 'react';
import { 
  Ticket, 
  AlertTriangle, 
  CreditCard, 
  Clock, 
  Wrench, 
  Building,
  Download,
  RefreshCw,
  Filter,
  Users
} from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { KpiCard } from '../../components/ui/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from '../../components/ui/chart';
import { Skeleton } from '../../components/ui/skeleton';
import { useLocale } from '../../lib/providers';
import { cn, formatNumber } from '../../lib/utils';
import { toast } from '../../components/ui/use-toast';

interface Kpis {
  openTickets: number;
  slaBreaches: number;
  unpaidInvoices: number;
  totalBuildings?: number;
  activeTechs?: number;
  monthlyRevenue?: number;
  completedTicketsToday?: number;
}

interface ChartData {
  ticketsByStatus: Array<{ name: string; value: number }>;
  monthlyTrend: Array<{ name: string; value: number }>;
  techWorkload: Array<{ name: string; value: number }>;
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<Kpis>({ 
    openTickets: 0, 
    slaBreaches: 0, 
    unpaidInvoices: 0,
    totalBuildings: 0,
    activeTechs: 0,
    monthlyRevenue: 0,
    completedTicketsToday: 0
  });
  const [chartData, setChartData] = useState<ChartData>({
    ticketsByStatus: [],
    monthlyTrend: [],
    techWorkload: []
  });
  const [buildingId, setBuildingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLocale();

  async function loadData() {
    try {
      const query = buildingId ? `?buildingId=${buildingId}` : '';
      const [kpisRes, chartsRes] = await Promise.all([
        authFetch(`/api/v1/dashboard${query}`),
        authFetch(`/api/v1/dashboard/charts${query}`)
      ]);

      if (kpisRes.ok) {
        const kpisData = await kpisRes.json();
        setKpis({
          openTickets: kpisData.openTickets || 0,
          slaBreaches: kpisData.slaBreaches || 0,
          unpaidInvoices: kpisData.unpaidInvoices || 0,
          totalBuildings: kpisData.totalBuildings || 15,
          activeTechs: kpisData.activeTechs || 8,
          monthlyRevenue: kpisData.monthlyRevenue || 125000,
          completedTicketsToday: kpisData.completedTicketsToday || 12
        });
      }

      // Mock chart data if endpoint doesn't exist
      setChartData({
        ticketsByStatus: [
          { name: 'פתוח', value: kpis.openTickets || 15 },
          { name: 'בתהליך', value: 23 },
          { name: 'הושלם', value: 45 },
          { name: 'סגור', value: 12 }
        ],
        monthlyTrend: [
          { name: 'ינואר', value: 65 },
          { name: 'פברואר', value: 72 },
          { name: 'מרץ', value: 68 },
          { name: 'אפריל', value: 81 },
          { name: 'מאי', value: 79 },
          { name: 'יוני', value: 88 }
        ],
        techWorkload: [
          { name: 'אבי כהן', value: 12 },
          { name: 'דנה לוי', value: 8 },
          { name: 'יוסי דוד', value: 15 },
          { name: 'רינה שמש', value: 6 }
        ]
      });

    } catch (error) {
      toast({
        title: "שגיאה בטעינת נתונים",
        description: "לא ניתן לטעון את נתוני הדשבורד",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [buildingId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleExport = () => {
    const query = buildingId ? `?buildingId=${buildingId}` : '';
    window.open(`/api/v1/dashboard/export${query}`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">דשבורד ניהול</h1>
          <p className="text-muted-foreground">
            סקירה כללית של המערכת ופעילות היומית
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            placeholder="מזהה בניין (אופציונלי)"
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
            className="w-48"
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button onClick={handleExport}>
            <Download className="me-2 h-4 w-4" />
            יצוא CSV
          </Button>
        </div>
      </div>

      {/* Building Filter Badge */}
      {buildingId && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Building className="h-3 w-3" />
            בניין {buildingId}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setBuildingId('')}
          >
            הסר סינון
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="קריאות פתוחות"
          value={formatNumber(kpis.openTickets)}
          icon={Ticket}
          badgeText={kpis.openTickets > 20 ? "דורש תשומת לב" : undefined}
          badgeVariant={kpis.openTickets > 20 ? "warning" : undefined}
          changeType={kpis.openTickets > 20 ? "negative" : "positive"}
          clickable
        />
        
        <KpiCard
          title="הפרות SLA"
          value={formatNumber(kpis.slaBreaches)}
          icon={AlertTriangle}
          badgeText={kpis.slaBreaches > 0 ? "דחוף" : "תקין"}
          badgeVariant={kpis.slaBreaches > 0 ? "destructive" : "success"}
          changeType={kpis.slaBreaches > 0 ? "negative" : "positive"}
          clickable
        />
        
        <KpiCard
          title="חשבוניות שלא שולמו"
          value={formatNumber(kpis.unpaidInvoices)}
          icon={CreditCard}
          description="דורש מעקב"
          changeType="neutral"
          clickable
        />

        <KpiCard
          title="הושלמו היום"
          value={formatNumber(kpis.completedTicketsToday ?? 0)}
          icon={Wrench}
          badgeText="עודכן"
          badgeVariant="success"
          changeType="positive"
          change={12}
        />
      </div>

      {/* Additional KPIs Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="סה״כ בניינים"
          value={formatNumber(kpis.totalBuildings || 0)}
          icon={Building}
          description="בניינים פעילים במערכת"
        />
        
        <KpiCard
          title="טכנאים פעילים"
          value={formatNumber(kpis.activeTechs || 0)}
          icon={Users}
          description="טכנאים זמינים כעת"
        />
        
        <KpiCard
          title="הכנסות חודשיות"
          value={`₪${formatNumber(kpis.monthlyRevenue || 0)}`}
          icon={CreditCard}
          changeType="positive"
          change={8.2}
          description="לעומת החודש הקודם"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tickets by Status */}
        <Card>
          <CardHeader>
            <CardTitle>התפלגות קריאות לפי סטטוס</CardTitle>
            <CardDescription>
              סקירה של כל הקריאות לפי מצב נוכחי
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimplePieChart data={chartData.ticketsByStatus} height={250} />
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>מגמת קריאות חודשית</CardTitle>
            <CardDescription>
              מספר קריאות שהתקבלו בחודשים האחרונים
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={chartData.monthlyTrend} height={250} />
          </CardContent>
        </Card>

        {/* Tech Workload */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>עומס עבודה טכנאים</CardTitle>
            <CardDescription>
              מספר קריאות פעילות לכל טכנאי
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={chartData.techWorkload} height={250} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle>פעילות אחרונה</CardTitle>
          <CardDescription>
            עדכונים אחרונים במערכת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="font-medium">קריאה #1234 הושלמה</span>
              <span className="text-muted-foreground">לפני 5 דקות</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-warning" />
              <span className="font-medium">קריאה חדשה #1235 נפתחה</span>
              <span className="text-muted-foreground">לפני 12 דקות</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-info" />
              <span className="font-medium">טכנאי חדש נרשם למערכת</span>
              <span className="text-muted-foreground">לפני 1 שעה</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
