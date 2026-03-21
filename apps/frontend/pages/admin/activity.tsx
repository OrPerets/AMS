import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { authFetch, downloadAuthenticatedFile } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { TableListSkeleton } from '../../components/ui/page-states';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadActivity();
  }, []);

  async function loadActivity() {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch('/api/admin/activity');
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setRows(await response.json());
    } catch {
      setError('לא ניתן לטעון את יומן הפעילות כרגע.');
      toast({ title: 'טעינת יומן הפעילות נכשלה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const groupedRows = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const groups = new Map<string, { label: string; items: ActivityRow[] }>();
    for (const row of rows) {
      const date = new Date(row.createdAt);
      const key = date.toISOString().slice(0, 10);
      const existing = groups.get(key) ?? { label: formatter.format(date), items: [] };
      existing.items.push(row);
      groups.set(key, existing);
    }

    return Array.from(groups.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      items: value.items,
    }));
  }, [locale, rows]);

  if (loading) {
    return <TableListSkeleton rows={5} columns={3} />;
  }

  if (error && rows.length === 0) {
    return <InlineErrorPanel title="יומן הפעילות לא נטען" description={error} onRetry={loadActivity} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">יומן פעילות ואודיט</h1>
          <p className="text-sm text-muted-foreground">קיבוץ כרונולוגי שמקל לזהות גלי פעולה, אישורים, יצואים ושינויים רגישים.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => downloadAuthenticatedFile('/api/admin/activity/export', 'activity-export.csv')}>
            <Download className="me-2 h-4 w-4" />
            יצוא CSV
          </Button>
          <Button variant="outline" onClick={loadActivity} disabled={loading}>
            <RefreshCw className="me-2 h-4 w-4" />
            רענון
          </Button>
        </div>
      </div>

      {error ? <InlineErrorPanel title="הוצגו הרשומות האחרונות שנטענו" description={error} onRetry={loadActivity} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Timeline
          </CardTitle>
          <CardDescription>הרשומות מקובצות לפי יום, כך שקל להבין רצף פעולות ולא רק רשימה שטוחה של אירועים.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {groupedRows.map((group) => (
            <section key={group.key} className="space-y-4">
              <div className="sticky top-0 z-10 inline-flex rounded-full border border-border bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                {group.label}
              </div>
              <div className="space-y-4 border-s border-border/70 ps-5">
                {group.items.map((row) => (
                  <div key={row.id} className="relative rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <span className="absolute -start-[1.65rem] top-5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={row.severity === 'CRITICAL' ? 'destructive' : row.severity === 'WARNING' ? 'warning' : 'outline'}>
                            {row.severity}
                          </Badge>
                          <Badge variant="secondary">
                            {row.entityType}
                            {row.entityId ? ` #${row.entityId}` : ''}
                          </Badge>
                          <span className="font-medium">{row.summary}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.action} · {row.actor}
                          {row.buildingName ? ` · בניין: ${row.buildingName}` : ''}
                          {row.residentName ? ` · דייר: ${row.residentName}` : ''}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDate(new Date(row.createdAt), locale)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {!groupedRows.length ? <div className="py-8 text-center text-sm text-muted-foreground">אין עדיין פעילות להצגה.</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
