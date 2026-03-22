'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { getGardensWorkerPlan, type GardensWorkerPlanDetail } from './api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { DetailPanelSkeleton } from '@/components/ui/page-states';

export function GardensReportView({ month, workerId }: { month: string; workerId: number }) {
  const router = useRouter();
  const [data, setData] = useState<GardensWorkerPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await getGardensWorkerPlan(month, workerId);
        setData(detail);
        if (router.query.download === '1') {
          window.setTimeout(() => window.print(), 250);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'טעינת הדוח נכשלה.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [month, router.query.download, workerId]);

  const summary = useMemo(
    () => ({
      assignments: data?.assignments.length ?? 0,
      workingDays: new Set(data?.assignments.map((assignment) => assignment.workDate.slice(0, 10)) ?? []).size,
      notesCount: data?.assignments.filter((assignment) => assignment.notes).length ?? 0,
    }),
    [data],
  );

  if (loading) {
    return <DetailPanelSkeleton />;
  }

  if (error || !data) {
    return (
      <EmptyState
        type="error"
        title="טעינת דוח העובד נכשלה"
        description={error ?? 'לא התקבלה תשובה תקינה מהשרת.'}
      />
    );
  }

  return (
    <div className="space-y-6 bg-white print:space-y-4">
      <Card variant="featured" className="print:shadow-none">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl sm:text-3xl">דוח חודשי לעובד</CardTitle>
            <CardDescription>{data.worker.name} | חודש {data.month}</CardDescription>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" onClick={() => window.print()}>
              הדפס / שמור כ-PDF
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'שיבוצים', value: summary.assignments },
          { label: 'ימי עבודה', value: summary.workingDays },
          { label: 'הערות פעילות', value: summary.notesCount },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פירוט שיבוצים</CardTitle>
          <CardDescription>ריכוז כל המשמרות כפי שהוגשו במערכת AMS.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.assignments.length === 0 ? (
            <EmptyState
              size="sm"
              type="empty"
              title="אין שיבוצים בדוח הזה"
              description="העובד עדיין לא הזין שיבוצים לחודש המבוקש."
            />
          ) : (
            data.assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-[22px] border border-subtle-border bg-background/80 p-4">
                <div className="flex flex-wrap gap-2 text-sm font-semibold">
                  <span>{new Date(assignment.workDate).toLocaleDateString('he-IL')}</span>
                  <span>{assignment.location}</span>
                </div>
                {assignment.notes ? <p className="mt-2 text-sm text-muted-foreground">{assignment.notes}</p> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
