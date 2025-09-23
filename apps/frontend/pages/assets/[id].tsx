import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, CalendarClock, MapPin, Wrench } from "lucide-react";
import { assetSummaries, maintenanceHistory, maintenanceEvents } from "../../components/maintenance/data";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { MaintenanceHistoryTimeline } from "../../components/maintenance/maintenance-history-timeline";
import { MaintenanceCalendar } from "../../components/ui/maintenance-calendar";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function AssetDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const asset = assetSummaries.find((item) => item.id === id) ?? assetSummaries[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">פרטי נכס</p>
          <h1 className="text-3xl font-bold text-foreground">{asset?.name}</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/maintenance" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> חזרה לתחזוקה
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">מזהה</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{asset?.id ?? id}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">קטגוריה</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-foreground">
            <Wrench className="h-4 w-4" /> {asset?.category}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-xs">
              {asset?.status ?? "לא ידוע"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5" /> מיקום והיסטוריה
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="text-xs font-medium text-foreground">מיקום נוכחי</p>
            <p>{asset?.location}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="text-xs font-medium text-foreground">תחזוקה קרובה</p>
            <p className="flex items-center gap-2 text-foreground">
              <CalendarClock className="h-4 w-4" />
              {asset?.nextMaintenance ? format(new Date(asset.nextMaintenance), "dd MMM yyyy", { locale: he }) : "בהגדרה"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <MaintenanceHistoryTimeline items={maintenanceHistory} />
        <MaintenanceCalendar events={maintenanceEvents} />
      </div>
    </div>
  );
}
