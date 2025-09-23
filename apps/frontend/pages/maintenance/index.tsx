import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, ClipboardList, Factory, FileText, Hammer, Shield } from "lucide-react";
import { MaintenanceStatCards } from "../../components/maintenance/maintenance-stat-cards";
import { MaintenanceCalendar } from "../../components/ui/maintenance-calendar";
import { MaintenanceTaskTable, MaintenanceTaskRow } from "../../components/maintenance/maintenance-task-table";
import { MaintenanceHistoryTimeline } from "../../components/maintenance/maintenance-history-timeline";
import { MaintenanceCostTrend } from "../../components/maintenance/maintenance-cost-trend";
import { MaintenanceSearchFilters } from "../../components/maintenance/maintenance-search-filters";
import { MaintenanceForms } from "../../components/maintenance/maintenance-forms";
import {
  maintenanceStats,
  maintenanceEvents,
  maintenanceTasks,
  maintenanceHistory,
  maintenanceCostTrend,
  workOrderSummaries,
  assetSummaries,
  maintenanceFilters,
} from "../../components/maintenance/data";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { AssetCard } from "../../components/ui/asset-card";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const workOrderStatusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  INVOICED: "bg-purple-100 text-purple-700",
};

export default function MaintenanceDashboardPage() {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<MaintenanceTaskRow | null>(maintenanceTasks[0] ?? null);

  const totalPreventive = useMemo(
    () => maintenanceCostTrend.reduce((sum, item) => sum + item.preventive, 0),
    []
  );
  const totalCorrective = useMemo(
    () => maintenanceCostTrend.reduce((sum, item) => sum + item.corrective, 0),
    []
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">מעקב אחר כלל פעילות התחזוקה</p>
          <h1 className="text-3xl font-bold text-foreground">דשבורד תחזוקה</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/maintenance/reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            דוחות מתקדמים
          </Link>
        </Button>
      </header>

      <MaintenanceStatCards stats={maintenanceStats} />

      <MaintenanceSearchFilters options={maintenanceFilters} onFilterChange={() => undefined} />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <MaintenanceTaskTable
          tasks={maintenanceTasks}
          onSelectTask={(task) => {
            setSelectedTask(task);
            void router.prefetch(`/maintenance/${task.id}`);
          }}
        />
        <div className="space-y-6">
          <MaintenanceCalendar events={maintenanceEvents} />

          {selectedTask && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl">משימה נבחרת</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedTask.id}</p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/maintenance/${selectedTask.id}`} className="flex items-center gap-1">
                      פירוט מלא
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2 text-foreground">
                  <Shield className="h-4 w-4" /> {selectedTask.category}
                  <Badge variant="outline" className="text-xs">
                    {selectedTask.priority}
                  </Badge>
                </div>
                <p>
                  <span className="font-semibold text-foreground">בניין:</span> {selectedTask.building}
                </p>
                <p>
                  <span className="font-semibold text-foreground">מיקום:</span> {selectedTask.unit}
                </p>
                <p>
                  <span className="font-semibold text-foreground">אחראי:</span> {selectedTask.assignee}
                </p>
                <p>
                  <span className="font-semibold text-foreground">תאריך הבא:</span>{" "}
                  {format(new Date(selectedTask.nextDate), "dd MMM yyyy", { locale: he })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <MaintenanceCostTrend data={maintenanceCostTrend} />
        <MaintenanceHistoryTimeline items={maintenanceHistory} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">סיכום הזמנות עבודה</CardTitle>
            <p className="text-sm text-muted-foreground">
              {`סה"כ תחזוקה מונעת: ₪${totalPreventive.toLocaleString("he-IL")}, תחזוקה מתקנת: ₪${totalCorrective.toLocaleString(
                "he-IL"
              )}`}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {workOrderSummaries.length} הזמנות פעילות
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {workOrderSummaries.map((order) => (
            <Link key={order.id} href={`/work-orders/${order.id}`} className="block">
              <div className="rounded-lg border bg-card p-4 transition hover:border-primary/40 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{order.title}</h3>
                  <Badge className={workOrderStatusStyles[order.status] ?? "bg-muted text-muted-foreground"}>
                    {order.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">ספק: {order.supplier}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  תאריך: {format(new Date(order.scheduled), "dd MMM", { locale: he })}
                </p>
                <p className="mt-1 text-sm font-medium text-primary">
                  עלות משוערת: ₪{order.costEstimate.toLocaleString("he-IL")}
                </p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">נכסים קריטיים</h2>
          <Button asChild variant="link" className="gap-1 text-primary">
            <Link href="/assets/A-502">
              מעבר לניהול נכסים
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {assetSummaries.map((asset) => (
            <AssetCard key={asset.id} asset={asset} onClick={(summary) => router.push(`/assets/${summary.id}`)} />
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">ציוני דרך אחרונים</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-muted/40 p-4">
            <Hammer className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-foreground">השלמת פרויקט שדרוג מערכות HVAC</p>
            <p className="text-xs text-muted-foreground">ביצוע מלא עם חיסכון של 12% בעלויות אנרגיה</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <Factory className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-foreground">הכנסת ספק חדש לשירותי חשמל</p>
            <p className="text-xs text-muted-foreground">מענה SLA משופר וזמינות 24/7</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <ClipboardList className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-foreground">תיעוד מלא לכל בנייני החברה</p>
            <p className="text-xs text-muted-foreground">100% מהמשימות מתועדות עם תמונות ואישורים</p>
          </div>
        </CardContent>
      </Card>

      <MaintenanceForms />
    </div>
  );
}
