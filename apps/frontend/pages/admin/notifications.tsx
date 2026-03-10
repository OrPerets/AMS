import { useEffect, useMemo, useState } from 'react';
import { BellRing, Send } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/use-toast';

const templateDefinitions: Record<string, { title: string; fields: string[]; defaultParams: Record<string, string> }> = {
  ANNOUNCEMENT: {
    title: 'הודעה כללית',
    fields: ['title', 'message'],
    defaultParams: { title: '', message: '' },
  },
  PAYMENT_DUE: {
    title: 'תזכורת תשלום',
    fields: ['type', 'amount', 'dueDate'],
    defaultParams: { type: 'ועד בית', amount: '0', dueDate: '' },
  },
  EMERGENCY_ALERT: {
    title: 'התראת חירום',
    fields: ['title', 'message', 'buildingName'],
    defaultParams: { title: '', message: '', buildingName: '' },
  },
  WORK_ORDER_ASSIGNED: {
    title: 'הקצאת הזמנת עבודה',
    fields: ['title', 'description', 'dueDate'],
    defaultParams: { title: '', description: '', dueDate: '' },
  },
};

type OverviewNotification = {
  id: number;
  title: string;
  type?: string | null;
  userId?: number | null;
  buildingId?: number | null;
  createdAt: string;
  read: boolean;
};

export default function AdminNotifications() {
  const [target, setTarget] = useState<'user' | 'building' | 'all'>('user');
  const [targetId, setTargetId] = useState('');
  const [template, setTemplate] = useState('ANNOUNCEMENT');
  const [params, setParams] = useState<Record<string, string>>(templateDefinitions.ANNOUNCEMENT.defaultParams);
  const [sending, setSending] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<OverviewNotification[]>([]);

  useEffect(() => {
    loadRecent();
  }, []);

  const activeTemplate = useMemo(() => templateDefinitions[template], [template]);

  async function loadRecent() {
    const response = await authFetch('/api/admin/overview');
    if (response.ok) {
      const data = await response.json();
      setRecentNotifications(data.recentNotifications || []);
    }
  }

  async function send() {
    try {
      setSending(true);
      let url = '/api/v1/notifications';
      if (target === 'user') url += `/user/${targetId}`;
      if (target === 'building') url += `/building/${targetId}`;
      if (target === 'all') url += '/tenants';

      const response = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, params }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      toast({ title: 'ההתראה נשלחה' });
      await loadRecent();
    } catch {
      toast({
        title: 'שליחת ההתראה נכשלה',
        description: 'בדוק מזהה יעד ושדות תבנית.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">התראות מנהל</h1>
        <p className="text-muted-foreground">משלוח התראות לפי תבנית למשתמש, בניין או כלל הדיירים.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              מחולל התראות
            </CardTitle>
            <CardDescription>תבניות מוכנות לשימוש עם פרמטרים דינמיים.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>יעד</Label>
                <Select value={target} onValueChange={(value) => setTarget(value as 'user' | 'building' | 'all')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">משתמש בודד</SelectItem>
                    <SelectItem value="building">בניין</SelectItem>
                    <SelectItem value="all">כל הדיירים</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>תבנית</Label>
                <Select
                  value={template}
                  onValueChange={(value) => {
                    setTemplate(value);
                    setParams(templateDefinitions[value].defaultParams);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(templateDefinitions).map(([key, definition]) => (
                      <SelectItem key={key} value={key}>
                        {definition.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {target !== 'all' && (
              <div className="space-y-2">
                <Label htmlFor="targetId">מזהה יעד</Label>
                <Input id="targetId" value={targetId} onChange={(event) => setTargetId(event.target.value)} />
              </div>
            )}

            {activeTemplate.fields.map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{field}</Label>
                {field === 'message' || field === 'description' ? (
                  <Textarea
                    id={field}
                    rows={4}
                    value={params[field] || ''}
                    onChange={(event) => setParams((current) => ({ ...current, [field]: event.target.value }))}
                  />
                ) : (
                  <Input
                    id={field}
                    value={params[field] || ''}
                    onChange={(event) => setParams((current) => ({ ...current, [field]: event.target.value }))}
                  />
                )}
              </div>
            ))}

            <Button onClick={send} disabled={sending || (target !== 'all' && !targetId)}>
              <Send className="me-2 h-4 w-4" />
              שלח התראה
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>יומן שליחה אחרון</CardTitle>
            <CardDescription>התראות שנוצרו לאחרונה, כפי שנשמרו במסד הנתונים.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotifications.map((notification) => (
              <div key={notification.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {notification.type || 'מותאם אישית'} • {new Date(notification.createdAt).toLocaleString('he-IL')}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {notification.userId ? `משתמש ${notification.userId}` : notification.buildingId ? `בניין ${notification.buildingId}` : 'כללי'}
                  </span>
                </div>
              </div>
            ))}
            {recentNotifications.length === 0 && (
              <p className="text-sm text-muted-foreground">עדיין לא נשמרו התראות מתאימות בסביבה זו.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
