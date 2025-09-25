import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, CalendarClock, MapPin, Wrench, DollarSign, TrendingDown, Edit, Save, X } from "lucide-react";
import { assetSummaries, maintenanceHistory, maintenanceEvents } from "../../components/maintenance/data";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { MaintenanceHistoryTimeline } from "../../components/maintenance/maintenance-history-timeline";
import { MaintenanceCalendar } from "../../components/ui/maintenance-calendar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { authFetch } from "../../lib/auth";
import { toast } from "../../components/ui/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Asset {
  id: number;
  name: string;
  category: string;
  description?: string;
  serialNumber?: string;
  location?: string;
  buildingId: number;
  buildingName?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  value?: number;
  salvageValue?: number;
  quantity?: number;
  usefulLifeYears?: number;
  depreciationMethod?: string;
  status?: string;
}

interface DepreciationData {
  assetId: number;
  method: string;
  usefulLifeYears: number;
  salvageValue: number;
  annualDepreciation: number;
  accumulatedDepreciation: number;
  bookValue: number;
  ageYears: number;
  quantity: number;
}

export default function AssetDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [depreciation, setDepreciation] = useState<DepreciationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    if (id) {
      loadAssetData();
    }
  }, [id]);

  const loadAssetData = async () => {
    try {
      const [assetRes, depreciationRes] = await Promise.all([
        authFetch(`/api/v1/assets/${id}`),
        authFetch(`/api/v1/assets/${id}/depreciation`)
      ]);

      if (assetRes.ok) {
        const assetData = await assetRes.json();
        setAsset(assetData);
        setNewLocation(assetData.location || '');
      }

      if (depreciationRes.ok) {
        const depreciationData = await depreciationRes.json();
        setDepreciation(depreciationData);
      }
    } catch (error) {
      console.error('Failed to load asset data:', error);
      // Fallback to mock data
      const mockAsset = assetSummaries.find((item) => item.id === id) ?? assetSummaries[0];
      setAsset({
        id: parseInt(id as string),
        name: mockAsset?.name || 'נכס לא ידוע',
        category: mockAsset?.category || 'OTHER',
        location: mockAsset?.location || 'לא ידוע',
        buildingId: 1,
        buildingName: 'בניין דוגמה',
        status: 'ACTIVE'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = async () => {
    if (!newLocation.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין מיקום",
        variant: "destructive"
      });
      return;
    }

    setSavingLocation(true);
    try {
      const res = await authFetch(`/api/v1/assets/${id}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: newLocation,
          notes: locationNotes
        })
      });

      if (res.ok) {
        toast({
          title: "מיקום עודכן",
          description: "המיקום עודכן בהצלחה"
        });
        setEditingLocation(false);
        setLocationNotes('');
        loadAssetData(); // Reload to get updated data
      } else {
        throw new Error('Failed to update location');
      }
    } catch (error) {
      toast({
        title: "שגיאה בעדכון מיקום",
        description: "לא ניתן לעדכן את המיקום",
        variant: "destructive"
      });
    } finally {
      setSavingLocation(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
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
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">פרטי נכס</p>
          <h1 className="text-3xl font-bold text-foreground">{asset.name}</h1>
          <p className="text-sm text-muted-foreground">{asset.buildingName}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/assets/${asset.id}/edit`} className="flex items-center gap-2">
              <Edit className="h-4 w-4" /> ערוך
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/assets" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> חזרה לרשימה
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">מזהה</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">#{asset.id}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">קטגוריה</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-foreground">
            <Wrench className="h-4 w-4" /> {asset.category}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-xs">
              {asset.status ?? "לא ידוע"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5" /> מיקום
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingLocation ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="location">מיקום חדש</Label>
                <Input
                  id="location"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="הזן מיקום חדש"
                />
              </div>
              <div>
                <Label htmlFor="notes">הערות</Label>
                <Textarea
                  id="notes"
                  value={locationNotes}
                  onChange={(e) => setLocationNotes(e.target.value)}
                  placeholder="הערות על שינוי המיקום"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleLocationUpdate} 
                  disabled={savingLocation}
                  size="sm"
                >
                  <Save className="me-2 h-4 w-4" />
                  {savingLocation ? 'שומר...' : 'שמור'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingLocation(false);
                    setNewLocation(asset.location || '');
                    setLocationNotes('');
                  }}
                  size="sm"
                >
                  <X className="me-2 h-4 w-4" />
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground flex-1">
                <p className="text-xs font-medium text-foreground">מיקום נוכחי</p>
                <p>{asset.location || 'לא הוגדר'}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEditingLocation(true)}
                className="ml-4"
              >
                <Edit className="me-2 h-4 w-4" />
                עדכן מיקום
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Depreciation Information */}
      {depreciation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingDown className="h-5 w-5" /> חישוב פחת
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="text-xs font-medium text-foreground">ערך מקורי</p>
                <p className="text-lg font-semibold text-foreground">
                  {asset.value ? formatCurrency(asset.value) : 'לא הוגדר'}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="text-xs font-medium text-foreground">פחת מצטבר</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(depreciation.accumulatedDepreciation)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="text-xs font-medium text-foreground">ערך ספרים</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(depreciation.bookValue)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="text-xs font-medium text-foreground">פחת שנתי</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(depreciation.annualDepreciation)}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">שיטת פחת:</p>
                <p>{depreciation.method === 'STRAIGHT_LINE' ? 'קו ישר' : depreciation.method}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">תקופת חיים שימושית:</p>
                <p>{depreciation.usefulLifeYears} שנים</p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">גיל הנכס:</p>
                <p>{depreciation.ageYears.toFixed(1)} שנים</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Information */}
      {asset.value && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-5 w-5" /> מידע פיננסי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="text-xs font-medium text-foreground">ערך רכישה</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(asset.value)}
                </p>
              </div>
              {asset.salvageValue && (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  <p className="text-xs font-medium text-foreground">ערך גרוטאות</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrency(asset.salvageValue)}
                  </p>
                </div>
              )}
              {asset.quantity && (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  <p className="text-xs font-medium text-foreground">כמות</p>
                  <p className="text-lg font-semibold text-foreground">
                    {asset.quantity}
                  </p>
                </div>
              )}
            </div>
            {asset.purchaseDate && (
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">תאריך רכישה:</p>
                <p>{format(new Date(asset.purchaseDate), "dd MMM yyyy", { locale: he })}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <MaintenanceHistoryTimeline items={maintenanceHistory} />
        <MaintenanceCalendar events={maintenanceEvents} />
      </div>
    </div>
  );
}
