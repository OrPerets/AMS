"use client";

import React, { useMemo, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card } from "./card";
import { cn } from "../../lib/utils";
import { Bell, CheckCircle2 } from "lucide-react";

export interface NotificationItem {
  id: number | string;
  title: string;
  message: string;
  type?: string | null;
  createdAt: string | Date;
  read?: boolean;
  metadata?: Record<string, unknown> | null;
}

interface NotificationCenterProps {
  notifications: NotificationItem[];
  className?: string;
  onMarkAsRead?: (id: NotificationItem["id"]) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  className,
  onMarkAsRead,
}) => {
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string | "all">("all");

  const normalizedNotifications = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        createdAt:
          typeof notification.createdAt === "string"
            ? parseISO(notification.createdAt)
            : notification.createdAt,
      })),
    [notifications]
  );

  const types = useMemo(() => {
    const unique = new Set<string>();
    normalizedNotifications.forEach((notification) => {
      if (notification.type) {
        unique.add(notification.type);
      }
    });
    return Array.from(unique.values());
  }, [normalizedNotifications]);

  const filtered = useMemo(() => {
    return normalizedNotifications.filter((notification) => {
      if (statusFilter === "unread" && notification.read) {
        return false;
      }
      if (statusFilter === "read" && !notification.read) {
        return false;
      }
      if (typeFilter !== "all" && notification.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [normalizedNotifications, statusFilter, typeFilter]);

  return (
    <Card className={cn("space-y-4 p-5", className)}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">מרכז התראות</h3>
            <p className="text-sm text-muted-foreground">
              ניהול ועדכון של התראות מערכת ותקשורת עם דיירים וצוות
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
          >
            הכל
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "unread" ? "default" : "outline"}
            onClick={() => setStatusFilter("unread")}
          >
            לא נקראו
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "read" ? "default" : "outline"}
            onClick={() => setStatusFilter("read")}
          >
            נקראו
          </Button>
        </div>
      </header>

      {types.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="h-7 px-2 text-xs"
            variant={typeFilter === "all" ? "default" : "outline"}
            onClick={() => setTypeFilter("all")}
          >
            כל הסוגים
          </Button>
          {types.map((type) => (
            <Button
              key={type}
              size="sm"
              className="h-7 px-2 text-xs"
              variant={typeFilter === type ? "default" : "outline"}
              onClick={() => setTypeFilter(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            אין התראות להצגה.
          </div>
        )}

        {filtered.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "relative flex items-start gap-3 rounded-lg border px-4 py-3 shadow-sm transition",
              notification.read
                ? "bg-background"
                : "border-primary/40 bg-primary/5 shadow-md"
            )}
          >
            <div className="mt-1">
              {notification.read ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Bell className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                {notification.type && (
                  <Badge variant="outline" className="text-xs">
                    {notification.type}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: he })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              {notification.metadata && (
                <pre className="rounded bg-muted/50 p-2 text-[11px] leading-relaxed text-muted-foreground">
{JSON.stringify(notification.metadata, null, 2)}
                </pre>
              )}
            </div>
            {!notification.read && (
              <Button size="sm" variant="ghost" onClick={() => onMarkAsRead?.(notification.id)}>
                סמן כנקרא
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
