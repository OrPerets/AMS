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
  MoreHorizontal,
  RefreshCw,
  Building2
} from 'lucide-react';
import { authFetch } from '../lib/auth';
import { DataTable } from '../components/ui/data-table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AmsDrawer } from '../components/ui/ams-drawer';
import { AmsFilterTabs } from '../components/ui/ams-filter-tabs';
import { AmsMetricProgress } from '../components/ui/ams-metric-progress';
import { AmsQueryField } from '../components/ui/ams-query-field';
import { KpiCard } from '../components/ui/kpi-card';
import { MobileContextBar } from '../components/ui/mobile-context-bar';
import { MobilePriorityInbox } from '../components/ui/mobile-priority-inbox';
import { SectionHeader } from '../components/ui/section-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Skeleton } from '../components/ui/skeleton';
import { InlineErrorPanel } from '../components/ui/inline-feedback';
import { cn, formatNumber } from '../lib/utils';
import { toast } from '../components/ui/use-toast';
import { useRouter } from 'next/router';
import { useLocale } from '../lib/providers';

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

interface BuildingOverview {
  building: Building;
  metrics: {
    totalUnits: number;
    openTickets: number;
    activeMaintenanceSchedules: number;
    assetCount: number;
    activeContracts: number;
  };
  financial: {
    planned: number;
    actual: number;
    variance: number;
  };
  upcomingMaintenance: Array<{
    id: number;
    title: string;
    nextOccurrence?: string | null;
    priority?: string | null;
  }>;
}

const statusConfig = {
  ACTIVE: { label: 'פעיל', variant: 'success' as const },
  MAINTENANCE: { label: 'תחזוקה', variant: 'warning' as const },
  INACTIVE: { label: 'לא פעיל', variant: 'outline' as const },
};

