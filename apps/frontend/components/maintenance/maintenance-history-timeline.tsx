"use client";

import React from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { CheckCircle2, Clock3, ClipboardList } from "lucide-react";

export interface MaintenanceHistoryItem {
  id: string;
  title: string;
  date: string;
  cost?: number;
  technician?: string;
  status?: "verified" | "pending" | string;
  notes?: string;
}

interface MaintenanceHistoryTimelineProps {
  items: MaintenanceHistoryItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  verified: { label: "מאושר", color: "text-emerald-600", icon: CheckCircle2 },
  pending: { label: "ממתין", color: "text-amber-600", icon: Clock3 },
  default: { label: "נרשם", color: "text-blue-600", icon: ClipboardList },
};

export const MaintenanceHistoryTimeline: React.FC<MaintenanceHistoryTimelineProps> = ({ items }) => {
  return (
    <Card className="space-y-4 p-5">
      <h3 className="text-lg font-semibold text-foreground">היסטוריית תחזוקה</h3>
      <div className="space-y-6">
        {items.map((item) => {
          const status = statusConfig[item.status ?? ""] ?? statusConfig.default;
          const Icon = status.icon;
          return (
            <div key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={cn("rounded-full bg-primary/10 p-2", status.color)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="mt-1 h-full w-px bg-border" aria-hidden />
              </div>
              <div className="flex-1 space-y-1 rounded-lg border bg-background/80 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    לפני {formatDistanceToNow(parseISO(item.date), { addSuffix: false, locale: he })}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {item.technician && <p>טכנאי אחראי: {item.technician}</p>}
                  {item.cost !== undefined && <p>עלות: ₪{item.cost.toLocaleString('he-IL')}</p>}
                  {item.notes && <p>{item.notes}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
