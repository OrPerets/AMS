import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { ArrowRight, Home, Leaf, ListChecks, Sprout, Undo2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { GlassSurface } from '../ui/glass-surface';
import { cn } from '../../lib/utils';
import { getCurrentUserId } from '../../lib/auth';
import { getLatestGardensPlan, getStoredGardensResume, setStoredGardensResume } from '../../lib/gardens';

type NavItem = {
  label: string;
  href: string;
  icon: typeof Home;
};

export function GardensModuleShell({
  children,
  title,
  description,
  role,
  activePlan,
  moduleLabel,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  role?: string | null;
  activePlan?: string | null;
  moduleLabel: string;
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  const userId = getCurrentUserId();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!router.asPath.startsWith('/gardens')) return;
    if (router.asPath.includes('/report/')) return;

    setStoredGardensResume(router.asPath, {
      role,
      userId,
      label: moduleLabel,
    });
  }, [moduleLabel, role, router.asPath, userId]);

  const resume = useMemo(() => getStoredGardensResume(role, userId), [role, userId, router.asPath]);
  const latestPlan = activePlan || getLatestGardensPlan(activePlan ? [{ plan: activePlan }] : []);
  const managerItems: NavItem[] = [
    { label: 'בית הגינון', href: '/gardens', icon: Home },
    { label: 'חודש פעיל', href: latestPlan ? `/gardens/months/${latestPlan}` : '/gardens', icon: Sprout },
    {
      label: 'תזכורות ומעקב',
      href: latestPlan ? `/gardens/reminders?plan=${latestPlan}` : '/gardens/reminders',
      icon: ListChecks,
    },
    { label: 'חזרה ל-AMS', href: '/home', icon: Undo2 },
  ];
  const workerItems: NavItem[] = [
    { label: 'המרחב שלי', href: '/gardens', icon: Home },
    { label: 'המשך לחודש', href: '/gardens#gardens-worker-month-grid', icon: Sprout },
    { label: 'הנחיות הגשה', href: '/gardens#gardens-guidelines', icon: ListChecks },
    { label: 'חזרה ל-AMS', href: '/home', icon: Undo2 },
  ];
  const navItems = role === 'TECH' ? workerItems : managerItems;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card variant="featured" className="mobile-entry-card overflow-hidden border-primary/15 bg-[radial-gradient(circle_at_top,_rgba(74,124,67,0.16),_transparent_40%),linear-gradient(180deg,_rgba(255,250,244,0.98),_rgba(247,242,233,0.95))]">
        <CardContent className="space-y-3 p-3.5 sm:space-y-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Badge variant="success">Garden module</Badge>
            <Badge variant="outline">{role === 'TECH' ? 'עובד שטח' : 'ניהול ותיאום'}</Badge>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12 sm:rounded-2xl">
                <Leaf className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-xl font-black tracking-tight text-foreground sm:text-3xl">{title}</h1>
                <p className="max-w-3xl text-[13px] leading-5 text-muted-foreground sm:text-base sm:leading-7">{description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">{actions}</div>
          </div>

          <div className="grid gap-2.5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-3">
            <GlassSurface className="rounded-[26px] p-3 sm:p-4">
              <div className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-tertiary sm:mb-3">ניווט המודול</div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.href.includes('#')
                    ? router.asPath === item.href
                    : router.asPath === item.href || (item.href !== '/gardens' && router.asPath.startsWith(item.href.split('?')[0]));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex min-h-[56px] items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition-colors',
                        active
                          ? 'border-primary/30 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]'
                          : 'border-border/70 bg-background/75 text-foreground hover:border-primary/20 hover:bg-primary/5',
                      )}
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-background/95 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </GlassSurface>

            <GlassSurface className="rounded-[26px] p-3 sm:p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">המשך מהנקודה האחרונה</div>
              <div className="mt-1.5 text-[15px] font-semibold text-foreground sm:mt-2 sm:text-base">{resume?.label || 'עדיין לא נשמר מסלול קודם'}</div>
              <div className="mt-1 text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                {resume?.href && resume.href !== router.asPath
                  ? 'המערכת זוכרת את המסך האחרון שביקרת בו בתוך מודול הגינון.'
                  : 'הניווט במודול מופרד מ-AMS כדי לשמור על הקשר עבודה ברור.'}
              </div>
              {resume?.href && resume.href !== router.asPath ? (
                <Button asChild variant="outline" size="sm" className="mt-4 w-full justify-between">
                  <Link href={resume.href}>
                    <span>חזור למסך האחרון</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </GlassSurface>
          </div>
        </CardContent>
      </Card>

      {children}
    </div>
  );
}
