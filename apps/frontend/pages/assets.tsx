import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Box,
  Building,
  Calendar,
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
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetCardView[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBuilding, setFilterBuilding] = useState('all');

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
      const res = await authFetch('/api/v1/assets');
      if (!res.ok) {
        throw new Error('Failed to load assets');
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAssets(list.map(mapAssetRecord));
    } catch (error: any) {
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
    };
  };

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ציוד ונכסים</h1>
          <p className="text-muted-foreground">ניהול ציוד ונכסים בבניינים</p>
        </div>

        <Button asChild>
          <Link href="/assets/new">
            <Plus className="me-2 h-4 w-4" />
            הוסף נכס
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>סינון וחיפוש</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="חיפוש נכסים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48">
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
              <SelectTrigger className="w-full sm:w-48">
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
              <SelectTrigger className="w-full sm:w-56">
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
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssets.map((asset) => (
          <Card key={asset.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-sm font-medium line-clamp-1">{asset.name}</CardTitle>
                    <div className="text-xs text-muted-foreground">{getCategoryLabel(asset.category)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">{getStatusIcon(asset.status)}</div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusColor(asset.status)}>{getStatusLabel(asset.status)}</Badge>
                  {isMaintenanceDue(asset.nextMaintenance) && <Badge variant="warning">תחזוקה קרובה</Badge>}
                </div>

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

                  {asset.location && (
                    <div className="text-xs">
                      מיקום: {asset.location}
                    </div>
                  )}

                  {asset.nextMaintenance && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>תחזוקה הבאה: {new Date(asset.nextMaintenance).toLocaleDateString('he-IL')}</span>
                    </div>
                  )}
                </div>
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

      {filteredAssets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Box className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">אין נכסים</h3>
            <p className="mb-4 text-center text-muted-foreground">
              לא נמצאו נכסים התואמים לקריטריונים שלך
            </p>
            <Button asChild>
              <Link href="/assets/new">
                <Plus className="me-2 h-4 w-4" />
                הוסף נכס ראשון
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
