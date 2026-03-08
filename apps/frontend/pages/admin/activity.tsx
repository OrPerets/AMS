import { useEffect, useState } from 'react';
import { Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from '../../components/ui/use-toast';
import { formatDate } from '../../lib/utils';
import { useLocale } from '../../lib/providers';

type ActivityRow = {
  id: number;
  createdAt: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  action: string;
  entityType: string;
  entityId?: number | null;
  actor: string;
  buildingName?: string | null;
  residentName?: string | null;
  summary: string;
};

export default function AdminActivityPage() {
  const { locale } = useLocale();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  async function loadActivity() {
    try {
      setLoading(true);
      const response = await authFetch('/admin/activity');
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setRows(await response.json());
    } catch (error) {
      console.error(error);
      toast({ title: 'טעינת יומן הפעילות נכשלה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">יומן פעילות ואודיט</h1>
          <p className="text-sm text-muted-foreground">מעקב אחרי שינויים פיננסיים, הרשאות, מסמכים ופעולות תפעוליות.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/admin/activity/export', '_blank')}>
            <Download className="me-2 h-4 w-4" />
            יצוא CSV
          </Button>
          <Button variant="outline" onClick={loadActivity} disabled={loading}>
            <RefreshCw className="me-2 h-4 w-4" />
            רענון
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> פעילות אחרונה</CardTitle>
          <CardDescription>היומן נבנה כדי לאפשר בדיקת חריגות, אישורים ושינויי סטטוס בזמן אמת.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={row.severity === 'CRITICAL' ? 'destructive' : row.severity === 'WARNING' ? 'warning' : 'outline'}>
                      {row.severity}
                    </Badge>
                    <span className="font-medium">{row.summary}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {row.action} · {row.entityType}{row.entityId ? ` #${row.entityId}` : ''} · {row.actor}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(new Date(row.createdAt), locale)}
                </div>
              </div>
              {(row.buildingName || row.residentName) && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {row.buildingName ? `בניין: ${row.buildingName}` : ''}
                  {row.buildingName && row.residentName ? ' · ' : ''}
                  {row.residentName ? `דייר: ${row.residentName}` : ''}
                </div>
              )}
            </div>
          ))}
          {!loading && !rows.length && <div className="py-8 text-center text-sm text-muted-foreground">אין עדיין פעילות להצגה.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
