import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, FileWarning, Wrench } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../components/ui/use-toast';
import { formatDate } from '../../lib/utils';
import { useLocale } from '../../lib/providers';

type CalendarItem = {
  id: string;
  type: 'SCHEDULE' | 'MAINTENANCE' | 'CONTRACT' | 'INVOICE' | 'NOTICE' | 'VOTE' | 'COMPLIANCE';
  date: string;
  title: string;
  description: string;
  buildingName: string;
  priority: string;
  href?: string;
};

export default function OperationsCalendarPage() {
  const { locale } = useLocale();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [range, setRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  });
  const [filters, setFilters] = useState({ type: 'ALL', status: '', search: '' });

  useEffect(() => {
    loadCalendar();
  }, [range.start, range.end, filters.type, filters.status, filters.search]);

  async function loadCalendar() {
    try {
      const params = new URLSearchParams({ start: range.start, end: range.end });
      if (filters.type !== 'ALL') params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      const response = await authFetch(`/api/v1/operations/calendar?${params.toString()}`);
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setItems(data.items || []);
      setSummary(data.summary || {});
    } catch (error) {
      console.error(error);
      toast({ title: 'טעינת היומן נכשלה', variant: 'destructive' });
    }
  }

  const grouped = useMemo(() => {
    return items.reduce<Record<string, CalendarItem[]>>((acc, item) => {
      const key = item.date.slice(0, 10);
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [items]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">יומן תפעול פורטפוליו</h1>
        <p className="text-sm text-muted-foreground">אירועי תחזוקה, לוחות זמנים, חידושי חוזים, פירעונות והודעות במקום אחד.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> טווח תאריכים</CardTitle>
          <CardDescription>היומן מאחד בין מקורות שונים כדי לאפשר תכנון שבועי וחודשי.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input type="date" value={range.start} onChange={(event) => setRange((current) => ({ ...current, start: event.target.value }))} />
          <Input type="date" value={range.end} onChange={(event) => setRange((current) => ({ ...current, end: event.target.value }))} />
          <select className="rounded-md border px-3 py-2 text-sm" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
            <option value="ALL">כל הסוגים</option>
            {['SCHEDULE', 'MAINTENANCE', 'CONTRACT', 'INVOICE', 'NOTICE', 'VOTE', 'COMPLIANCE'].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <Input placeholder="חיפוש" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(summary).map(([key, value]) => (
          <Card key={key}><CardHeader><CardTitle className="text-sm">{key}</CardTitle></CardHeader><CardContent>{value}</CardContent></Card>
        ))}
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([day, dayItems]) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle>{formatDate(new Date(day), locale)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dayItems.map((item) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.type === 'CONTRACT' || item.type === 'INVOICE' || item.type === 'COMPLIANCE' ? 'warning' : item.type === 'MAINTENANCE' ? 'outline' : 'secondary'}>
                          {item.type}
                        </Badge>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{item.buildingName} · {item.description}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.type === 'MAINTENANCE' ? <Wrench className="h-4 w-4" /> : <FileWarning className="h-4 w-4" />}
                      {item.priority}
                      {item.href ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={item.href}>פתח</Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        {!items.length && <div className="py-8 text-center text-sm text-muted-foreground">אין אירועים בטווח שנבחר.</div>}
      </div>
    </div>
  );
}
