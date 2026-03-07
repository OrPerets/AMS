import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { authFetch } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Plus } from 'lucide-react';
import BuildingCodesTable from '../../components/buildings/BuildingCodesTable';
import AddCodeDialog from '../../components/buildings/AddCodeDialog';
import EditCodeDialog from '../../components/buildings/EditCodeDialog';
import { toast } from 'sonner';

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

type BuildingCode = {
  id: number;
  codeType: string;
  code: string;
  description?: string;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  createdAt: string;
  creator?: {
    id: number;
    email: string;
  };
};

export default function BuildingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState<Building | null>(null);
  const [details, setDetails] = useState<BuildingDetails | null>(null);
  const [codes, setCodes] = useState<BuildingCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [addCodeOpen, setAddCodeOpen] = useState(false);
  const [editCodeOpen, setEditCodeOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<BuildingCode | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [bRes, dRes, unitsRes] = await Promise.all([
          authFetch(`/api/v1/buildings/${id}`),
          authFetch(`/api/v1/buildings/${id}/details`),
          authFetch(`/api/v1/units?buildingId=${id}`),
        ]);
        let buildingRecord: Building | null = null;
        let detailsRecord: BuildingDetails | null = null;

        if (bRes.ok) {
          buildingRecord = await bRes.json();
          setBuilding(buildingRecord);
        }
        if (dRes.ok) {
          detailsRecord = await dRes.json();
          setDetails(detailsRecord);
        }
        if (unitsRes.ok) {
          const unitsData = await unitsRes.json();
          setDetails((prev) =>
            prev
              ? { ...prev, units: unitsData }
              : {
                  id: buildingRecord?.id ?? Number(id),
                  name: buildingRecord?.name ?? '',
                  address: buildingRecord?.address,
                  units: unitsData,
                  assets: detailsRecord?.assets ?? [],
                  documents: detailsRecord?.documents ?? [],
                },
          );
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  const loadCodes = async () => {
    if (!id) return;
    setCodesLoading(true);
    try {
      const res = await authFetch(`/api/v1/buildings/${id}/codes`);
      if (res.ok) {
        const data = await res.json();
        setCodes(data);
      }
    } catch (error) {
      console.error('Error loading codes:', error);
      toast.error('שגיאה בטעינת קודים');
    } finally {
      setCodesLoading(false);
    }
  };

  const handleDeleteCode = async (codeId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הקוד?')) return;

    try {
      const res = await authFetch(
        `/api/v1/buildings/codes/${codeId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        toast.success('הקוד נמחק בהצלחה');
        loadCodes();
      } else {
        throw new Error('Failed to delete code');
      }
    } catch (error) {
      console.error('Error deleting code:', error);
      toast.error('שגיאה במחיקת הקוד');
    }
  };

  const handleEditCode = (code: BuildingCode) => {
    setSelectedCode(code);
    setEditCodeOpen(true);
  };

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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">סקירה</TabsTrigger>
          <TabsTrigger value="codes" onClick={() => loadCodes()}>
            קודי גישה
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
              <Button size="sm" asChild>
                <Link href={`/units/new?buildingId=${building.id}`}>הוסף יחידה</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="codes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>קודי גישה ובניין</CardTitle>
                <Button onClick={() => setAddCodeOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  הוסף קוד
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {codesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <BuildingCodesTable
                  codes={codes}
                  onEdit={handleEditCode}
                  onDelete={handleDeleteCode}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddCodeDialog
        open={addCodeOpen}
        onOpenChange={setAddCodeOpen}
        buildingId={Number(id)}
        onSuccess={loadCodes}
      />

      <EditCodeDialog
        open={editCodeOpen}
        onOpenChange={setEditCodeOpen}
        code={selectedCode}
        onSuccess={loadCodes}
      />
    </div>
  );
}

