import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, BellRing, FileText, ShieldCheck } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../components/ui/use-toast';

interface Building {
  id: number;
  name: string;
}

interface MaintenanceSchedule {
  id: number;
  buildingId: number;
  title: string;
  category: string;
  priority: string;
  nextOccurrence?: string | null;
  startDate: string;
  estimatedCost?: number | null;
  completionVerified: boolean;
  building: {
    id: number;
    name: string;
  };
}

interface CostProjection {
  totalEstimatedCost: number;
  byPriority: Record<string, { count: number; estimatedCost: number }>;
}

interface ExceptionSummary {
  summary: {
    unverifiedMaintenance: number;
    overdueMaintenance: number;
    urgentTickets: number;
    openWorkOrders: number;
  };
}

export default function MaintenanceReportsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceSchedule[]>([]);
  const [projection, setProjection] = useState<CostProjection | null>(null);
  const [exceptions, setExceptions] = useState<ExceptionSummary | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const selectedBuildingNumericId = selectedBuildingId === 'all' ? null : Number(selectedBuildingId);

  const loadReport = async () => {
    setLoading(true);
    try {
      const [buildingsRes, schedulesRes] = await Promise.all([
        authFetch('/api/v1/buildings'),
        authFetch('/api/v1/maintenance'),
      ]);

      if (!buildingsRes.ok || !schedulesRes.ok) {
        throw new Error('Failed to load maintenance report');
      }

      const [buildingsData, schedulesData] = await Promise.all([buildingsRes.json(), schedulesRes.json()]);
      setBuildings(Array.isArray(buildingsData) ? buildingsData : []);
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
    } catch (error) {
      toast({ title: 'שגיאה בטעינת דוחות התחזוקה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadBuildingBreakdown = async (buildingId: number) => {
    try {
      const [alertsRes, projectionRes, exceptionsRes] = await Promise.all([
        authFetch(`/api/v1/maintenance/building/${buildingId}/alerts`),
        authFetch(`/api/v1/maintenance/building/${buildingId}/cost-projection`),
        authFetch(`/api/v1/maintenance/exceptions?buildingId=${buildingId}`),
      ]);

      setAlerts(alertsRes.ok ? await alertsRes.json() : []);
      setProjection(projectionRes.ok ? await projectionRes.json() : null);
      setExceptions(exceptionsRes.ok ? await exceptionsRes.json() : null);
    } catch (error) {
      setAlerts([]);
      setProjection(null);
      setExceptions(null);
    }
  };

  useEffect(() => {
    void loadReport();
  }, []);

  useEffect(() => {
    if (selectedBuildingNumericId) {
      void loadBuildingBreakdown(selectedBuildingNumericId);
    } else {
      setAlerts([]);
      setProjection(null);
    }
  }, [selectedBuildingNumericId]);

  const filteredSchedules = useMemo(() => {
    if (!selectedBuildingNumericId) {
      return schedules;
    }
    return schedules.filter((schedule) => schedule.buildingId === selectedBuildingNumericId);
  }, [schedules, selectedBuildingNumericId]);

  const byCategory = useMemo(() => {
    return filteredSchedules.reduce<Record<string, number>>((acc, schedule) => {
      acc[schedule.category] = (acc[schedule.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [filteredSchedules]);

  const byPriority = useMemo(() => {
    return filteredSchedules.reduce<Record<string, number>>((acc, schedule) => {
      acc[schedule.priority] = (acc[schedule.priority] ?? 0) + 1;
      return acc;
    }, {});
  }, [filteredSchedules]);

  const totalEstimatedCost = useMemo(() => {
    return filteredSchedules.reduce((sum, schedule) => sum + (schedule.estimatedCost ?? 0), 0);
  }, [filteredSchedules]);

  if (loading) {
    return <div>טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">ניתוח פעילות תחזוקה</p>
          <h1 className="text-3xl font-bold">דוחות תחזוקה</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/maintenance" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            חזרה לתחזוקה
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>מסנן בניין</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedBuildingId}
            onChange={(event) => setSelectedBuildingId(event.target.value)}
          >
            <option value="all">כל הבניינים</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">סה"כ משימות</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{filteredSchedules.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">מאומתות</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            {filteredSchedules.filter((schedule) => schedule.completionVerified).length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">עלות משוערת</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(totalEstimatedCost)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">התראות קרובות</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <BellRing className="h-5 w-5 text-amber-600" />
            {alerts.length}
          </CardContent>
        </Card>
      </div>

      {exceptions && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">לא אומתו</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{exceptions.summary.unverifiedMaintenance}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">באיחור</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{exceptions.summary.overdueMaintenance}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">קריאות דחופות</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{exceptions.summary.urgentTickets}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">הזמנות פתוחות</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{exceptions.summary.openWorkOrders}</CardContent></Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              חלוקה לפי קטגוריה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(byCategory).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span>{category}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
            {Object.keys(byCategory).length === 0 && <p className="text-sm text-muted-foreground">אין נתונים להצגה.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              חלוקה לפי עדיפות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(byPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span>{priority}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
            {Object.keys(byPriority).length === 0 && <p className="text-sm text-muted-foreground">אין נתונים להצגה.</p>}
          </CardContent>
        </Card>
      </div>

      {projection && (
        <Card>
          <CardHeader>
            <CardTitle>תחזית עלויות לבניין הנבחר</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-medium">סה"כ צפוי: {formatCurrency(projection.totalEstimatedCost)}</p>
            {Object.entries(projection.byPriority).map(([priority, value]) => (
              <div key={priority} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span>{priority}</span>
                <span>
                  {value.count} משימות • {formatCurrency(value.estimatedCost)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>משימות קרובות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredSchedules
            .slice()
            .sort((a, b) => new Date(a.nextOccurrence ?? a.startDate).getTime() - new Date(b.nextOccurrence ?? b.startDate).getTime())
            .slice(0, 10)
            .map((schedule) => (
              <div key={schedule.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{schedule.title}</span>
                  <Badge variant="outline">{schedule.priority}</Badge>
                  {schedule.completionVerified && <Badge variant="secondary">מאומת</Badge>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {schedule.building.name} • {formatDate(schedule.nextOccurrence ?? schedule.startDate)}
                </p>
              </div>
            ))}
          {filteredSchedules.length === 0 && <p className="text-sm text-muted-foreground">אין משימות תחזוקה להצגה.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
