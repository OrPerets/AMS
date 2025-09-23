"use client";

import React, { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isSameDay, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { Badge } from "./badge";
import { Card } from "./card";
import { cn } from "../../lib/utils";
import { CalendarClock, Wrench } from "lucide-react";

export interface MaintenanceEvent {
  id?: number | string;
  date: Date | string;
  title: string;
  description?: string;
  category?: string;
  status?: "scheduled" | "completed" | "overdue" | string;
  assignee?: string;
}

interface MaintenanceCalendarProps {
  events: MaintenanceEvent[];
  className?: string;
  onSelectEvent?: (event: MaintenanceEvent) => void;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
};

const parseDate = (value: Date | string) => (typeof value === "string" ? parseISO(value) : value);

export const MaintenanceCalendar: React.FC<MaintenanceCalendarProps> = ({
  events,
  className,
  onSelectEvent,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const normalizedEvents = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        date: parseDate(event.date),
      })),
    [events]
  );

  const eventsForSelectedDay = useMemo(
    () =>
      normalizedEvents.filter((event) =>
        isSameDay(event.date as Date, selectedDate)
      ),
    [normalizedEvents, selectedDate]
  );

  const modifiers = useMemo(
    () => ({
      hasEvent: normalizedEvents.map((event) => event.date as Date),
    }),
    [normalizedEvents]
  );

  const modifiersStyles = {
    hasEvent: {
      borderRadius: "9999px",
      backgroundColor: "rgba(59, 130, 246, 0.15)",
      color: "rgb(37, 99, 235)",
    },
  } satisfies Parameters<typeof DayPicker>[0]["modifiersStyles"];

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[320px_1fr]", className)}>
      <Card className="p-4">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          locale={he}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          weekStartsOn={0}
          showOutsideDays
          styles={{
            caption_label: { fontWeight: 600 },
            day: { borderRadius: "9999px" },
          }}
        />
      </Card>

      <Card className="space-y-4 p-5">
        <header className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">תחזוקה ליום {format(selectedDate, "dd MMMM yyyy", { locale: he })}</h3>
            <p className="text-sm text-muted-foreground">
              {eventsForSelectedDay.length > 0
                ? `${eventsForSelectedDay.length} משימות מתוכננות`
                : "אין משימות מתוכננות ליום זה"}
            </p>
          </div>
          <CalendarClock className="h-6 w-6 text-primary" />
        </header>

        <div className="space-y-3">
          {eventsForSelectedDay.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              אין תחזוקה רשומה ליום זה.
            </div>
          )}

          {eventsForSelectedDay.map((event) => (
            <button
              key={event.id ?? `${event.title}-${event.date}`}
              type="button"
              onClick={() => onSelectEvent?.(event)}
              className="w-full text-start"
            >
              <div className="flex w-full items-start gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition hover:border-primary/40 hover:shadow-md">
                <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                  <Wrench className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                    {event.category && (
                      <Badge variant="outline" className="text-xs">
                        {event.category}
                      </Badge>
                    )}
                    {event.status && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          statusColors[event.status] ?? "bg-muted text-muted-foreground"
                        )}
                      >
                        {event.status === "scheduled"
                          ? "מתוכנן"
                          : event.status === "completed"
                          ? "הושלם"
                          : event.status === "overdue"
                          ? "באיחור"
                          : event.status}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  )}
                  {event.assignee && (
                    <p className="text-xs text-muted-foreground">אחראי: {event.assignee}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(event.date as Date, "HH:mm")}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};
