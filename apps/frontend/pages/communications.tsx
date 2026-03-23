import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Clock3, Inbox, Mail, MessageCircle, Plus, Send, User2, Users } from 'lucide-react';
import { authFetch, getCurrentUserId, getEffectiveRole } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from '../components/ui/use-toast';

type Scope = 'all' | 'inbox' | 'outbox';
type TargetType = 'ALL' | 'BUILDING' | 'UNIT' | 'USER';

interface UserRef {
  id: number;
  email: string;
}

interface BuildingRef {
  id: number;
  name: string;
}

interface Communication {
  id: number;
  subject?: string | null;
  message: string;
  channel?: string | null;
  metadata?: Record<string, any> | null;
  readAt?: string | null;
  createdAt: string;
  senderId: number;
  recipientId?: number | null;
  buildingId?: number | null;
  unitId?: number | null;
  sender?: UserRef | null;
  recipient?: UserRef | null;
  building?: BuildingRef | null;
}

interface ResidentRequestItem {
  requestKey: string;
  subject: string;
  message: string;
  requestType: string;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CLOSED';
  statusNotes?: string | null;
  senderEmail?: string | null;
  recipientCount: number;
}

const emptyCompose = {
  subject: '',
  message: '',
  channel: 'PORTAL',
  priority: 'MEDIUM',
  targetType: 'ALL' as TargetType,
  targetId: '',
};

