import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Building2, Home, MapPin, Edit, Plus, Users } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from '../../components/ui/use-toast';

interface Resident {
  id: number;
  user?: {
    id: number;
    email: string;
  };
}

interface Asset {
  id: number;
  name: string;
  category: string;
  status?: string | null;
  location?: string | null;
}

interface Unit {
  id: number;
  number?: string;
  buildingId: number;
  building?: {
    id: number;
    name: string;
    address?: string;
  };
  residents?: Resident[];
  assets?: Asset[];
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parkingSpaces?: number | null;
  floor?: number | null;
}

export default function UnitDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<Unit | null>(null);

  useEffect(() => {
    if (!id) return;
    void loadUnitData();
  }, [id]);

  const loadUnitData = async () => {
    try {
      const res = await authFetch(`/api/v1/units/${id}`);
      if (!res.ok) {
        throw new Error('לא ניתן לטעון את פרטי היחידה');
      }

      const unitData = await res.json();
      setUnit(unitData);
    } catch (error: any) {
      toast({
        title: 'שגיאה בטעינת יחידה',
        description: error.message || 'אירעה שגיאה בעת טעינת הנתונים',
        variant: 'destructive',
      });
      router.push('/buildings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'MAINTENANCE':
        return 'warning';
      case 'OUT_OF_ORDER':
        return 'destructive';
      case 'RETIRED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-6 w-48" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">היחידה לא נמצאה.</p>
        <Button asChild variant="outline">
          <Link href="/buildings">חזרה לבניינים</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">פרטי יחידה</p>
          <h1 className="text-3xl font-bold">יחידה {unit.number || unit.id}</h1>
          <p className="text-sm text-muted-foreground">{unit.building?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/units/${unit.id}/edit`}>
              <Edit className="me-2 h-4 w-4" />
              ערוך
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/buildings/${unit.buildingId}`}>
              <ArrowLeft className="me-2 h-4 w-4 icon-directional" />
              חזרה לבניין
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="בניין" value={unit.building?.name || `#${unit.buildingId}`} icon={Building2} />
        <MetricCard label="קומה" value={unit.floor ?? 'לא הוגדר'} icon={MapPin} />
        <MetricCard label="שטח" value={unit.area ? `${unit.area} מ"ר` : 'לא הוגדר'} icon={Home} />
        <MetricCard label="דיירים" value={unit.residents?.length ?? 0} icon={Users} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>דיירים</CardTitle>
          </CardHeader>
          <CardContent>
            {unit.residents && unit.residents.length > 0 ? (
              <div className="space-y-3">
                {unit.residents.map((resident) => (
                  <div key={resident.id} className="rounded-lg border p-3">
                    <div className="font-medium">דייר #{resident.id}</div>
                    <div className="text-sm text-muted-foreground">
                      {resident.user?.email ?? 'ללא כתובת אימייל'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">אין דיירים רשומים ליחידה זו.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>נכסים משויכים</CardTitle>
            <Button asChild size="sm">
              <Link href={`/assets/new?buildingId=${unit.buildingId}&unitId=${unit.id}`}>
                <Plus className="me-2 h-4 w-4" />
                שיוך נכס
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {unit.assets && unit.assets.length > 0 ? (
              <div className="space-y-3">
                {unit.assets.map((asset) => (
                  <Link
                    key={asset.id}
                    href={`/assets/${asset.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-sm text-muted-foreground">{asset.category}</div>
                      {asset.location && <div className="text-xs text-muted-foreground">מיקום: {asset.location}</div>}
                    </div>
                    <Badge variant={getStatusColor(asset.status)}>{asset.status ?? 'ללא סטטוס'}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">אין נכסים משויכים ליחידה זו.</p>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/assets/new?buildingId=${unit.buildingId}&unitId=${unit.id}`}>
                    <Plus className="me-2 h-4 w-4" />
                    הוסף נכס ליחידה
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>מידע על היחידה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <InfoCard label="מספר יחידה" value={unit.number || unit.id} />
            <InfoCard label="חדרי שינה" value={unit.bedrooms ?? 'לא הוגדר'} />
            <InfoCard label="חדרי רחצה" value={unit.bathrooms ?? 'לא הוגדר'} />
            <InfoCard label="חניות" value={unit.parkingSpaces ?? 'לא הוגדר'} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-full bg-muted p-2">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 text-sm">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
