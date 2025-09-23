import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, FileDown, PieChart } from "lucide-react";
import { maintenanceTasks, maintenanceCostTrend } from "../../components/maintenance/data";
import { MaintenanceCostTrend } from "../../components/maintenance/maintenance-cost-trend";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

export default function MaintenanceReportsPage() {
  const tasksByStatus = useMemo(() => {
    return maintenanceTasks.reduce<Record<string, number>>((acc, task) => {
      acc[task.status] = (acc[task.status] ?? 0) + 1;
      return acc;
    }, {});
  }, []);

  const tasksByPriority = useMemo(() => {
    return maintenanceTasks.reduce<Record<string, number>>((acc, task) => {
      acc[task.priority] = (acc[task.priority] ?? 0) + 1;
      return acc;
    }, {});
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">ניתוח פעילות התחזוקה</p>
          <h1 className="text-3xl font-bold text-foreground">דוחות תחזוקה</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/maintenance" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> חזרה ללוח הבקרה
            </Link>
          </Button>
          <Button variant="secondary" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" /> ייצוא דוח
          </Button>
        </div>
      </header>

      <MaintenanceCostTrend data={maintenanceCostTrend} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="h-5 w-5" /> חלוקה לפי סטטוס
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {maintenanceTasks.length} משימות
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {Object.entries(tasksByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                <span>{status}</span>
                <span className="font-semibold text-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" /> חלוקה לפי עדיפות
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {maintenanceTasks.length} משימות
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {Object.entries(tasksByPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                <span>{priority}</span>
                <span className="font-semibold text-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