export default function Buildings() {
  const { t } = useLocale();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [selectedOverview, setSelectedOverview] = useState<BuildingOverview | null>(null);
  const [previewBuildingId, setPreviewBuildingId] = useState<number | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const router = useRouter();

  const loadBuildings = async () => {
    setError(null);
    if (!buildings.length) {
      setLoading(true);
    }

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
        setSelectedBuildingId((current) => current ?? list[0]?.id ?? null);
      } else {
        // Mock data for demo
        const fallback: Building[] = [
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
        ];
        setBuildings(fallback);
        setSelectedBuildingId((current) => current ?? fallback[0]?.id ?? null);
      }
    } catch (error: any) {
      const message = error?.message || "לא ניתן לטעון את רשימת הבניינים";
      setError(message);
      toast({
        title: "שגיאה בטעינת בניינים",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    if (!selectedBuildingId) {
      setSelectedOverview(null);
      return;
    }

    const loadOverview = async () => {
      try {
        setOverviewLoading(true);
        const response = await authFetch(`/api/v1/buildings/${selectedBuildingId}/overview`);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        setSelectedOverview((await response.json()) as BuildingOverview);
      } catch {
        setSelectedOverview(null);
      } finally {
        setOverviewLoading(false);
      }
    };

    void loadOverview();
  }, [selectedBuildingId]);

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
  const previewBuilding = useMemo(
    () => buildings.find((building) => building.id === previewBuildingId) ?? null,
    [buildings, previewBuildingId],
  );

  useEffect(() => {
    if (!filteredBuildings.length) {
      setSelectedBuildingId(null);
      setSelectedOverview(null);
      return;
    }

    const stillVisible = filteredBuildings.some((building) => building.id === selectedBuildingId);
    if (!stillVisible) {
      setSelectedBuildingId(filteredBuildings[0].id);
    }
  }, [filteredBuildings, selectedBuildingId]);

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
  const filterCounts = useMemo(
    () => ({
      all: buildings.length,
      ACTIVE: buildings.filter((building) => building.status === 'ACTIVE').length,
      MAINTENANCE: buildings.filter((building) => building.status === 'MAINTENANCE').length,
      INACTIVE: buildings.filter((building) => building.status === 'INACTIVE').length,
    }),
    [buildings],
  );

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

  if (error && !buildings.length) {
    return (
      <InlineErrorPanel
        title="רשימת הבניינים לא נטענה"
        description={error}
        onRetry={() => void loadBuildings()}
      />
    );
  }

  const selectedBuilding = filteredBuildings.find((building) => building.id === selectedBuildingId) ?? null;
  const rankedBuildings = [...filteredBuildings]
    .sort((left, right) => {
      const leftOccupancy = left.totalUnits && left.occupiedUnits ? left.occupiedUnits / left.totalUnits : 0;
      const rightOccupancy = right.totalUnits && right.occupiedUnits ? right.occupiedUnits / right.totalUnits : 0;
      const leftRisk = (left.status === 'MAINTENANCE' ? 2 : left.status === 'INACTIVE' ? 3 : 0) + (1 - leftOccupancy);
      const rightRisk = (right.status === 'MAINTENANCE' ? 2 : right.status === 'INACTIVE' ? 3 : 0) + (1 - rightOccupancy);
      return rightRisk - leftRisk;
    })
    .slice(0, 3);
  const priorityItems = rankedBuildings.map((building) => {
    const occupancyRate = building.totalUnits && building.occupiedUnits ? Math.round((building.occupiedUnits / building.totalUnits) * 100) : 0;
    const reasons = [
      building.status === 'MAINTENANCE' ? t('buildings.priority.maintenanceStatus') : null,
      building.status === 'INACTIVE' ? t('buildings.priority.inactiveBuilding') : null,
      occupancyRate < 85 ? t('buildings.priority.vacancy', { value: 100 - occupancyRate }) : null,
      !building.lastInspection ? t('buildings.priority.missingInspection') : null,
    ].filter(Boolean);

    return {
      id: `building-${building.id}`,
      status: building.status === 'ACTIVE' ? t('buildings.priority.inProgress') : t('buildings.priority.atRisk'),
      tone: building.status === 'ACTIVE' ? 'active' as const : 'warning' as const,
      title: building.name,
      reason: reasons.length ? t('buildings.priority.reasonPrefix', { value: reasons.join(', ') }) : t('buildings.priority.healthyReason'),
      meta: t('buildings.priority.occupiedMeta', { occupied: building.occupiedUnits || 0, total: building.totalUnits || 0 }),
      href: `/buildings/${building.id}`,
      ctaLabel: t('buildings.priority.openBuilding'),
    };
  });

  return (
    <div className="space-y-6">
      {error ? (
        <InlineErrorPanel
          className="mb-2"
          title="הנתונים חלקיים"
          description={error}
          onRetry={() => void loadBuildings()}
        />
      ) : null}
      <MobileContextBar
        roleLabel={t('buildings.mobile.roleLabel')}
        contextLabel={selectedBuilding ? selectedBuilding.name : t('buildings.mobile.portfolioOverview')}
        syncLabel={t('buildings.mobile.syncedLabel')}
        lastUpdated={new Date().toLocaleDateString('he-IL')}
        chips={[t('buildings.mobile.totalBuildings', { count: kpis.totalBuildings }), t('buildings.mobile.occupancy', { value: kpis.occupancyRate })]}
      />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ניהול בניינים</h1>
          <p className="text-muted-foreground">
            ניהול רכוש והתחזוקה של הבניינים במערכת
          </p>
        </div>
        
        <div className="page-header-actions">
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

      <MobilePriorityInbox
        title={t('buildings.mobile.priorityTitle')}
        subtitle={t('buildings.mobile.prioritySubtitle')}
        items={priorityItems}
      />

      <div className="grid grid-cols-2 gap-2 md:hidden">
        <AmsMetricProgress
          label="תפוסה"
          value={`${kpis.occupancyRate}%`}
          progress={kpis.occupancyRate}
          hint={`${kpis.totalUnits} יחידות פעילות`}
          tone={kpis.occupancyRate > 85 ? 'success' : kpis.occupancyRate > 70 ? 'warning' : 'danger'}
        />
        <AmsMetricProgress
          label="בניינים פעילים"
          value={formatNumber(kpis.activeBuildings)}
          progress={kpis.totalBuildings ? Math.round((kpis.activeBuildings / kpis.totalBuildings) * 100) : 0}
          hint={`${filterCounts.MAINTENANCE + filterCounts.INACTIVE} דורשים תשומת לב`}
          tone={filterCounts.MAINTENANCE + filterCounts.INACTIVE > 0 ? 'warning' : 'success'}
        />
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
      <div className="sticky top-16 z-10 space-y-3 rounded-[24px] border border-subtle-border bg-card/95 p-3 backdrop-blur">
        <AmsFilterTabs
          ariaLabel="סינון בניינים לפי סטטוס"
          selectedKey={statusFilter}
          onSelectionChange={setStatusFilter}
          items={[
            { key: 'all', label: 'הכל', badge: filterCounts.all },
            { key: 'ACTIVE', label: 'פעיל', badge: filterCounts.ACTIVE },
            { key: 'MAINTENANCE', label: 'תחזוקה', badge: filterCounts.MAINTENANCE },
            { key: 'INACTIVE', label: 'לא פעיל', badge: filterCounts.INACTIVE },
          ]}
        />
        <AmsQueryField
          value={search}
          onChange={setSearch}
          placeholder="חיפוש בניין, כתובת או תיק"
          ariaLabel="חיפוש בניינים"
        />
      </div>

      <Card variant="featured">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <SectionHeader
            title={t('buildings.mobile.actionConsoleTitle')}
            subtitle={t('buildings.mobile.actionConsoleSubtitle')}
            meta={selectedBuilding ? t('buildings.mobile.focusedOn', { name: selectedBuilding.name }) : t('buildings.mobile.selectBuilding')}
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Button className="justify-between" onClick={() => router.push(selectedBuilding ? `/buildings/${selectedBuilding.id}` : '/buildings')}>
              {t('buildings.mobile.openIssues')}
            </Button>
            <Button variant="outline" className="justify-between" onClick={() => router.push('/payments')}>
              {t('buildings.mobile.collectionRisk')}
            </Button>
            <Button variant="outline" className="justify-between" onClick={() => router.push('/maintenance')}>
              {t('buildings.mobile.upcomingMaintenance')}
            </Button>
            <Button variant="outline" className="justify-between" onClick={() => router.push('/tickets')}>
              {t('buildings.mobile.urgentTickets')}
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[20px] border border-subtle-border bg-background/88 p-4">
              <div className="text-xs tracking-[0.16em] text-tertiary">{t('buildings.mobile.switcherTitle')}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {filteredBuildings.slice(0, 6).map((building) => (
                  <Button
                    key={building.id}
                    size="sm"
                    variant={building.id === selectedBuildingId ? 'default' : 'outline'}
                    onClick={() => setSelectedBuildingId(building.id)}
                  >
                    {building.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="rounded-[20px] border border-subtle-border bg-background/88 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-tertiary">Why this building is prioritized</div>
              <div className="mt-2 text-sm text-foreground">
                {selectedBuilding
                  ? `Highest-value next step for ${selectedBuilding.name}: review open issues, confirm collection exposure, and inspect upcoming maintenance from one mobile workflow.`
                  : 'Choose a building to get a ranked explanation and action shortcuts.'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>רשימת בניינים</CardTitle>
            <CardDescription>בחירה מתוך הרשימה מציגה סיכום תפעולי ופיננסי מימין בלי לעזוב את המסך.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={filteredBuildings}
              searchPlaceholder="חיפוש בניינים..."
              onRowClick={(building) => setSelectedBuildingId(building.id)}
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
                    <Button size="sm" variant={selectedBuildingId === building.id ? 'default' : 'outline'} onClick={(event) => { event.stopPropagation(); setSelectedBuildingId(building.id); }}>בחר</Button>
                    <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); setPreviewBuildingId(building.id); }}>תצוגה מהירה</Button>
                    <Button size="sm" onClick={(event) => { event.stopPropagation(); handleViewBuilding(building); }}>צפה</Button>
                    <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); handleEditBuilding(building); }}>ערוך</Button>
                  </div>
                </div>
              );
              }}
            />
          </CardContent>
        </Card>

        <AmsDrawer
          isOpen={Boolean(previewBuilding)}
          onOpenChange={(open) => {
            if (!open) setPreviewBuildingId(null);
          }}
          title={previewBuilding?.name ?? 'תצוגה מהירה'}
          description={previewBuilding?.address || 'ללא כתובת'}
        >
          {previewBuilding ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <AmsMetricProgress
                  label="תפוסה"
                  value={`${previewBuilding.totalUnits && previewBuilding.occupiedUnits ? Math.round((previewBuilding.occupiedUnits / previewBuilding.totalUnits) * 100) : 0}%`}
                  progress={previewBuilding.totalUnits && previewBuilding.occupiedUnits ? Math.round((previewBuilding.occupiedUnits / previewBuilding.totalUnits) * 100) : 0}
                  hint={`${previewBuilding.occupiedUnits || 0}/${previewBuilding.totalUnits || 0} יחידות`}
                  tone={previewBuilding.status === 'INACTIVE' ? 'danger' : previewBuilding.status === 'MAINTENANCE' ? 'warning' : 'success'}
                  variant="dark"
                />
                <AmsMetricProgress
                  label="סטטוס"
                  value={statusConfig[previewBuilding.status as keyof typeof statusConfig]?.label || 'לא ידוע'}
                  progress={previewBuilding.status === 'ACTIVE' ? 92 : previewBuilding.status === 'MAINTENANCE' ? 54 : 18}
                  hint={previewBuilding.manager || 'ללא מנהל מוקצה'}
                  tone={previewBuilding.status === 'ACTIVE' ? 'success' : previewBuilding.status === 'MAINTENANCE' ? 'warning' : 'danger'}
                  variant="dark"
                />
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 text-sm text-white/76">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/52">Summary</div>
                <div className="mt-2 space-y-1">
                  <div>מנהל: {previewBuilding.manager || 'לא הוקצה'}</div>
                  <div>בדיקה אחרונה: {previewBuilding.lastInspection ? new Date(previewBuilding.lastInspection).toLocaleDateString('he-IL') : 'לא בוצעה'}</div>
                  <div>מספר בניין: #{previewBuilding.id}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => { setSelectedBuildingId(previewBuilding.id); setPreviewBuildingId(null); }}>
                  פתח בלוח הצד
                </Button>
                <Button variant="outline" onClick={() => handleViewBuilding(previewBuilding)}>
                  <Eye className="me-2 h-4 w-4" />
                  עמוד מלא
                </Button>
                <Button variant="outline" onClick={() => handleEditBuilding(previewBuilding)}>
                  <Edit className="me-2 h-4 w-4" />
                  ערוך
                </Button>
              </div>
            </div>
          ) : null}
        </AmsDrawer>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>חלונית פרטי בניין</CardTitle>
            <CardDescription>אותו דפוס master-detail של המסך התפעולי, מותאם לניהול בניינים.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedBuilding ? (
              <>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-foreground">{selectedBuilding.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedBuilding.address || 'ללא כתובת'}</div>
                    </div>
                    <Badge variant={statusConfig[selectedBuilding.status as keyof typeof statusConfig]?.variant || 'outline'}>
                      {statusConfig[selectedBuilding.status as keyof typeof statusConfig]?.label || 'לא ידוע'}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handleViewBuilding(selectedBuilding)}>
                      <Eye className="me-2 h-4 w-4" />
                      עמוד מלא
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditBuilding(selectedBuilding)}>
                      <Edit className="me-2 h-4 w-4" />
                      ערוך
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailBox label="יחידות" value={String(selectedOverview?.metrics.totalUnits ?? selectedBuilding.totalUnits ?? 0)} />
                  <DetailBox label="קריאות פתוחות" value={String(selectedOverview?.metrics.openTickets ?? 0)} />
                  <DetailBox label="משימות תחזוקה" value={String(selectedOverview?.metrics.activeMaintenanceSchedules ?? 0)} />
                  <DetailBox label="חוזים פעילים" value={String(selectedOverview?.metrics.activeContracts ?? 0)} />
                </div>

                <div className="rounded-2xl border border-subtle-border bg-muted/30 p-4">
                  <div className="text-sm font-semibold text-foreground">תמונה פיננסית</div>
                  {overviewLoading ? (
                    <div className="mt-3 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>מתוכנן</span>
                        <span className="font-medium text-foreground">{formatNumber(selectedOverview?.financial.planned ?? 0)} ₪</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>בפועל</span>
                        <span className="font-medium text-foreground">{formatNumber(selectedOverview?.financial.actual ?? 0)} ₪</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>פער</span>
                        <span className={cn('font-medium', (selectedOverview?.financial.variance ?? 0) < 0 ? 'text-destructive' : 'text-success')}>
                          {formatNumber(selectedOverview?.financial.variance ?? 0)} ₪
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-subtle-border bg-muted/30 p-4">
                  <div className="text-sm font-semibold text-foreground">תחזוקה קרובה</div>
                  <div className="mt-3 space-y-2">
                    {overviewLoading ? (
                      <>
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </>
                    ) : selectedOverview?.upcomingMaintenance?.length ? (
                      selectedOverview.upcomingMaintenance.map((item) => (
                        <div key={item.id} className="rounded-xl border border-subtle-border bg-background px-3 py-2.5 text-sm">
                          <div className="font-medium text-foreground">{item.title}</div>
                          <div className="mt-1 text-muted-foreground">
                            {item.nextOccurrence ? new Date(item.nextOccurrence).toLocaleDateString('he-IL') : 'ללא מועד'}
                            {item.priority ? ` · ${item.priority}` : ''}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">אין תחזוקה קרובה להצגה.</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-subtle-border p-8 text-center text-sm text-muted-foreground">
                בחר בניין מהרשימה כדי לקבל תמונת מצב ותזכורות פעולה.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-subtle-border bg-background px-3 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
