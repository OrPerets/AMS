import { useEffect, useMemo, useState } from 'react';
import { addDays, format, getDaysInMonth, parseISO } from 'date-fns';
import { CalendarDays, FileCheck2, Save, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { MobileCardSkeleton } from '../ui/page-states';
import { PageHero } from '../ui/page-hero';
import { MobileActionBar } from '../ui/mobile-action-bar';
import { SectionHeader } from '../ui/section-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from '../ui/use-toast';
import MonthGrid from '../../gardens/components/MonthGrid';
import type { DayEntry } from '../../gardens/components/DayCell';
import {
  formatDateLabel,
  formatPlanLabel,
  formatStatusLabel,
  getGardensWorkerDashboard,
  listGardensBuildings,
  getGardensWorkerMonth,
  saveGardensWorkerMonth,
  submitGardensWorkerMonth,
  type GardensBuildingOption,
  type GardensStatus,
  type GardensWorkerDashboard,
  type GardensWorkerMonth,
} from '../../lib/gardens';
import { getEffectiveRole } from '../../lib/auth';
import { GardensModuleShell } from './GardensModuleShell';
import { GardensStatusBadge } from './GardensStatusBadge';

function toEntryMap(assignments: GardensWorkerMonth['assignments']) {
  return assignments.reduce<Record<string, DayEntry>>((acc, assignment) => {
    acc[assignment.date] = {
      address: assignment.location,
      notes: assignment.notes,
    };
    return acc;
  }, {});
}

function entryMapToAssignments(entries: Record<string, DayEntry>) {
  return Object.entries(entries)
    .map(([date, entry]) => ({
      date,
      location: entry.address.trim(),
      notes: entry.notes.trim() || undefined,
    }))
    .filter((entry) => entry.location);
}

function getWorkerStateCopy(status: GardensStatus, assignmentCount: number, reviewNote?: string | null) {
  switch (status) {
    case 'NEEDS_CHANGES':
      return {
        badge: 'דורש עדכון',
        title: 'נדרשים תיקונים לפני אישור',
        description: reviewNote || 'פתח את החודש, עדכן את הימים שסומנו, והגש מחדש רק אחרי בדיקה קצרה.',
        actionTitle: 'בדוק את ההערות והמשך לעריכה',
        actionDescription: `מולאו כרגע ${assignmentCount} ימים. שמור טיוטה תוך כדי עבודה והגש מחדש אחרי תיקון.`,
      };
    case 'SUBMITTED':
      return {
        badge: 'הוגש',
        title: 'החודש כבר הוגש לבדיקה',
        description: 'אין צורך לבצע פעולה נוספת עד שיחזור משוב מהמנהל.',
        actionTitle: 'המתן למשוב מנהל',
        actionDescription: 'אפשר לעבור על החודש לקריאה בלבד ולהתכונן לשינויים אם יידרשו.',
      };
    case 'APPROVED':
      return {
        badge: 'אושר',
        title: 'החודש אושר וננעל',
        description: 'התוכנית סגורה לקריאה בלבד כדי לשמור על גרסה מוסכמת אחת.',
        actionTitle: 'החודש סגור לעריכה',
        actionDescription: 'אם יש צורך בשינוי נוסף, פנה למנהל לפני פתיחת עדכון חדש.',
      };
    default:
      return {
        badge: 'טיוטה',
        title: 'המשך לעדכן את החודש הפעיל',
        description: 'מלא רק ימים שבהם יש עבודה בפועל, ואז שמור או הגש כשהחודש מוכן.',
        actionTitle: 'המשך למלא את החודש',
        actionDescription: `מולאו כרגע ${assignmentCount} ימים. הפעולה הראשית היא לשמור טיוטה או להגיש כשהכול סגור.`,
      };
  }
}

export function GardensWorkerWorkspace() {
  const [dashboard, setDashboard] = useState<GardensWorkerDashboard | null>(null);
  const [activeMonth, setActiveMonth] = useState<GardensWorkerMonth | null>(null);
  const [buildings, setBuildings] = useState<GardensBuildingOption[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [entries, setEntries] = useState<Record<string, DayEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const role = getEffectiveRole();

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await getGardensWorkerDashboard();
      setDashboard(data);
      const initialPlan = data.month?.plan || data.months[0]?.plan || '';
      setSelectedPlan(initialPlan);
      if (data.month) {
        setActiveMonth({
          worker: data.worker,
          month: data.month,
          assignments: data.assignments,
          summary: data.summary,
        });
        setEntries(toEntryMap(data.assignments));
      } else {
        setActiveMonth(null);
        setEntries({});
      }
    } catch {
      toast({
        title: 'טעינת מרחב העבודה נכשלה',
        description: 'לא הצלחנו למשוך את נתוני הגינון מהשרת.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        setBuildingsLoading(true);
        const items = await listGardensBuildings();
        if (!cancelled) {
          setBuildings(Array.isArray(items) ? items : []);
        }
      } catch {
        if (!cancelled) {
          setBuildings([]);
        }
      } finally {
        if (!cancelled) {
          setBuildingsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dashboard || !selectedPlan) {
      return;
    }

    if (dashboard.month?.plan === selectedPlan) {
      setActiveMonth({
        worker: dashboard.worker,
        month: dashboard.month,
        assignments: dashboard.assignments,
        summary: dashboard.summary,
      });
      setEntries(toEntryMap(dashboard.assignments));
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const month = await getGardensWorkerMonth(selectedPlan);
        if (!cancelled) {
          setActiveMonth(month);
          setEntries(toEntryMap(month.assignments));
        }
      } catch {
        if (!cancelled) {
          toast({
            title: 'טעינת החודש שנבחר נכשלה',
            description: 'לא ניתן לפתוח את החודש שבחרת כרגע.',
            variant: 'destructive',
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dashboard, selectedPlan]);

  const editable =
    activeMonth?.month &&
    !activeMonth.month.isLocked &&
    activeMonth.month.status !== 'APPROVED';

  const assignmentCount = useMemo(
    () => Object.keys(entries).filter((key) => entries[key]?.address?.trim()).length,
    [entries],
  );
  const workerState = useMemo(
    () => getWorkerStateCopy(activeMonth?.month?.status ?? 'DRAFT', assignmentCount, activeMonth?.month?.reviewNote),
    [activeMonth?.month?.reviewNote, activeMonth?.month?.status, assignmentCount],
  );
  const buildingOptions = useMemo(
    () =>
      buildings
        .map((building) => ({
          id: building.id,
          name: building.name,
          location: (building.address || building.name || '').trim(),
          address: building.address?.trim() || null,
        }))
        .filter((building) => building.location)
        .sort((left, right) => left.name.localeCompare(right.name, 'he')),
    [buildings],
  );

  const save = async () => {
    if (!activeMonth?.month) {
      return;
    }

    setSaving(true);
    try {
      await saveGardensWorkerMonth(activeMonth.month.plan, entryMapToAssignments(entries));
      toast({
        title: 'התוכנית נשמרה',
        description: 'הטיוטה עודכנה ב-AMS ותישאר זמינה להמשך עבודה.',
        variant: 'success',
      });
      await loadDashboard();
    } catch {
      toast({
        title: 'שמירת התוכנית נכשלה',
        description: 'לא ניתן לשמור את הנתונים כרגע.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!activeMonth?.month) {
      return;
    }

    setSubmitting(true);
    try {
      await saveGardensWorkerMonth(activeMonth.month.plan, entryMapToAssignments(entries));
      await submitGardensWorkerMonth(activeMonth.month.plan);
      toast({
        title: 'התוכנית הוגשה לאישור',
        description: 'ההגשה נשמרה וממתינה כעת לבדיקת מנהל.',
        variant: 'success',
      });
      await loadDashboard();
    } catch {
      toast({
        title: 'שליחת התוכנית נכשלה',
        description: 'בדוק שמילאת לפחות יום אחד ונסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <MobileCardSkeleton cards={2} />;
  }

  if (!dashboard || !activeMonth?.month) {
    return (
      <EmptyState
        title="אין כרגע חודש גינון פתוח עבורך"
        description="ברגע שהנהלת AMS תיצור חודש חדש, הוא יופיע כאן אוטומטית עם כלים לשמירה ולהגשה."
        type="empty"
      />
    );
  }

  return (
    <GardensModuleShell
      role={role}
      activePlan={activeMonth.month.plan}
      moduleLabel={`מרחב עבודה לעובד עבור ${formatPlanLabel(activeMonth.month.plan)}`}
      title="מרחב העבודה האישי בגינון"
      description="המודול שומר עבורך מסלול עבודה נפרד: חודש פעיל, סטטוס ההגשה, הנחיות, ושמירה מהירה בלי לחזור למסכי AMS הכלליים."
      actions={
        <Button asChild size="sm">
          <a href="#gardens-worker-month-grid">{editable ? 'המשך לעריכה' : 'צפה בחודש'}</a>
        </Button>
      }
    >
      <div className="space-y-8">
        <PageHero
          variant="operational"
          compact
          eyebrow={
            <>
              <GardensStatusBadge status={activeMonth.month.status} />
              <Badge variant="outline">{workerState.badge}</Badge>
            </>
          }
          kicker="WORKSPACE"
          title={workerState.title}
          description={workerState.description}
        />

        <section className="grid gap-4 lg:grid-cols-3">
          <Card variant="metric">
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">חודש פעיל</div>
              <div className="mt-2 text-xl font-black">{formatPlanLabel(activeMonth.month.plan)}</div>
              <div className="mt-2 text-sm text-muted-foreground">כל הפעולות שלך מרוכזות במסך אחד.</div>
            </CardContent>
          </Card>
          <Card variant="metric">
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">ימים שמולאו</div>
              <div className="mt-2 text-3xl font-black">{assignmentCount}</div>
              <div className="mt-2 text-sm text-muted-foreground">שמור טיוטה תוך כדי כדי לא לאבד התקדמות.</div>
            </CardContent>
          </Card>
          <Card variant="metric">
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">הפעולה הבאה</div>
              <div className="mt-2 text-lg font-black">{editable ? 'המשך מילוי או שלח' : 'מעקב אחרי ההגשה'}</div>
              <div className="mt-2 text-sm text-muted-foreground">{workerState.actionDescription}</div>
            </CardContent>
          </Card>
        </section>

        <Card variant="featured" className="overflow-hidden rounded-[22px]">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-[1.2fr_0.8fr_0.8fr] sm:p-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">פעולה ראשית</div>
              <div className="mt-1 text-base font-semibold text-foreground">{workerState.actionTitle}</div>
              <div className="mt-1 text-sm leading-6 text-secondary-foreground">{workerState.actionDescription}</div>
            </div>
            <div className="rounded-[18px] border border-subtle-border bg-background/82 p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-tertiary">חודש פעיל</div>
              <div className="mt-2 text-lg font-black">{formatPlanLabel(activeMonth.month.plan)}</div>
            </div>
            <div className="rounded-[18px] border border-subtle-border bg-background/82 p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-tertiary">יעד הגשה</div>
              <div className="mt-2 text-sm font-semibold">{formatDateLabel(activeMonth.month.submissionDeadline)}</div>
              <div className="mt-1 text-xs text-secondary-foreground">{assignmentCount} ימים מולאו</div>
            </div>
          </CardContent>
        </Card>

      {activeMonth.month.status === 'NEEDS_CHANGES' && activeMonth.month.reviewNote ? (
        <Alert variant="warning">
          <AlertIcon variant="warning" />
          <AlertTitle>נדרש עדכון לפני אישור סופי</AlertTitle>
          <AlertDescription>{activeMonth.month.reviewNote}</AlertDescription>
        </Alert>
      ) : null}

      {activeMonth.month.status === 'APPROVED' ? (
        <Alert variant="success">
          <AlertIcon variant="success" />
          <AlertTitle>התוכנית אושרה</AlertTitle>
          <AlertDescription>החודש סגור עבורך לקריאה בלבד. אם צריך שינוי נוסף, פנה למנהל.</AlertDescription>
        </Alert>
      ) : null}

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card variant="featured">
          <CardHeader>
            <CardTitle>בקרה חודשית</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">בחר חודש עבודה</div>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר חודש" />
                </SelectTrigger>
                <SelectContent>
                  {dashboard.months.map((month) => (
                    <SelectItem key={month.plan} value={month.plan}>
                      {formatPlanLabel(month.plan)} | {formatStatusLabel(month.status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-subtle-border/80 bg-background/75 p-4">
                <div className="text-xs text-muted-foreground">סטטוס</div>
                <div className="mt-2">
                  <GardensStatusBadge status={activeMonth.month.status} />
                </div>
              </div>
              <div className="rounded-[20px] border border-subtle-border/80 bg-background/75 p-4">
                <div className="text-xs text-muted-foreground">הוגש</div>
                <div className="mt-2 text-sm font-semibold">
                  {activeMonth.month.submittedAt
                    ? formatDateLabel(activeMonth.month.submittedAt, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'עדיין לא'}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-subtle-border/80 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
              שמירה מעדכנת את הטיוטה הנוכחית. הגשה שולחת את החודש לבדיקה אצל המנהל ומקפיאה אותו עד לתגובה.
            </div>
          </CardContent>
        </Card>

        <Card id="gardens-worker-month-grid" variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              לוח חודשי
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MonthGrid
              month={activeMonth.month.plan}
              entries={entries}
              buildingOptions={buildingOptions}
              buildingsLoading={buildingsLoading}
              readOnly={!editable}
              onChange={(date, value, bulk) => {
                const activePlan = activeMonth.month?.plan;
                if (!activePlan) {
                  return;
                }

                setEntries((current) => {
                  const next = { ...current };
                  if (value) {
                    next[date] = value;
                  } else {
                    delete next[date];
                  }

                  if (value && bulk) {
                    const start = parseISO(`${activePlan}-01`);
                    const daysInMonth = getDaysInMonth(start);
                    for (let index = 1; index <= daysInMonth; index += 1) {
                      const currentDate = addDays(start, index - 1);
                      const dayOfWeek = currentDate.getDay();
                      const key = format(currentDate, 'yyyy-MM-dd');
                      if (key === date) {
                        continue;
                      }
                      if (
                        bulk === 'all' ||
                        (bulk === 'weekdays' && dayOfWeek >= 0 && dayOfWeek <= 4) ||
                        (bulk === 'weekends' && dayOfWeek >= 5)
                      ) {
                        next[key] = value;
                      }
                    }
                  }
                  return next;
                });
              }}
            />

            {!editable ? (
              <Badge variant="outline">החודש מוצג לקריאה בלבד</Badge>
            ) : null}
          </CardContent>
        </Card>
        </section>

        <section id="gardens-guidelines" className="space-y-4">
          <SectionHeader
            title="קווים מנחים להגשה"
            subtitle="לחץ על יום בלוח, בחר בניין אחד מתוך הרשימה, והוסף הערה רק כשצריך הקשר נוסף."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              'יום נשמר רק אחרי בחירת בניין. הימים שסומנו בלוח הם הימים שיוגשו לבדיקה.',
              'שמור טיוטה בכל שלב. אין צורך להמתין לסיום כל החודש.',
              'אם המנהל החזיר את התוכנית, העדכן את הימים הרלוונטיים והגש מחדש.',
              'אחרי אישור סופי החודש הופך לקריאה בלבד כדי לשמור על גרסה מוסכמת אחת.',
            ].map((line) => (
              <Card key={line} variant="listRow">
                <CardContent className="p-5 text-sm leading-6 text-muted-foreground">
                  {line}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <MobileActionBar
          title={editable ? 'המשך לערוך או הגש לאישור' : 'החודש סגור לעריכה'}
          description={workerState.actionDescription}
        >
          <div className="grid gap-2">
            <Button variant="outline" onClick={() => void save()} loading={saving} disabled={!editable} className="w-full justify-between">
              <span className="inline-flex items-center gap-2">
                <Save className="h-4 w-4" />
                שמור טיוטה
              </span>
              <span>{assignmentCount} ימים</span>
            </Button>
            <Button onClick={() => void submit()} loading={submitting} disabled={!editable} className="w-full justify-between">
              <span className="inline-flex items-center gap-2">
                <Send className="h-4 w-4" />
                הגש לאישור
              </span>
              <GardensStatusBadge status={activeMonth.month.status} />
            </Button>
          </div>
        </MobileActionBar>
      </div>
    </GardensModuleShell>
  );
}
