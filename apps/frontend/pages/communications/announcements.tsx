import { useEffect, useMemo, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/use-toast';

type Building = { id: number; name: string; address: string };
type Unit = { id: number; number: string; floor?: number | null };

export default function AnnouncementsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState({
    buildingId: '',
    floor: '',
    unitIds: '',
    recipientRole: 'RESIDENT',
    priority: 'MEDIUM',
    subject: '',
    message: '',
  });

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    if (!form.buildingId) {
      setUnits([]);
      return;
    }
    loadUnits(form.buildingId);
  }, [form.buildingId]);

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

  const floors = useMemo(() => {
    return Array.from(new Set(units.map((unit) => unit.floor).filter((value) => value !== null && value !== undefined))) as number[];
  }, [units]);

  async function submitAnnouncement() {
    try {
      const response = await authFetch('/api/v1/communications/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: form.buildingId ? Number(form.buildingId) : undefined,
          floor: form.floor ? Number(form.floor) : undefined,
          unitIds: form.unitIds
            ? form.unitIds.split(',').map((item) => Number(item.trim())).filter(Boolean)
            : undefined,
          recipientRole: form.recipientRole,
          priority: form.priority,
          subject: form.subject,
          message: form.message,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      toast({ title: 'ההודעה נשלחה' });
      setForm({
        buildingId: '',
        floor: '',
        unitIds: '',
        recipientRole: 'RESIDENT',
        priority: 'MEDIUM',
        subject: '',
        message: '',
      });
      setUnits([]);
    } catch (error) {
      console.error(error);
      toast({ title: 'שליחת ההודעה נכשלה', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">הודעות ממוקדות</h1>
        <p className="text-sm text-muted-foreground">שליחת הודעות לפי בניין, קומה, יחידות או סוג נמען.</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> הודעה חדשה</CardTitle>
          <CardDescription>השתמשו בקהל יעד ממוקד במקום הודעה כללית לכלל התושבים.</CardDescription>
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
          <Button onClick={submitAnnouncement} disabled={!form.subject || !form.message}>שלח הודעה</Button>
        </CardContent>
      </Card>
    </div>
  );
}
