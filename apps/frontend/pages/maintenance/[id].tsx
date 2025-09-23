import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, ShieldAlert, Users } from "lucide-react";
import { maintenanceTasks, maintenanceHistory, maintenanceEvents } from "../../components/maintenance/data";
import { MaintenanceHistoryTimeline } from "../../components/maintenance/maintenance-history-timeline";
import { MaintenanceCalendar } from "../../components/ui/maintenance-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function MaintenanceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const task = maintenanceTasks.find((item) => item.id === id) ?? maintenanceTasks[0];
  const history = maintenanceHistory.filter((item) => item.id.includes(String(id ?? ""))); // mock filtering
  const events = maintenanceEvents.filter((event) => event.title.includes(task.category));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">פרטי משימת תחזוקה</p>
          <h1 className="text-3xl font-bold text-foreground">{task?.id ?? id}</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/maintenance" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> חזרה לדשבורד
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="space-y-1 p-5">
            <p className="text-xs text-muted-foreground">בניין</p>
            <p className="text-lg font-semibold text-foreground">{task?.building}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-5">
            <p className="text-xs text-muted-foreground">מיקום</p>
            <p className="text-lg font-semibold text-foreground">{task?.unit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-5">
            <p className="text-xs text-muted-foreground">תאריך הבא</p>
            <p className="text-lg font-semibold text-foreground">
              {task?.nextDate ? format(new Date(task.nextDate), "dd MMM yyyy", { locale: he }) : "לא נקבע"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            <span className="text-xs text-muted-foreground">סטטוס</span>
            <Badge variant="outline" className="w-fit text-xs">
              {task?.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <ShieldAlert className="h-5 w-5" />
            <CardTitle className="text-xl">מאפייני המשימה</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            עדיפות {task?.priority}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">אחראי</p>
            <p className="flex items-center gap-2 text-sm text-foreground">
              <Users className="h-4 w-4" /> {task?.assignee}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">תזמון</p>
            <p className="flex items-center gap-2 text-sm text-foreground">
              <CalendarDays className="h-4 w-4" /> {task?.nextDate ? format(new Date(task.nextDate), "PPPP", { locale: he }) : "בהגדרה"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">קטגוריה</p>
            <p className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4" /> {task?.category}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">תיאור</p>
            <p className="text-sm text-muted-foreground">
              {`משימה חוזרת לטיפול בקטגוריה ${task?.category}. הנתונים מוצגים לצורך הדגמה ומציגים את יכולת המערכת.`}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <MaintenanceHistoryTimeline items={history.length ? history : maintenanceHistory} />
        <MaintenanceCalendar events={events.length ? events : maintenanceEvents} />
      </div>
    </div>
  );
}
