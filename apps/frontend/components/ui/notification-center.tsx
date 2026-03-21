"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card } from "./card";
import { cn } from "../../lib/utils";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Info,
  Sparkles,
  Zap,
} from "lucide-react";
import { triggerHaptic } from "../../lib/mobile";
import { useLocale } from "../../lib/providers";
import { getDateFnsLocale } from "../../lib/i18n";

export type NotificationPriority = "critical" | "needs_action" | "informational" | "completed";

export interface NotificationItem {
  id: number | string;
  title: string;
  message: string;
  type?: string | null;
  createdAt: string | Date;
  read?: boolean;
  metadata?: Record<string, unknown> | null;
}

export function deriveNotificationPriority(notification: NotificationItem): NotificationPriority {
  if (notification.read) return "completed";

  const type = (notification.type || "").toUpperCase();
  const metadata = notification.metadata || {};
  const severity = typeof metadata.severity === "string" ? metadata.severity.toUpperCase() : "";

  if (type === "EMERGENCY_ALERT" || severity === "URGENT" || severity === "CRITICAL") {
    return "critical";
  }

  if (
    type === "PAYMENT_OVERDUE" ||
    type === "BUDGET_ALERT" ||
    type === "WORK_ORDER_ASSIGNED" ||
    type === "TICKET_STATUS" ||
    type === "PAYMENT_DUE" ||
    typeof metadata.ticketId === "number" ||
    typeof metadata.workOrderId === "number"
  ) {
    return "needs_action";
  }

  return "informational";
}

function resolveNotificationAction(notification: NotificationItem, t: (key: string) => string) {
  const metadata = notification.metadata || {};
  const ticketId = typeof metadata.ticketId === "number" ? metadata.ticketId : null;
  const workOrderId = typeof metadata.workOrderId === "number" ? metadata.workOrderId : null;
  const buildingId = typeof metadata.buildingId === "number" ? metadata.buildingId : null;
  const invoiceId = typeof metadata.invoiceId === "number" ? metadata.invoiceId : null;

  if (ticketId) {
    return { href: `/tickets/${ticketId}`, label: t("notifications.action.openTicket") };
  }
  if (workOrderId) {
    return { href: `/work-orders/${workOrderId}`, label: t("notifications.action.openWorkOrder") };
  }
  if (invoiceId) {
    return { href: "/payments", label: t("notifications.action.openPayments") };
  }
  if (buildingId) {
    return { href: `/buildings/${buildingId}`, label: t("notifications.action.openBuilding") };
  }
  if ((notification.type || "").includes("PAYMENT")) {
    return { href: "/payments", label: t("notifications.action.openPayments") };
  }
  if ((notification.type || "").includes("TICKET")) {
    return { href: "/tickets", label: t("notifications.action.openBoard") };
  }
  return { href: "/notifications", label: t("common.viewDetails") };
}

const priorityConfig: Record<
  NotificationPriority,
  {
    icon: React.FC<{ className?: string }>;
    labelKey: string;
    badgeClass: string;
    borderClass: string;
    bgClass: string;
  }
> = {
  critical: {
    icon: AlertTriangle,
    labelKey: "notifications.priority.critical",
    badgeClass: "border-destructive/30 bg-destructive/10 text-destructive",
    borderClass: "border-destructive/40",
    bgClass: "bg-destructive/5",
  },
  needs_action: {
    icon: Clock,
    labelKey: "notifications.priority.needsAction",
    badgeClass: "border-warning/30 bg-warning/10 text-warning-foreground",
    borderClass: "border-warning/40",
    bgClass: "bg-warning/5",
  },
  informational: {
    icon: Info,
    labelKey: "notifications.priority.informational",
    badgeClass: "border-primary/20 bg-primary/5 text-primary",
    borderClass: "border-primary/20",
    bgClass: "bg-primary/5",
  },
  completed: {
    icon: CheckCircle2,
    labelKey: "notifications.priority.completed",
    badgeClass: "border-success/20 bg-success/5 text-success",
    borderClass: "border-border",
    bgClass: "bg-background",
  },
};

