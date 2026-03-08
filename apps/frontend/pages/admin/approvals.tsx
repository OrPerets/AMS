import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { toast } from '../../components/ui/use-toast';
import { formatDate } from '../../lib/utils';
import { useLocale } from '../../lib/providers';

type ApprovalTask = {
  id: number;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  title: string;
  description?: string | null;
  buildingName?: string | null;
  requesterEmail?: string | null;
  decisionEmail?: string | null;
  createdAt: string;
  decidedAt?: string | null;
};

export default function AdminApprovalsPage() {
  const { locale } = useLocale();
  const [tasks, setTasks] = useState<ApprovalTask[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [commentById, setCommentById] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  useEffect(() => {
    void loadTasks(status);
  }, [status]);

  async function loadTasks(nextStatus = status) {
    try {
      setLoading(true);
      const response = await authFetch(`/api/admin/approvals?status=${nextStatus}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setTasks(await response.json());
    } catch (error) {
      console.error(error);
      toast({ title: 'טעינת תור האישורים נכשלה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function decide(taskId: number, action: 'approve' | 'reject') {
    try {
      setSubmittingId(taskId);
      const response = await authFetch(`/api/admin/approvals/${taskId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentById[taskId] || undefined }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      toast({ title: action === 'approve' ? 'הבקשה אושרה' : 'הבקשה נדחתה' });
      await loadTasks();
    } catch (error) {
      console.error(error);
      toast({ title: 'עדכון האישור נכשל', variant: 'destructive' });
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">מרכז אישורים</h1>
          <p className="text-sm text-muted-foreground">ניהול הוצאות, הזמנות עבודה, מחיקות מסמך והתאמות יתרה לפי מדיניות אישור.</p>
        </div>
        <div className="flex gap-2">
          <select className="rounded-md border px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="PENDING">ממתין</option>
            <option value="APPROVED">אושר</option>
            <option value="REJECTED">נדחה</option>
          </select>
          <Button variant="outline" onClick={() => loadTasks()} disabled={loading}>
            <RefreshCw className="me-2 h-4 w-4" />
            רענון
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> תור אישורים</CardTitle>
          <CardDescription>פעולות רגישות נשמרות כאן עד לאישור או דחייה מתועדת.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-xl border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={task.status === 'APPROVED' ? 'success' : task.status === 'REJECTED' ? 'destructive' : 'warning'}>
                      {task.status}
                    </Badge>
                    <Badge variant="outline">{task.type}</Badge>
                    <span className="font-medium">{task.title}</span>
                  </div>
                  {task.description && <div className="text-sm text-muted-foreground">{task.description}</div>}
                  <div className="text-xs text-muted-foreground">
                    {task.buildingName ? `בניין: ${task.buildingName} · ` : ''}
                    {task.requesterEmail ? `מבקש: ${task.requesterEmail}` : 'מבקש: מערכת'}
                    {task.decisionEmail ? ` · מאשר: ${task.decisionEmail}` : ''}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(new Date(task.decidedAt || task.createdAt), locale)}
                </div>
              </div>

              {task.status === 'PENDING' && (
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                  <Input
                    placeholder="הערת החלטה (אופציונלי)"
                    value={commentById[task.id] || ''}
                    onChange={(event) => setCommentById((current) => ({ ...current, [task.id]: event.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => decide(task.id, 'approve')} disabled={submittingId === task.id}>
                      <CheckCircle2 className="me-2 h-4 w-4" />
                      אשר
                    </Button>
                    <Button variant="destructive" onClick={() => decide(task.id, 'reject')} disabled={submittingId === task.id}>
                      <XCircle className="me-2 h-4 w-4" />
                      דחה
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!loading && !tasks.length && <div className="py-8 text-center text-sm text-muted-foreground">אין בקשות להצגה במסנן הנוכחי.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
