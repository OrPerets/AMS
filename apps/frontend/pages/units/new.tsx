import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../components/ui/use-toast';

interface Building {
  id: number;
  name: string;
}

interface UnitForm {
  number: string;
  buildingId: string;
  area: string;
  floor: string;
  bedrooms: string;
  bathrooms: string;
  parkingSpaces: string;
}

export default function NewUnitPage() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UnitForm>({
    number: '',
    buildingId: '',
    area: '',
    floor: '',
    bedrooms: '',
    bathrooms: '',
    parkingSpaces: '',
  });

  useEffect(() => {
    void loadBuildings();
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof router.query.buildingId !== 'string') return;
    setForm((current) => ({ ...current, buildingId: router.query.buildingId as string }));
  }, [router.isReady, router.query.buildingId]);

  const loadBuildings = async () => {
    try {
      const res = await authFetch('/api/v1/buildings');
      if (!res.ok) return;
      const data = await res.json();
      setBuildings(Array.isArray(data) ? data : []);
    } catch {
      setBuildings([]);
    }
  };

  const handleInputChange = (field: keyof UnitForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        number: form.number,
        buildingId: Number(form.buildingId),
        area: form.area ? Number(form.area) : undefined,
        floor: form.floor ? Number(form.floor) : undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        parkingSpaces: form.parkingSpaces ? Number(form.parkingSpaces) : undefined,
      };

      const res = await authFetch('/api/v1/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'יצירת יחידה נכשלה');
      }

      const created = await res.json();
      toast({ title: 'היחידה נוצרה בהצלחה' });
      router.push(`/units/${created.id}`);
    } catch (error: any) {
      toast({
        title: 'שגיאה ביצירת יחידה',
        description: error.message || 'לא ניתן ליצור את היחידה',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">יחידה חדשה</h1>
          <p className="text-muted-foreground">הוספת יחידה חדשה לבניין קיים</p>
        </div>
        <Button asChild variant="outline">
          <Link href={form.buildingId ? `/buildings/${form.buildingId}` : '/buildings'}>
            <ArrowLeft className="me-2 h-4 w-4" />
            חזרה
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
              <Label htmlFor="buildingId">בניין *</Label>
              <Select value={form.buildingId} onValueChange={(value) => handleInputChange('buildingId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר בניין" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={String(building.id)}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              <Button type="button" variant="outline" onClick={() => router.back()}>
                בטל
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
