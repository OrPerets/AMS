"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  AlertTriangle,
  Archive,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Info,
  Sparkles,
} from "lucide-react";
import { getDateFnsLocale } from "../../lib/i18n";
import { triggerHaptic } from "../../lib/mobile";
import { useLocale } from "../../lib/providers";
import { cn } from "../../lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card } from "./card";

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
    dotClass: string;
    sectionClass: string;
    itemClass: string;
  }
> = {
  critical: {
    icon: AlertTriangle,
    labelKey: "notifications.priority.critical",
    badgeClass: "border-destructive/25 bg-destructive/10 text-destructive",
    dotClass: "bg-destructive",
    sectionClass: "border-destructive/18 bg-linear-to-br from-card via-card to-destructive/7",
    itemClass: "border-destructive/18 bg-destructive/[0.035]",
  },
  needs_action: {
    icon: Clock,
    labelKey: "notifications.priority.needsAction",
    badgeClass: "border-warning/25 bg-warning/10 text-warning-foreground",
    dotClass: "bg-warning",
    sectionClass: "border-warning/18 bg-linear-to-br from-card via-card to-warning/7",
    itemClass: "border-warning/18 bg-warning/[0.035]",
  },
  informational: {
    icon: Info,
    labelKey: "notifications.priority.informational",
    badgeClass: "border-primary/18 bg-primary/10 text-primary",
    dotClass: "bg-primary",
    sectionClass: "border-primary/14 bg-linear-to-br from-card via-card to-primary/7",
    itemClass: "border-subtle-border bg-background/82",
  },
  completed: {
    icon: CheckCircle2,
    labelKey: "notifications.priority.completed",
    badgeClass: "border-success/18 bg-success/10 text-success",
    dotClass: "bg-success",
    sectionClass: "border-subtle-border bg-linear-to-br from-card via-card to-emerald-500/[0.04]",
    itemClass: "border-subtle-border/85 bg-muted/18",
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
  const [snapBackId, setSnapBackId] = useState<NotificationItem["id"] | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const swipeLockedRef = useRef(false);
  const snapBackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const hasSeenHint = sessionStorage.getItem("notification-center-swipe-hint-seen");
      if (!hasSeenHint) {
        setShowSwipeHint(true);
        sessionStorage.setItem("notification-center-swipe-hint-seen", "1");
      }
    } catch {
      // Ignore storage access issues (private mode/restricted browser contexts).
    }

    return () => {
      if (snapBackTimeoutRef.current) {
        clearTimeout(snapBackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showSwipeHint) return;
    const timeoutId = setTimeout(() => setShowSwipeHint(false), 5000);
    return () => clearTimeout(timeoutId);
  }, [showSwipeHint]);

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
    [notifications],
  );

  const triageSections = useMemo(() => {
    const sections: Record<NotificationPriority, typeof normalizedNotifications> = {
      critical: [],
      needs_action: [],
      informational: [],
      completed: [],
    };
    for (const item of normalizedNotifications) {
      sections[item._priority].push(item);
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

  const renderNotificationCard = (notification: (typeof normalizedNotifications)[number]) => {
    const priority = notification._priority;
    const config = priorityConfig[priority];
    const PriorityIcon = config.icon;
    const action = resolveNotificationAction(notification, t);
    const dragOffset = dragState.id === notification.id ? dragState.offset : 0;
    const dragProgress = Math.min(Math.abs(dragOffset) / 120, 1);
    const isDragging = dragState.id === notification.id;
    const isSnappingBack = snapBackId === notification.id;
    const isLeftSwipe = dragOffset < 0;

    return (
      <article
        key={notification.id}
        className={cn(
          "relative overflow-hidden rounded-[24px] border p-4 shadow-card transition duration-200",
          "hover:-translate-y-0.5 active:translate-y-0",
          isSnappingBack && "transition-transform duration-250 ease-out",
          config.itemClass,
        )}
        style={{
          transform: isDragging || isSnappingBack ? `translateX(${dragOffset}px)` : undefined,
          touchAction: "pan-y",
        }}
        onTouchStart={(event) => {
          touchStartXRef.current = event.touches[0]?.clientX ?? null;
          touchStartYRef.current = event.touches[0]?.clientY ?? null;
          swipeLockedRef.current = false;
          setDragState({ id: null, offset: 0 });
        }}
        onTouchMove={(event) => {
          if (touchStartXRef.current === null || touchStartYRef.current === null) return;
          const deltaX = event.touches[0].clientX - touchStartXRef.current;
          const deltaY = event.touches[0].clientY - touchStartYRef.current;

          if (!swipeLockedRef.current) {
            if (Math.abs(deltaY) > Math.abs(deltaX) || Math.abs(deltaX) < 18) {
              return;
            }

            swipeLockedRef.current = true;
          }

          setDragState({
            id: notification.id,
            offset: Math.max(Math.min(deltaX, 120), -120),
          });
        }}
        onTouchEnd={() => {
          const shouldDismiss = Math.abs(dragState.offset) > 84 && dragState.id === notification.id;
          if (shouldDismiss) {
            if (!notification.read) onMarkAsRead?.(notification.id);
            onDismiss?.(notification.id);
            triggerHaptic("light");
          } else if (dragState.id === notification.id && Math.abs(dragState.offset) > 0) {
            setSnapBackId(notification.id);
            setDragState({ id: notification.id, offset: 0 });
            if (snapBackTimeoutRef.current) {
              clearTimeout(snapBackTimeoutRef.current);
            }
            snapBackTimeoutRef.current = setTimeout(() => setSnapBackId(null), 260);
          }
          touchStartXRef.current = null;
          touchStartYRef.current = null;
          swipeLockedRef.current = false;
          if (shouldDismiss || dragState.id !== notification.id || Math.abs(dragState.offset) === 0) {
            setDragState({ id: null, offset: 0 });
          }
        }}
        onTouchCancel={() => {
          touchStartXRef.current = null;
          touchStartYRef.current = null;
          swipeLockedRef.current = false;
          setDragState({ id: null, offset: 0 });
        }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4"
          aria-hidden="true"
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border border-success/30 bg-success/15 text-success transition-transform duration-150",
              !isLeftSwipe ? "origin-left" : "origin-center",
            )}
            style={{
              opacity: !isLeftSwipe ? dragProgress : Math.max(dragProgress * 0.35, 0.08),
              transform: `scale(${!isLeftSwipe ? 0.85 + dragProgress * 0.25 : 0.9})`,
            }}
          >
            <Check className="h-4 w-4" />
          </div>
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border border-warning/30 bg-warning/15 text-warning-foreground transition-transform duration-150",
              isLeftSwipe ? "origin-right" : "origin-center",
            )}
            style={{
              opacity: isLeftSwipe ? dragProgress : Math.max(dragProgress * 0.35, 0.08),
              transform: `scale(${isLeftSwipe ? 0.85 + dragProgress * 0.25 : 0.9})`,
            }}
          >
            <Archive className="h-4 w-4" />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-linear-to-b from-white/6 to-transparent" />
        <div className="relative flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-white/8 bg-background/74 shadow-sm backdrop-blur">
            <PriorityIcon
              className={cn(
                "h-4.5 w-4.5",
                priority === "critical" && "text-destructive",
                priority === "needs_action" && "text-warning",
                priority === "informational" && "text-primary",
                priority === "completed" && "text-success",
              )}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground sm:text-[15px]">{notification.title}</p>
                  {!notification.read ? <span className={cn("h-2 w-2 rounded-full", config.dotClass)} /> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
                  <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px]", config.badgeClass)}>
                    {t(config.labelKey)}
                  </Badge>
                  {notification.type ? (
                    <Badge variant="outline" className="px-2 py-0.5 text-[10px]">
                      {notification.type}
                    </Badge>
                  ) : null}
                  <span>
                    {formatDistanceToNow(notification.createdAt, {
                      addSuffix: true,
                      locale: getDateFnsLocale(locale),
                    })}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">{notification.message}</p>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button asChild size="sm" variant="outline">
                <Link href={action.href}>
                  {action.label}
                  <ExternalLink className="ms-2 h-3.5 w-3.5" />
                </Link>
              </Button>
              {!notification.read ? (
                <Button size="sm" variant="ghost" onClick={() => onMarkAsRead?.(notification.id)}>
                  {t("common.markAsRead")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    );
  };

  if (mode === "flat") {
    return (
      <Card className={cn("overflow-hidden p-5", className)}>
        <header className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-primary/14 bg-primary/10 text-primary shadow-sm">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground">{t("notifications.centerTitle")}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{t("notifications.centerDescription")}</p>
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

  const allEmpty = Object.values(triageSections).every((section) => section.length === 0);

  return (
    <div className={cn("space-y-4", className)}>
      {allEmpty ? <EmptyNotifications t={t} /> : null}
      {sectionMeta.map(({ key, titleKey, descKey }) => {
        const items = triageSections[key];
        if (items.length === 0) return null;

        const isCollapsed = collapsedSections[key];
        const config = priorityConfig[key];
        const SectionIcon = config.icon;

        return (
          <Card key={key} className={cn("overflow-hidden", config.sectionClass)}>
            <button
              type="button"
              onClick={() => toggleSection(key)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-start transition-colors hover:bg-background/24"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-background/72 shadow-sm backdrop-blur">
                  <SectionIcon
                    className={cn(
                      "h-4.5 w-4.5",
                      key === "critical" && "text-destructive",
                      key === "needs_action" && "text-warning",
                      key === "informational" && "text-primary",
                      key === "completed" && "text-success",
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground sm:text-base">{t(titleKey)}</span>
                    <Badge variant="outline" className="px-2 py-0.5 text-[10px]">
                      {items.length}
                    </Badge>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">{t(descKey)}</p>
                </div>
              </div>
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>
            {showSwipeHint && key === "needs_action" ? (
              <div className="px-4 pb-1">
                <div className="rounded-md border border-primary/20 bg-primary/8 px-3 py-2 text-xs leading-5 text-muted-foreground">
                  Tip: swipe a notification card right to complete it or left to archive it.
                </div>
              </div>
            ) : null}

            {!isCollapsed ? <div className="space-y-3 px-4 pb-4">{items.map(renderNotificationCard)}</div> : null}
          </Card>
        );
      })}
    </div>
  );
};

function EmptyNotifications({ t }: { t: (key: string) => string }) {
  return (
    <div className="rounded-[26px] border border-primary/14 bg-linear-to-br from-card via-card to-primary/8 p-6 text-center shadow-card">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-background/75 text-primary shadow-sm">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="text-base font-semibold text-foreground">{t("notifications.centerEmptyTitle")}</div>
      <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {t("notifications.centerEmptyDescription")}
      </div>
    </div>
  );
}
