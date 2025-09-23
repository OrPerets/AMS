"use client";

import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card } from "../ui/card";

interface MaintenanceCostTrendProps {
  data: { month: string; preventive: number; corrective: number }[];
}

const currencyFormatter = (value: number) => `₪${value.toLocaleString("he-IL")}`;

export const MaintenanceCostTrend: React.FC<MaintenanceCostTrendProps> = ({ data }) => {
  return (
    <Card className="p-5">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">עלות תחזוקה לפי חודש</h3>
          <p className="text-sm text-muted-foreground">השוואה בין תחזוקה מונעת ותחזוקה מתקנת</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">נתונים לדוגמה</span>
      </header>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPreventive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCorrective" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickFormatter={currencyFormatter} tickLine={false} axisLine={false} width={80} />
            <Tooltip formatter={(value: number) => currencyFormatter(value)} labelClassName="text-sm font-medium" />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10 }} />
            <Area type="monotone" dataKey="preventive" stroke="#2563eb" fill="url(#colorPreventive)" name="תחזוקה מונעת" />
            <Area type="monotone" dataKey="corrective" stroke="#f97316" fill="url(#colorCorrective)" name="תחזוקה מתקנת" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
