import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { BellRing, Download, FileCheck2, Undo2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { MobileMetricStrip } from '../ui/mobile-metric-strip';
import { TableListSkeleton } from '../ui/page-states';
import { PageHero } from '../ui/page-hero';
import { RosterCard } from '../ui/roster-card';
import { SectionHeader } from '../ui/section-header';
import { toast } from '../ui/use-toast';
import { GardensModuleShell } from './GardensModuleShell';
import {
  formatDateLabel,
  formatPlanLabel,
  getGardensManagerDashboard,
  sendGardensReminders,
  type GardensManagerDashboard,
} from '../../lib/gardens';
import { getEffectiveRole } from '../../lib/auth';
import { GardensStatusBadge } from './GardensStatusBadge';

export function GardensManagerMonth({ plan }: { plan: string }) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<GardensManagerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState(false);
  const [workerReminderId, setWorkerReminderId] = useState<number | null>(null);
  const role = getEffectiveRole();

  const load = async () => {
    setLoading(true);
    try {
      setDashboard(await getGardensManagerDashboard(plan));
    } catch {
      toast({
        title: 'טעינת חודש הגינון נכשלה',
        description: 'לא ניתן לטעון את נתוני החודש כרגע.',
        variant: 'destructive',
      });
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [plan]);

  const reminderSummary = useMemo(() => {
    if (!dashboard) {
      return 0;
    }

    return dashboard.workers.filter((worker) =>
      ['DRAFT', 'NEEDS_CHANGES'].includes(worker.status),
    ).length;
  }, [dashboard]);

  const remindPending = async () => {
    setReminding(true);
    try {
      const result = await sendGardensReminders(plan, { onlyPending: true });
      toast({
        title: 'תזכורות נשלחו',
        description: `נשלחו ${result.sent} תזכורות לעובדים שעדיין לא השלימו את החודש.`,
        variant: 'success',
      });
      await load();
    } catch {
      toast({
        title: 'שליחת התזכורות נכשלה',
        description: 'נסו שוב בעוד רגע.',
        variant: 'destructive',
      });
    } finally {
      setReminding(false);
    }
  };

  const remindWorker = async (workerProfileId: number, workerName: string) => {
    setWorkerReminderId(workerProfileId);
    try {
      await sendGardensReminders(plan, { workerProfileIds: [workerProfileId] });
      toast({
        title: 'תזכורת נשלחה',
        description: `נשלחה תזכורת ל-${workerName}.`,
        variant: 'success',
      });
      await load();
    } catch {
      toast({
        title: 'שליחת התזכורת נכשלה',
        description: 'נסו שוב בעוד רגע.',
        variant: 'destructive',
      });
    } finally {
      setWorkerReminderId(null);
    }
  };

  if (loading) {
    return <TableListSkeleton rows={6} columns={5} />;
  }

  if (!dashboard) {
    return (
      <EmptyState
        title="לא הצלחנו לטעון את החודש"
        description="יכול להיות שהחודש לא קיים, או שהחיבור לשרת נכשל."
        type="error"
        action={{ label: 'חזרה למודול', onClick: () => void router.push('/gardens'), variant: 'outline' }}
      />
    );
  }

  return (
    <GardensModuleShell
      role={role}
      activePlan={plan}
      moduleLabel={`חודש גינון ${formatPlanLabel(plan)}`}
      title={`חודש הגינון ${formatPlanLabel(plan)}`}
      description="כל בדיקות המנהל מרוכזות כאן: מי הגיש, מה דורש אישור, אילו כתובות שובצו, ומתי צריך לשלוח תזכורת."
      actions={
        <>
          <Button variant="outline" onClick={() => void router.push('/gardens')}>
            <Undo2 className="me-2 h-4 w-4" />
            חזרה לכל החודשים
          </Button>
          <Button onClick={remindPending} loading={reminding}>
            <BellRing className="me-2 h-4 w-4" />
            שלח תזכורת לממתינים
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        <PageHero
          variant="operational"
          eyebrow={<Badge variant={dashboard.month.isLocked ? 'warning' : 'success'}>{dashboard.month.isLocked ? 'נעול' : 'פתוח לעריכה'}</Badge>}
          kicker="Gardens Month"
          title={formatPlanLabel(plan)}
          description="עקוב אחר מי הגיש, מי צריך תזכורת, ואיפה נדרש אישור או שינוי."
          aside={
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-subtle-border bg-background/88 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-tertiary">עובדים בחודש</div>
                <div className="mt-2 text-2xl font-black">{dashboard.stats.workers}</div>
              </div>
              <div className="rounded-[20px] border border-subtle-border bg-background/88 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-tertiary">יעד הגשה</div>
                <div className="mt-2 text-lg font-black">{formatDateLabel(dashboard.month.submissionDeadline)}</div>
              </div>
            </div>
          }
        />

        <MobileMetricStrip
          roleKey={role === 'PM' ? 'PM' : 'ADMIN'}
          metrics={[
            {
              id: 'submitted',
              label: 'הוגשו',
              value: dashboard.stats.submitted,
              hint: `${dashboard.stats.workers} עובדים בחודש הפעיל`,
              tone: dashboard.stats.needsChanges > 0 ? 'warning' : 'success',
              href: '#gardens-approvals',
            },
            {
              id: 'needs-changes',
              label: 'נדרש עדכון',
              value: dashboard.stats.needsChanges,
              hint: reminderSummary > 0 ? `${reminderSummary} ממתינים לתזכורת או שינוי` : 'אין עובדים שמחכים להשלמה',
              tone: dashboard.stats.needsChanges > 0 ? 'warning' : 'success',
              href: '#gardens-approvals',
            },
          ]}
          quickActions={[
            {
              id: 'approved',
              title: 'אושרו',
              value: dashboard.stats.approved,
              subtitle: 'עובדים שאושרו',
              href: '#gardens-approvals',
              tone: 'success',
            },
            {
              id: 'assignments',
              title: 'שיבוצים',
              value: dashboard.stats.assignments,
              subtitle: 'ימי עבודה בחודש',
              href: '#gardens-reports',
            },
          ]}
        />

        <section id="gardens-approvals" className="space-y-4">
          <SectionHeader
            title="סטטוס עובדים"
            subtitle="כל עובד מקבל תוכנית AMS משלו. אפשר להיכנס לבדיקת פרטים מלאה או להפיק דו״ח חודשי."
            meta={`${dashboard.workers.length} כרטיסי עובדים`}
          />

        {!dashboard.workers.length ? (
          <EmptyState
            title="אין עובדי גינון בחודש הזה"
            description="החודש נוצר, אבל לא נמצאו פרופילי עובדים פעילים מסוג TECH לשיוך אוטומטי."
            type="restricted"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {dashboard.workers.map((worker) => (
              <RosterCard
                key={worker.workerProfileId}
                title={worker.displayName}
                subtitle={`${worker.teamName || 'ללא צוות'} · ${worker.email}`}
                avatarItems={[
                  { id: `worker-${worker.workerProfileId}`, label: worker.displayName, tone: 'primary' },
                  ...(worker.teamName ? [{ id: `team-${worker.workerProfileId}`, label: worker.teamName, fallback: worker.teamName.slice(0, 1), tone: 'success' as const }] : []),
                ]}
                badges={
                  <>
                    <GardensStatusBadge status={worker.status} />
                    <Badge variant="outline">{worker.assignmentCount > 0 ? `${worker.assignmentCount} ימים שובצו` : 'ללא שיבוצים'}</Badge>
                    {worker.reviewedBy ? <Badge variant="secondary">נבדק ע״י {worker.reviewedBy}</Badge> : null}
                  </>
                }
                details={[
                  {
                    label: 'הוגש',
                    value: worker.submittedAt ? formatDateLabel(worker.submittedAt, { dateStyle: 'medium', timeStyle: 'short' }) : 'עדיין לא',
                  },
                  {
                    label: 'תזכורת אחרונה',
                    value: worker.lastReminderAt ? formatDateLabel(worker.lastReminderAt, { dateStyle: 'medium', timeStyle: 'short' }) : 'לא נשלחה',
                  },
                ]}
                note={
                  worker.reviewNote ? (
                    <>
                      <div className="mb-1 font-semibold">הערת מנהל</div>
                      {worker.reviewNote}
                    </>
                  ) : undefined
                }
                primaryAction={{
                  label: 'פתח לאישור',
                  href: `/gardens/months/${plan}/workers/${worker.workerProfileId}`,
                  icon: FileCheck2,
                }}
                secondaryActions={[
                  {
                    id: `report-${worker.workerProfileId}`,
                    label: 'הפק דו״ח חודשי',
                    description: 'פתיחת הדו״ח בחלון חדש לצורך הורדה או הדפסה.',
                    href: `/gardens/months/${plan}/report/${worker.workerProfileId}?download=1`,
                    external: true,
                    icon: Download,
                  },
                  {
                    id: `review-${worker.workerProfileId}`,
                    label: 'פתח כרטיס עובד',
                    description: 'בדיקת פירוט מלא, הערות ושיבוצים לפני אישור.',
                    href: `/gardens/months/${plan}/workers/${worker.workerProfileId}`,
                    icon: FileCheck2,
                  },
                  {
                    id: `reminder-${worker.workerProfileId}`,
                    label: workerReminderId === worker.workerProfileId ? 'שולח תזכורת...' : 'שלח תזכורת אישית',
                    description: 'שליחת תזכורת רק לעובד הזה להשלמת או עדכון החודש.',
                    icon: BellRing,
                    tone: 'warning',
                    disabled: workerReminderId === worker.workerProfileId || worker.status === 'APPROVED',
                    onSelect: () => remindWorker(worker.workerProfileId, worker.displayName),
                  },
                ]}
              />
            ))}
          </div>
        )}
        </section>

        <section id="gardens-reports" className="space-y-4">
          <SectionHeader
            title="שיבוצים מרוכזים"
            subtitle="רשימת כל הכתובות ששובצו בחודש, לצורך בקרת עומסים וחפיפה בין עובדים."
            meta={`${dashboard.assignments.length} שורות`}
          />

        {!dashboard.assignments.length ? (
          <EmptyState
            title="אין עדיין שיבוצים להצגה"
            description="השיבוצים יופיעו כאן אחרי שהעובדים ישמרו או יגישו את התוכנית שלהם."
            type="empty"
          />
        ) : (
          <>
            <div className="grid gap-3 sm:hidden">
              {dashboard.assignments.map((assignment) => (
                <Card key={assignment.id} variant="elevated" className="rounded-[24px]">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{assignment.workerName}</div>
                        <div className="mt-1 text-[13px] leading-5 text-secondary-foreground">{assignment.location}</div>
                      </div>
                      <Badge variant="outline">{formatDateLabel(assignment.date)}</Badge>
                    </div>
                    <div className="rounded-[18px] border border-subtle-border/80 bg-background/70 p-3 text-sm leading-6 text-secondary-foreground">
                      {assignment.notes || 'ללא הערה'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card variant="elevated" className="hidden sm:block">
              <CardContent className="overflow-x-auto p-0">
                <table className="min-w-full text-right">
                  <thead className="border-b border-subtle-border bg-muted/35 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-4 font-medium">תאריך</th>
                      <th className="px-4 py-4 font-medium">עובד</th>
                      <th className="px-4 py-4 font-medium">מיקום</th>
                      <th className="px-4 py-4 font-medium">הערות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.assignments.map((assignment) => (
                      <tr key={assignment.id} className="border-b border-subtle-border/70 last:border-b-0">
                        <td className="px-4 py-4 text-sm">{formatDateLabel(assignment.date)}</td>
                        <td className="px-4 py-4 text-sm font-medium">{assignment.workerName}</td>
                        <td className="px-4 py-4 text-sm">{assignment.location}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{assignment.notes || 'ללא הערה'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
        </section>
      </div>
    </GardensModuleShell>
  );
}
