import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { authFetch } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';

type Unit = {
  id: number;
  number?: string;
};

type Building = {
  id: number;
  name: string;
  address?: string;
  totalUnits?: number;
  floors?: number;
  yearBuilt?: number;
};

type BuildingDetails = {
  id: number;
  name: string;
  address?: string;
  totalUnits?: number;
  floors?: number;
  yearBuilt?: number;
  units?: Unit[];
  assets?: { id: number; name: string }[];
  documents?: { id: number; title?: string }[];
};

export default function BuildingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState<Building | null>(null);
  const [details, setDetails] = useState<BuildingDetails | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [bRes, dRes, unitsRes] = await Promise.all([
          authFetch(`/api/v1/buildings/${id}`),
          authFetch(`/api/v1/buildings/${id}/details`),
          authFetch(`/api/v1/units?buildingId=${id}`),
        ]);
        if (bRes.ok) setBuilding(await bRes.json());
        if (dRes.ok) setDetails(await dRes.json());
        if (unitsRes.ok) {
          const unitsData = await unitsRes.json();
          setDetails(prev => prev ? { ...prev, units: unitsData } : null);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!building) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">הבניין לא נמצא.</p>
        <Button asChild variant="outline">
          <Link href="/buildings">חזרה לרשימה</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">פרטי בניין</p>
          <h1 className="text-3xl font-bold">{building.name}</h1>
          <p className="text-sm text-muted-foreground">{building.address}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/buildings/${building.id}/edit`}>ערוך</Link>
          </Button>
          <Button asChild>
            <Link href="/buildings">חזרה</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">נתוני מבנה</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <div>מספר קומות: {building.floors ?? '—'}</div>
            <div>סה"כ יחידות: {building.totalUnits ?? details?.units?.length ?? '—'}</div>
            <div>שנת בנייה: {building.yearBuilt ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">נכסים</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {details?.assets?.length ? (
              <div className="flex flex-wrap gap-2">
                {details.assets.map((a) => (
                  <Badge key={a.id} variant="outline">{a.name}</Badge>
                ))}
              </div>
            ) : (
              <span>אין נכסים</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">מסמכים</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {details?.documents?.length ? (
              <div className="space-y-1">
                {details.documents.map((d) => (
                  <div key={d.id}>• {d.title ?? `מסמך #${d.id}`}</div>
                ))}
              </div>
            ) : (
              <span>אין מסמכים</span>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">יחידות בבניין</CardTitle>
        </CardHeader>
        <CardContent>
          {details?.units?.length ? (
            <div className="grid gap-2 md:grid-cols-3">
              {details.units.map((u) => (
                <Link key={u.id} href={`/units/${u.id}`}>
                  <div className="rounded border p-3 text-sm hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="font-medium">יחידה {u.number ?? u.id}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      לחץ לפרטים נוספים
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">אין יחידות להצגה.</p>
              <Button size="sm">
                הוסף יחידה
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


