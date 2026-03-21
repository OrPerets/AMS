"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card } from "./card";
import { cn } from "../../lib/utils";
import { Bell, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import { triggerHaptic } from "../../lib/mobile";
import { useLocale } from "../../lib/providers";
import { getDateFnsLocale } from "../../lib/i18n";

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
  onDismiss?: (id: NotificationItem["id"]) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  className,
  onMarkAsRead,
  onDismiss,
}) => {
  const { locale, t } = useLocale();
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string | "all">("all");
  const [dragState, setDragState] = useState<{ id: NotificationItem["id"] | null; offset: number }>({
    id: null,
    offset: 0,
  });
  const touchStartXRef = useRef<number | null>(null);

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

  const resolveAction = (notification: NotificationItem) => {
    const metadata = notification.metadata || {};
    const ticketId = typeof metadata.ticketId === 'number' ? metadata.ticketId : null;
    const workOrderId = typeof metadata.workOrderId === 'number' ? metadata.workOrderId : null;
    const buildingId = typeof metadata.buildingId === 'number' ? metadata.buildingId : null;
    const invoiceId = typeof metadata.invoiceId === 'number' ? metadata.invoiceId : null;

    if (ticketId) {
      return { href: `/tickets/${ticketId}`, label: t('notifications.action.openTicket') };
    }
    if (workOrderId) {
      return { href: `/work-orders/${workOrderId}`, label: t('notifications.action.openWorkOrder') };
    }
    if (invoiceId) {
      return { href: '/payments', label: t('notifications.action.openPayments') };
    }
    if (buildingId) {
      return { href: `/buildings/${buildingId}`, label: t('notifications.action.openBuilding') };
    }
    if ((notification.type || '').includes('PAYMENT')) {
      return { href: '/payments', label: t('notifications.action.openPayments') };
    }
    if ((notification.type || '').includes('TICKET')) {
      return { href: '/tickets', label: t('notifications.action.openBoard') };
    }
    return { href: '/notifications', label: t('common.viewDetails') };
  };

  return (
    <Card className={cn("space-y-4 p-5", className)}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t('notifications.centerTitle')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('notifications.centerDescription')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
          >
            {t('common.all')}
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "unread" ? "default" : "outline"}
            onClick={() => setStatusFilter("unread")}
          >
            {t('common.unread')}
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "read" ? "default" : "outline"}
            onClick={() => setStatusFilter("read")}
          >
            {t('common.read')}
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
            {t('notifications.allTypes')}
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
          <div className="rounded-[24px] border border-dashed border-primary/20 bg-primary/5 p-6 text-center text-sm text-muted-foreground">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="font-medium text-foreground">{t('notifications.centerEmptyTitle')}</div>
            <div className="mt-2 leading-7">
              {t('notifications.centerEmptyDescription')}
            </div>
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
            style={{
              transform:
                dragState.id === notification.id ? `translateX(${dragState.offset}px)` : undefined,
            }}
            onTouchStart={(event) => {
              touchStartXRef.current = event.touches[0]?.clientX ?? null;
              setDragState({ id: notification.id, offset: 0 });
            }}
            onTouchMove={(event) => {
              if (touchStartXRef.current === null) {
                return;
              }

              const delta = event.touches[0].clientX - touchStartXRef.current;
              setDragState({
                id: notification.id,
                offset: Math.max(Math.min(delta, 120), -120),
              });
            }}
            onTouchEnd={() => {
              const shouldDismiss = Math.abs(dragState.offset) > 84 && dragState.id === notification.id;

              if (shouldDismiss) {
                if (!notification.read) {
                  onMarkAsRead?.(notification.id);
                }
                onDismiss?.(notification.id);
                triggerHaptic('light');
              }

              touchStartXRef.current = null;
              setDragState({ id: null, offset: 0 });
            }}
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
                  {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: getDateFnsLocale(locale) })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              {notification.metadata && (
                <pre className="rounded bg-muted/50 p-2 text-[11px] leading-relaxed text-muted-foreground">
{JSON.stringify(notification.metadata, null, 2)}
                </pre>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={resolveAction(notification).href}>
                    {resolveAction(notification).label}
                    <ExternalLink className="ms-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
                {!notification.read && (
                  <Button size="sm" variant="ghost" onClick={() => onMarkAsRead?.(notification.id)}>
                    {t('common.markAsRead')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
