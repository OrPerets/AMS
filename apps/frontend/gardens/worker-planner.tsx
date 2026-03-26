'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getMyCurrentGardensMonth, getMyGardensPlan, saveMyGardensAssignments, submitMyGardensPlan, type MyGardensPlan } from './api';
import { getStatusLabel, getStatusTone } from './utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MobileCardSkeleton } from '@/components/ui/page-states';
import { StatusBadge } from '@/components/ui/status-badge';

type DraftAssignment = {
  workDate: string;
  location: string;
  notes: string;
};

export function GardensWorkerPlanner() {
  const [month, setMonth] = useState<string | null>(null);
  const [plan, setPlan] = useState<MyGardensPlan | null>(null);
  const [draft, setDraft] = useState<DraftAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const current = await getMyCurrentGardensMonth();
      setMonth(current.month);
      if (!current.month) {
        setPlan(null);
        setDraft([]);
        return;
      }
      const detail: MyGardensPlan = await getMyGardensPlan(current.month);
      setPlan(detail);
      setDraft(
        detail.assignments.map((assignment) => ({
          workDate: assignment.workDate.slice(0, 10),
          location: assignment.location,
          notes: assignment.notes || '',
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'טעינת התוכנית האישית נכשלה.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const sortedDraft = useMemo(
    () =>
      [...draft].sort((left, right) => left.workDate.localeCompare(right.workDate) || left.location.localeCompare(right.location)),
    [draft],
  );

  const updateRow = (index: number, field: keyof DraftAssignment, value: string) => {
    setDraft((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    );
  };

  const addRow = () => {
    setDraft((current) => [...current, { workDate: month ? `${month}-01` : '', location: '', notes: '' }]);
  };

  const removeRow = (index: number) => {
    setDraft((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const save = async () => {
    if (!month) return;
    try {
      setSaving(true);
      await saveMyGardensAssignments(
        month,
        sortedDraft
          .filter((row) => row.workDate && row.location.trim())
          .map((row) => ({
            workDate: new Date(`${row.workDate}T00:00:00`).toISOString(),
            location: row.location.trim(),
            notes: row.notes.trim() || undefined,
          })),
      );
      toast.success('טיוטת התוכנית נשמרה.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שמירת הטיוטה נכשלה.');
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!month) return;
    try {
      setSubmitting(true);
      await save();
      await submitMyGardensPlan(month);
      toast.success('התוכנית הוגשה לאישור.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'הגשת התוכנית נכשלה.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <MobileCardSkeleton cards={3} />;
  }

  if (error) {
    return (
      <EmptyState
        type="error"
        title="טעינת התוכנית האישית נכשלה"
        description={error}
        action={{ label: 'נסה שוב', onClick: () => void load() }}
      />
    );
  }

  if (!month || !plan) {
    return (
      <EmptyState
        type="empty"
        title="עדיין אין חודש תכנון פתוח"
        description="ברגע שהנהלת הגינון תפתח חודש עבודה חדש, הוא יופיע כאן ותוכלו לעדכן את התוכנית החודשית."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="featured">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl sm:text-3xl">תוכנית העבודה שלי</CardTitle>
            <CardDescription>
              עדכנו את השיבוצים לחודש {plan.month}, שמרו טיוטה והגישו לאישור כשאתם מוכנים.
            </CardDescription>
          </div>
          <StatusBadge label={getStatusLabel(plan.plan.status)} tone={getStatusTone(plan.plan.status)} />
        </CardHeader>
      </Card>

      {plan.plan.reviewNote ? (
        <Alert variant="warning">
          <AlertTitle>התוכנית הוחזרה לעדכון</AlertTitle>
          <AlertDescription>{plan.plan.reviewNote}</AlertDescription>
        </Alert>
      ) : null}

      {!plan.canEdit ? (
        <Alert variant={plan.plan.status === 'APPROVED' ? 'success' : 'info'}>
          <AlertTitle>{plan.plan.status === 'APPROVED' ? 'התוכנית אושרה' : 'התוכנית ממתינה לסקירה'}</AlertTitle>
          <AlertDescription>
            {plan.plan.status === 'APPROVED'
              ? 'אין צורך בפעולה נוספת כרגע.'
              : 'ברגע שההנהלה תסיים את הבדיקה, הסטטוס יתעדכן כאן.'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>שיבוצי החודש</CardTitle>
          <CardDescription>הוסיפו יום עבודה, מיקום והערות במידת הצורך. אפשר לעדכן טיוטה כמה פעמים שצריך.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedDraft.length === 0 ? (
            <EmptyState
              size="sm"
              type="create"
              title="עדיין לא הוספת שיבוצים"
              description="התחילו משורת שיבוץ ראשונה כדי לבנות את תוכנית העבודה של החודש."
              action={plan.canEdit ? { label: 'הוסף שיבוץ ראשון', onClick: addRow } : undefined}
            />
          ) : (
            sortedDraft.map((row, index) => (
              <div key={`${row.workDate}-${index}`} className="grid gap-3 rounded-[22px] border border-subtle-border bg-background/80 p-4 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)_auto]">
                <input
                  type="date"
                  className="rounded-full border border-subtle-border bg-background px-4 py-2 text-sm"
                  value={row.workDate}
                  disabled={!plan.canEdit}
                  onChange={(event) => updateRow(index, 'workDate', event.target.value)}
                />
                <input
                  type="text"
                  className="rounded-full border border-subtle-border bg-background px-4 py-2 text-sm"
                  placeholder="מיקום / כתובת"
                  value={row.location}
                  disabled={!plan.canEdit}
                  onChange={(event) => updateRow(index, 'location', event.target.value)}
                />
                <input
                  type="text"
                  className="rounded-full border border-subtle-border bg-background px-4 py-2 text-sm"
                  placeholder="הערות"
                  value={row.notes}
                  disabled={!plan.canEdit}
                  onChange={(event) => updateRow(index, 'notes', event.target.value)}
                />
                {plan.canEdit ? (
                  <Button variant="ghost" size="sm" onClick={() => removeRow(index)}>
                    הסר
                  </Button>
                ) : null}
              </div>
            ))
          )}

          {plan.canEdit ? (
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={addRow}>
                הוסף שיבוץ
              </Button>
              <Button onClick={save} loading={saving}>
                שמור טיוטה
              </Button>
              <Button variant="success" onClick={submit} loading={submitting}>
                הגש לאישור
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
