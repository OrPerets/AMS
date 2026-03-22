'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getGardensMonthOverview, type GardensMonthOverview } from './api';
import { getStatusLabel, getStatusTone } from './utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MobileCardSkeleton } from '@/components/ui/page-states';
import { StatusBadge } from '@/components/ui/status-badge';

export function GardensApprovalList({ month }: { month: string }) {
  const [data, setData] = useState<GardensMonthOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setData(await getGardensMonthOverview(month));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'טעינת האישורים נכשלה.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [month]);

  const items = useMemo(
    () =>
      data?.workers
        .slice()
        .sort((left, right) => {
          if (left.status === right.status) {
            return left.workerName.localeCompare(right.workerName, 'he');
          }
          if (left.status === 'SUBMITTED') return -1;
          if (right.status === 'SUBMITTED') return 1;
          return left.status.localeCompare(right.status);
        }) ?? [],
    [data],
  );

  if (loading) {
    return <MobileCardSkeleton cards={4} />;
  }

  if (error || !data) {
    return (
      <EmptyState
        type="error"
        title="טעינת אישורי התוכניות נכשלה"
        description={error ?? 'לא התקבלה תשובה תקינה מהשרת.'}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>אישורי תוכנית לחודש {month}</CardTitle>
        <CardDescription>ההגשות ממוינות כך שהפריטים שממתינים לסקירה יופיעו ראשונים.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <EmptyState
            size="sm"
            type="empty"
            title="אין עדיין תוכניות להצגה"
            description="ברגע שעובדי הגינון יתחילו לעדכן את התוכניות שלהם, הן יופיעו כאן."
          />
        ) : (
          items.map((worker) => (
            <Link key={worker.workerProfileId} href={`/gardens/approvals/${month}/${worker.workerId}`} className="block rounded-[22px] border border-subtle-border bg-background/80 p-4 transition hover:border-primary/30 hover:shadow-card">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold">{worker.workerName}</div>
                    <StatusBadge label={getStatusLabel(worker.status)} tone={getStatusTone(worker.status)} />
                    {worker.teamName ? <StatusBadge label={worker.teamName} tone="neutral" /> : null}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>{worker.assignmentCount} שיבוצים</span>
                    {worker.submittedAt ? <span>הוגש: {new Date(worker.submittedAt).toLocaleString('he-IL')}</span> : null}
                    {worker.reviewNote ? <span>הערת מנהל: {worker.reviewNote}</span> : null}
                  </div>
                </div>
                <div className="text-sm font-medium text-primary">לסקירת התוכנית</div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
