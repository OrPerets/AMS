import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { CalendarDays, ChevronLeft, Leaf, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { MobileCardSkeleton } from '../ui/page-states';
import { PageHero } from '../ui/page-hero';
import { MobileActionHub } from '../ui/mobile-action-hub';
import { SectionHeader } from '../ui/section-header';
import { Badge } from '../ui/badge';
import { toast } from '../ui/use-toast';
import {
  createGardensMonth,
  formatDateLabel,
  formatPlanLabel,
  listGardensMonths,
  type GardensMonthSummary,
} from '../../lib/gardens';

export function GardensManagerHome() {
  const router = useRouter();
  const [months, setMonths] = useState<GardensMonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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

  const createNextMonth = async () => {
    setCreating(true);
    try {
      await createGardensMonth({ plan: upcomingPlan });
      toast({
        title: 'חודש גינון חדש נוצר',
        description: `החודש ${formatPlanLabel(upcomingPlan)} מוכן לעבודה.`,
        variant: 'success',
      });
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
    <div className="space-y-8">
      <PageHero
        variant="operational"
        eyebrow={<Badge variant="success">AMS Native</Badge>}
        kicker="Gardens"
        title="ניהול גננים"
        description="הסתכל קודם על מה שממתין לטיפול, מי עוד לא הגיש, ומה צריך לפתוח עכשיו."
        actions={
          <Button onClick={createNextMonth} loading={creating}>
            <Plus className="me-2 h-4 w-4" />
            צור את החודש הבא
          </Button>
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

      <MobileActionHub
        title="מרכז עבודה"
        subtitle="קיצורים ישירים לפי סדר העבודה בפועל."
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
            description: months[0] ? `פתח ${formatPlanLabel(months[0].plan)}` : 'אין חודש פעיל',
            href: months[0] ? `/gardens/months/${months[0].plan}` : '/gardens',
            icon: Leaf,
            accent: 'info',
          },
          {
            id: 'reports',
            label: 'דוחות',
            description: 'ייצוא חודשי לעובדים',
            href: months[0] ? `/gardens/months/${months[0].plan}` : '/gardens',
            icon: CalendarDays,
            accent: 'neutral',
          },
          {
            id: 'reminders',
            label: 'תזכורות',
            description: 'לעובדים שטרם הגישו',
            href: '/gardens/reminders',
            icon: Leaf,
            accent: 'warning',
          },
        ]}
      />

      <section className="space-y-4">
        <SectionHeader
          title="חודשים פעילים והיסטוריים"
          subtitle="כל חודש נוצר בתוך בסיס הנתונים של AMS ומושך אוטומטית את עובדי השטח הפעילים."
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
          <div className="space-y-3">
            {months.map((month) => (
              <Card
                key={month.plan}
                variant="action"
                onClick={() => void router.push(`/gardens/months/${month.plan}`)}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={month.isLocked ? 'warning' : 'success'}>
                          {month.isLocked ? 'חודש נעול' : 'חודש פתוח'}
                        </Badge>
                        <Badge variant="outline">{month.plan}</Badge>
                      </div>
                      <CardTitle className="text-2xl">{formatPlanLabel(month.plan)}</CardTitle>
                    </div>
                    <div className="rounded-[18px] border border-primary/12 bg-primary/8 p-3 text-primary">
                      <Leaf className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>{month.stats.workers} עובדים</span>
                    <span>•</span>
                    <span>{month.stats.submitted} הוגשו</span>
                    <span>•</span>
                    <span>{month.stats.coverageDays} ימי כיסוי</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      יעד הגשה: {formatDateLabel(month.submissionDeadline)}
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
  );
}
