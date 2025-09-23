"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingUp, Wrench, ShieldCheck, CalendarClock } from "lucide-react";
import { cn } from "../../lib/utils";

export interface MaintenanceStat {
  title: string;
  value: string | number;
  trend?: string;
  color?: string;
}

const icons = [Wrench, ShieldCheck, CalendarClock, TrendingUp];

interface MaintenanceStatCardsProps {
  stats: MaintenanceStat[];
}

export const MaintenanceStatCards: React.FC<MaintenanceStatCardsProps> = ({ stats }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = icons[index % icons.length];
        return (
          <Card key={stat.title} className="border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <span className="rounded-full bg-primary/10 p-2 text-primary">
                <Icon className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
              {stat.trend && (
                <p className={cn("text-xs mt-2", stat.color ?? "text-muted-foreground")}>{stat.trend}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
