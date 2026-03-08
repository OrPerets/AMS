import { useEffect, useState } from 'react';
import { authFetch } from '../lib/auth';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from '../components/ui/use-toast';
import { formatCurrency, formatDate } from '../lib/utils';
import { useLocale } from '../lib/providers';

type Option = { id: number; name?: string; email?: string; address?: string };

type Contract = {
  id: number;
  title: string;
  description?: string | null;
  value?: number | null;
  startDate: string;
  endDate?: string | null;
  status: string;
  renewalReminderDays: number;
  approvalStatus: string;
  building: { id: number; name: string; address: string };
  supplier?: { id: number; name: string } | null;
  owner?: { id: number; email: string } | null;
  documents: Array<{ id: number; name: string }>;
};

export default function ContractsPage() {
  const { locale } = useLocale();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [buildings, setBuildings] = useState<Option[]>([]);
  const [vendors, setVendors] = useState<Option[]>([]);
  const [owners, setOwners] = useState<Option[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    buildingId: '',
    supplierId: '',
    ownerUserId: '',
    title: '',
    value: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    renewalReminderDays: '30',
    approvalStatus: 'APPROVED',
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [contractsRes, buildingsRes, vendorsRes, ownersRes] = await Promise.all([
        authFetch('/api/v1/contracts'),
        authFetch('/api/v1/buildings'),
        authFetch('/api/v1/vendors'),
        authFetch('/api/v1/users/management'),
      ]);
      if (!contractsRes.ok || !buildingsRes.ok || !vendorsRes.ok || !ownersRes.ok) {
        throw new Error('load failed');
      }
      setContracts(await contractsRes.json());
      setBuildings(await buildingsRes.json());
      setVendors(await vendorsRes.json());
      setOwners(await ownersRes.json());
    } catch (error) {
      console.error(error);
      toast({ title: 'טעינת החוזים נכשלה', variant: 'destructive' });
    }
  }

  async function saveContract() {
    try {
      const response = await authFetch(editingId ? `/api/v1/contracts/${editingId}` : '/api/v1/contracts', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: Number(form.buildingId),
          supplierId: form.supplierId ? Number(form.supplierId) : undefined,
          ownerUserId: form.ownerUserId ? Number(form.ownerUserId) : undefined,
          title: form.title,
          value: form.value ? Number(form.value) : undefined,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          renewalReminderDays: Number(form.renewalReminderDays || 30),
          approvalStatus: form.approvalStatus,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      setForm({
        buildingId: '',
        supplierId: '',
        ownerUserId: '',
        title: '',
        value: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        renewalReminderDays: '30',
        approvalStatus: 'APPROVED',
      });
      setEditingId(null);
      toast({ title: editingId ? 'החוזה עודכן' : 'החוזה נשמר' });
      await loadAll();
    } catch (error) {
      console.error(error);
      toast({ title: editingId ? 'עדכון החוזה נכשל' : 'שמירת החוזה נכשלה', variant: 'destructive' });
    }
  }

  async function runReminders() {
    try {
      const response = await authFetch('/api/v1/portfolio/reminders/run', { method: 'POST' });
      if (!response.ok) throw new Error(await response.text());
      toast({ title: 'תזכורות חידוש חוזים נשלחו' });
      await loadAll();
    } catch (error) {
      console.error(error);
      toast({ title: 'שליחת התזכורות נכשלה', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">חוזים והתחדשות</h1>
        <p className="text-sm text-muted-foreground">מעקב אחרי בעלי אחריות, אישור, מסמכים ותאריכי סיום.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>חוזה חדש</CardTitle>
            <CardDescription>הזנת חוזה תפעולי והגדרת חלון תזכורת לחידוש.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.buildingId} onChange={(event) => setForm((current) => ({ ...current, buildingId: event.target.value }))}>
              <option value="">בחר בניין</option>
              {buildings.map((building) => <option key={building.id} value={building.id}>{building.name} {building.address ? `· ${building.address}` : ''}</option>)}
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.supplierId} onChange={(event) => setForm((current) => ({ ...current, supplierId: event.target.value }))}>
              <option value="">בחר ספק</option>
              {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
            </select>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.ownerUserId} onChange={(event) => setForm((current) => ({ ...current, ownerUserId: event.target.value }))}>
              <option value="">בעל אחריות</option>
              {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.email}</option>)}
            </select>
            <Input placeholder="כותרת חוזה" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            <Input placeholder="שווי חוזה" type="number" value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              <Input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
              <Input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input type="number" placeholder="ימי תזכורת" value={form.renewalReminderDays} onChange={(event) => setForm((current) => ({ ...current, renewalReminderDays: event.target.value }))} />
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.approvalStatus} onChange={(event) => setForm((current) => ({ ...current, approvalStatus: event.target.value }))}>
                <option value="APPROVED">מאושר</option>
                <option value="PENDING">ממתין לאישור</option>
                <option value="REVIEW">בבדיקה</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveContract} disabled={!form.buildingId || !form.title}>{editingId ? 'עדכן חוזה' : 'שמור חוזה'}</Button>
              {editingId ? <Button variant="outline" onClick={() => { setEditingId(null); setForm({ buildingId: '', supplierId: '', ownerUserId: '', title: '', value: '', startDate: new Date().toISOString().split('T')[0], endDate: '', renewalReminderDays: '30', approvalStatus: 'APPROVED' }); }}>בטל</Button> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>חוזים פעילים וקרובים לפקיעה</CardTitle>
            <CardDescription>רשימת החוזים כוללת בעל אחריות, ספק, מסמכים וסטטוס אישור.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open('/api/v1/contracts?format=csv', '_blank')}>ייצא CSV</Button>
              <Button variant="outline" size="sm" onClick={runReminders}>שלח תזכורות חידוש</Button>
            </div>
            {contracts.map((contract) => {
              const expiringSoon = contract.endDate && new Date(contract.endDate).getTime() < Date.now() + contract.renewalReminderDays * 24 * 60 * 60 * 1000;
              const overdue = contract.endDate && new Date(contract.endDate).getTime() < Date.now();
              return (
                <div key={contract.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{contract.title}</span>
                        <Badge variant={contract.approvalStatus === 'APPROVED' ? 'success' : 'warning'}>{contract.approvalStatus}</Badge>
                        {overdue ? <Badge variant="destructive">פג תוקף</Badge> : expiringSoon ? <Badge variant="warning">קרוב לפקיעה</Badge> : null}
                      </div>
                      <div className="text-sm text-muted-foreground">{contract.building.name} · {contract.supplier?.name || 'ללא ספק'} · {contract.owner?.email || 'ללא בעל אחריות'}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(new Date(contract.startDate), locale)}
                        {contract.endDate ? ` עד ${formatDate(new Date(contract.endDate), locale)}` : ' · ללא תאריך סיום'}
                        {contract.value ? ` · ${formatCurrency(contract.value)}` : ''}
                        {` · מסמכים: ${contract.documents.length}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{contract.status}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(contract.id);
                          setForm({
                            buildingId: String(contract.building.id),
                            supplierId: contract.supplier?.id ? String(contract.supplier.id) : '',
                            ownerUserId: contract.owner?.id ? String(contract.owner.id) : '',
                            title: contract.title,
                            value: contract.value ? String(contract.value) : '',
                            startDate: contract.startDate.slice(0, 10),
                            endDate: contract.endDate ? contract.endDate.slice(0, 10) : '',
                            renewalReminderDays: String(contract.renewalReminderDays),
                            approvalStatus: contract.approvalStatus,
                          });
                        }}
                      >
                        ערוך
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
