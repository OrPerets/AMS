import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Save, X } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../components/ui/use-toast';

interface Building {
  id: number;
  name: string;
}

interface CreateAssetForm {
  name: string;
  category: string;
  description: string;
  serialNumber: string;
  location: string;
  buildingId: string;
  purchaseDate: string;
  warrantyExpiry: string;
  value: string;
  salvageValue: string;
  quantity: string;
  usefulLifeYears: string;
  depreciationMethod: string;
  status: string;
}

export default function CreateAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [form, setForm] = useState<CreateAssetForm>({
    name: '',
    category: '',
    description: '',
    serialNumber: '',
    location: '',
    buildingId: '',
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
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      const res = await authFetch('/api/v1/buildings');
      if (res.ok) {
        const data = await res.json();
        setBuildings(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load buildings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        buildingId: parseInt(form.buildingId),
        value: form.value ? parseFloat(form.value) : undefined,
        salvageValue: form.salvageValue ? parseFloat(form.salvageValue) : undefined,
        quantity: form.quantity ? parseInt(form.quantity) : undefined,
        usefulLifeYears: form.usefulLifeYears ? parseInt(form.usefulLifeYears) : undefined,
      };

      const res = await authFetch('/api/v1/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({
          title: "נכס נוצר בהצלחה",
          description: "הנכס נוסף למערכת"
        });
        router.push('/assets');
      } else {
        const error = await res.json();
        throw new Error(error.message || 'שגיאה ביצירת הנכס');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה ביצירת נכס",
        description: error.message || "לא ניתן ליצור את הנכס",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateAssetForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">הוסף נכס חדש</h1>
          <p className="text-muted-foreground">
            הוסף נכס חדש למערכת ניהול הנכסים
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/assets" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            חזרה לרשימה
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
                    <SelectItem value="HVAC">מיזוג אוויר</SelectItem>
                    <SelectItem value="ELEVATOR">מעלית</SelectItem>
                    <SelectItem value="PLUMBING">אינסטלציה</SelectItem>
                    <SelectItem value="ELECTRICAL">חשמל</SelectItem>
                    <SelectItem value="SECURITY">אבטחה</SelectItem>
                    <SelectItem value="OTHER">אחר</SelectItem>
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
            <Link href="/assets">
              <X className="me-2 h-4 w-4" />
              ביטול
            </Link>
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="me-2 h-4 w-4" />
            {loading ? 'יוצר...' : 'צור נכס'}
          </Button>
        </div>
      </form>
    </div>
  );
}
