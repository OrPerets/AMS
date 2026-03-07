import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { authFetch } from '../../../lib/auth';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { toast } from '../../../components/ui/use-toast';
import { Skeleton } from '../../../components/ui/skeleton';

interface UnitForm {
  number: string;
  area: string;
  floor: string;
  bedrooms: string;
  bathrooms: string;
  parkingSpaces: string;
  buildingId: number;
}

export default function EditUnitPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UnitForm>({
    number: '',
    area: '',
    floor: '',
    bedrooms: '',
    bathrooms: '',
    parkingSpaces: '',
    buildingId: 0,
  });

  useEffect(() => {
    if (!id) return;
    void loadUnit();
  }, [id]);

  const loadUnit = async () => {
    try {
      const res = await authFetch(`/api/v1/units/${id}`);
      if (!res.ok) {
        throw new Error('לא ניתן לטעון את פרטי היחידה');
      }

      const unit = await res.json();
      setForm({
        number: unit.number || '',
        area: unit.area?.toString() || '',
        floor: unit.floor?.toString() || '',
        bedrooms: unit.bedrooms?.toString() || '',
        bathrooms: unit.bathrooms?.toString() || '',
        parkingSpaces: unit.parkingSpaces?.toString() || '',
        buildingId: unit.buildingId,
      });
    } catch (error: any) {
      toast({
        title: 'שגיאה בטעינת יחידה',
        description: error.message || 'לא ניתן לטעון את פרטי היחידה',
        variant: 'destructive',
      });
      router.push('/buildings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UnitForm, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        number: form.number,
        area: form.area ? Number(form.area) : undefined,
        floor: form.floor ? Number(form.floor) : undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        parkingSpaces: form.parkingSpaces ? Number(form.parkingSpaces) : undefined,
        buildingId: form.buildingId,
      };

      const res = await authFetch(`/api/v1/units/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'עדכון יחידה נכשל');
      }

      toast({ title: 'היחידה עודכנה בהצלחה' });
      router.push(`/units/${id}`);
    } catch (error: any) {
      toast({
        title: 'שגיאה בעדכון יחידה',
        description: error.message || 'לא ניתן לעדכן את היחידה',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">עריכת יחידה</h1>
          <p className="text-muted-foreground">עדכון פרטי היחידה וניהול השיוך לבניין</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/units/${id}`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            חזרה ליחידה
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פרטי יחידה</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="number">מספר יחידה *</Label>
              <Input id="number" value={form.number} onChange={(e) => handleInputChange('number', e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="floor">קומה</Label>
              <Input id="floor" type="number" value={form.floor} onChange={(e) => handleInputChange('floor', e.target.value)} />
            </div>

            <div>
              <Label htmlFor="area">שטח</Label>
              <Input id="area" type="number" step="0.1" value={form.area} onChange={(e) => handleInputChange('area', e.target.value)} />
            </div>

            <div>
              <Label htmlFor="bedrooms">חדרי שינה</Label>
              <Input id="bedrooms" type="number" value={form.bedrooms} onChange={(e) => handleInputChange('bedrooms', e.target.value)} />
            </div>

            <div>
              <Label htmlFor="bathrooms">חדרי רחצה</Label>
              <Input id="bathrooms" type="number" value={form.bathrooms} onChange={(e) => handleInputChange('bathrooms', e.target.value)} />
            </div>

            <div>
              <Label htmlFor="parkingSpaces">חניות</Label>
              <Input
                id="parkingSpaces"
                type="number"
                value={form.parkingSpaces}
                onChange={(e) => handleInputChange('parkingSpaces', e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'שומר...' : 'שמור'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/units/${id}`)}>
                בטל
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
