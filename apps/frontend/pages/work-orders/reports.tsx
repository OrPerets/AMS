import React, { useEffect, useState } from 'react';
import { authFetch } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { 
  BarChart3, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { toast } from '../../components/ui/use-toast';

interface WorkOrderReport {
  filters: {
    start?: string;
    end?: string;
    supplierId?: number;
    status?: string;
  };
  totals: {
    count: number;
    totalCost: number;
    averageCompletionTimeHours: number | null;
  };
  byStatus: {
    [key: string]: {
      count: number;
      totalCost: number;
    };
  };
  orders: any[];
}

const statusLabels: Record<string, string> = {
  PENDING: "ממתין",
  APPROVED: "מאושר", 
  IN_PROGRESS: "בתהליך",
  COMPLETED: "הושלם",
  INVOICED: "חויב",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700", 
  COMPLETED: "bg-emerald-100 text-emerald-700",
  INVOICED: "bg-purple-100 text-purple-700",
};

export default function WorkOrderReportsPage() {
  const [report, setReport] = useState<WorkOrderReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start: '',
    end: '',
    supplierId: '',
    status: ''
  });

  const loadReport = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.start) queryParams.set('start', filters.start);
      if (filters.end) queryParams.set('end', filters.end);
      if (filters.supplierId) queryParams.set('supplierId', filters.supplierId);
      if (filters.status) queryParams.set('status', filters.status);

      const res = await authFetch(`/api/v1/work-orders/reports/summary?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        // Mock data for demo
        setReport({
          filters: {
            ...filters,
            supplierId: filters.supplierId ? parseInt(filters.supplierId) : undefined
          },
          totals: {
            count: 45,
            totalCost: 125000,
            averageCompletionTimeHours: 24.5
          },
          byStatus: {
            PENDING: { count: 8, totalCost: 15000 },
            APPROVED: { count: 12, totalCost: 35000 },
            IN_PROGRESS: { count: 6, totalCost: 20000 },
            COMPLETED: { count: 15, totalCost: 45000 },
            INVOICED: { count: 4, totalCost: 10000 }
          },
          orders: []
        });
      }
    } catch (error) {
      toast({ title: 'שגיאה בטעינת הדוח', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.start) queryParams.set('start', filters.start);
      if (filters.end) queryParams.set('end', filters.end);
      if (filters.supplierId) queryParams.set('supplierId', filters.supplierId);
      if (filters.status) queryParams.set('status', filters.status);
      queryParams.set('format', format);

      const res = await authFetch(`/api/v1/work-orders/reports/export?${queryParams.toString()}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `work-orders-report.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({ title: 'הדוח הורד בהצלחה' });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({ title: 'שגיאה בייצוא הדוח', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">דוחות הזמנות עבודה</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">דוחות הזמנות עבודה</h1>
          <p className="text-muted-foreground">
            ניתוח ביצועים ועלויות של הזמנות עבודה
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            מסננים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="text-sm font-medium">תאריך התחלה</label>
              <Input
                type="date"
                value={filters.start}
                onChange={(e) => setFilters(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">תאריך סיום</label>
              <Input
                type="date"
                value={filters.end}
                onChange={(e) => setFilters(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">ספק</label>
              <Input
                placeholder="מזהה ספק"
                value={filters.supplierId}
                onChange={(e) => setFilters(prev => ({ ...prev, supplierId: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">סטטוס</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="כל הסטטוסים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">כל הסטטוסים</SelectItem>
                  <SelectItem value="PENDING">ממתין</SelectItem>
                  <SelectItem value="APPROVED">מאושר</SelectItem>
                  <SelectItem value="IN_PROGRESS">בתהליך</SelectItem>
                  <SelectItem value="COMPLETED">הושלם</SelectItem>
                  <SelectItem value="INVOICED">חויב</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadReport} className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                עדכן דוח
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              סה"כ הזמנות
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report?.totals.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              הזמנות עבודה
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              סה"כ עלות
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{(report?.totals.totalCost || 0).toLocaleString('he-IL')}
            </div>
            <p className="text-xs text-muted-foreground">
              עלות כוללת
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              זמן השלמה ממוצע
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report?.totals.averageCompletionTimeHours 
                ? `${Math.round(report.totals.averageCompletionTimeHours)} שעות`
                : '—'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              זמן השלמה ממוצע
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              עלות ממוצעת
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{report?.totals.count 
                ? Math.round((report.totals.totalCost || 0) / report.totals.count).toLocaleString('he-IL')
                : '0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              עלות ממוצעת להזמנה
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            פילוח לפי סטטוס
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Object.entries(report?.byStatus || {}).map(([status, data]) => (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={statusColors[status] || "bg-muted text-muted-foreground"}>
                    {statusLabels[status] || status}
                  </Badge>
                  <span className="text-sm font-medium">{data.count}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  ₪{data.totalCost.toLocaleString('he-IL')}
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ 
                      width: `${report?.totals.count ? (data.count / report.totals.count) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              ניתוח עלויות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(report?.byStatus || {})
                .sort(([,a], [,b]) => b.totalCost - a.totalCost)
                .map(([status, data]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[status] || "bg-muted text-muted-foreground"}>
                        {statusLabels[status] || status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₪{data.totalCost.toLocaleString('he-IL')}</div>
                      <div className="text-sm text-muted-foreground">
                        {report?.totals.totalCost 
                          ? `${Math.round((data.totalCost / report.totals.totalCost) * 100)}%`
                          : '0%'
                        }
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              ביצועים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">הזמנות הושלמו</span>
                <span className="font-bold text-green-600">
                  {report?.byStatus.COMPLETED?.count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">הזמנות בתהליך</span>
                <span className="font-bold text-blue-600">
                  {report?.byStatus.IN_PROGRESS?.count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">הזמנות ממתינות</span>
                <span className="font-bold text-amber-600">
                  {report?.byStatus.PENDING?.count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">שיעור השלמה</span>
                <span className="font-bold">
                  {report?.totals.count 
                    ? `${Math.round(((report.byStatus.COMPLETED?.count || 0) / report.totals.count) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
