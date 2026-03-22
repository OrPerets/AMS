import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { ArrowRight, Building2, ClipboardList, Leaf, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { getDefaultRoute, getEffectiveRole, isAuthenticated, logout, shouldRouteToWorkerHub } from '../lib/auth';

const WEEKLY_FORM_URL = process.env.NEXT_PUBLIC_WEEKLY_FORM_URL || 'https://amit-ex.vercel.app/';

const workerActions = [
  {
    key: 'management',
    title: 'כניסה למערכת ניהול',
    description: 'המשך לעמדת AMS הראשית לפי התפקיד שלך.',
    href: '',
    external: false,
    icon: Building2,
    roles: ['ADMIN', 'MASTER', 'PM', 'TECH', 'ACCOUNTANT'],
  },
  {
    key: 'weekly-form',
    title: 'מעבר לדו"ח פיקוח',
    description: 'פתיחה מהירה של טופס הפיקוח החיצוני בחלון חדש.',
    href: WEEKLY_FORM_URL,
    external: true,
    icon: ClipboardList,
    roles: ['ADMIN', 'MASTER', 'PM', 'TECH'],
  },
  {
    key: 'gardens',
    title: 'ניהול גננים',
    description: 'תכנון חודשי, אישורים ותצוגת דוחות בתוך AMS.',
    href: '/gardens',
    external: false,
    icon: Leaf,
    roles: ['ADMIN', 'MASTER', 'PM', 'TECH'],
  },
] as const;

export default function WorkerHubPage() {
  const router = useRouter();
  const role = getEffectiveRole();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login?portal=worker');
      return;
    }

    if (role && !shouldRouteToWorkerHub(role)) {
      router.replace(getDefaultRoute(role));
    }
  }, [role, router]);

  const visibleActions = useMemo(
    () => workerActions.filter((action) => role && action.roles.includes(role)),
    [role],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(201,156,72,0.14),transparent_30%),linear-gradient(180deg,rgba(250,247,240,0.96),rgba(245,240,230,0.86))] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center sm:mb-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-raised">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-4xl">כניסה לעובדים</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            בחרו את סביבת העבודה הרלוונטית להמשך.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {visibleActions.map((action) => {
            const Icon = action.icon;
            const href = action.key === 'management' ? getDefaultRoute(role) : action.href;
            const content = (
              <Card className="h-full border-primary/15 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl">
                <CardHeader className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{action.title}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-relaxed">
                      {action.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="inline-flex items-center text-sm font-medium text-primary">
                    פתח
                    <ArrowRight className="me-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            );

            if (action.external) {
              return (
                <a key={action.key} href={href} target="_blank" rel="noreferrer" className="block">
                  {content}
                </a>
              );
            }

            return (
              <Link key={action.key} href={href} className="block">
                {content}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={logout}>
            <LogOut className="me-2 h-4 w-4" />
            התנתק
          </Button>
        </div>
      </div>
    </div>
  );
}
