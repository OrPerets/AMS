"use client";

import React from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "../../lib/utils";

export interface MaintenanceTaskRow {
  id: string;
  building: string;
  unit: string;
  category: string;
  priority: string;
  status: string;
  nextDate: string;
  assignee: string;
}

interface MaintenanceTaskTableProps {
  tasks: MaintenanceTaskRow[];
  onSelectTask?: (task: MaintenanceTaskRow) => void;
}

const priorityColors: Record<string, string> = {
  גבוהה: "bg-red-100 text-red-700",
  בינונית: "bg-amber-100 text-amber-700",
  נמוכה: "bg-emerald-100 text-emerald-700",
};

const statusColors: Record<string, string> = {
  מתוכנן: "bg-blue-100 text-blue-700",
  בהכנה: "bg-indigo-100 text-indigo-700",
  באיחור: "bg-red-100 text-red-700",
  הושלם: "bg-emerald-100 text-emerald-700",
};

export const MaintenanceTaskTable: React.FC<MaintenanceTaskTableProps> = ({ tasks, onSelectTask }) => {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr className="text-right text-xs font-medium uppercase text-muted-foreground">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">בניין</th>
              <th className="px-4 py-3">מיקום</th>
              <th className="px-4 py-3">קטגוריה</th>
              <th className="px-4 py-3">עדיפות</th>
              <th className="px-4 py-3">סטטוס</th>
              <th className="px-4 py-3">תאריך הבא</th>
              <th className="px-4 py-3">אחראי</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="cursor-pointer transition hover:bg-muted/40"
                onClick={() => onSelectTask?.(task)}
              >
                <td className="px-4 py-3 font-medium text-muted-foreground">{task.id}</td>
                <td className="px-4 py-3 font-medium text-foreground">{task.building}</td>
                <td className="px-4 py-3 text-muted-foreground">{task.unit}</td>
                <td className="px-4 py-3 text-muted-foreground">{task.category}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className={cn("text-xs", priorityColors[task.priority] ?? "")}> {task.priority} </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn("text-xs", statusColors[task.status] ?? "")}> {task.status} </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(new Date(task.nextDate), "dd MMM yyyy", { locale: he })}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{task.assignee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
