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
  getGardensWorkerMonth,
  saveGardensWorkerMonth,
  submitGardensWorkerMonth,
  type GardensWorkerDashboard,
  type GardensWorkerMonth,
} from '../../lib/gardens';
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

export function GardensWorkerWorkspace() {
  const [dashboard, setDashboard] = useState<GardensWorkerDashboard | null>(null);
  const [activeMonth, setActiveMonth] = useState<GardensWorkerMonth | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [entries, setEntries] = useState<Record<string, DayEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="space-y-8">
      <PageHero
        variant="operational"
        eyebrow={<GardensStatusBadge status={activeMonth.month.status} />}
        kicker="Worker Workspace"
        title={`שלום ${dashboard.worker.displayName}`}
        description="עדכן את החודש, בדוק מה עוד חסר, והגש לאישור כשהכול מוכן."
        actions={
          <GardensStatusBadge status={activeMonth.month.status} />
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] border border-subtle-border bg-background/88 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-tertiary">חודש פעיל</div>
              <div className="mt-2 text-xl font-black">{formatPlanLabel(activeMonth.month.plan)}</div>
            </div>
            <div className="rounded-[20px] border border-subtle-border bg-background/88 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-tertiary">יעד הגשה</div>
              <div className="mt-2 text-sm font-semibold">{formatDateLabel(activeMonth.month.submissionDeadline)}</div>
            </div>
            <div className="rounded-[20px] border border-subtle-border bg-background/88 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-tertiary">ימים שמולאו</div>
              <div className="mt-2 text-xl font-black">{assignmentCount}</div>
            </div>
          </div>
        }
      />

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

        <Card variant="elevated">
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
              readOnly={!editable}
              onChange={(date, value, bulk) => {
                setEntries((current) => {
                  const next = { ...current };
                  if (value) {
                    next[date] = value;
                  } else {
                    delete next[date];
                  }

                  if (value && bulk) {
                    const start = parseISO(`${activeMonth.month.plan}-01`);
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

      <section className="space-y-4">
        <SectionHeader
          title="קווים מנחים להגשה"
          subtitle="מלא רק ימים שבהם יש עבודה בפועל. כל יום מקבל מיקום אחד והערות אופציונליות."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {[
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
        title="שמור או הגש את החודש"
        description={editable ? 'מומלץ לשמור טיוטה במהלך העבודה ולהגיש רק אחרי בדיקה קצרה.' : 'החודש סגור לעריכה כרגע.'}
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
  );
}
