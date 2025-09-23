import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, ClipboardSignature, DollarSign, Factory, FileText, Timer } from "lucide-react";
import { workOrderSummaries } from "../../components/maintenance/data";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  PENDING: "ממתין",
  APPROVED: "מאושר",
  IN_PROGRESS: "בתהליך",
  COMPLETED: "הושלם",
  INVOICED: "חויב",
};

export default function WorkOrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const order = workOrderSummaries.find((item) => item.id === id) ?? workOrderSummaries[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">פרטי הזמנת עבודה</p>
          <h1 className="text-3xl font-bold text-foreground">{order?.id ?? id}</h1>
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
            <CardTitle className="text-lg">ספק מבצע</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-foreground">
            <Factory className="h-4 w-4" /> {order?.supplier}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">סטטוס</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-foreground">
            <Badge variant="secondary" className="text-xs">
              {statusLabels[order?.status ?? "PENDING"]}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">תאריך משוער</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-foreground">
            <Timer className="h-4 w-4" />
            {order?.scheduled ? format(new Date(order.scheduled), "PPPP", { locale: he }) : "לא הוגדר"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ClipboardSignature className="h-5 w-5" /> פירוט עבודה
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="text-xs font-medium text-foreground">תיאור</p>
            <p>{order?.title}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="text-xs font-medium text-foreground">הערות</p>
            <p>הנתונים מוצגים לצורכי הדגמה. ניתן להרחיב את התיאור ולשייך מסמכים מהמערכת.</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="text-xs font-medium text-foreground">עלות משוערת</p>
            <p className="flex items-center gap-2 text-foreground">
              <DollarSign className="h-4 w-4" /> ₪{order?.costEstimate.toLocaleString("he-IL")}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="text-xs font-medium text-foreground">מסמכים</p>
            <p className="flex items-center gap-2 text-foreground">
              <FileText className="h-4 w-4" /> ניתן לצרף חשבוניות ואסמכתאות להזמנה זו.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
