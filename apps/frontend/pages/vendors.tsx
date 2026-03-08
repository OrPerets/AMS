import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, Truck } from 'lucide-react';
import { authFetch } from '../lib/auth';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from '../components/ui/use-toast';
import { formatDate } from '../lib/utils';
import { useLocale } from '../lib/providers';

type Vendor = {
  id: number;
  name: string;
  skills: string[];
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  insuranceExpiry?: string | null;
  complianceNotes?: string | null;
  rating?: number | null;
  contracts: Array<{ id: number }>;
  workOrders: Array<{ id: number }>;
};

export default function VendorsPage() {
  const { locale } = useLocale();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    skills: '',
    contactName: '',
    email: '',
    phone: '',
    insuranceExpiry: '',
    complianceNotes: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    try {
      setLoading(true);
      const response = await authFetch('/api/v1/vendors');
      if (!response.ok) throw new Error(await response.text());
      setVendors(await response.json());
    } catch (error) {
      console.error(error);
      toast({ title: 'טעינת הספקים נכשלה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function createVendor() {
    try {
      const response = await authFetch('/api/v1/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(',').map((item) => item.trim()).filter(Boolean),
          insuranceExpiry: form.insuranceExpiry || undefined,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      setForm({ name: '', skills: '', contactName: '', email: '', phone: '', insuranceExpiry: '', complianceNotes: '' });
      toast({ title: 'הספק נשמר' });
      await loadVendors();
    } catch (error) {
      console.error(error);
      toast({ title: 'שמירת ספק נכשלה', variant: 'destructive' });
    }
  }

  async function toggleVendor(vendor: Vendor) {
    try {
      const response = await authFetch(`/api/v1/vendors/${vendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !vendor.isActive }),
      });
      if (!response.ok) throw new Error(await response.text());
      await loadVendors();
    } catch (error) {
      console.error(error);
      toast({ title: 'עדכון הספק נכשל', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">ספקים וקבלנים</h1>
        <p className="text-sm text-muted-foreground">ניהול אנשי קשר, כישורים, מצב פעילות ותוקף ביטוחים.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>ספק חדש</CardTitle>
            <CardDescription>הקמה מהירה לספקי תחזוקה, ניקיון, חשמל ושירות.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="שם ספק" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <Input placeholder="איש קשר" value={form.contactName} onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))} />
            <Input placeholder="אימייל" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            <Input placeholder="טלפון" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            <Input placeholder="כישורים מופרדים בפסיקים" value={form.skills} onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value }))} />
            <Input type="date" value={form.insuranceExpiry} onChange={(event) => setForm((current) => ({ ...current, insuranceExpiry: event.target.value }))} />
            <Input placeholder="הערות תאימות" value={form.complianceNotes} onChange={(event) => setForm((current) => ({ ...current, complianceNotes: event.target.value }))} />
            <Button onClick={createVendor} disabled={!form.name}>שמור ספק</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>רשימת ספקים</CardTitle>
            <CardDescription>כאן אפשר לזהות ספקים לא פעילים או כאלה שביטוחם עומד לפוג.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {vendors.map((vendor) => {
              const expiring = vendor.insuranceExpiry && new Date(vendor.insuranceExpiry).getTime() < Date.now() + 30 * 24 * 60 * 60 * 1000;
              return (
                <div key={vendor.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        <span className="font-medium">{vendor.name}</span>
                        <Badge variant={vendor.isActive ? 'success' : 'secondary'}>{vendor.isActive ? 'פעיל' : 'מושהה'}</Badge>
                        {expiring ? <Badge variant="warning"><AlertTriangle className="me-1 h-3 w-3" />ביטוח קרוב לפקיעה</Badge> : null}
                      </div>
                      <div className="text-sm text-muted-foreground">{vendor.contactName || 'ללא איש קשר'} · {vendor.phone || 'ללא טלפון'} · {vendor.email || 'ללא אימייל'}</div>
                      <div className="flex flex-wrap gap-2">
                        {vendor.skills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        חוזים: {vendor.contracts.length} · הזמנות עבודה אחרונות: {vendor.workOrders.length}
                        {vendor.insuranceExpiry ? ` · ביטוח עד ${formatDate(new Date(vendor.insuranceExpiry), locale)}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleVendor(vendor)}>
                        {vendor.isActive ? 'השהה' : 'הפעל'}
                      </Button>
                    </div>
                  </div>
                  {vendor.complianceNotes ? (
                    <div className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">
                      <div className="mb-1 flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" /> תאימות</div>
                      {vendor.complianceNotes}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {!loading && !vendors.length && <div className="py-8 text-center text-sm text-muted-foreground">אין ספקים להצגה.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
