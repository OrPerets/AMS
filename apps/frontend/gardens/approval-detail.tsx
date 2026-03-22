'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { getGardensWorkerPlan, reviewGardensWorkerPlan, type GardensWorkerPlanDetail } from './api';
import { getStatusLabel, getStatusTone } from './utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { DetailPanelSkeleton } from '@/components/ui/page-states';
import { StatusBadge } from '@/components/ui/status-badge';

export function GardensApprovalDetail({ month, workerId }: { month: string; workerId: number }) {
  const router = useRouter();
  const [data, setData] = useState<GardensWorkerPlanDetail | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const detail = await getGardensWorkerPlan(month, workerId);
      setData(detail);
      setReviewNote(detail.plan.reviewNote || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'טעינת פרטי התוכנית נכשלה.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [month, workerId]);

  const submitReview = async (status: 'APPROVED' | 'NEEDS_CHANGES') => {
    try {
      setSubmitting(true);
      await reviewGardensWorkerPlan(month, workerId, { status, reviewNote: reviewNote.trim() || undefined });
      toast.success(status === 'APPROVED' ? 'התוכנית אושרה.' : 'התוכנית הוחזרה לתיקון.');
      void router.push(`/gardens/approvals/${month}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'עדכון סטטוס התוכנית נכשל.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <DetailPanelSkeleton />;
  }

  if (error || !data) {
    return (
      <EmptyState
        type="error"
        title="טעינת פרטי התוכנית נכשלה"
        description={error ?? 'לא התקבלה תשובה תקינה מהשרת.'}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="featured">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl">{data.worker.name}</CardTitle>
            <CardDescription>סקירת תוכנית העבודה לחודש {data.month} לפני אישור סופי.</CardDescription>
          </div>
          <StatusBadge label={getStatusLabel(data.plan.status)} tone={getStatusTone(data.plan.status)} />
        </CardHeader>
      </Card>

      {data.plan.reviewNote ? (
        <Alert variant="warning">
          <AlertTitle>הערת הסקירה הקודמת</AlertTitle>
          <AlertDescription>{data.plan.reviewNote}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>שיבוצי העובד</CardTitle>
          <CardDescription>לפני אישור, ודאו שהתוכנית מלאה, ברורה ומתאימה לצרכים התפעוליים של החודש.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.assignments.length === 0 ? (
            <EmptyState
              size="sm"
              type="empty"
              title="אין שיבוצים בתוכנית"
              description="כרגע לא הוזנו ימי עבודה. במקרה כזה מומלץ להחזיר את התוכנית לעדכון."
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

      <Card>
        <CardHeader>
          <CardTitle>החלטת מנהל</CardTitle>
          <CardDescription>השאירו הנחיה ברורה אם התוכנית חוזרת לעדכון. באישור סופי ההערה היא אופציונלית.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="min-h-32 w-full rounded-[22px] border border-subtle-border bg-background px-4 py-3 text-sm"
            placeholder="הערת סקירה לעובד"
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <Button variant="success" onClick={() => void submitReview('APPROVED')} loading={submitting}>
              אשר תוכנית
            </Button>
            <Button variant="warning" onClick={() => void submitReview('NEEDS_CHANGES')} loading={submitting}>
              החזר לתיקון
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
