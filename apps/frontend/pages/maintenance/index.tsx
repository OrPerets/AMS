import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Search,
  Wrench,
} from 'lucide-react';
import { authFetch } from '../../lib/auth';
import {
  formatCurrency,
  formatDate,
  getMaintenanceCategoryLabel,
  getMaintenanceFrequencyLabel,
  getMaintenanceTypeLabel,
  getPriorityTone,
} from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import { FormField } from '../../components/ui/form-field';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { Input } from '../../components/ui/input';
import { TableListSkeleton } from '../../components/ui/page-states';
import { PageHero } from '../../components/ui/page-hero';
import { SectionHeader } from '../../components/ui/section-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { StatusBadge } from '../../components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
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
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceSchedule[]>([]);
  const [projection, setProjection] = useState<CostProjection | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedBuildingNumericId = selectedBuildingId === 'all' ? null : Number(selectedBuildingId);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

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
    } catch (loadError) {
      console.error(loadError);
      setError('לא ניתן לטעון כרגע את מרכז התחזוקה.');
      setBuildings([]);
      setSchedules([]);
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

      setAlerts(alertsRes.ok ? await alertsRes.json() : []);
      setProjection(projectionRes.ok ? await projectionRes.json() : null);
    } catch (loadError) {
      console.error(loadError);
      setAlerts([]);
      setProjection(null);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const matchesBuilding = !selectedBuildingNumericId || schedule.buildingId === selectedBuildingNumericId;
      const matchesType = typeFilter === 'ALL' || schedule.type === typeFilter;
      const matchesQuery =
        !query.trim() ||
        schedule.title.toLowerCase().includes(query.trim().toLowerCase()) ||
        schedule.building.name.toLowerCase().includes(query.trim().toLowerCase());

      return matchesBuilding && matchesType && matchesQuery;
    });
  }, [query, schedules, selectedBuildingNumericId, typeFilter]);

  useEffect(() => {
    if (!filteredSchedules.length) {
      setSelectedScheduleId(null);
      return;
    }

    const visible = filteredSchedules.some((schedule) => schedule.id === selectedScheduleId);
    if (!visible) {
      setSelectedScheduleId(filteredSchedules[0].id);
    }
  }, [filteredSchedules, selectedScheduleId]);

  const selectedSchedule = filteredSchedules.find((schedule) => schedule.id === selectedScheduleId) ?? null;
  const insightBuildingId = selectedBuildingNumericId ?? selectedSchedule?.buildingId ?? null;

  useEffect(() => {
    if (insightBuildingId) {
      void loadBuildingInsights(insightBuildingId);
      return;
    }

    setAlerts([]);
    setProjection(null);
  }, [insightBuildingId]);

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

  const formErrors = useMemo(() => {
    return {
      buildingId: form.buildingId ? '' : 'יש לבחור בניין.',
      title: form.title.trim() ? '' : 'יש להזין כותרת למשימה.',
      startDate: form.startDate ? '' : 'יש לקבוע מועד התחלה.',
    };
  }, [form.buildingId, form.startDate, form.title]);

  const createSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formErrors.buildingId || formErrors.title || formErrors.startDate) {
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
    } catch (submitError: any) {
      toast({
        title: 'שגיאה ביצירת משימה',
        description: submitError?.message || 'נסו שוב',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHero
        kicker="Maintenance operations unified"
        eyebrow={<StatusBadge label="Operations" tone="finance" />}
        title="תחזוקה ותפעול"
        description="המסך עודכן לתבנית אחידה: פילטרים משותפים, טבלת משימות סריקה, סטטוסים ברורים בין מונעת/מתקנת/בדיקה, וטופס יצירה עם ולידציה בסיסית."
        actions={
          <>
            <Button asChild variant="hero">
              <Link href="/maintenance/reports">
                <ArrowLeft className="me-2 h-4 w-4 icon-directional" />
                דוחות תחזוקה
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <Link href="/work-orders/reports">
                <FileText className="me-2 h-4 w-4" />
                דוחות הזמנות עבודה
              </Link>
            </Button>
          </>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-2 text-white">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55">משימות בסינון</div>
              <div className="mt-2 text-2xl font-black">{stats.total}</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55">בחריגה</div>
              <div className="mt-2 text-2xl font-black">{stats.overdue}</div>
            </div>
          </div>
        }
      />

      {loading ? (
        <TableListSkeleton rows={6} columns={6} />
      ) : error ? (
        <InlineErrorPanel title="מרכז התחזוקה לא נטען" description={error} onRetry={loadDashboard} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="סה״כ משימות" value={stats.total} />
            <MetricCard title="מאומתות" value={stats.verified} icon={<CheckCircle2 className="h-5 w-5 text-success" />} />
            <MetricCard title="קרובות לביצוע" value={stats.upcoming} icon={<CalendarClock className="h-5 w-5 text-info" />} />
            <MetricCard title="התראות" value={alerts.length} icon={<BellRing className="h-5 w-5 text-warning" />} />
          </div>

          <Card variant="elevated">
            <CardContent className="space-y-6 p-6">
              <SectionHeader
                title="פילטרים"
                subtitle="חיפוש, סינון לפי בניין וסוג עבודה, והכנה לשכבת בחירה מרובה במסך הטבלה."
                meta="Bulk-ready"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="חיפוש משימה">
                  <div className="relative">
                    <Search className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="כותרת משימה או שם בניין"
                      className="pe-10"
                    />
                  </div>
                </FormField>

                <FormField label="בניין">
                  <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הבניינים</SelectItem>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={String(building.id)}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="סוג משימה">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">כל הסוגים</SelectItem>
                      <SelectItem value="PREVENTIVE">מונעת</SelectItem>
                      <SelectItem value="CORRECTIVE">מתקנת</SelectItem>
                      <SelectItem value="INSPECTION">בדיקה</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
            <Card variant="elevated">
              <CardContent className="space-y-6 p-6">
                <SectionHeader
                  title="לוח משימות תחזוקה"
                  subtitle="תצוגת טבלה סריקה עם עמודות קבועות לקראת פעולות מרובות בעתיד."
                  meta={`${filteredSchedules.length} שורות`}
                  actions={
                    <Button variant="outline" size="sm" disabled>
                      0 נבחרו
                    </Button>
                  }
                />

                {filteredSchedules.length === 0 ? (
                  <EmptyState
                    type={query || typeFilter !== 'ALL' || selectedBuildingId !== 'all' ? 'search' : 'empty'}
                    title={query || typeFilter !== 'ALL' || selectedBuildingId !== 'all' ? 'אין משימות עבור הסינון הנוכחי' : 'אין עדיין משימות תחזוקה'}
                    description={
                      query || typeFilter !== 'ALL' || selectedBuildingId !== 'all'
                        ? 'נסה להסיר מסננים או לעבור לבניין אחר.'
                        : 'צור משימת תחזוקה חדשה כדי להתחיל לבנות לוח עבודה תפעולי.'
                    }
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">משימה</TableHead>
                        <TableHead className="text-right">בניין</TableHead>
                        <TableHead className="text-right">סוג</TableHead>
                        <TableHead className="text-right">קצב</TableHead>
                        <TableHead className="text-right">מצב</TableHead>
                        <TableHead className="text-right">מועד הבא</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchedules.map((schedule) => (
                        <TableRow
                          key={schedule.id}
                          className={`cursor-pointer ${selectedScheduleId === schedule.id ? 'bg-muted/60' : ''}`}
                          onClick={() => setSelectedScheduleId(schedule.id)}
                        >
                          <TableCell>
                            <div className="space-y-2">
                              <div className="font-semibold text-foreground">{schedule.title}</div>
                              <div className="text-sm text-muted-foreground">{schedule.description || 'ללא תיאור נוסף'}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium">{schedule.building.name}</div>
                            <div className="text-xs text-muted-foreground">{getMaintenanceCategoryLabel(schedule.category)}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <StatusBadge label={getMaintenanceTypeLabel(schedule.type)} tone={schedule.type === 'PREVENTIVE' ? 'active' : schedule.type === 'CORRECTIVE' ? 'warning' : 'neutral'} />
                              <StatusBadge label={schedule.priority} tone={getPriorityTone(schedule.priority)} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{getMaintenanceFrequencyLabel(schedule.frequency)}</TableCell>
                          <TableCell className="text-right">
                            {schedule.completionVerified ? <StatusBadge label="מאומתת" tone="success" /> : <StatusBadge label="ממתינה לאימות" tone="warning" />}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium">{formatDate(schedule.nextOccurrence ?? schedule.startDate)}</div>
                            <div className="text-xs text-muted-foreground">
                              {schedule.estimatedCost ? formatCurrency(schedule.estimatedCost) : 'ללא אומדן'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    חלונית משימה
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedSchedule ? (
                    <>
                      <div className="rounded-[20px] border border-subtle-border bg-muted/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-foreground">{selectedSchedule.title}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{selectedSchedule.building.name}</div>
                          </div>
                          <StatusBadge label={getMaintenanceTypeLabel(selectedSchedule.type)} tone={selectedSchedule.type === 'PREVENTIVE' ? 'active' : selectedSchedule.type === 'CORRECTIVE' ? 'warning' : 'neutral'} />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <DetailStat label="עדיפות" value={selectedSchedule.priority} />
                          <DetailStat label="מועד הבא" value={formatDate(selectedSchedule.nextOccurrence ?? selectedSchedule.startDate)} />
                          <DetailStat label="אחראי" value={selectedSchedule.assignedTo?.email || 'לא הוקצה'} />
                          <DetailStat label="אימות" value={selectedSchedule.completionVerified ? 'מאומתת' : 'ממתינה לאימות'} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => router.push(`/maintenance/${selectedSchedule.id}`)}>
                            פתח משימה
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => router.push(`/operations/calendar?buildingId=${selectedSchedule.buildingId}`)}>
                            עבור ליומן
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-subtle-border bg-muted/40 p-4 text-sm">
                        <div className="text-sm font-semibold text-foreground">פירוט</div>
                        <div className="mt-2 text-muted-foreground">{selectedSchedule.description || 'ללא תיאור נוסף למשימה זו.'}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusBadge label={getMaintenanceFrequencyLabel(selectedSchedule.frequency)} tone="neutral" />
                          <StatusBadge label={getMaintenanceCategoryLabel(selectedSchedule.category)} tone="finance" />
                          {selectedSchedule.estimatedCost ? <StatusBadge label={formatCurrency(selectedSchedule.estimatedCost)} tone="success" /> : null}
                        </div>
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      type="empty"
                      size="sm"
                      title="בחר משימה מהטבלה"
                      description="החלונית מציגה תקציר, פעולות וקונטקסט של המשימה שנבחרה."
                    />
                  )}
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BellRing className="h-5 w-5" />
                    התראות קרובות
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {alerts.length === 0 ? (
                    <EmptyState
                      type="empty"
                      size="sm"
                      title="אין התראות קרובות"
                      description="לבניין הנבחר אין כרגע משימות שחוצות את חלון ההתראה."
                    />
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="rounded-[20px] border border-subtle-border bg-muted/40 p-4 text-sm">
                        <div className="font-medium text-foreground">{alert.title}</div>
                        <div className="mt-1 text-muted-foreground">{formatDate(alert.nextOccurrence ?? alert.startDate)}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusBadge label={getMaintenanceTypeLabel(alert.type)} tone={alert.type === 'PREVENTIVE' ? 'active' : 'warning'} />
                          <StatusBadge label={alert.priority} tone={getPriorityTone(alert.priority)} />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    תחזית עלויות
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-[20px] border border-subtle-border bg-muted/40 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-tertiary">סה״כ צפוי</div>
                    <div className="mt-2 text-2xl font-black text-foreground">
                      {projection ? formatCurrency(projection.totalEstimatedCost) : formatCurrency(0)}
                    </div>
                  </div>

                  {projection && Object.entries(projection.byPriority).length > 0 ? (
                    Object.entries(projection.byPriority).map(([priority, value]) => (
                      <div key={priority} className="flex items-center justify-between rounded-[18px] border border-subtle-border px-4 py-3">
                        <StatusBadge label={priority} tone={getPriorityTone(priority)} />
                        <span className="text-muted-foreground">
                          {value.count} משימות • {formatCurrency(value.estimatedCost)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      type="empty"
                      size="sm"
                      title="אין תחזית פעילה"
                      description="כאשר ייטענו אומדנים לבניין הנבחר, הם יוצגו כאן לפי רמות עדיפות."
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card variant="elevated">
            <CardContent className="space-y-6 p-6">
              <SectionHeader
                title="תזמון משימת תחזוקה חדשה"
                subtitle="טופס יצירה אחיד עם טקסטי הקשר, ולידציה בסיסית ורכיבי בחירה משותפים."
                meta={submitting ? 'שומר...' : 'מוכן ליצירה'}
              />

              <form onSubmit={createSchedule} className="grid gap-4 md:grid-cols-2">
                <FormField label="בניין" description="היכן המשימה תתבצע." error={formErrors.buildingId || undefined} required>
                  <Select value={form.buildingId} onValueChange={(value) => setForm((current) => ({ ...current, buildingId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר בניין" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={String(building.id)}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="כותרת" description="שם קצר וניתן לסריקה." error={formErrors.title || undefined} required>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="בדיקת משאבות, ניקוי פילטרים, טיפול נזילה..."
                  />
                </FormField>

                <FormField label="קטגוריה">
                  <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">כללי</SelectItem>
                      <SelectItem value="ELECTRICAL">חשמל</SelectItem>
                      <SelectItem value="PLUMBING">אינסטלציה</SelectItem>
                      <SelectItem value="HVAC">מיזוג ואוורור</SelectItem>
                      <SelectItem value="SAFETY">בטיחות</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="סוג">
                  <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PREVENTIVE">מונעת</SelectItem>
                      <SelectItem value="CORRECTIVE">מתקנת</SelectItem>
                      <SelectItem value="INSPECTION">בדיקה</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="תדירות">
                  <Select value={form.frequency} onValueChange={(value) => setForm((current) => ({ ...current, frequency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">יומי</SelectItem>
                      <SelectItem value="WEEKLY">שבועי</SelectItem>
                      <SelectItem value="MONTHLY">חודשי</SelectItem>
                      <SelectItem value="QUARTERLY">רבעוני</SelectItem>
                      <SelectItem value="ANNUAL">שנתי</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="מועד התחלה" error={formErrors.startDate || undefined} required>
                  <Input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  />
                </FormField>

                <FormField label="עלות משוערת" description="אופציונלי. ישמש לתחזית העלויות.">
                  <Input
                    type="number"
                    value={form.estimatedCost}
                    onChange={(event) => setForm((current) => ({ ...current, estimatedCost: event.target.value }))}
                    placeholder="0"
                  />
                </FormField>

                <FormField label="תיאור" description="פירוט קצר לצוות המבצע." className="md:col-span-2">
                  <Textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    rows={4}
                    placeholder="הערות גישה, ציוד נדרש או מידע מקדים לטכנאי."
                  />
                </FormField>

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={submitting || Boolean(formErrors.buildingId || formErrors.title || formErrors.startDate)}>
                    <Wrench className="me-2 h-4 w-4" />
                    {submitting ? 'יוצר...' : 'צור משימת תחזוקה'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: number; icon?: React.ReactNode }) {
  return (
    <Card variant="elevated">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-2xl font-bold">
        {icon}
        {value}
      </CardContent>
    </Card>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-subtle-border bg-background px-3 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium text-foreground">{value}</div>
    </div>
  );
}
