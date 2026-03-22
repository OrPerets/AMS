import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Save, X } from 'lucide-react';
import { authFetch } from '../../../lib/auth';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from '../../../components/ui/use-toast';
import { Skeleton } from '../../../components/ui/skeleton';

interface Building {
  id: number;
  name: string;
}

interface UnitOption {
  id: number;
  number: string;
}

interface Asset {
  id: number;
  name: string;
  category: string;
  description?: string;
  serialNumber?: string;
  location?: string;
  buildingId: number;
  unitId?: number | null;
  purchaseDate?: string;
  warrantyExpiry?: string;
  value?: number;
  salvageValue?: number;
  quantity?: number;
  usefulLifeYears?: number;
  depreciationMethod?: string;
  status?: string;
}

interface EditAssetForm {
  name: string;
  category: string;
  description: string;
  serialNumber: string;
  location: string;
  buildingId: string;
  unitId: string;
  purchaseDate: string;
  warrantyExpiry: string;
  value: string;
  salvageValue: string;
  quantity: string;
  usefulLifeYears: string;
  depreciationMethod: string;
  status: string;
}

export default function EditAssetPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [form, setForm] = useState<EditAssetForm>({
    name: '',
    category: '',
    description: '',
    serialNumber: '',
    location: '',
    buildingId: '',
    unitId: 'none',
    purchaseDate: '',
    warrantyExpiry: '',
    value: '',
    salvageValue: '',
    quantity: '1',
    usefulLifeYears: '10',
    depreciationMethod: 'STRAIGHT_LINE',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (id) {
      void loadData();
    }
  }, [id]);

  useEffect(() => {
    if (!form.buildingId) {
      setUnits([]);
      setForm((current) => ({ ...current, unitId: 'none' }));
      return;
    }

    void loadUnits(form.buildingId);
  }, [form.buildingId]);

  const loadData = async () => {
    try {
      const [buildingsRes, assetRes] = await Promise.all([
        authFetch('/api/v1/buildings'),
        authFetch(`/api/v1/assets/${id}`)
      ]);

      if (buildingsRes.ok) {
        const buildingsData = await buildingsRes.json();
        setBuildings(Array.isArray(buildingsData) ? buildingsData : []);
      }

      if (assetRes.ok) {
        const assetData = await assetRes.json();
        setAsset(assetData);
        setForm({
          name: assetData.name || '',
          category: assetData.category || '',
          description: assetData.description || '',
          serialNumber: assetData.serialNumber || '',
          location: assetData.location || '',
          buildingId: assetData.buildingId?.toString() || '',
          unitId: assetData.unitId ? assetData.unitId.toString() : 'none',
          purchaseDate: assetData.purchaseDate ? assetData.purchaseDate.split('T')[0] : '',
          warrantyExpiry: assetData.warrantyExpiry ? assetData.warrantyExpiry.split('T')[0] : '',
          value: assetData.value?.toString() || '',
          salvageValue: assetData.salvageValue?.toString() || '',
          quantity: assetData.quantity?.toString() || '1',
          usefulLifeYears: assetData.usefulLifeYears?.toString() || '10',
          depreciationMethod: assetData.depreciationMethod || 'STRAIGHT_LINE',
          status: assetData.status || 'ACTIVE'
        });
      } else {
        toast({
          title: "שגיאה בטעינת נכס",
          description: "לא ניתן לטעון את פרטי הנכס",
          variant: "destructive"
        });
        router.push('/assets');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה בטעינת נתונים",
        description: error.message || "אירעה שגיאה בעת טעינת הנתונים",
        variant: "destructive"
      });
      router.push('/assets');
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async (buildingId: string) => {
    try {
      const res = await authFetch(`/api/v1/units?buildingId=${buildingId}`);
      if (!res.ok) {
        throw new Error('Failed to load units');
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setUnits(
        list.map((unit) => ({
          id: unit.id,
          number: unit.number || String(unit.id),
        })),
      );
    } catch {
      setUnits([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        buildingId: parseInt(form.buildingId),
        unitId: form.unitId !== 'none' ? parseInt(form.unitId) : undefined,
        value: form.value ? parseFloat(form.value) : undefined,
        salvageValue: form.salvageValue ? parseFloat(form.salvageValue) : undefined,
        quantity: form.quantity ? parseInt(form.quantity) : undefined,
        usefulLifeYears: form.usefulLifeYears ? parseInt(form.usefulLifeYears) : undefined,
      };

      const res = await authFetch(`/api/v1/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({
          title: "נכס עודכן בהצלחה",
          description: "השינויים נשמרו"
        });
        router.push(`/assets/${id}`);
      } else {
        const error = await res.json();
        throw new Error(error.message || 'שגיאה בעדכון הנכס');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה בעדכון נכס",
        description: error.message || "לא ניתן לעדכן את הנכס",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof EditAssetForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">הנכס לא נמצא.</p>
        <Button asChild variant="outline">
          <Link href="/assets">חזרה לרשימה</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ערוך נכס</h1>
          <p className="text-muted-foreground">
            ערוך את פרטי הנכס: {asset.name}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/assets/${id}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 icon-directional" />
            חזרה לפרטי הנכס
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>מידע בסיסי</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">שם הנכס *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="שם הנכס"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">קטגוריה *</Label>
                <Select value={form.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">כללי</SelectItem>
                    <SelectItem value="HVAC">מיזוג אוויר</SelectItem>
                    <SelectItem value="ELEVATORS">מעליות</SelectItem>
                    <SelectItem value="PLUMBING">אינסטלציה</SelectItem>
                    <SelectItem value="ELECTRICAL">חשמל</SelectItem>
                    <SelectItem value="SAFETY">אבטחה</SelectItem>
                    <SelectItem value="LANDSCAPING">גינון</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="buildingId">בניין *</Label>
                <Select value={form.buildingId} onValueChange={(value) => handleInputChange('buildingId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר בניין" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building) => (
                      <SelectItem key={building.id} value={building.id.toString()}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unitId">שיוך ליחידה</Label>
                <Select
                  value={form.unitId}
                  onValueChange={(value) => handleInputChange('unitId', value)}
                  disabled={!form.buildingId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ללא שיוך ליחידה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא שיוך ליחידה</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={String(unit.id)}>
                        יחידה {unit.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">מיקום</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="מיקום הנכס"
                />
              </div>

              <div>
                <Label htmlFor="description">תיאור</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="תיאור הנכס"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>פרטים טכניים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="serialNumber">מספר סידורי</Label>
                <Input
                  id="serialNumber"
                  value={form.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  placeholder="מספר סידורי"
                />
              </div>

              <div>
                <Label htmlFor="quantity">כמות</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="1"
                />
              </div>

              <div>
                <Label htmlFor="status">סטטוס</Label>
                <Select value={form.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">פעיל</SelectItem>
                    <SelectItem value="MAINTENANCE">בתחזוקה</SelectItem>
                    <SelectItem value="OUT_OF_ORDER">מקולקל</SelectItem>
                    <SelectItem value="RETIRED">לא פעיל</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="purchaseDate">תאריך רכישה</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="warrantyExpiry">תאריך סיום אחריות</Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  value={form.warrantyExpiry}
                  onChange={(e) => handleInputChange('warrantyExpiry', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>מידע פיננסי</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="value">ערך הנכס (₪)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={form.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="salvageValue">ערך גרוטאות (₪)</Label>
                <Input
                  id="salvageValue"
                  type="number"
                  step="0.01"
                  value={form.salvageValue}
                  onChange={(e) => handleInputChange('salvageValue', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="usefulLifeYears">תקופת חיים שימושית (שנים)</Label>
                <Input
                  id="usefulLifeYears"
                  type="number"
                  min="1"
                  value={form.usefulLifeYears}
                  onChange={(e) => handleInputChange('usefulLifeYears', e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="depreciationMethod">שיטת פחת</Label>
              <Select value={form.depreciationMethod} onValueChange={(value) => handleInputChange('depreciationMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר שיטת פחת" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STRAIGHT_LINE">קו ישר</SelectItem>
                  <SelectItem value="DECLINING_BALANCE">יתרה פוחתת</SelectItem>
                  <SelectItem value="SUM_OF_YEARS">סכום שנים</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button asChild variant="outline">
            <Link href={`/assets/${id}`}>
              <X className="me-2 h-4 w-4" />
              ביטול
            </Link>
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="me-2 h-4 w-4" />
            {saving ? 'שומר...' : 'שמור שינויים'}
          </Button>
        </div>
      </form>
    </div>
  );
}
