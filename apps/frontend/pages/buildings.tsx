// /Users/orperetz/Documents/AMS/apps/frontend/pages/buildings.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Plus, 
  Eye, 
  Edit, 
  Building, 
  Home, 
  Users, 
  MapPin,
  MoreHorizontal,
  RefreshCw,
  Filter,
  Building2
} from 'lucide-react';
import { authFetch } from '../lib/auth';
import { DataTable } from '../components/ui/data-table';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { KpiCard } from '../components/ui/kpi-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Skeleton, SkeletonCard, SkeletonTable } from '../components/ui/skeleton';
import { EmptyBuildings } from '../components/ui/empty-state';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { cn, formatNumber } from '../lib/utils';
import { toast } from '../components/ui/use-toast';
import { useRouter } from 'next/router';

interface Building {
  id: number;
  name: string;
  address?: string;
  totalUnits?: number;
  occupiedUnits?: number;
  manager?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  createdAt?: string;
  lastInspection?: string;
}

const statusConfig = {
  ACTIVE: { label: 'פעיל', variant: 'success' as const },
  MAINTENANCE: { label: 'תחזוקה', variant: 'warning' as const },
  INACTIVE: { label: 'לא פעיל', variant: 'outline' as const },
};

export default function Buildings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const router = useRouter();

  const loadBuildings = async () => {
    try {
      const res = await authFetch('/api/v1/buildings');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
          ? (data as any).items
          : [];
        setBuildings(list);
      } else {
        // Mock data for demo
        setBuildings([
          {
            id: 1,
            name: 'אפרים קישון 5, הרצליה',
            address: 'אפרים קישון 5, הרצליה',
            totalUnits: 24,
            occupiedUnits: 22,
            manager: 'דני לוי',
            status: 'ACTIVE',
            createdAt: '2024-01-15T10:30:00Z',
            lastInspection: '2024-01-10T14:20:00Z'
          },
          {
            id: 2,
            name: 'אמה סאבר 9, הרצליה',
            address: 'אמה סאבר 9, הרצליה',
            totalUnits: 18,
            occupiedUnits: 16,
            manager: 'רינה כהן',
            status: 'ACTIVE',
            createdAt: '2024-01-12T09:15:00Z',
            lastInspection: '2024-01-08T16:45:00Z'
          },
          {
            id: 3,
            name: 'דוד שמעוני 12, הרצליה',
            address: 'דוד שמעוני 12, הרצליה',
            totalUnits: 30,
            occupiedUnits: 28,
            manager: 'יוסי דוד',
            status: 'MAINTENANCE',
            createdAt: '2024-01-08T11:30:00Z',
            lastInspection: '2024-01-05T10:20:00Z'
          },
          {
            id: 4,
            name: 'דליה רביקוביץ 7, הרצליה',
            address: 'דליה רביקוביץ 7, הרצליה',
            totalUnits: 16,
            occupiedUnits: 15,
            manager: 'שרה אברהם',
            status: 'ACTIVE',
            createdAt: '2024-01-03T14:45:00Z',
            lastInspection: '2024-01-02T09:30:00Z'
          }
        ]);
      }
    } catch (error: any) {
      toast({
        title: "שגיאה בטעינת בניינים",
        description: error?.message || "לא ניתן לטעון את רשימת הבניינים",
        variant: "destructive",
      });
      // Still show mock data for demo
      setBuildings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBuildings();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadBuildings();
  };

  const handleViewBuilding = (building: Building) => {
    router.push(`/buildings/${building.id}`);
  };

  const handleEditBuilding = (building: Building) => {
    router.push(`/buildings/${building.id}/edit`);
  };

  const handleCreateBuilding = () => {
    router.push('/buildings/new');
  };

  const filteredBuildings = useMemo(() => {
    const term = search.trim().toLowerCase();
    return buildings.filter(building => {
      const statusMatch = statusFilter === 'all' || building.status === statusFilter;
      const searchMatch = !term ||
        building.name?.toLowerCase().includes(term) ||
        building.address?.toLowerCase().includes(term);
      return statusMatch && searchMatch;
    });
  }, [buildings, statusFilter, search]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalBuildings = buildings.length;
    const totalUnits = buildings.reduce((sum, b) => sum + (b.totalUnits || 0), 0);
    const occupiedUnits = buildings.reduce((sum, b) => sum + (b.occupiedUnits || 0), 0);
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    const activeBuildings = buildings.filter(b => b.status === 'ACTIVE').length;

    return {
      totalBuildings,
      activeBuildings,
      totalUnits,
      occupancyRate
    };
  }, [buildings]);

  const columns: ColumnDef<Building>[] = [
    {
      accessorKey: "id",
      header: "מס׳ בניין",
      cell: ({ row }) => (
        <div className="font-medium">#{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "שם הבניין",
      cell: ({ row }) => {
        const building = row.original;
        return (
          <div className="max-w-[250px]">
            <div className="font-medium truncate">
              {building.name}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {building.address || 'ללא כתובת'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "סטטוס",
      cell: ({ row }) => {
        const rawStatus = row.getValue("status");
        const status = rawStatus as keyof typeof statusConfig;
        const config = statusConfig[status] ?? { label: String(rawStatus ?? 'לא ידוע'), variant: 'outline' as const };
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "totalUnits",
      header: "יחידות",
      cell: ({ row }) => {
        const building = row.original;
        const occupancyRate = building.totalUnits && building.occupiedUnits 
          ? Math.round((building.occupiedUnits / building.totalUnits) * 100)
          : 0;
        
        return (
          <div className="text-center">
            <div className="font-medium">
              {building.occupiedUnits || 0}/{building.totalUnits || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {occupancyRate}% תפוסה
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "manager",
      header: "מנהל בניין",
      cell: ({ row }) => {
        const manager = row.getValue("manager") as string;
        return manager ? (
          <div className="text-sm">{manager}</div>
        ) : (
          <Badge variant="outline">לא הוקצה</Badge>
        );
      },
    },
    {
      accessorKey: "lastInspection",
      header: "בדיקה אחרונה",
      cell: ({ row }) => {
        const lastInspection = row.getValue("lastInspection") as string;
        if (!lastInspection) {
          return <Badge variant="warning">לא בוצעה</Badge>;
        }
        const date = new Date(lastInspection);
        return (
          <div className="text-sm">
            {date.toLocaleDateString('he-IL')}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const building = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">פתח תפריט</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>פעולות</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewBuilding(building)}>
                <Eye className="me-2 h-4 w-4" />
                צפה בפרטים
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditBuilding(building)}>
                <Edit className="me-2 h-4 w-4" />
                ערוך בניין
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                if (!confirm('למחוק את הבניין? פעולה זו בלתי הפיכה.')) return;
                try {
                  const res = await authFetch(`/api/v1/buildings/${building.id}`, { method: 'DELETE' });
                  if (!res.ok) throw new Error('מחיקה נכשלה');
                  toast({ title: 'הבניין נמחק' });
                  loadBuildings();
                } catch (e: any) {
                  toast({ title: 'שגיאה במחיקה', description: e?.message, variant: 'destructive' });
                }
              }}>
                <MoreHorizontal className="me-2 h-4 w-4" />
                מחק בניין
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Users className="me-2 h-4 w-4" />
                נהל דיירים
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ניהול בניינים</h1>
          <p className="text-muted-foreground">
            ניהול רכוש והתחזוקה של הבניינים במערכת
          </p>
        </div>
        
        <div className="page-header-actions">
          <div className="relative w-full sm:w-auto">
            <Input
              placeholder="חיפוש בניינים..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-[220px]"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="shrink-0"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button onClick={handleCreateBuilding} className="w-full sm:w-auto">
            <Plus className="me-2 h-4 w-4" />
            בניין חדש
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="page-kpi-grid">
        <KpiCard
          title="סה״כ בניינים"
          value={formatNumber(kpis.totalBuildings)}
          icon={Building2}
          description="בניינים במערכת"
          clickable
        />
        
        <KpiCard
          title="בניינים פעילים"
          value={formatNumber(kpis.activeBuildings)}
          icon={Building}
          badgeText={kpis.activeBuildings === kpis.totalBuildings ? "מעולה" : "תקין"}
          badgeVariant={kpis.activeBuildings === kpis.totalBuildings ? "success" : "info"}
          changeType="positive"
          clickable
        />
        
        <KpiCard
          title="סה״כ יחידות"
          value={formatNumber(kpis.totalUnits)}
          icon={Home}
          description="יחידות דיור במערכת"
          clickable
        />

        <KpiCard
          title="אחוז תפוסה"
          value={`${kpis.occupancyRate}%`}
          icon={Users}
          badgeText={kpis.occupancyRate > 85 ? "גבוה" : kpis.occupancyRate > 70 ? "תקין" : "נמוך"}
          badgeVariant={kpis.occupancyRate > 85 ? "success" : kpis.occupancyRate > 70 ? "info" : "warning"}
          changeType={kpis.occupancyRate > 85 ? "positive" : kpis.occupancyRate > 70 ? "neutral" : "negative"}
          clickable
        />
      </div>

      {/* Filters */}
      <div className="page-filter-bar rounded-xl border bg-card p-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">סינון:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="ACTIVE">פעיל</SelectItem>
            <SelectItem value="MAINTENANCE">תחזוקה</SelectItem>
            <SelectItem value="INACTIVE">לא פעיל</SelectItem>
          </SelectContent>
        </Select>

        {statusFilter !== 'all' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="w-full sm:w-auto"
          >
            נקה סינונים
          </Button>
        )}
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredBuildings}
            searchPlaceholder="חיפוש בניינים..."
            onRowClick={handleViewBuilding}
            mobileCardRender={(building) => {
              const status = building.status as keyof typeof statusConfig;
              const config = statusConfig[status] ?? { label: String(building.status ?? 'לא ידוע'), variant: 'outline' as const };
              const occupancyRate = building.totalUnits && building.occupiedUnits
                ? Math.round((building.occupiedUnits / building.totalUnits) * 100)
                : 0;

              return (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">#{building.id} · {building.name}</div>
                      <div className="text-sm text-muted-foreground">{building.address || 'ללא כתובת'}</div>
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">יחידות</div>
                      <div className="font-medium">{building.occupiedUnits || 0}/{building.totalUnits || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">תפוסה</div>
                      <div className="font-medium">{occupancyRate}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">מנהל</div>
                      <div className="font-medium">{building.manager || 'לא הוקצה'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">בדיקה אחרונה</div>
                      <div className="font-medium">{building.lastInspection ? new Date(building.lastInspection).toLocaleDateString('he-IL') : 'לא בוצעה'}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={(event) => { event.stopPropagation(); handleViewBuilding(building); }}>צפה</Button>
                    <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); handleEditBuilding(building); }}>ערוך</Button>
                  </div>
                </div>
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
