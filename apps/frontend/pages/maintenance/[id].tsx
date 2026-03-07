import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, CheckCircle2, ClipboardCheck, Clock3, ShieldCheck, Wrench } from 'lucide-react';
import { authFetch, getCurrentUserId } from '../../lib/auth';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/use-toast';

interface MaintenanceHistory {
  id: number;
  performedAt: string;
  notes?: string | null;
  cost?: number | null;
  verified: boolean;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
  performedBy?: {
    id: number;
    email: string;
  } | null;
  verifiedBy?: {
    id: number;
    email: string;
  } | null;
}

interface MaintenanceSchedule {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  type: string;
  frequency: string;
  priority: string;
  startDate: string;
  nextOccurrence?: string | null;
  lastCompleted?: string | null;
  completionVerified: boolean;
  completionNotes?: string | null;
  estimatedCost?: number | null;
  building: {
    id: number;
    name: string;
  };
  assignedTo?: {
    id: number;
    email: string;
  } | null;
  histories: MaintenanceHistory[];
}

export default function MaintenanceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [schedule, setSchedule] = useState<MaintenanceSchedule | null>(null);
  const [history, setHistory] = useState<MaintenanceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionCost, setCompletionCost] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const latestHistory = useMemo(() => history[0] ?? null, [history]);

  const loadSchedule = async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    try {
      const [scheduleRes, historyRes] = await Promise.all([
        authFetch(`/api/v1/maintenance/${id}`),
        authFetch(`/api/v1/maintenance/${id}/history`),
      ]);

      if (!scheduleRes.ok) {
        throw new Error('Failed to load maintenance schedule');
      }

      const scheduleData = await scheduleRes.json();
      setSchedule(scheduleData);

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(Array.isArray(historyData) ? historyData : []);
      } else {
        setHistory(Array.isArray(scheduleData.histories) ? scheduleData.histories : []);
      }
    } catch (error) {
      toast({ title: 'שגיאה בטעינת המשימה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSchedule();
  }, [id]);

  const completeSchedule = async () => {
    if (!id) {
      return;
    }

    setSaving(true);
    try {
      const response = await authFetch(`/api/v1/maintenance/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          performedAt: new Date().toISOString(),
          notes: completionNotes || undefined,
          cost: completionCost ? Number(completionCost) : undefined,
          performedById: getCurrentUserId() ?? undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({ title: 'הביצוע נשמר' });
      setCompletionNotes('');
      setCompletionCost('');
      await loadSchedule();
    } catch (error: any) {
      toast({
        title: 'שגיאה בסימון השלמה',
        description: error?.message || 'נסו שוב',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const verifySchedule = async () => {
    if (!id || !latestHistory) {
      return;
    }

    setSaving(true);
    try {
      const response = await authFetch(`/api/v1/maintenance/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historyId: latestHistory.id,
          verified: true,
          verifiedAt: new Date().toISOString(),
          verifiedById: getCurrentUserId() ?? undefined,
          notes: verificationNotes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({ title: 'האימות נשמר' });
      setVerificationNotes('');
      await loadSchedule();
    } catch (error: any) {
      toast({
        title: 'שגיאה באימות הביצוע',
        description: error?.message || 'נסו שוב',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>טוען...</div>;
  }

  if (!schedule) {
    return <div>משימת תחזוקה לא נמצאה</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">פרטי משימת תחזוקה</p>
          <h1 className="text-3xl font-bold">{schedule.title}</h1>
          <p className="text-sm text-muted-foreground">{schedule.building.name}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/maintenance" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            חזרה לתחזוקה
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">קטגוריה</p>
            <p className="text-lg font-semibold">{schedule.category}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">סוג</p>
            <p className="text-lg font-semibold">{schedule.type}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">מועד הבא</p>
            <p className="text-lg font-semibold">{formatDate(schedule.nextOccurrence ?? schedule.startDate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">אימות</p>
            <div className="flex items-center gap-2">
              <Badge variant={schedule.completionVerified ? 'secondary' : 'outline'}>
                {schedule.completionVerified ? 'מאומת' : 'ממתין לאימות'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פרטי משימה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{schedule.description || 'לא הוזן תיאור נוסף למשימה זו.'}</p>
          <p>תדירות: {schedule.frequency}</p>
          <p>עדיפות: {schedule.priority}</p>
          <p>אחראי: {schedule.assignedTo?.email || 'לא הוקצה'}</p>
          <p>עלות משוערת: {formatCurrency(schedule.estimatedCost ?? 0)}</p>
          {schedule.lastCompleted && <p>בוצע לאחרונה: {formatDate(schedule.lastCompleted)}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              רישום ביצוע
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">הערות ביצוע</label>
              <Textarea value={completionNotes} onChange={(event) => setCompletionNotes(event.target.value)} rows={4} />
            </div>
            <div>
              <label className="text-sm font-medium">עלות בפועל</label>
              <Input type="number" value={completionCost} onChange={(event) => setCompletionCost(event.target.value)} />
            </div>
            <Button onClick={completeSchedule} disabled={saving}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              סמן כהושלם
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              אימות השלמה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {latestHistory
                ? `האימות יתבצע מול הרישום האחרון מתאריך ${formatDate(latestHistory.performedAt)}`
                : 'אין עדיין רישומי ביצוע לאימות.'}
            </p>
            <div>
              <label className="text-sm font-medium">הערות אימות</label>
              <Textarea value={verificationNotes} onChange={(event) => setVerificationNotes(event.target.value)} rows={4} />
            </div>
            <Button onClick={verifySchedule} disabled={saving || !latestHistory}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              אמת ביצוע
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" />
            היסטוריית תחזוקה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.map((entry) => (
            <div key={entry.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={entry.verified ? 'secondary' : 'outline'}>
                  {entry.verified ? 'מאומת' : 'ממתין'}
                </Badge>
                <span className="font-medium">{formatDate(entry.performedAt)}</span>
                {entry.cost !== null && entry.cost !== undefined && <span>{formatCurrency(entry.cost)}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{entry.notes || 'ללא הערות ביצוע.'}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                בוצע על ידי: {entry.performedBy?.email || 'לא צוין'}
              </p>
              {entry.verifiedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  אומת ב-{formatDate(entry.verifiedAt)} על ידי {entry.verifiedBy?.email || 'לא צוין'}
                </p>
              )}
            </div>
          ))}
          {history.length === 0 && <p className="text-sm text-muted-foreground">אין היסטוריה למשימה זו.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
