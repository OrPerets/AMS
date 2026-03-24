import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { CalendarDays, ChevronLeft, Leaf, Plus, TimerReset } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { MobileCardSkeleton } from '../ui/page-states';
import { PageHero } from '../ui/page-hero';
import { MobileActionHub } from '../ui/mobile-action-hub';
import { SectionHeader } from '../ui/section-header';
import { Badge } from '../ui/badge';
import { toast } from '../ui/use-toast';
import { GardensModuleShell } from './GardensModuleShell';
import {
  createGardensMonth,
  formatDateLabel,
  formatPlanLabel,
  getLatestGardensPlan,
  listGardensMonths,
  type GardensMonthSummary,
} from '../../lib/gardens';
import { getEffectiveRole } from '../../lib/auth';
import { showGardensMonthCreated } from '../../lib/success-feedback';

export function GardensManagerHome() {
  const router = useRouter();
  const [months, setMonths] = useState<GardensMonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const role = getEffectiveRole();

  const load = async () => {
    setLoading(true);
    try {
      setMonths(await listGardensMonths());
    } catch (error) {
      toast({
        title: 'טעינת מודול הגינון נכשלה',
        description: 'לא הצלחנו לטעון את רשימת החודשים. נסה שוב בעוד רגע.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const upcomingPlan = useMemo(() => {
    const now = new Date();
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const year = next.getUTCFullYear();
    const month = String(next.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const latestPlan = useMemo(() => getLatestGardensPlan(months), [months]);
  const latestMonth = useMemo(
    () => months.find((month) => month.plan === latestPlan) ?? months[0] ?? null,
    [latestPlan, months],
  );
  const pendingWorkersCount = useMemo(() => {
    if (!latestMonth) return 0;
    return Math.max(
      latestMonth.stats.workers - latestMonth.stats.approved,
      latestMonth.stats.submitted + latestMonth.stats.needsChanges,
    );
  }, [latestMonth]);

  const createNextMonth = async () => {
    setCreating(true);
    try {
      await createGardensMonth({ plan: upcomingPlan });
      showGardensMonthCreated(formatPlanLabel(upcomingPlan));
      await load();
      await router.push(`/gardens/months/${upcomingPlan}`);
    } catch {
      toast({
        title: 'לא הצלחנו ליצור את החודש הבא',
        description: 'בדוק שהעובדים משויכים ל-AMS ונסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <MobileCardSkeleton cards={3} />;
  }

  return (
    <GardensModuleShell
      role={role}
      activePlan={latestPlan}
      moduleLabel="דף הבית של מודול הגינון"
      title="מודול הגינון"
      description="זהו אזור עבודה נפרד בתוך AMS לניהול חודשי הגינון, אישורים, דוחות ותזכורות בלי להרגיש כמו מסך צדדי מוסתר."
      actions={
        <Button onClick={createNextMonth} loading={creating}>
          <Plus className="me-2 h-4 w-4" />
          צור את החודש הבא
        </Button>
      }
    >
      <div className="space-y-4 sm:space-y-8">
        <PageHero
          variant="operational"
          mobileCompact
          eyebrow={<Badge variant="success">AMS Native</Badge>}
          kicker="Gardens"
          title="ניהול גננים"
          description="התחל מהמשימות שממתינות לטיפול, המשך לחודש הפעיל, ומשם עבר לאישורים, דוחות ותזכורות."
          actions={
            latestPlan ? (
              <Button variant="outline" onClick={() => void router.push(`/gardens/months/${latestPlan}`)}>
                <TimerReset className="me-2 h-4 w-4" />
                המשך לחודש הפעיל
              </Button>
            ) : undefined
          }
          aside={
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-subtle-border bg-background/88 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-tertiary">חודש יעד</div>
                <div className="mt-2 text-xl font-black">{formatPlanLabel(upcomingPlan)}</div>
              </div>
              <div className="rounded-[20px] border border-subtle-border bg-background/88 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-tertiary">חודשים מנוהלים</div>
                <div className="mt-2 text-2xl font-black">{months.length}</div>
              </div>
            </div>
          }
        />

        <section className="grid gap-2.5 sm:gap-4 lg:grid-cols-3">
          <Card variant="metric">
            <CardContent className="p-3.5 sm:p-5">
              <div className="text-xs text-muted-foreground">ממתינים לטיפול</div>
              <div className="mt-1.5 text-2xl font-extrabold tabular-nums sm:mt-2 sm:text-3xl">{pendingWorkersCount}</div>
              <div className="mt-1.5 text-[13px] leading-5 text-muted-foreground sm:mt-2 sm:text-sm">
                {latestMonth ? `${formatPlanLabel(latestMonth.plan)} עדיין דורש מעקב מנהל.` : 'ברגע שייפתח חודש, תראה כאן מה מחכה לבדיקה.'}
              </div>
            </CardContent>
          </Card>
          <Card variant="metric">
            <CardContent className="p-3.5 sm:p-5">
              <div className="text-xs text-muted-foreground">קיצור מומלץ</div>
              <div className="mt-1.5 text-base font-extrabold sm:mt-2 sm:text-lg">{latestMonth ? 'אישורים ודוחות' : 'יצירת חודש ראשון'}</div>
              <div className="mt-1.5 text-[13px] leading-5 text-muted-foreground sm:mt-2 sm:text-sm">
                {latestMonth ? 'פתח את החודש הפעיל כדי לבדוק הגשות, להחזיר לעדכון או לייצא דוח.' : 'התחל מיצירת חודש עבודה חדש לעובדי הגינון.'}
              </div>
            </CardContent>
          </Card>
          <Card variant="metric">
            <CardContent className="p-3.5 sm:p-5">
              <div className="text-xs text-muted-foreground">תזכורות</div>
              <div className="mt-1.5 text-2xl font-extrabold tabular-nums sm:mt-2 sm:text-3xl">{latestMonth?.stats.needsChanges ?? 0}</div>
              <div className="mt-1.5 text-[13px] leading-5 text-muted-foreground sm:mt-2 sm:text-sm">
                עובדים עם צורך בעדכון או בהמשך מעקב לפני אישור סופי.
              </div>
            </CardContent>
          </Card>
        </section>

        <MobileActionHub
          mobileHomeEffect
          title="מרכז עבודה"
          subtitle="כניסות ישירות למסלולי העבודה המרכזיים של מודול הגינון."
          items={[
            {
              id: 'new-month',
              label: 'חודש חדש',
              description: formatPlanLabel(upcomingPlan),
              icon: Plus,
              accent: 'primary',
              onClick: () => void createNextMonth(),
            },
            {
              id: 'approvals',
              label: 'אישורים',
              description: latestMonth ? `פתח ${formatPlanLabel(latestMonth.plan)}` : 'אין חודש פעיל',
              href: latestMonth ? `/gardens/months/${latestMonth.plan}` : '/gardens',
              icon: Leaf,
              accent: 'info',
            },
            {
              id: 'reports',
              label: 'דוחות',
              description: 'ייצוא חודשי לעובדים',
              href: latestMonth ? `/gardens/months/${latestMonth.plan}` : '/gardens',
              icon: CalendarDays,
              accent: 'neutral',
            },
            {
              id: 'reminders',
              label: 'תזכורות',
              description: latestMonth ? 'שליחה ומעקב לעובדים ממתינים' : 'ייפתחו אחרי יצירת חודש',
              href: latestMonth ? `/gardens/reminders?plan=${latestMonth.plan}` : '/gardens/reminders',
              icon: Leaf,
              accent: 'warning',
            },
          ]}
        />

        <section className="space-y-3 sm:space-y-4">
          <SectionHeader
            title="חודשים פעילים והיסטוריים"
            subtitle="כל חודש נוצר מתוך המודול הייעודי, מושך עובדים פעילים, ומשמש ככניסה אחת לאישורים, דוחות ותזכורות."
            meta={months.length ? `${months.length} חודשים` : 'ללא חודשים'}
          />

          {!months.length ? (
            <EmptyState
              title="עדיין לא נוצר חודש גינון"
              description="ברגע שייווצר חודש ראשון, העובדים יראו אותו במסך האישי שלהם ויוכלו להגיש תוכנית לאישור."
              type="create"
              action={{ label: 'צור את החודש הבא', onClick: createNextMonth }}
            />
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {months.map((month) => (
                <Card
                  key={month.plan}
                  variant="action"
                  onClick={() => void router.push(`/gardens/months/${month.plan}`)}
                >
                  <CardHeader className="space-y-2 sm:space-y-3">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          <Badge variant={month.isLocked ? 'warning' : 'success'}>
                            {month.isLocked ? 'חודש נעול' : 'חודש פתוח'}
                          </Badge>
                          <Badge variant="outline">{month.plan}</Badge>
                          {latestPlan === month.plan ? <Badge variant="secondary">ברירת המחדל של המודול</Badge> : null}
                        </div>
                        <CardTitle className="text-xl sm:text-2xl">{formatPlanLabel(month.plan)}</CardTitle>
                      </div>
                      <div className="rounded-2xl border border-primary/12 bg-primary/8 p-2.5 text-primary sm:p-3">
                        <Leaf className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="flex flex-wrap gap-2 text-[13px] text-muted-foreground sm:text-sm">
                      <span>{month.stats.workers} עובדים</span>
                      <span>•</span>
                      <span>{month.stats.submitted} הוגשו</span>
                      <span>•</span>
                      <span>{month.stats.coverageDays} ימי כיסוי</span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                      <div className="rounded-2xl border border-subtle-border/80 bg-background/75 p-2.5 text-[13px] sm:p-3 sm:text-sm">
                        <div className="text-xs text-muted-foreground">יעד הגשה</div>
                        <div className="mt-1.5 font-semibold sm:mt-2">{formatDateLabel(month.submissionDeadline)}</div>
                      </div>
                      <div className="rounded-2xl border border-subtle-border/80 bg-background/75 p-2.5 text-[13px] sm:p-3 sm:text-sm">
                        <div className="text-xs text-muted-foreground">ממתינים לטיפול</div>
                        <div className="mt-1.5 font-semibold sm:mt-2">{Math.max(month.stats.workers - month.stats.approved, 0)} עובדים</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted-foreground sm:gap-3 sm:text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        אישורים, דוחות ותזכורות במקום אחד
                      </div>
                      <div className="inline-flex items-center gap-2 font-medium text-primary">
                        פתח חודש
                        <ChevronLeft className="h-4 w-4" />
                      </div>
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
