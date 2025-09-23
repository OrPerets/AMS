"use client";

import React from "react";
import { Card } from "./card";
import { Badge } from "./badge";
import { cn } from "../../lib/utils";
import { CalendarClock, MapPin, Settings2 } from "lucide-react";

export interface AssetSummary {
  id: number | string;
  name: string;
  category: string;
  status?: string | null;
  location?: string | null;
  serialNumber?: string | null;
  nextMaintenance?: string | Date | null;
  documentsCount?: number;
  maintenanceCount?: number;
}

interface AssetCardProps {
  asset: AssetSummary;
  className?: string;
  onClick?: (asset: AssetSummary) => void;
}

const statusVariants: Record<string, string> = {
  OPERATIONAL: "bg-emerald-100 text-emerald-700",
  MAINTENANCE: "bg-amber-100 text-amber-700",
  OUT_OF_SERVICE: "bg-red-100 text-red-700",
};

export const AssetCard: React.FC<AssetCardProps> = ({ asset, className, onClick }) => {
  const status = asset.status?.toUpperCase() ?? "";

  return (
    <button
      type="button"
      onClick={() => onClick?.(asset)}
      className={cn("w-full text-start", !onClick && "cursor-default")}
    >
      <Card className={cn("space-y-3 p-5 transition hover:border-primary/40 hover:shadow-md", className)}>
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-base font-semibold text-foreground">{asset.name}</h4>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> {asset.category}
            </p>
          </div>
          {status && (
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                statusVariants[status] ?? "bg-muted text-muted-foreground"
              )}
            >
              {asset.status}
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {asset.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {asset.location}
            </div>
          )}
          {asset.serialNumber && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                מס' סידורי {asset.serialNumber}
              </Badge>
            </div>
          )}
          {asset.nextMaintenance && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              {typeof asset.nextMaintenance === "string"
                ? asset.nextMaintenance
                : asset.nextMaintenance?.toLocaleDateString("he-IL")}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>מסמכים: {asset.documentsCount ?? 0}</span>
          <span>משימות תחזוקה: {asset.maintenanceCount ?? 0}</span>
        </div>
      </Card>
    </button>
  );
};
