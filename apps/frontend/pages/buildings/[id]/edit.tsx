import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authFetch } from '../../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { toast } from '../../../components/ui/use-toast';

export default function EditBuildingPage() {
  const router = useRouter();
  const { id } = router.query;
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      try {
        const res = await authFetch(`/api/v1/buildings/${id}`);
        if (res.ok) {
          const b = await res.json();
          setName(b.name ?? '');
          setAddress(b.address ?? '');
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/v1/buildings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Update failed');
      }
      toast({ title: 'הבניין עודכן בהצלחה' });
      router.push(`/buildings/${id}`);
    } catch (err: any) {
      toast({ title: 'שגיאה בעדכון', description: err?.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="space-y-4"><div className="h-8 bg-muted rounded" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">עריכת בניין</h1>
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
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>שמור</Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/buildings/${id}`)}>בטל</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


