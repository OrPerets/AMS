import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BellRing, CalendarClock, CheckCircle2, ClipboardList, FileText, Wrench } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { formatCurrency, formatDate, getStatusLabel } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/use-toast';

interface Building {
  id: number;
  name: string;
}

interface MaintenanceSchedule {
  id: number;
  buildingId: number;
  title: string;
  description?: string | null;
  category: string;
  type: string;
  frequency: string;
  startDate: string;
  nextOccurrence?: string | null;
  priority: string;
  estimatedCost?: number | null;
  lastCompleted?: string | null;
  completionVerified: boolean;
  building: {
    id: number;
    name: string;
  };
  assignedTo?: {
    id: number;
    email: string;
  } | null;
  histories?: Array<{ id: number }>;
}

interface CostProjection {
  totalEstimatedCost: number;
  byPriority: Record<string, { count: number; estimatedCost: number }>;
}

const initialForm = {
  buildingId: '',
  title: '',
  description: '',
  category: 'GENERAL',
  type: 'PREVENTIVE',
  frequency: 'MONTHLY',
  startDate: '',
  estimatedCost: '',
};

export default function MaintenanceDashboardPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceSchedule[]>([]);
  const [projection, setProjection] = useState<CostProjection | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedBuildingNumericId = selectedBuildingId === 'all' ? null : Number(selectedBuildingId);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [buildingsRes, schedulesRes] = await Promise.all([
        authFetch('/api/v1/buildings'),
        authFetch('/api/v1/maintenance'),
      ]);

      if (!buildingsRes.ok || !schedulesRes.ok) {
        throw new Error('Failed to load maintenance dashboard');
      }

      const [buildingsData, schedulesData] = await Promise.all([buildingsRes.json(), schedulesRes.json()]);
      setBuildings(Array.isArray(buildingsData) ? buildingsData : []);
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);

      const defaultBuildingId =
        selectedBuildingNumericId ??
        (Array.isArray(buildingsData) && buildingsData.length > 0 ? buildingsData[0].id : null);

      if (defaultBuildingId) {
        setSelectedBuildingId(String(defaultBuildingId));
      }
    } catch (error) {
      toast({ title: 'שגיאה בטעינת התחזוקה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadBuildingInsights = async (buildingId: number) => {
    try {
      const [alertsRes, projectionRes] = await Promise.all([
        authFetch(`/api/v1/maintenance/building/${buildingId}/alerts`),
        authFetch(`/api/v1/maintenance/building/${buildingId}/cost-projection`),
      ]);

      if (alertsRes.ok) {
        setAlerts(await alertsRes.json());
      } else {
        setAlerts([]);
      }

      if (projectionRes.ok) {
        setProjection(await projectionRes.json());
      } else {
        setProjection(null);
      }
    } catch (error) {
      setAlerts([]);
      setProjection(null);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (selectedBuildingNumericId) {
      void loadBuildingInsights(selectedBuildingNumericId);
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

  const stats = useMemo(() => {
    const now = Date.now();
    const upcomingWindow = now + 1000 * 60 * 60 * 24 * 7;

    return {
      total: filteredSchedules.length,
      verified: filteredSchedules.filter((schedule) => schedule.completionVerified).length,
      overdue: filteredSchedules.filter((schedule) => {
        const date = schedule.nextOccurrence ?? schedule.startDate;
        return new Date(date).getTime() < now;
      }).length,
      upcoming: filteredSchedules.filter((schedule) => {
        const date = schedule.nextOccurrence ?? schedule.startDate;
        const time = new Date(date).getTime();
        return time >= now && time <= upcomingWindow;
      }).length,
    };
  }, [filteredSchedules]);

  const createSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.buildingId || !form.title || !form.startDate) {
      toast({ title: 'חסרים שדות חובה', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await authFetch('/api/v1/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: Number(form.buildingId),
          title: form.title,
          description: form.description || undefined,
          category: form.category,
          type: form.type,
          frequency: form.frequency,
          recurrenceRule: form.frequency,
          startDate: new Date(form.startDate).toISOString(),
          estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({ title: 'משימת תחזוקה נוצרה' });
      setForm(initialForm);
      await loadDashboard();
    } catch (error: any) {
      toast({
        title: 'שגיאה ביצירת משימה',
        description: error?.message || 'נסו שוב',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">ניהול תחזוקה שוטף</p>
          <h1 className="text-3xl font-bold">תחזוקה ותפעול</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/work-orders/reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              דוחות הזמנות עבודה
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/maintenance/reports" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              דוחות תחזוקה
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">סה"כ משימות</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">מאומתות</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            {stats.verified}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">קרובות לביצוע</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <CalendarClock className="h-5 w-5 text-blue-600" />
            {stats.upcoming}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">בחריגה</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <BellRing className="h-5 w-5 text-amber-600" />
            {stats.overdue}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>סינון לפי בניין</CardTitle>
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

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>לוח משימות תחזוקה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredSchedules.map((schedule) => (
              <Link
                key={schedule.id}
                href={`/maintenance/${schedule.id}`}
                className="flex items-center justify-between rounded-lg border p-4 transition hover:border-primary/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{schedule.title}</span>
                    <Badge variant="outline">{schedule.priority}</Badge>
                    {schedule.completionVerified && <Badge variant="secondary">מאומת</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {schedule.building.name} • {schedule.category} • {schedule.frequency}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    מועד הבא: {formatDate(schedule.nextOccurrence ?? schedule.startDate)}
                  </p>
                </div>
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            {filteredSchedules.length === 0 && (
              <p className="text-sm text-muted-foreground">לא נמצאו משימות תחזוקה עבור הסינון שנבחר.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5" />
                התראות קרובות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-muted-foreground">{formatDate(alert.nextOccurrence ?? alert.startDate)}</p>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-sm text-muted-foreground">אין התראות קרובות לבניין הנבחר.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                תחזית עלויות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium">
                סה"כ צפוי: {projection ? formatCurrency(projection.totalEstimatedCost) : formatCurrency(0)}
              </p>
              {projection && Object.entries(projection.byPriority).map(([priority, value]) => (
                <div key={priority} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>{priority}</span>
                  <span>
                    {value.count} משימות • {formatCurrency(value.estimatedCost)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            תזמון משימת תחזוקה חדשה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createSchedule} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">בניין</label>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.buildingId}
                onChange={(event) => setForm((current) => ({ ...current, buildingId: event.target.value }))}
              >
                <option value="">בחר בניין</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">כותרת</label>
              <Input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">קטגוריה</label>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              >
                <option value="GENERAL">GENERAL</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="PLUMBING">PLUMBING</option>
                <option value="HVAC">HVAC</option>
                <option value="SAFETY">SAFETY</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">סוג</label>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
              >
                <option value="PREVENTIVE">PREVENTIVE</option>
                <option value="CORRECTIVE">CORRECTIVE</option>
                <option value="INSPECTION">INSPECTION</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">תדירות</label>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.frequency}
                onChange={(event) => setForm((current) => ({ ...current, frequency: event.target.value }))}
              >
                <option value="DAILY">DAILY</option>
                <option value="WEEKLY">WEEKLY</option>
                <option value="MONTHLY">MONTHLY</option>
                <option value="QUARTERLY">QUARTERLY</option>
                <option value="ANNUAL">ANNUAL</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">מועד התחלה</label>
              <Input
                type="datetime-local"
                value={form.startDate}
                onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">עלות משוערת</label>
              <Input
                type="number"
                value={form.estimatedCost}
                onChange={(event) => setForm((current) => ({ ...current, estimatedCost: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">תיאור</label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={4}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'יוצר...' : 'צור משימת תחזוקה'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
