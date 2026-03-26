import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Box,
  Building,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { authFetch } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from '../components/ui/use-toast';
import {
  CompactContextHeader,
  ConsistencyStateBlock,
  FilterActionBar,
  ListItemMetaRow,
} from '../components/ui/mobile-page-cleanup-kit';

interface BuildingOption {
  id: number;
  name: string;
}

interface AssetApiRecord {
  id: number;
  name: string;
  category: string;
  status?: string | null;
  location?: string | null;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
  value?: number | null;
  description?: string | null;
  buildingId: number;
  unitId?: number | null;
  building?: { id: number; name: string } | null;
  unit?: { id: number; number?: string | null } | null;
  maintenanceSchedules?: Array<{ nextOccurrence?: string | null; startDate?: string | null }>;
  replacementRecommended?: boolean;
  nextInventoryCheck?: string | null;
  lastInventoryCheck?: string | null;
}

interface AssetCardView {
  id: number;
  name: string;
  category: string;
  status: string;
  location: string;
  buildingId: number;
  buildingName: string;
  unitId?: number;
  unitNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  nextMaintenance?: string;
  value: number;
  description?: string;
  replacementRecommended: boolean;
  nextInventoryCheck?: string;
  lastInventoryCheck?: string;
}

interface LifecycleSummaryResponse {
  summary: {
    totalAssets: number;
    expiringWarranty: number;
    expiredWarranty: number;
    replacementRecommended: number;
    overdueInventoryChecks: number;
    totalMaintenanceCost: number;
  };
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetCardView[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [lifecycle, setLifecycle] = useState<LifecycleSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBuilding, setFilterBuilding] = useState('all');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    void loadBuildings();
    void loadAssets();
  }, []);

  const loadBuildings = async () => {
    try {
      const res = await authFetch('/api/v1/buildings');
      if (!res.ok) {
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setBuildings(list.map((building) => ({ id: building.id, name: building.name })));
    } catch {
      setBuildings([]);
    }
  };

  const loadAssets = async () => {
    try {
      setLoadError(false);
      const res = await authFetch('/api/v1/assets');
      if (!res.ok) {
        throw new Error('Failed to load assets');
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAssets(list.map(mapAssetRecord));
    } catch (error: any) {
      setLoadError(true);
      toast({
        title: 'שגיאה בטעינת נכסים',
        description: error?.message || 'לא ניתן לטעון את רשימת הנכסים',
        variant: 'destructive',
      });
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLifecycle = async (buildingId?: string) => {
    try {
      const suffix = buildingId && buildingId !== 'all' ? `?buildingId=${buildingId}` : '';
      const res = await authFetch(`/api/v1/assets/lifecycle/summary${suffix}`);
      setLifecycle(res.ok ? await res.json() : null);
    } catch {
      setLifecycle(null);
    }
  };

  const mapAssetRecord = (asset: AssetApiRecord): AssetCardView => {
    const nextMaintenance = asset.maintenanceSchedules?.find(
      (schedule) => schedule.nextOccurrence || schedule.startDate,
    );

    return {
      id: asset.id,
      name: asset.name,
      category: asset.category,
      status: asset.status ?? 'ACTIVE',
      location: asset.location ?? '',
      buildingId: asset.buildingId,
      buildingName: asset.building?.name ?? `בניין #${asset.buildingId}`,
      unitId: asset.unitId ?? asset.unit?.id ?? undefined,
      unitNumber: asset.unit?.number ?? undefined,
      purchaseDate: asset.purchaseDate ?? undefined,
      warrantyExpiry: asset.warrantyExpiry ?? undefined,
      nextMaintenance: nextMaintenance?.nextOccurrence ?? nextMaintenance?.startDate ?? undefined,
      value: asset.value ?? 0,
      description: asset.description ?? undefined,
      replacementRecommended: asset.replacementRecommended ?? false,
      nextInventoryCheck: asset.nextInventoryCheck ?? undefined,
      lastInventoryCheck: asset.lastInventoryCheck ?? undefined,
    };
  };

  useEffect(() => {
    void loadLifecycle(filterBuilding);
  }, [filterBuilding]);

  const filteredAssets = assets.filter((asset) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      asset.name.toLowerCase().includes(term) ||
      asset.buildingName.toLowerCase().includes(term) ||
      asset.location.toLowerCase().includes(term) ||
      (asset.unitNumber ?? '').toLowerCase().includes(term);

    const matchesCategory = filterCategory === 'all' || asset.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
    const matchesBuilding =
      filterBuilding === 'all' || asset.buildingId === Number(filterBuilding);

    return matchesSearch && matchesCategory && matchesStatus && matchesBuilding;
  });

  const getStatusColor = (status: string) => {
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
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'MAINTENANCE':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'OUT_OF_ORDER':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'RETIRED':
        return <Box className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'HVAC':
        return 'מיזוג אוויר';
      case 'ELEVATORS':
      case 'ELEVATOR':
        return 'מעלית';
      case 'PLUMBING':
        return 'אינסטלציה';
      case 'ELECTRICAL':
        return 'חשמל';
      case 'SAFETY':
      case 'SECURITY':
        return 'אבטחה';
      case 'LANDSCAPING':
        return 'גינון';
      case 'GENERAL':
      case 'OTHER':
        return 'כללי';
      default:
        return category;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'פעיל';
      case 'MAINTENANCE':
        return 'בתחזוקה';
      case 'OUT_OF_ORDER':
        return 'מקולקל';
      case 'RETIRED':
        return 'יצא משימוש';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);

  const isMaintenanceDue = (nextMaintenance?: string) => {
    if (!nextMaintenance) return false;
    const nextDate = new Date(nextMaintenance);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CompactContextHeader
        title="ציוד ונכסים"
        description="ניהול ציוד ונכסים בבניינים עם מעקב אחר אחריות ותחזוקה."
        context="נכסים"
        chips={['חיפוש מהיר', 'סינון אחיד', 'פעולות מיידיות']}
        actions={
          <Button asChild>
            <Link href="/assets/new">
              <Plus className="me-2 h-4 w-4" />
              הוסף נכס
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>סינון וחיפוש</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterActionBar className="sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="חיפוש נכסים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                <SelectItem value="GENERAL">כללי</SelectItem>
                <SelectItem value="HVAC">מיזוג אוויר</SelectItem>
                <SelectItem value="ELECTRICAL">חשמל</SelectItem>
                <SelectItem value="PLUMBING">אינסטלציה</SelectItem>
                <SelectItem value="SAFETY">אבטחה</SelectItem>
                <SelectItem value="LANDSCAPING">גינון</SelectItem>
                <SelectItem value="ELEVATORS">מעליות</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="ACTIVE">פעיל</SelectItem>
                <SelectItem value="MAINTENANCE">בתחזוקה</SelectItem>
                <SelectItem value="OUT_OF_ORDER">מקולקל</SelectItem>
                <SelectItem value="RETIRED">יצא משימוש</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBuilding} onValueChange={setFilterBuilding}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="בניין" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הבניינים</SelectItem>
                {buildings.map((building) => (
                  <SelectItem key={building.id} value={String(building.id)}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterActionBar>
        </CardContent>
      </Card>

      <ConsistencyStateBlock
        state={loadError ? 'error' : !filteredAssets.length ? 'empty' : 'ready'}
        emptyTitle="אין נכסים להצגה"
        emptyDescription="לא נמצאו נכסים התואמים למסננים שנבחרו."
        onRetry={loadAssets}
      >
        {lifecycle && (
          <div className="grid gap-4 md:grid-cols-5">
            <Card><CardHeader><CardTitle>נכסים</CardTitle></CardHeader><CardContent>{lifecycle.summary.totalAssets}</CardContent></Card>
            <Card><CardHeader><CardTitle>אחריות קרובה</CardTitle></CardHeader><CardContent>{lifecycle.summary.expiringWarranty}</CardContent></Card>
            <Card><CardHeader><CardTitle>אחריות שפגה</CardTitle></CardHeader><CardContent>{lifecycle.summary.expiredWarranty}</CardContent></Card>
            <Card><CardHeader><CardTitle>החלפה מומלצת</CardTitle></CardHeader><CardContent>{lifecycle.summary.replacementRecommended}</CardContent></Card>
            <Card><CardHeader><CardTitle>ספירת מלאי באיחור</CardTitle></CardHeader><CardContent>{lifecycle.summary.overdueInventoryChecks}</CardContent></Card>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="line-clamp-1 text-sm font-medium">{asset.name}</CardTitle>
                      <div className="text-xs text-muted-foreground">{getCategoryLabel(asset.category)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">{getStatusIcon(asset.status)}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusColor(asset.status)}>{getStatusLabel(asset.status)}</Badge>
                  {isMaintenanceDue(asset.nextMaintenance) && <Badge variant="warning">תחזוקה קרובה</Badge>}
                </div>
                <ListItemMetaRow
                  status={getStatusLabel(asset.status)}
                  urgency={isMaintenanceDue(asset.nextMaintenance) ? 'גבוהה' : 'רגילה'}
                  owner={asset.buildingName}
                  dueLabel={
                    asset.nextMaintenance
                      ? `יעד תחזוקה: ${new Date(asset.nextMaintenance).toLocaleDateString('he-IL')}`
                      : 'יעד תחזוקה: ללא'
                  }
                />
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3" />
                    <span>{asset.buildingName}</span>
                    {asset.unitNumber && <span>יחידה {asset.unitNumber}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatCurrency(asset.value)}</span>
                  </div>
                  {asset.location && <div className="text-xs">מיקום: {asset.location}</div>}
                  {asset.replacementRecommended && <Badge variant="destructive">החלפה מומלצת</Badge>}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/assets/${asset.id}/edit`}>ערוך</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/assets/${asset.id}`}>צפה</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ConsistencyStateBlock>
    </div>
  );
}
