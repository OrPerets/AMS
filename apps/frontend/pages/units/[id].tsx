import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Home, Users, MapPin, Edit, Plus } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from '../../components/ui/use-toast';

interface Unit {
  id: number;
  number?: string;
  buildingId: number;
  buildingName?: string;
  residents?: Resident[];
  assets?: Asset[];
}

interface Resident {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface Asset {
  id: number;
  name: string;
  category: string;
  status: string;
  location?: string;
}

export default function UnitDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<Unit | null>(null);

  useEffect(() => {
    if (id) {
      loadUnitData();
    }
  }, [id]);

  const loadUnitData = async () => {
    try {
      const res = await authFetch(`/api/v1/units/${id}`);
      if (res.ok) {
        const unitData = await res.json();
        setUnit(unitData);
      } else {
        toast({
          title: "שגיאה בטעינת יחידה",
          description: "לא ניתן לטעון את פרטי היחידה",
          variant: "destructive"
        });
        router.push('/buildings');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה בטעינת נתונים",
        description: error.message || "אירעה שגיאה בעת טעינת הנתונים",
        variant: "destructive"
      });
      router.push('/buildings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'MAINTENANCE': return 'warning';
      case 'OUT_OF_ORDER': return 'destructive';
      case 'RETIRED': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'פעיל';
      case 'MAINTENANCE': return 'בתחזוקה';
      case 'OUT_OF_ORDER': return 'מקולקל';
      case 'RETIRED': return 'לא פעיל';
      default: return status;
    }
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
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">פרטי יחידה</p>
          <h1 className="text-3xl font-bold">יחידה {unit.number || unit.id}</h1>
          <p className="text-sm text-muted-foreground">{unit.buildingName}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/units/${unit.id}/edit`} className="flex items-center gap-2">
              <Edit className="h-4 w-4" /> ערוך
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/buildings/${unit.buildingId}`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> חזרה לבניין
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Residents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              דיירים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unit.residents && unit.residents.length > 0 ? (
              <div className="space-y-3">
                {unit.residents.map((resident) => (
                  <div key={resident.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{resident.name}</div>
                      {resident.email && (
                        <div className="text-sm text-muted-foreground">{resident.email}</div>
                      )}
                      {resident.phone && (
                        <div className="text-sm text-muted-foreground">{resident.phone}</div>
                      )}
                    </div>
                    {resident.role && (
                      <Badge variant="outline">{resident.role}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">אין דיירים רשומים</p>
                <Button size="sm">
                  <Plus className="me-2 h-4 w-4" />
                  הוסף דייר
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              נכסים ביחידה
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unit.assets && unit.assets.length > 0 ? (
              <div className="space-y-3">
                {unit.assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-sm text-muted-foreground">{asset.category}</div>
                      {asset.location && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {asset.location}
                        </div>
                      )}
                    </div>
                    <Badge variant={getStatusColor(asset.status)}>
                      {getStatusLabel(asset.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">אין נכסים ביחידה</p>
                <Button size="sm">
                  <Plus className="me-2 h-4 w-4" />
                  הוסף נכס
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unit Information */}
      <Card>
        <CardHeader>
          <CardTitle>מידע על היחידה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="text-xs font-medium text-foreground">מספר יחידה</p>
              <p className="text-lg font-semibold text-foreground">
                {unit.number || unit.id}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="text-xs font-medium text-foreground">בניין</p>
              <p className="text-lg font-semibold text-foreground">
                {unit.buildingName || 'לא ידוע'}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="text-xs font-medium text-foreground">מספר דיירים</p>
              <p className="text-lg font-semibold text-foreground">
                {unit.residents?.length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