interface NotificationCenterProps {
  notifications: NotificationItem[];
  className?: string;
  onMarkAsRead?: (id: NotificationItem["id"]) => void;
  onDismiss?: (id: NotificationItem["id"]) => void;
  mode?: "triage" | "flat";
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  className,
  onMarkAsRead,
  onDismiss,
  mode = "triage",
}) => {
  const { locale, t } = useLocale();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [dragState, setDragState] = useState<{
    id: NotificationItem["id"] | null;
    offset: number;
  }>({ id: null, offset: 0 });
  const touchStartXRef = useRef<number | null>(null);

  const normalizedNotifications = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        createdAt:
          typeof notification.createdAt === "string"
            ? parseISO(notification.createdAt)
            : notification.createdAt,
        _priority: deriveNotificationPriority(notification),
      })),
    [notifications]
  );

  const triageSections = useMemo(() => {
    const sections: Record<NotificationPriority, typeof normalizedNotifications> = {
      critical: [],
      needs_action: [],
      informational: [],
      completed: [],
    };
    for (const n of normalizedNotifications) {
      sections[n._priority].push(n);
    }
    return sections;
  }, [normalizedNotifications]);

  const toggleSection = (key: string) =>
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const sectionMeta: Array<{
    key: NotificationPriority;
    titleKey: string;
    descKey: string;
  }> = [
    {
      key: "critical",
      titleKey: "notifications.triage.criticalSection",
      descKey: "notifications.triage.criticalDescription",
    },
    {
      key: "needs_action",
      titleKey: "notifications.triage.actionSection",
      descKey: "notifications.triage.actionDescription",
    },
    {
      key: "informational",
      titleKey: "notifications.triage.infoSection",
      descKey: "notifications.triage.infoDescription",
    },
    {
      key: "completed",
      titleKey: "notifications.triage.completedSection",
      descKey: "notifications.triage.completedDescription",
    },
  ];

  const renderNotificationCard = (
    notification: (typeof normalizedNotifications)[number]
  ) => {
    const priority = notification._priority;
    const config = priorityConfig[priority];
    const PriorityIcon = config.icon;
    const action = resolveNotificationAction(notification, t);

    return (
      <div
        key={notification.id}
        className={cn(
          "relative flex items-start gap-3 rounded-lg border px-4 py-3 shadow-sm transition",
          config.borderClass,
          notification.read ? "bg-background" : config.bgClass
        )}
        style={{
          transform:
            dragState.id === notification.id
              ? `translateX(${dragState.offset}px)`
              : undefined,
        }}
        onTouchStart={(event) => {
          touchStartXRef.current = event.touches[0]?.clientX ?? null;
          setDragState({ id: notification.id, offset: 0 });
        }}
        onTouchMove={(event) => {
          if (touchStartXRef.current === null) return;
          const delta = event.touches[0].clientX - touchStartXRef.current;
          setDragState({
            id: notification.id,
            offset: Math.max(Math.min(delta, 120), -120),
          });
        }}
        onTouchEnd={() => {
          const shouldDismiss =
            Math.abs(dragState.offset) > 84 && dragState.id === notification.id;
          if (shouldDismiss) {
            if (!notification.read) onMarkAsRead?.(notification.id);
            onDismiss?.(notification.id);
            triggerHaptic("light");
          }
          touchStartXRef.current = null;
          setDragState({ id: null, offset: 0 });
        }}
      >
        <div className="mt-1">
          <PriorityIcon
            className={cn(
              "h-5 w-5",
              priority === "critical" && "text-destructive",
              priority === "needs_action" && "text-warning",
              priority === "informational" && "text-primary",
              priority === "completed" && "text-emerald-500"
            )}
          />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{notification.title}</p>
            <Badge variant="outline" className={cn("text-[10px]", config.badgeClass)}>
              {t(config.labelKey)}
            </Badge>
            {notification.type && (
              <Badge variant="outline" className="text-[10px]">
                {notification.type}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(notification.createdAt, {
                addSuffix: true,
                locale: getDateFnsLocale(locale),
              })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button asChild size="sm" variant="outline">
              <Link href={action.href}>
                {action.label}
                <ExternalLink className="ms-2 h-3.5 w-3.5" />
              </Link>
            </Button>
            {!notification.read && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMarkAsRead?.(notification.id)}
              >
                {t("common.markAsRead")}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (mode === "flat") {
    return (
      <Card className={cn("space-y-4 p-5", className)}>
        <header className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t("notifications.centerTitle")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("notifications.centerDescription")}
            </p>
          </div>
        </header>
        <div className="space-y-3">
          {normalizedNotifications.length === 0 ? (
            <EmptyNotifications t={t} />
          ) : (
            normalizedNotifications.map(renderNotificationCard)
          )}
        </div>
      </Card>
    );
  }

  const allEmpty = Object.values(triageSections).every((s) => s.length === 0);

  return (
    <div className={cn("space-y-6", className)}>
      {allEmpty && <EmptyNotifications t={t} />}
      {sectionMeta.map(({ key, titleKey, descKey }) => {
        const items = triageSections[key];
        if (items.length === 0) return null;
        const isCollapsed = collapsedSections[key];
        const config = priorityConfig[key];
        const SectionIcon = config.icon;

        return (
          <Card key={key} className="overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection(key)}
              className="flex w-full items-center justify-between gap-3 p-4 text-start hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    key === "critical" && "bg-destructive/10 text-destructive",
                    key === "needs_action" && "bg-warning/10 text-warning",
                    key === "informational" && "bg-primary/10 text-primary",
                    key === "completed" && "bg-success/10 text-success"
                  )}
                >
                  <SectionIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{t(titleKey)}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {items.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t(descKey)}</p>
                </div>
              </div>
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {!isCollapsed && (
              <div className="space-y-3 px-4 pb-4">{items.map(renderNotificationCard)}</div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

function EmptyNotifications({ t }: { t: (key: string) => string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-primary/20 bg-primary/5 p-6 text-center text-sm text-muted-foreground">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="font-medium text-foreground">{t("notifications.centerEmptyTitle")}</div>
      <div className="mt-2 leading-7">{t("notifications.centerEmptyDescription")}</div>
    </div>
  );
}
