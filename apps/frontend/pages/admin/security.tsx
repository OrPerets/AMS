import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from '../../components/ui/use-toast';
import { formatDate } from '../../lib/utils';
import { useLocale } from '../../lib/providers';

type SecurityResponse = {
  permissionMatrix: Record<string, Record<string, string[]>>;
  enforcementNotes: string[];
  recentSensitiveActivity: Array<{
    id: number;
    entityType: string;
    action: string;
    summary: string;
    severity: string;
    createdAt: string;
  }>;
};

export default function AdminSecurityPage() {
  const { locale } = useLocale();
  const [data, setData] = useState<SecurityResponse | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const response = await authFetch('/api/admin/security');
      if (!response.ok) throw new Error(await response.text());
      setData(await response.json());
    } catch (error) {
      console.error(error);
      toast({ title: 'טעינת מרכז האבטחה נכשלה', variant: 'destructive' });
      setData(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">אבטחה והרשאות</h1>
        <p className="text-sm text-muted-foreground">מטריצת תפקידים, כללי אכיפה ופעילות רגישה אחרונה.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            כללי אכיפה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data?.enforcementNotes.map((note) => (
            <div key={note} className="rounded-lg border px-3 py-2">{note}</div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>מטריצת הרשאות</CardTitle>
          <CardDescription>הגדרה מפורשת של הגישה המותרת לכל תפקיד.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(data?.permissionMatrix ?? {}).map(([role, domains]) => (
            <div key={role} className="rounded-xl border p-4">
              <div className="mb-3 font-medium">{role}</div>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(domains).map(([domain, permissions]) => (
                  <div key={domain} className="rounded-lg border p-3">
                    <div className="mb-2 text-sm font-medium">{domain}</div>
                    <div className="flex flex-wrap gap-2">
                      {permissions.length === 0 ? <Badge variant="secondary">ללא גישה</Badge> : permissions.map((permission) => <Badge key={permission} variant="outline">{permission}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>פעילות רגישה אחרונה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.recentSensitiveActivity.map((row) => (
            <div key={row.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{row.summary}</div>
                <Badge variant={row.severity === 'CRITICAL' ? 'destructive' : row.severity === 'WARNING' ? 'warning' : 'outline'}>
                  {row.entityType} · {row.action}
                </Badge>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {formatDate(new Date(row.createdAt), locale)}
              </div>
            </div>
          ))}
          {!data?.recentSensitiveActivity?.length && <div className="text-sm text-muted-foreground">אין פעילות רגישה להצגה.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