export default function CommunicationsPage() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [threadMessages, setThreadMessages] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [scope, setScope] = useState<Scope>('all');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedThreadUserId, setSelectedThreadUserId] = useState<number | null>(null);
  const [composeData, setComposeData] = useState(emptyCompose);
  const [effectiveRole, setEffectiveRole] = useState<string | null>(null);
  const [residentRequests, setResidentRequests] = useState<ResidentRequestItem[]>([]);

  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
    setEffectiveRole(getEffectiveRole());
  }, []);

  async function loadCommunications(nextScope: Scope = scope, userId = currentUserId) {
    if (!userId) {
      setLoading(false);
      setCommunications([]);
      return;
    }

    try {
      setLoading(true);
      const endpoint =
        nextScope === 'inbox'
          ? `/api/v1/communications/inbox/${userId}`
          : nextScope === 'outbox'
            ? `/api/v1/communications/outbox/${userId}`
            : '/api/v1/communications';
      const res = await authFetch(endpoint);
      if (!res.ok) throw new Error(await res.text());
      setCommunications(await res.json());
    } catch (error) {
      toast({
        title: 'שגיאה בטעינת הודעות',
        description: 'לא ניתן לטעון את מרכז התקשורת כרגע.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadThread(counterpartyId: number) {
    if (!currentUserId) return;
    try {
      setThreadLoading(true);
      const res = await authFetch(`/api/v1/communications/conversation/${currentUserId}/${counterpartyId}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setThreadMessages(data);
      setSelectedThreadUserId(counterpartyId);
    } catch {
      toast({
        title: 'שגיאה בטעינת שרשור',
        description: 'לא ניתן לטעון את ההיסטוריה מול המשתמש שנבחר.',
        variant: 'destructive',
      });
    } finally {
      setThreadLoading(false);
    }
  }

  useEffect(() => {
    if (currentUserId) {
      loadCommunications(scope, currentUserId);
    }
  }, [currentUserId, scope]);

  useEffect(() => {
    if (effectiveRole === 'ADMIN' || effectiveRole === 'PM' || effectiveRole === 'MASTER') {
      void loadResidentRequests();
    }
  }, [effectiveRole]);

  async function loadResidentRequests() {
    try {
      const res = await authFetch('/api/v1/communications/resident-requests');
      if (!res.ok) throw new Error(await res.text());
      setResidentRequests(await res.json());
    } catch {
      toast({
        title: 'טעינת בקשות דייר נכשלה',
        description: 'לא ניתן לטעון את תור בקשות הדיירים כרגע.',
        variant: 'destructive',
      });
    }
  }

  async function updateResidentRequest(requestKey: string, status: ResidentRequestItem['status']) {
    try {
      const res = await authFetch(`/api/v1/communications/resident-requests/${requestKey}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadResidentRequests();
    } catch {
      toast({
        title: 'עדכון סטטוס הבקשה נכשל',
        description: 'לא ניתן לעדכן את בקשת הדייר כרגע.',
        variant: 'destructive',
      });
    }
  }

  const filteredCommunications = useMemo(() => {
    return communications.filter((communication) => {
      const haystack = [
        communication.subject,
        communication.message,
        communication.sender?.email,
        communication.recipient?.email,
        communication.building?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
      const matchesChannel =
        channelFilter === 'all' || (communication.channel ?? 'PORTAL').toUpperCase() === channelFilter;
      return matchesSearch && matchesChannel;
    });
  }, [communications, searchTerm, channelFilter]);

  const threadCandidates = useMemo(() => {
    if (!currentUserId) return [];
    const unique = new Map<number, UserRef>();
    for (const communication of communications) {
      const isOutgoing = communication.senderId === currentUserId;
      const counterparty = isOutgoing ? communication.recipient : communication.sender;
      if (counterparty?.id) {
        unique.set(counterparty.id, counterparty);
      }
    }
    return Array.from(unique.values());
  }, [communications, currentUserId]);

  const bulkCount = useMemo(() => {
    return communications.filter((item) => item.channel === 'ANNOUNCEMENT' || !item.recipientId).length;
  }, [communications]);

  async function handleSendMessage() {
    if (!currentUserId || !composeData.message.trim()) {
      toast({
        title: 'פרטים חסרים',
        description: 'נדרש משתמש מחובר והודעה עם תוכן כדי לשלוח.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const targetId = composeData.targetId ? Number(composeData.targetId) : undefined;
      const isAnnouncement = composeData.channel === 'ANNOUNCEMENT';
      let res: Response;

      if (isAnnouncement && (composeData.targetType === 'ALL' || composeData.targetType === 'BUILDING')) {
        res = await authFetch('/api/v1/communications/announcement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: currentUserId,
            buildingId: composeData.targetType === 'BUILDING' ? targetId : undefined,
            subject: composeData.subject,
            message: composeData.message,
            priority: composeData.priority,
          }),
        });
      } else {
        res = await authFetch('/api/v1/communications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: currentUserId,
            recipientId: composeData.targetType === 'USER' ? targetId : undefined,
            buildingId: composeData.targetType === 'BUILDING' ? targetId : undefined,
            unitId: composeData.targetType === 'UNIT' ? targetId : undefined,
            subject: composeData.subject,
            message: composeData.message,
            channel: composeData.channel,
            metadata: {
              priority: composeData.priority,
              targetType: composeData.targetType,
            },
          }),
        });
      }

      if (!res.ok) throw new Error(await res.text());

      toast({
        title: 'הודעה נשלחה',
        description:
          composeData.targetType === 'ALL' || composeData.targetType === 'BUILDING'
            ? 'ההודעה נשלחה בערוץ קבוצתי.'
            : 'ההודעה נשלחה לנמען שנבחר.',
      });
      setComposeData(emptyCompose);
      setShowCompose(false);
      await loadCommunications(scope);
      if (selectedThreadUserId && composeData.targetType === 'USER' && Number(composeData.targetId) === selectedThreadUserId) {
        await loadThread(selectedThreadUserId);
      }
    } catch {
      toast({
        title: 'שליחת ההודעה נכשלה',
        description: 'המערכת לא הצליחה להשלים את שליחת ההודעה.',
        variant: 'destructive',
      });
    }
  }

  const scopeLabel = {
    all: 'כל ההודעות',
    inbox: 'דואר נכנס',
    outbox: 'הודעות שנשלחו',
  }[scope];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">מרכז תקשורת</h1>
          <p className="text-muted-foreground">רשימת הודעות, היסטוריית שיחות ושליחה מרוכזת של עדכונים לדיירים ולצוות.</p>
        </div>
        <Button onClick={() => setShowCompose((open) => !open)}>
          <Plus className="me-2 h-4 w-4" />
          {showCompose ? 'סגור טופס' : 'הודעה חדשה'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>היקף תקשורת</CardDescription>
            <CardTitle>{communications.length}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            {scopeLabel}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>שיחות ישירות</CardDescription>
            <CardTitle>{threadCandidates.length}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Inbox className="h-4 w-4" />
            משתמשים עם היסטוריית שיחה
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>הודעות קבוצתיות</CardDescription>
            <CardTitle>{bulkCount}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            הכרזות וערוצים מרובי נמענים
          </CardContent>
        </Card>
      </div>

      {showCompose && (
        <Card>
          <CardHeader>
            <CardTitle>שליחת הודעה</CardTitle>
            <CardDescription>תמיכה בהודעות ישירות, הודעות לבניין, ליחידה או הכרזה קבוצתית.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">כותרת</label>
                <Input
                  value={composeData.subject}
                  onChange={(event) => setComposeData((current) => ({ ...current, subject: event.target.value }))}
                  placeholder="כותרת קצרה"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">ערוץ</label>
                <Select
                  value={composeData.channel}
                  onValueChange={(value) => setComposeData((current) => ({ ...current, channel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PORTAL">פורטל</SelectItem>
                    <SelectItem value="INTERNAL">פנימי</SelectItem>
                    <SelectItem value="ANNOUNCEMENT">הכרזה</SelectItem>
                    <SelectItem value="EMAIL">אימייל</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">תוכן</label>
              <Textarea
                rows={5}
                value={composeData.message}
                onChange={(event) => setComposeData((current) => ({ ...current, message: event.target.value }))}
                placeholder="כתוב כאן את תוכן ההודעה"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">יעד</label>
                <Select
                  value={composeData.targetType}
                  onValueChange={(value: TargetType) => setComposeData((current) => ({ ...current, targetType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">כלל הדיירים</SelectItem>
                    <SelectItem value="BUILDING">בניין</SelectItem>
                    <SelectItem value="UNIT">יחידה</SelectItem>
                    <SelectItem value="USER">משתמש</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">מזהה יעד</label>
                <Input
                  value={composeData.targetId}
                  onChange={(event) => setComposeData((current) => ({ ...current, targetId: event.target.value }))}
                  placeholder={composeData.targetType === 'ALL' ? 'לא נדרש' : 'לדוגמה: 12'}
                  disabled={composeData.targetType === 'ALL'}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">עדיפות</label>
                <Select
                  value={composeData.priority}
                  onValueChange={(value) => setComposeData((current) => ({ ...current, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">נמוכה</SelectItem>
                    <SelectItem value="MEDIUM">בינונית</SelectItem>
                    <SelectItem value="HIGH">גבוהה</SelectItem>
                    <SelectItem value="URGENT">דחופה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCompose(false)}>
                ביטול
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="me-2 h-4 w-4" />
                שלח
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(effectiveRole === 'ADMIN' || effectiveRole === 'PM' || effectiveRole === 'MASTER') && (
        <Card>
          <CardHeader>
            <CardTitle>בקשות דייר בטיפול</CardTitle>
            <CardDescription>עדכון מהיר לסטטוס בקשות מעבר, חניה, מסמכים ופרטי קשר.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {residentRequests.slice(0, 6).map((request) => (
              <div key={request.requestKey} className="rounded-xl border p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={request.status === 'COMPLETED' ? 'success' : request.status === 'CLOSED' ? 'secondary' : 'warning'}>{request.status}</Badge>
                      <Badge variant="outline">{request.requestType}</Badge>
                      <span className="font-medium">{request.subject.replace(/^[A-Z_]+:\s*/, '')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{request.senderEmail || 'דייר'} · {request.message}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateResidentRequest(request.requestKey, 'IN_REVIEW')}>בטיפול</Button>
                    <Button size="sm" onClick={() => updateResidentRequest(request.requestKey, 'COMPLETED')}>הושלם</Button>
                  </div>
                </div>
              </div>
            ))}
            {!residentRequests.length && <div className="text-sm text-muted-foreground">אין בקשות דייר פעילות.</div>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>חיפוש וסינון</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="חיפוש לפי נושא, תוכן או משתמש" />
          <Select value={scope} onValueChange={(value: Scope) => setScope(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל ההודעות</SelectItem>
              <SelectItem value="inbox">דואר נכנס</SelectItem>
              <SelectItem value="outbox">דואר יוצא</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הערוצים</SelectItem>
              <SelectItem value="PORTAL">פורטל</SelectItem>
              <SelectItem value="INTERNAL">פנימי</SelectItem>
              <SelectItem value="ANNOUNCEMENT">הכרזה</SelectItem>
              <SelectItem value="EMAIL">אימייל</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-4">
          {filteredCommunications.map((communication) => {
            const counterparty =
              communication.senderId === currentUserId ? communication.recipient : communication.sender;
            const priority = communication.metadata?.priority ?? 'MEDIUM';
            return (
              <Card key={communication.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{communication.subject || 'ללא נושא'}</CardTitle>
                    <Badge variant="outline">{communication.channel || 'PORTAL'}</Badge>
                    <Badge>{priority}</Badge>
                    {!communication.readAt && communication.recipientId === currentUserId && (
                      <Badge variant="secondary">לא נקראה</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-3">{communication.message}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-1">
                      <User2 className="h-4 w-4" />
                      {communication.sender?.email || `#${communication.senderId}`}
                    </span>
                    {communication.building && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {communication.building.name}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-4 w-4" />
                      {new Date(communication.createdAt).toLocaleString('he-IL')}
                    </span>
                  </div>
                  {counterparty?.id && (
                    <Button variant="outline" size="sm" onClick={() => loadThread(counterparty.id)}>
                      פתח שרשור
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {filteredCommunications.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">אין הודעות להצגה</h3>
                <p className="text-muted-foreground">שנה את הסינון או שלח הודעה חדשה כדי להתחיל היסטוריה.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>שרשור והיסטוריה</CardTitle>
            <CardDescription>בחירת משתמש מציגה את ההתכתבות הישירה המלאה איתו.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={selectedThreadUserId ? String(selectedThreadUserId) : ''}
              onValueChange={(value) => loadThread(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר משתמש עם היסטוריה" />
              </SelectTrigger>
              <SelectContent>
                {threadCandidates.map((candidate) => (
                  <SelectItem key={candidate.id} value={String(candidate.id)}>
                    {candidate.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {threadLoading && <Skeleton className="h-60 w-full" />}

            {!threadLoading && selectedThreadUserId && threadMessages.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                אין הודעות בשרשור זה.
              </div>
            )}

            {!threadLoading && threadMessages.length > 0 && (
              <div className="space-y-3">
                {threadMessages.map((message) => {
                  const outgoing = message.senderId === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`rounded-lg border p-3 ${outgoing ? 'bg-primary/5' : 'bg-muted/40'}`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>{outgoing ? 'נשלח על ידך' : message.sender?.email || `#${message.senderId}`}</span>
                        <span>{new Date(message.createdAt).toLocaleString('he-IL')}</span>
                      </div>
                      {message.subject && <div className="mb-1 text-sm font-medium">{message.subject}</div>}
                      <div className="text-sm">{message.message}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
