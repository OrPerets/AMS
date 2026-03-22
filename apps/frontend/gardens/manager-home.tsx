'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarDays, ClipboardCheck, FileSpreadsheet, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { createGardensMonth, getGardensDashboard, listGardensMonths, type GardensDashboard, type GardensMonthListItem } from './api';
import { getNextMonthLabel } from './utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MobileCardSkeleton } from '@/components/ui/page-states';
import { StatusBadge } from '@/components/ui/status-badge';

export function GardensManagerHome() {
  const [dashboard, setDashboard] = useState<GardensDashboard | null>(null);
  const [months, setMonths] = useState<GardensMonthListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardData, monthsData] = await Promise.all([getGardensDashboard(), listGardensMonths()]);
      setDashboard(dashboardData);
      setMonths(monthsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'טעינת המודול נכשלה.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createNextMonth = async () => {
    try {
      setCreating(true);
      const nextMonth = getNextMonthLabel();
      await createGardensMonth(nextMonth);
      toast.success(`נוצר חודש תכנון ${nextMonth}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'יצירת החודש נכשלה.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <MobileCardSkeleton cards={4} />;
  }

  if (error) {
    return (
      <EmptyState
        type="error"
        title="טעינת מודול הגינון נכשלה"
        description={error}
        action={{ label: 'נסה שוב', onClick: () => void load() }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="featured">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl sm:text-3xl">מודול גינון</CardTitle>
            <CardDescription>
              תכנון חודשי, הגשות עובדים, אישורים ודוחות צוותי גינון בתוך AMS.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={createNextMonth} loading={creating}>
              צור חודש תכנון חדש
            </Button>
            {dashboard?.activeMonth ? (
              <Button asChild variant="outline">
                <Link href={`/gardens/plan/${dashboard.activeMonth.month}`}>פתח את החודש הפעיל</Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'חודשי תכנון', value: dashboard?.summary.totalMonths ?? 0, icon: CalendarDays },
          { label: 'עובדים פעילים', value: dashboard?.summary.activeWorkers ?? 0, icon: FileSpreadsheet },
          { label: 'ממתינים לאישור', value: dashboard?.summary.pendingApprovals ?? 0, icon: ClipboardCheck },
          { label: 'דורש טיפול', value: dashboard?.summary.requiresAttention ?? 0, icon: BellRing },
        ].map((item) => (
          <Card key={item.label} variant="metric">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">{item.label}</CardTitle>
              <item.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card variant="action" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>מרכז עבודה</CardTitle>
            <CardDescription>כל הפעולות המרכזיות מרוכזות כאן לפי סדר העבודה בפועל.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link href={dashboard?.activeMonth ? `/gardens/plan/${dashboard.activeMonth.month}` : '/gardens'} className="rounded-[22px] border border-subtle-border bg-background/80 p-4 transition hover:border-primary/30 hover:shadow-card">
              <div className="text-sm font-semibold">תכנון חודשי</div>
              <p className="mt-2 text-sm text-muted-foreground">ניהול כל תוכניות העובדים בחודש הפעיל.</p>
            </Link>
            <Link href={dashboard?.activeMonth ? `/gardens/approvals/${dashboard.activeMonth.month}` : '/gardens'} className="rounded-[22px] border border-subtle-border bg-background/80 p-4 transition hover:border-primary/30 hover:shadow-card">
              <div className="text-sm font-semibold">אישורי תוכנית</div>
              <p className="mt-2 text-sm text-muted-foreground">מעבר מהיר להגשות שממתינות לסקירה.</p>
            </Link>
            <Link href={dashboard?.activeMonth ? `/gardens/plan/${dashboard.activeMonth.month}` : '/gardens'} className="rounded-[22px] border border-subtle-border bg-background/80 p-4 transition hover:border-primary/30 hover:shadow-card">
              <div className="text-sm font-semibold">דוחות</div>
              <p className="mt-2 text-sm text-muted-foreground">ייצוא דוחות חודשיים לכל עובד ישירות מתוך AMS.</p>
            </Link>
            <Link href="/gardens/reminders" className="rounded-[22px] border border-subtle-border bg-background/80 p-4 transition hover:border-primary/30 hover:shadow-card">
              <div className="text-sm font-semibold">תזכורות</div>
              <p className="mt-2 text-sm text-muted-foreground">שליחת תזכורות לעובדים שעדיין לא הגישו תוכנית.</p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>החודש הפעיל</CardTitle>
            <CardDescription>מצב נוכחי של מחזור העבודה הפעיל.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard?.activeMonth ? (
              <>
                <div className="text-xl font-semibold">{dashboard.activeMonth.month}</div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    label={dashboard.activeMonth.isLocked ? 'נעול' : 'פתוח לעבודה'}
                    tone={dashboard.activeMonth.isLocked ? 'warning' : 'active'}
                  />
                  <StatusBadge label={`${dashboard.activeMonth.submitted} ממתינים`} tone="active" />
                  <StatusBadge label={`${dashboard.activeMonth.needsChanges} לתיקון`} tone="warning" />
                </div>
              </>
            ) : (
              <EmptyState
                size="sm"
                type="create"
                title="עדיין אין חודש תכנון"
                description="כדי להתחיל לעבוד, צרו את חודש התכנון הבא והמערכת תכין אוטומטית תוכניות לכל עובדי הגינון."
                action={{ label: 'צור חודש ראשון', onClick: () => void createNextMonth() }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>חודשי תכנון</CardTitle>
          <CardDescription>רשימת כל החודשים, כולל מצב הגשה, אישור וכמות שיבוצים.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {months.length === 0 ? (
            <EmptyState
              size="sm"
              type="empty"
              title="אין עדיין חודשי תכנון"
              description="החודש הראשון יופיע כאן מיד לאחר יצירה."
            />
          ) : (
            months.map((month) => (
              <div key={month.id} className="flex flex-col gap-3 rounded-[22px] border border-subtle-border bg-background/80 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold">{month.month}</div>
                    <StatusBadge label={month.isLocked ? 'נעול' : 'פתוח'} tone={month.isLocked ? 'warning' : 'active'} />
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>{month.workers} עובדים</span>
                    <span>{month.assignments} שיבוצים</span>
                    <span>{month.submitted} ממתינים</span>
                    <span>{month.approved} אושרו</span>
                    <span>{month.needsChanges} לתיקון</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/gardens/plan/${month.month}`}>לפתיחת התכנון</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/gardens/approvals/${month.month}`}>לסקירת ההגשות</Link>
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
