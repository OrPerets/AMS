import { useEffect, useMemo, useState } from 'react';
import { Megaphone, Send, ShieldCheck } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/use-toast';
import { formatDate } from '../../lib/utils';
import { useLocale } from '../../lib/providers';

type Building = { id: number; name: string; address: string };
type Unit = { id: number; number: string; floor?: number | null };
type DocumentOption = { id: number; name: string; category?: string | null };
type PreviewRecipient = { id: number; email: string; role: string; units: Array<{ id: number; number: string; floor?: number | null }> };
type AnnouncementHistoryItem = {
  batchKey: string;
  subject: string;
  message: string;
  createdAt: string;
  buildingName?: string | null;
  priority: string;
  recipientRole: string;
  recipientCount: number;
  sampleRecipients: string[];
};

const presets = {
  routine: { priority: 'LOW', subject: 'עדכון שגרתי' },
  urgent: { priority: 'URGENT', subject: 'הודעה דחופה' },
  governance: { priority: 'HIGH', subject: 'פרסום מסמך ועד / בניין' },
};

export default function AnnouncementsPage() {
  const { locale } = useLocale();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [preview, setPreview] = useState<{ count: number; recipients: PreviewRecipient[] } | null>(null);
  const [history, setHistory] = useState<AnnouncementHistoryItem[]>([]);
  const [form, setForm] = useState({
    buildingId: '',
    floor: '',
    unitIds: '',
    recipientRole: 'RESIDENT',
    priority: 'MEDIUM',
    subject: '',
    message: '',
  });
  const [bulletin, setBulletin] = useState({
    buildingId: '',
    documentId: '',
    bulletinType: 'meeting_summary',
    subject: '',
    message: '',
  });

  useEffect(() => {
    void loadBuildings();
    void loadHistory();
  }, []);

  useEffect(() => {
    if (!form.buildingId) {
      setUnits([]);
      setDocuments([]);
      return;
    }
    void Promise.all([loadUnits(form.buildingId), loadDocuments(form.buildingId), loadHistory(form.buildingId)]);
  }, [form.buildingId]);

  const floors = useMemo(() => {
    return Array.from(new Set(units.map((unit) => unit.floor).filter((value) => value !== null && value !== undefined))) as number[];
  }, [units]);

  async function loadBuildings() {
    const response = await authFetch('/api/v1/buildings');
    if (response.ok) {
      setBuildings(await response.json());
    }
  }

  async function loadUnits(buildingId: string) {
    const response = await authFetch(`/api/v1/buildings/${buildingId}/units`);
    if (response.ok) {
      setUnits(await response.json());
    }
  }

  async function loadDocuments(buildingId: string) {
    const response = await authFetch(`/api/v1/documents/building/${buildingId}`);
    if (response.ok) {
      setDocuments(await response.json());
    }
  }

  async function loadHistory(buildingId?: string) {
    const response = await authFetch(`/api/v1/communications/announcements/history${buildingId ? `?buildingId=${buildingId}` : ''}`);
    if (response.ok) {
      setHistory(await response.json());
    }
  }

  async function previewRecipients() {
    try {
      const response = await authFetch('/api/v1/communications/announcement/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: form.buildingId ? Number(form.buildingId) : undefined,
          floor: form.floor ? Number(form.floor) : undefined,
          unitIds: form.unitIds ? form.unitIds.split(',').map((item) => Number(item.trim())).filter(Boolean) : undefined,
          recipientRole: form.recipientRole,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      setPreview(await response.json());
    } catch (error) {
      console.error(error);
      toast({ title: 'תצוגת היעד נכשלה', variant: 'destructive' });
    }
  }

  async function submitAnnouncement() {
    try {
      const response = await authFetch('/api/v1/communications/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: form.buildingId ? Number(form.buildingId) : undefined,
          floor: form.floor ? Number(form.floor) : undefined,
          unitIds: form.unitIds ? form.unitIds.split(',').map((item) => Number(item.trim())).filter(Boolean) : undefined,
          recipientRole: form.recipientRole,
          priority: form.priority,
          subject: form.subject,
          message: form.message,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      toast({ title: 'ההודעה נשלחה' });
      setForm({ buildingId: '', floor: '', unitIds: '', recipientRole: 'RESIDENT', priority: 'MEDIUM', subject: '', message: '' });
      setPreview(null);
      setUnits([]);
      setDocuments([]);
      await loadHistory();
    } catch (error) {
      console.error(error);
      toast({ title: 'שליחת ההודעה נכשלה', variant: 'destructive' });
    }
  }

  async function publishBulletin() {
    try {
      const response = await authFetch('/api/v1/communications/document-bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: Number(bulletin.buildingId || form.buildingId),
          documentId: Number(bulletin.documentId),
          bulletinType: bulletin.bulletinType,
          subject: bulletin.subject,
          message: bulletin.message,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      toast({ title: 'המסמך פורסם לדיירים' });
      setBulletin({ buildingId: '', documentId: '', bulletinType: 'meeting_summary', subject: '', message: '' });
      await loadHistory(form.buildingId || undefined);
    } catch (error) {
      console.error(error);
      toast({ title: 'פרסום המסמך נכשל', variant: 'destructive' });
    }
  }

  function applyPreset(preset: keyof typeof presets) {
    const next = presets[preset];
    setForm((current) => ({ ...current, priority: next.priority, subject: current.subject || next.subject }));
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">הודעות ממוקדות ופרסומים</h1>
        <p className="text-sm text-muted-foreground">שליחת הודעות לפי בניין, קומה ויחידות, עם תצוגת יעד והיסטוריית משלוחים.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> הודעה חדשה</CardTitle>
            <CardDescription>תצוגה מקדימה של הקהל לפני שליחה, עם מסנני בניין ויחידות.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.buildingId} onChange={(event) => setForm((current) => ({ ...current, buildingId: event.target.value }))}>
              <option value="">כל הבניינים</option>
              {buildings.map((building) => <option key={building.id} value={building.id}>{building.name} · {building.address}</option>)}
            </select>
            <div className="grid gap-3 md:grid-cols-3">
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.floor} onChange={(event) => setForm((current) => ({ ...current, floor: event.target.value }))}>
                <option value="">כל הקומות</option>
                {floors.map((floor) => <option key={floor} value={floor}>{`קומה ${floor}`}</option>)}
              </select>
              <Input placeholder="יחידות (למשל 12,15)" value={form.unitIds} onChange={(event) => setForm((current) => ({ ...current, unitIds: event.target.value }))} />
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.recipientRole} onChange={(event) => setForm((current) => ({ ...current, recipientRole: event.target.value }))}>
                <option value="RESIDENT">דיירים</option>
                <option value="PM">מנהלי נכס</option>
                <option value="ADMIN">מנהלים</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('routine')}>שגרתי</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('urgent')}>דחוף</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => applyPreset('governance')}>ועד / בניין</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
                <option value="LOW">שגרתי</option>
                <option value="MEDIUM">רגיל</option>
                <option value="HIGH">חשוב</option>
                <option value="URGENT">דחוף</option>
              </select>
              <Input placeholder="נושא" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
            </div>
            <Textarea rows={8} placeholder="תוכן ההודעה" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={previewRecipients}>תצוגת יעד</Button>
              <Button onClick={submitAnnouncement} disabled={!form.subject || !form.message}>
                <Send className="me-2 h-4 w-4" />
                שלח הודעה
              </Button>
            </div>
            {preview ? (
              <div className="rounded-xl border p-4">
                <div className="font-medium">תצוגת יעד: {preview.count} נמענים</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {preview.recipients.map((recipient) => (
                    <Badge key={recipient.id} variant="outline">{recipient.email}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> פרסום מסמך / החלטה</CardTitle>
            <CardDescription>הפיכת מסמך לציבורי והפצתו כהודעת בניין.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={bulletin.buildingId || form.buildingId} onChange={(event) => setBulletin((current) => ({ ...current, buildingId: event.target.value }))}>
              <option value="">בחר בניין</option>
              {buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={bulletin.documentId} onChange={(event) => setBulletin((current) => ({ ...current, documentId: event.target.value }))}>
              <option value="">בחר מסמך</option>
              {documents.map((document) => <option key={document.id} value={document.id}>{document.name}</option>)}
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={bulletin.bulletinType} onChange={(event) => setBulletin((current) => ({ ...current, bulletinType: event.target.value }))}>
              <option value="meeting_summary">סיכום ישיבה</option>
              <option value="signed_protocol">פרוטוקול חתום</option>
              <option value="regulation">תקנון / נוהל</option>
              <option value="committee_decision">החלטת ועד</option>
            </select>
            <Input placeholder="נושא" value={bulletin.subject} onChange={(event) => setBulletin((current) => ({ ...current, subject: event.target.value }))} />
            <Textarea rows={6} placeholder="הודעת פרסום לדיירים" value={bulletin.message} onChange={(event) => setBulletin((current) => ({ ...current, message: event.target.value }))} />
            <Button onClick={publishBulletin} disabled={!bulletin.documentId || !bulletin.subject || !bulletin.message || !(bulletin.buildingId || form.buildingId)}>פרסם לדיירים</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>היסטוריית הודעות</CardTitle>
          <CardDescription>סיכום משלוחים, עדיפויות ודוגמאות נמענים.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.map((item) => (
            <div key={item.batchKey} className="rounded-xl border p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.priority === 'URGENT' ? 'destructive' : item.priority === 'HIGH' ? 'warning' : 'outline'}>{item.priority}</Badge>
                    <span className="font-medium">{item.subject}</span>
                    <Badge variant="secondary">{item.recipientCount} נמענים</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{item.buildingName || 'כללי'} · {item.recipientRole}</div>
                  <div className="text-sm text-muted-foreground">{item.message}</div>
                  {item.sampleRecipients.length ? <div className="text-xs text-muted-foreground">לדוגמה: {item.sampleRecipients.join(', ')}</div> : null}
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(new Date(item.createdAt), locale)}</div>
              </div>
            </div>
          ))}
          {!history.length && <div className="py-8 text-center text-sm text-muted-foreground">אין היסטוריית הודעות להצגה.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
