import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { BellRing, CalendarDays, Download, FileCheck2, Undo2, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { TableListSkeleton } from '../ui/page-states';
import { PageHero } from '../ui/page-hero';
import { SectionHeader } from '../ui/section-header';
import { toast } from '../ui/use-toast';
import {
  formatDateLabel,
  formatPlanLabel,
  getGardensManagerDashboard,
  sendGardensReminders,
  type GardensManagerDashboard,
} from '../../lib/gardens';
import { GardensStatusBadge } from './GardensStatusBadge';

export function GardensManagerMonth({ plan }: { plan: string }) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<GardensManagerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState(false);

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
    <div className="space-y-8">
      <PageHero
        variant="operational"
        eyebrow={<Badge variant={dashboard.month.isLocked ? 'warning' : 'success'}>{dashboard.month.isLocked ? 'נעול' : 'פתוח לעריכה'}</Badge>}
        kicker="Gardens Month"
        title={formatPlanLabel(plan)}
        description="עקוב אחר מי הגיש, מי צריך תזכורת, ואיפה נדרש אישור או שינוי."
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

      <section className="grid gap-4 lg:grid-cols-4">
        {[
          { label: 'הוגשו', value: dashboard.stats.submitted, icon: FileCheck2 },
          { label: 'אושרו', value: dashboard.stats.approved, icon: CalendarDays },
          { label: 'נדרש עדכון', value: dashboard.stats.needsChanges, icon: BellRing },
          { label: 'ימי שיבוץ', value: dashboard.stats.assignments, icon: Users },
        ].map((item) => (
          <Card key={item.label} variant="metric">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="mt-2 text-3xl font-black">{item.value}</div>
              </div>
              <div className="rounded-[18px] border border-primary/12 bg-primary/8 p-3 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
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
              <Card key={worker.workerProfileId} variant="action">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <GardensStatusBadge status={worker.status} />
                        {worker.assignmentCount > 0 ? (
                          <Badge variant="outline">{worker.assignmentCount} ימים שובצו</Badge>
                        ) : (
                          <Badge variant="outline">ללא שיבוצים</Badge>
                        )}
                      </div>
                      <CardTitle>{worker.displayName}</CardTitle>
                      <CardDescription>
                        {worker.teamName || 'ללא צוות'} | {worker.email}
                      </CardDescription>
                    </div>
                    <div className="rounded-[18px] border border-primary/12 bg-primary/8 p-3 text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-subtle-border/80 bg-background/75 p-4">
                      <div className="text-xs text-muted-foreground">הוגש</div>
                      <div className="mt-2 text-sm font-semibold">
                        {worker.submittedAt ? formatDateLabel(worker.submittedAt, { dateStyle: 'medium', timeStyle: 'short' }) : 'עדיין לא'}
                      </div>
                    </div>
                    <div className="rounded-[20px] border border-subtle-border/80 bg-background/75 p-4">
                      <div className="text-xs text-muted-foreground">תזכורת אחרונה</div>
                      <div className="mt-2 text-sm font-semibold">
                        {worker.lastReminderAt ? formatDateLabel(worker.lastReminderAt, { dateStyle: 'medium', timeStyle: 'short' }) : 'לא נשלחה'}
                      </div>
                    </div>
                  </div>

                  {worker.reviewNote ? (
                    <div className="rounded-[20px] border border-warning/20 bg-warning/8 p-4 text-sm leading-6 text-foreground">
                      <div className="mb-1 font-semibold">הערת מנהל</div>
                      {worker.reviewNote}
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link href={`/gardens/months/${plan}/workers/${worker.workerProfileId}`} className="inline-flex">
                      <Button className="w-full">
                        <FileCheck2 className="me-2 h-4 w-4" />
                        פתח לאישור
                      </Button>
                    </Link>
                    <Link
                      href={`/gardens/months/${plan}/report/${worker.workerProfileId}?download=1`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex"
                    >
                      <Button variant="outline" className="w-full">
                        <Download className="me-2 h-4 w-4" />
                        הפק דו״ח
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
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
          <Card variant="elevated">
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
        )}
      </section>
    </div>
  );
}
