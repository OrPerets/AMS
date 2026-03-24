import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { BellRing, FileCheck2, Send, Undo2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { MobileCardSkeleton } from '../ui/page-states';
import { SectionHeader } from '../ui/section-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from '../ui/use-toast';
import { getEffectiveRole } from '../../lib/auth';
import {
  formatDateLabel,
  formatPlanLabel,
  getGardensManagerDashboard,
  getLatestGardensPlan,
  listGardensMonths,
  sendGardensReminders,
  type GardensManagerDashboard,
  type GardensMonthSummary,
} from '../../lib/gardens';
import { GardensModuleShell } from './GardensModuleShell';
import { GardensStatusBadge } from './GardensStatusBadge';

export function GardensRemindersCenter({ initialPlan }: { initialPlan?: string | null }) {
  const router = useRouter();
  const role = getEffectiveRole();
  const [months, setMonths] = useState<GardensMonthSummary[]>([]);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan || '');
  const [dashboard, setDashboard] = useState<GardensManagerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingWorkerId, setSendingWorkerId] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const loadedMonths = await listGardensMonths();
        setMonths(loadedMonths);
        const plan = initialPlan || getLatestGardensPlan(loadedMonths) || '';
        setSelectedPlan(plan);
      } catch {
        toast({
          title: 'טעינת מרכז התזכורות נכשלה',
          description: 'לא ניתן למשוך כרגע את חודשי הגינון.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [initialPlan]);

  useEffect(() => {
    if (!selectedPlan) return;

    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const data = await getGardensManagerDashboard(selectedPlan);
        if (!cancelled) {
          setDashboard(data);
        }
      } catch {
        if (!cancelled) {
          toast({
            title: 'טעינת התזכורות נכשלה',
            description: 'לא הצלחנו לפתוח את מצב העובדים של החודש שבחרת.',
            variant: 'destructive',
          });
          setDashboard(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedPlan]);

  const pendingWorkers = useMemo(
    () => dashboard?.workers.filter((worker) => ['DRAFT', 'NEEDS_CHANGES'].includes(worker.status)) ?? [],
    [dashboard],
  );

  async function sendAllPending() {
    if (!selectedPlan) return;
    setSending(true);
    try {
      const result = await sendGardensReminders(selectedPlan, { onlyPending: true });
      toast({
        title: 'התזכורות נשלחו',
        description: `נשלחו ${result.sent} תזכורות לעובדים שעדיין צריכים פעולה.`,
        variant: 'success',
      });
      setDashboard(await getGardensManagerDashboard(selectedPlan));
    } catch {
      toast({
        title: 'שליחת התזכורות נכשלה',
        description: 'נסה שוב בעוד רגע.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }

  async function remindWorker(workerProfileId: number) {
    if (!selectedPlan) return;
    setSendingWorkerId(workerProfileId);
    try {
      const result = await sendGardensReminders(selectedPlan, { workerProfileIds: [workerProfileId] });
      toast({
        title: 'תזכורת נשלחה',
        description: result.sent > 0 ? 'העובד עודכן להמשיך את הטיפול בחודש.' : 'לא נשלחה תזכורת חדשה.',
        variant: 'success',
      });
      setDashboard(await getGardensManagerDashboard(selectedPlan));
    } catch {
      toast({
        title: 'שליחת התזכורת נכשלה',
        description: 'לא הצלחנו לעדכן את העובד כרגע.',
        variant: 'destructive',
      });
    } finally {
      setSendingWorkerId(null);
    }
  }

  if (loading && !dashboard && !months.length) {
    return <MobileCardSkeleton cards={3} />;
  }

  if (!months.length) {
    return (
      <GardensModuleShell
        role={role}
        moduleLabel="מרכז תזכורות"
        title="מרכז התזכורות של מודול הגינון"
        description="כאן נשלחות תזכורות לעובדים שעדיין לא הגישו או נדרשים לעדכון, אבל קודם צריך ליצור חודש עבודה."
      >
        <EmptyState
          title="אין עדיין חודש גינון פעיל"
          description="צור חודש גינון ראשון כדי להתחיל לעקוב אחרי עובדים ולשלוח תזכורות."
          type="create"
          action={{ label: 'חזרה לדף הבית של הגינון', onClick: () => void router.push('/gardens') }}
        />
      </GardensModuleShell>
    );
  }

  return (
    <GardensModuleShell
      role={role}
      activePlan={selectedPlan}
      moduleLabel={`מרכז תזכורות ${selectedPlan ? formatPlanLabel(selectedPlan) : ''}`.trim()}
      title="מרכז התזכורות והמעקב"
      description="מסך ייעודי לשליחת תזכורות, איתור עובדים שעדיין לא השלימו את החודש, ומעקב אחרי הפעולה האחרונה שבוצעה."
      actions={
        <>
          <Button variant="outline" onClick={() => void router.push(selectedPlan ? `/gardens/months/${selectedPlan}` : '/gardens')}>
            <Undo2 className="me-2 h-4 w-4" />
            חזרה לחודש
          </Button>
          <Button onClick={() => void sendAllPending()} loading={sending} disabled={!pendingWorkers.length}>
            <Send className="me-2 h-4 w-4" />
            שלח לכל הממתינים
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        <section className="grid gap-4 lg:grid-cols-3">
          <Card variant="metric">
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">חודש במעקב</div>
              <div className="mt-2 text-xl font-black">{selectedPlan ? formatPlanLabel(selectedPlan) : 'לא נבחר'}</div>
            </CardContent>
          </Card>
          <Card variant="metric">
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">ממתינים לתזכורת</div>
              <div className="mt-2 text-3xl font-black">{pendingWorkers.length}</div>
            </CardContent>
          </Card>
          <Card variant="metric">
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">הוגשו לאישור</div>
              <div className="mt-2 text-3xl font-black">{dashboard?.stats.submitted ?? 0}</div>
            </CardContent>
          </Card>
        </section>

        <Card variant="featured">
          <CardHeader className="space-y-3">
            <CardTitle>בחר חודש לניהול תזכורות</CardTitle>
            <CardDescription>אפשר לעבור בין חודשים כדי לעקוב אחרי עובדים שעדיין לא הגישו או שהוחזרו לעדכון.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedPlan}
              onValueChange={(value) => {
                setSelectedPlan(value);
                void router.replace(`/gardens/reminders?plan=${value}`, undefined, { shallow: true });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר חודש" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.plan} value={month.plan}>
                    {formatPlanLabel(month.plan)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <SectionHeader
            title="עובדים שממתינים לפעולה"
            subtitle="מכאן שולחים תזכורות אישיות או עוברים ישירות למסך האישור של החודש."
            meta={`${pendingWorkers.length} עובדים`}
          />

          {!pendingWorkers.length ? (
            <EmptyState
              title="אין כרגע עובדים שממתינים לתזכורת"
              description="כל העובדים השלימו את הפעולה הנדרשת או נמצאים כבר אחרי אישור."
              type="action"
              action={selectedPlan ? { label: 'פתח את החודש', onClick: () => void router.push(`/gardens/months/${selectedPlan}`) } : undefined}
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {pendingWorkers.map((worker) => (
                <Card key={worker.workerProfileId} variant="action">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <GardensStatusBadge status={worker.status} />
                          <Badge variant="outline">{worker.assignmentCount} ימים שובצו</Badge>
                        </div>
                        <CardTitle>{worker.displayName}</CardTitle>
                        <CardDescription>
                          {worker.teamName || 'ללא צוות'} | {worker.email}
                        </CardDescription>
                      </div>
                      <div className="rounded-[18px] border border-primary/12 bg-primary/8 p-3 text-primary">
                        <BellRing className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[18px] border border-subtle-border/80 bg-background/75 p-3 text-sm">
                        <div className="text-xs text-muted-foreground">הוגש לאחרונה</div>
                        <div className="mt-2 font-semibold">
                          {worker.submittedAt ? formatDateLabel(worker.submittedAt, { dateStyle: 'medium', timeStyle: 'short' }) : 'עדיין לא הוגש'}
                        </div>
                      </div>
                      <div className="rounded-[18px] border border-subtle-border/80 bg-background/75 p-3 text-sm">
                        <div className="text-xs text-muted-foreground">תזכורת אחרונה</div>
                        <div className="mt-2 font-semibold">
                          {worker.lastReminderAt ? formatDateLabel(worker.lastReminderAt, { dateStyle: 'medium', timeStyle: 'short' }) : 'לא נשלחה'}
                        </div>
                      </div>
                    </div>

                    {worker.reviewNote ? (
                      <div className="rounded-[18px] border border-warning/20 bg-warning/8 p-3 text-sm leading-6 text-foreground">
                        <div className="mb-1 font-semibold">הערת מנהל פעילה</div>
                        {worker.reviewNote}
                      </div>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        variant="outline"
                        onClick={() => void remindWorker(worker.workerProfileId)}
                        loading={sendingWorkerId === worker.workerProfileId}
                      >
                        <Send className="me-2 h-4 w-4" />
                        שלח תזכורת
                      </Button>
                      <Button onClick={() => void router.push(`/gardens/months/${selectedPlan}/workers/${worker.workerProfileId}`)}>
                        <FileCheck2 className="me-2 h-4 w-4" />
                        פתח לאישור
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </GardensModuleShell>
  );
}
