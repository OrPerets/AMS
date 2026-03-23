import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { AlertTriangle, CheckCircle2, Undo2 } from 'lucide-react';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DetailPanelSkeleton } from '../ui/page-states';
import { PageHero } from '../ui/page-hero';
import { SectionHeader } from '../ui/section-header';
import { Textarea } from '../ui/textarea';
import { toast } from '../ui/use-toast';
import { GardensModuleShell } from './GardensModuleShell';
import {
  formatDateLabel,
  formatPlanLabel,
  getGardensWorkerPlanDetail,
  reviewGardensWorkerPlan,
  type GardensWorkerPlanDetail,
} from '../../lib/gardens';
import { getEffectiveRole } from '../../lib/auth';
import { GardensStatusBadge } from './GardensStatusBadge';

export function GardensWorkerReview({
  plan,
  workerProfileId,
}: {
  plan: string;
  workerProfileId: number;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<GardensWorkerPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState<'APPROVED' | 'NEEDS_CHANGES' | null>(null);
  const role = getEffectiveRole();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getGardensWorkerPlanDetail(plan, workerProfileId);
      setDetail(data);
      setNote(data.planState.reviewNote || '');
    } catch {
      toast({
        title: 'טעינת תוכנית העובד נכשלה',
        description: 'לא ניתן לטעון כרגע את פרטי ההגשה.',
        variant: 'destructive',
      });
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [plan, workerProfileId]);

  const summary = useMemo(() => {
    const assignments = detail?.assignments ?? [];
    return {
      total: assignments.length,
      withNotes: assignments.filter((assignment) => assignment.notes).length,
      uniqueLocations: new Set(assignments.map((assignment) => assignment.location)).size,
    };
  }, [detail]);

  const submit = async (status: 'APPROVED' | 'NEEDS_CHANGES') => {
    setSubmitting(status);
    try {
      await reviewGardensWorkerPlan(plan, workerProfileId, {
        status,
        reviewNote: status === 'NEEDS_CHANGES' ? note : undefined,
      });
      toast({
        title: status === 'APPROVED' ? 'התוכנית אושרה' : 'התוכנית הוחזרה לעדכון',
        description:
          status === 'APPROVED'
            ? 'העובד קיבל חיווי על אישור התוכנית.'
            : 'העובד יקבל את הערת המנהל ויוכל להגיש מחדש.',
        variant: 'success',
      });
      await router.push(`/gardens/months/${plan}`);
    } catch {
      toast({
        title: 'עדכון סטטוס ההגשה נכשל',
        description: 'לא ניתן לעדכן את תוכנית העובד כרגע.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return <DetailPanelSkeleton />;
  }

  if (!detail) {
    return null;
  }

  return (
    <GardensModuleShell
      role={role}
      activePlan={plan}
      moduleLabel={`סקירת עובד ${detail.worker.displayName}`}
      title={`אישור תוכנית עבור ${detail.worker.displayName}`}
      description="אתה נמצא בתוך מסלול האישורים של מודול הגינון. מכאן אפשר לבדוק את פרטי ההגשה, להחזיר לעדכון או לאשר סופית."
      actions={
        <Button variant="outline" onClick={() => void router.push(`/gardens/months/${plan}`)}>
          <Undo2 className="me-2 h-4 w-4" />
          חזרה לחודש
        </Button>
      }
    >
      <div className="space-y-8">
        <PageHero
          eyebrow={<GardensStatusBadge status={detail.planState.status} />}
          kicker="Gardens Review"
          title={detail.worker.displayName}
          description={`סקירת תוכנית העבודה עבור ${formatPlanLabel(plan)} לפני אישור סופי או החזרה לעדכון.`}
          aside={
            <div className="space-y-3 text-white">
              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/55">הוגש בתאריך</div>
                <div className="mt-2 text-lg font-black">
                  {detail.planState.submittedAt
                    ? formatDateLabel(detail.planState.submittedAt, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'עדיין לא הוגש'}
                </div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/55">ערוץ קשר</div>
                <div className="mt-2 text-sm font-semibold">{detail.worker.email}</div>
              </div>
            </div>
          }
        />

        <section className="grid gap-4 lg:grid-cols-3">
        <Card variant="metric">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">ימי שיבוץ</div>
            <div className="mt-2 text-3xl font-black">{summary.total}</div>
          </CardContent>
        </Card>
        <Card variant="metric">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">מיקומים שונים</div>
            <div className="mt-2 text-3xl font-black">{summary.uniqueLocations}</div>
          </CardContent>
        </Card>
        <Card variant="metric">
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">שורות עם הערות</div>
            <div className="mt-2 text-3xl font-black">{summary.withNotes}</div>
          </CardContent>
        </Card>
        </section>

        {detail.planState.status === 'NEEDS_CHANGES' && detail.planState.reviewNote ? (
          <Alert variant="warning">
            <AlertIcon variant="warning" />
            <AlertTitle>התוכנית כבר הוחזרה בעבר לעדכון</AlertTitle>
            <AlertDescription>{detail.planState.reviewNote}</AlertDescription>
          </Alert>
        ) : null}

        <section className="space-y-4">
        <SectionHeader
          title="פירוט שיבוצים"
          subtitle="בדוק תאריכים, עומסים, כפילויות והערות לפני אישור."
          meta={`${detail.assignments.length} שורות`}
        />

        <Card variant="elevated">
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-full text-right">
              <thead className="border-b border-subtle-border bg-muted/35 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-4 font-medium">תאריך</th>
                  <th className="px-4 py-4 font-medium">מיקום</th>
                  <th className="px-4 py-4 font-medium">הערות</th>
                </tr>
              </thead>
              <tbody>
                {detail.assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-subtle-border/70 last:border-b-0">
                    <td className="px-4 py-4 text-sm">{formatDateLabel(assignment.date)}</td>
                    <td className="px-4 py-4 text-sm font-medium">{assignment.location}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{assignment.notes || 'ללא הערה'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        </section>

        <section className="space-y-4">
        <SectionHeader
          title="החלטת מנהל"
          subtitle="אפשר לאשר את התוכנית כפי שהיא, או להחזיר אותה לעדכון עם הערה ברורה לעובד."
        />

        <Card variant="featured">
          <CardHeader>
            <CardTitle>הערה לעובד</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="אם נדרש עדכון, כתוב כאן מה בדיוק צריך להשתנות."
              rows={5}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => void submit('NEEDS_CHANGES')}
                loading={submitting === 'NEEDS_CHANGES'}
              >
                <AlertTriangle className="me-2 h-4 w-4" />
                החזר לעדכון
              </Button>
              <Button onClick={() => void submit('APPROVED')} loading={submitting === 'APPROVED'}>
                <CheckCircle2 className="me-2 h-4 w-4" />
                אשר תוכנית
              </Button>
            </div>
          </CardContent>
        </Card>
        </section>
      </div>
    </GardensModuleShell>
  );
}
