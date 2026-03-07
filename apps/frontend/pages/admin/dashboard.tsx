import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, CreditCard, ShieldCheck, Ticket, UserCog, Users } from 'lucide-react';
import { authFetch, startImpersonation } from '../../lib/auth';
import { KpiCard } from '../../components/ui/kpi-card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from '../../components/ui/use-toast';

interface OverviewResponse {
  stats: {
    totalUsers: number;
    totalBuildings: number;
    openTickets: number;
    unpaidInvoices: number;
    activeTechs: number;
  };
  health: Record<string, string>;
  roleCounts: Record<string, number>;
  users: Array<{
    id: number;
    email: string;
    role: string;
    tenantId: number;
    phone?: string | null;
    createdAt: string;
  }>;
  recentImpersonationEvents: Array<{
    id: number;
    action: string;
    targetRole?: string | null;
    reason?: string | null;
    createdAt: string;
  }>;
  navigation: Array<{ label: string; href: string }>;
}

export default function Dashboard() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const response = await authFetch('/admin/overview');
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setData(await response.json());
    } catch {
      toast({
        title: 'טעינת דשבורד נכשלה',
        description: 'לא ניתן לטעון את נתוני הניהול כרגע.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function impersonate(role: string) {
    try {
      setSwitchingRole(role);
      await startImpersonation(role, 1, 'Admin dashboard quick switch');
      window.location.href =
        role === 'TECH' ? '/tech/jobs' : role === 'ACCOUNTANT' ? '/payments' : role === 'RESIDENT' ? '/tickets' : '/home';
    } catch {
      toast({
        title: 'החלפת תפקיד נכשלה',
        description: 'לא ניתן להתחבר לתפקיד המבוקש.',
        variant: 'destructive',
      });
    } finally {
      setSwitchingRole(null);
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">דשבורד ניהול</h1>
          <p className="text-muted-foreground">סטטוס מערכת, ניהול משתמשים, וקיצורי דרך לפעולות ניהוליות.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.navigation.map((item) => (
            <Button key={item.href} variant="outline" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="משתמשים" value={String(data.stats.totalUsers)} icon={Users} />
        <KpiCard title="בניינים" value={String(data.stats.totalBuildings)} icon={Building2} />
        <KpiCard title="קריאות פתוחות" value={String(data.stats.openTickets)} icon={Ticket} />
        <KpiCard title="חשבוניות פתוחות" value={String(data.stats.unpaidInvoices)} icon={CreditCard} />
        <KpiCard title="טכנאים" value={String(data.stats.activeTechs)} icon={UserCog} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>ניהול משתמשים</CardTitle>
            <CardDescription>המשתמשים האחרונים במערכת עם מעבר מהיר לתפקידי בדיקה.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.users.map((user) => (
              <div key={user.id} className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.email}</p>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    User #{user.id} • Tenant {user.tenantId} • {user.phone || 'ללא טלפון'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['ADMIN', 'PM', 'TECH', 'ACCOUNTANT', 'RESIDENT'].map((role) => (
                    <Button
                      key={`${user.id}-${role}`}
                      variant="outline"
                      size="sm"
                      disabled={switchingRole === role}
                      onClick={() => impersonate(role)}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>בריאות מערכת</CardTitle>
              <CardDescription>חיווי מהיר על שירותי הליבה.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(data.health).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                  <span>{key}</span>
                  <span className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    {value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>פילוח תפקידים</CardTitle>
              <CardDescription>כמה משתמשים משויכים לכל תפקיד.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(data.roleCounts).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span>{role}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>יומן התחזות אחרון</CardTitle>
              <CardDescription>מעקב אחר פעולות ניהוליות רגישות.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentImpersonationEvents.map((event) => (
                <div key={event.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">
                    {event.action} {event.targetRole ? `→ ${event.targetRole}` : ''}
                  </p>
                  <p className="text-muted-foreground">{event.reason || 'ללא סיבה מתועדת'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString('he-IL')}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
