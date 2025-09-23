"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card } from "./card";
import { Badge } from "./badge";
import { cn } from "../../lib/utils";

const palette = ["#2563eb", "#22c55e", "#f97316", "#9333ea", "#14b8a6", "#f43f5e"];

interface BudgetChartProps {
  planned: number;
  actual: number;
  categories: { name: string; value: number }[];
  className?: string;
}

export const BudgetChart: React.FC<BudgetChartProps> = ({ planned, actual, categories, className }) => {
  const summaryData = useMemo(() => {
    const remaining = Math.max(planned - actual, 0);
    return [
      { name: "הוצא בפועל", value: actual },
      { name: "זמין", value: remaining },
    ];
  }, [planned, actual]);

  const utilization = planned === 0 ? 0 : Math.min((actual / planned) * 100, 100);

  return (
    <Card className={cn("space-y-6 p-6", className)}>
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">סטטוס תקציב</h3>
          <p className="text-sm text-muted-foreground">מעקב אחרי ניצול התקציב והוצאות לפי קטגוריה</p>
        </div>
        <Badge variant={utilization > 90 ? "destructive" : utilization > 70 ? "secondary" : "default"}>
          {utilization.toFixed(0)}% מנוצל
        </Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="aspect-video w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie dataKey="value" data={summaryData} innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {summaryData.map((entry, index) => (
                    <Cell key={entry.name} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} ₪`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
              <dt className="text-xs text-muted-foreground">תקציב מתוכנן</dt>
              <dd className="text-lg font-semibold text-foreground">{planned.toLocaleString()} ₪</dd>
            </div>
            <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
              <dt className="text-xs text-muted-foreground">הוצאות בפועל</dt>
              <dd className="text-lg font-semibold text-foreground">{actual.toLocaleString()} ₪</dd>
            </div>
          </dl>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={categories}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip formatter={(value: number) => `${value.toLocaleString()} ₪`} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
