'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getGardensMonthOverview, sendGardensReminders, type GardensMonthOverview } from './api';
import { getStatusLabel, getStatusTone } from './utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MobileCardSkeleton } from '@/components/ui/page-states';
import { StatusBadge } from '@/components/ui/status-badge';

export function GardensMonthOverviewPage({ month }: { month: string }) {
  const [data, setData] = useState<GardensMonthOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await getGardensMonthOverview(month));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'טעינת החודש נכשלה.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [month]);

  const pendingCount = useMemo(
    () => data?.workers.filter((worker) => worker.status === 'SUBMITTED').length ?? 0,
    [data],
  );

  const sendReminders = async () => {
    try {
      setSending(true);
      const response = await sendGardensReminders(month);
      toast.success(`נשלחו ${response.reminded} תזכורות.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שליחת התזכורות נכשלה.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <MobileCardSkeleton cards={4} />;
  }

  if (error || !data) {
    return (
      <EmptyState
        type="error"
        title="טעינת חודש התכנון נכשלה"
        description={error ?? 'לא התקבלה תשובה תקינה מהשרת.'}
        action={{ label: 'נסה שוב', onClick: () => void load() }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="featured">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl sm:text-3xl">{data.month.title || `תכנון ${data.month.month}`}</CardTitle>
            <CardDescription>
              מעקב אחר סטטוס ההגשות, כמות השיבוצים והעובדים שעדיין דורשים טיפול.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={data.month.isLocked ? 'החודש נעול' : 'החודש פתוח'} tone={data.month.isLocked ? 'warning' : 'active'} />
            <Button variant="outline" onClick={sendReminders} loading={sending}>
              שלח תזכורות לעובדים
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'עובדים', value: data.stats.workers },
          { label: 'שיבוצים', value: data.stats.assignments },
          { label: 'ימי כיסוי', value: data.stats.coverageDays },
          { label: 'ממתינים לאישור', value: pendingCount },
        ].map((item) => (
          <Card key={item.label} variant="metric">
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
          <CardTitle>תוכניות עובדים</CardTitle>
          <CardDescription>לכל עובד מוצג סטטוס, כמות שיבוצים ופעולות ההמשך הרלוונטיות.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.workers.length === 0 ? (
            <EmptyState
              size="sm"
              type="empty"
              title="אין עובדים משויכים למודול"
              description="המערכת תציג כאן את עובדי הגינון ברגע שיוגדרו כעובדי TECH פעילים."
            />
          ) : (
            data.workers.map((worker) => (
              <div key={worker.workerProfileId} className="flex flex-col gap-3 rounded-[22px] border border-subtle-border bg-background/80 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold">{worker.workerName}</div>
                    <StatusBadge label={getStatusLabel(worker.status)} tone={getStatusTone(worker.status)} />
                    {worker.teamName ? <StatusBadge label={worker.teamName} tone="neutral" /> : null}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>{worker.assignmentCount} שיבוצים</span>
                    <span>{worker.email}</span>
                    {worker.submittedAt ? <span>הוגש: {new Date(worker.submittedAt).toLocaleDateString('he-IL')}</span> : null}
                    {worker.reviewNote ? <span>הערת מנהל: {worker.reviewNote}</span> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/gardens/plan/${month}/report/${worker.workerId}`}>לדוח העובד</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/gardens/approvals/${month}/${worker.workerId}`}>לפרטי התוכנית</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
