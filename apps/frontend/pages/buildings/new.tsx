import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { authFetch } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from '../../components/ui/use-toast';

export default function NewBuildingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [tenantId, setTenantId] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch('/api/v1/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, tenantId: Number(tenantId) }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Create failed');
      }
      const created = await res.json();
      toast({ title: 'הבניין נוצר בהצלחה' });
      router.push(`/buildings/${created.id}`);
    } catch (err: any) {
      toast({ title: 'שגיאה ביצירת בניין', description: err?.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">בניין חדש</h1>
      <Card>
        <CardHeader>
          <CardTitle>פרטי בניין</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">שם</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1">כתובת</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Tenant ID</label>
              <Input type="number" value={tenantId} onChange={(e) => setTenantId(e.target.value)} required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>שמור</Button>
              <Button type="button" variant="outline" onClick={() => router.push('/buildings')}>בטל</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


