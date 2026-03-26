import { Building2, Camera, Filter, MessageSquare, Search, UserRound } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import type { DispatchResponse, DispatchTicket } from './types';
import {
  formatRelative,
  severityBorderColors,
  SlaBadge,
  TicketSeverityBadge,
  TicketStatusBadge,
} from './presentation';

export function DispatchResultsList({
  dispatchData,
  selectedTicketId,
  selectedIds,
  statusFilter,
  severityFilter,
  slaFilter,
  categoryFilter,
  onStatusFilterChange,
  onSeverityFilterChange,
  onSlaFilterChange,
  onCategoryFilterChange,
  onResetFilters,
  onSelectTicket,
  onToggleTicket,
  onToggleAllVisible,
}: {
  dispatchData: DispatchResponse | null;
  selectedTicketId: number | null;
  selectedIds: number[];
  statusFilter: string;
  severityFilter: string;
  slaFilter: string;
  categoryFilter: string;
  onStatusFilterChange: (value: string) => void;
  onSeverityFilterChange: (value: string) => void;
  onSlaFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onResetFilters: () => void;
  onSelectTicket: (ticketId: number) => void;
  onToggleTicket: (ticketId: number) => void;
  onToggleAllVisible: () => void;
}) {
  const allVisibleSelected = Boolean(dispatchData?.items.length) && dispatchData!.items.every((ticket) => selectedIds.includes(ticket.id));

  return (
    <Card className="rounded-[28px] border-primary/10 bg-card/96">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>תור עבודה</CardTitle>
            <CardDescription>
              {dispatchData?.meta.total ?? 0} קריאות בתצוגה הנוכחית, עם בחירה מרובה וניווט מקלדת.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-white/80">
              <Filter className="me-1 h-3.5 w-3.5" />
              מסננים פעילים
            </Badge>
            <Button variant="outline" size="sm" className="rounded-full" onClick={onToggleAllVisible} disabled={!dispatchData?.items.length}>
              {allVisibleSelected ? 'בטל בחירה' : 'בחר הכל'}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="border-primary/12 bg-white">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">כל הסטטוסים</SelectItem>
              <SelectItem value="OPEN">פתוח</SelectItem>
              <SelectItem value="ASSIGNED">הוקצה</SelectItem>
              <SelectItem value="IN_PROGRESS">בטיפול</SelectItem>
              <SelectItem value="RESOLVED">נפתר</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={onSeverityFilterChange}>
            <SelectTrigger className="border-primary/12 bg-white">
              <SelectValue placeholder="חומרה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">כל החומרות</SelectItem>
              <SelectItem value="NORMAL">רגילה</SelectItem>
              <SelectItem value="HIGH">דחופה</SelectItem>
              <SelectItem value="URGENT">בהולה</SelectItem>
            </SelectContent>
          </Select>

          <Select value={slaFilter} onValueChange={onSlaFilterChange}>
            <SelectTrigger className="border-primary/12 bg-white">
              <SelectValue placeholder="SLA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">כל מצבי ה-SLA</SelectItem>
              <SelectItem value="BREACHED">חורג SLA</SelectItem>
              <SelectItem value="DUE_TODAY">יעד היום</SelectItem>
              <SelectItem value="AT_RISK">בסיכון</SelectItem>
              <SelectItem value="ON_TRACK">במסלול</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="border-primary/12 bg-white">
              <SelectValue placeholder="קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">כל הקטגוריות</SelectItem>
              {dispatchData?.filterOptions.categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="rounded-full border-primary/14 bg-white/82 hover:bg-white" onClick={onResetFilters}>
            איפוס מסננים
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {dispatchData?.items.length ? (
          dispatchData.items.map((ticket) => (
            <TicketListCard
              key={ticket.id}
              ticket={ticket}
              selected={selectedTicketId === ticket.id}
              checked={selectedIds.includes(ticket.id)}
              onSelect={() => onSelectTicket(ticket.id)}
              onToggle={() => onToggleTicket(ticket.id)}
            />
          ))
        ) : (
          <div className="rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-950">אין קריאות בתצוגה הזו</p>
            <p className="mt-2 text-sm text-slate-500">נסה לשנות תור, מסננים או חיפוש כדי להרחיב את הרשימה.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TicketListCard({
  ticket,
  selected,
  checked,
  onSelect,
  onToggle,
}: {
  ticket: DispatchTicket;
  selected: boolean;
  checked: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const isUrgent = ticket.slaState === 'BREACHED' || ticket.severity === 'URGENT';

  return (
    <div
      className={`rounded-[22px] border border-s-[4px] p-4 transition-all ${
        selected
          ? 'border-primary/24 border-s-primary bg-[linear-gradient(180deg,rgba(215,164,62,0.18)_0%,rgba(255,250,240,0.96)_100%)] text-foreground shadow-[0_24px_56px_-38px_rgba(84,58,15,0.34)]'
          : `border-subtle-border ${severityBorderColors[ticket.severity]} bg-background/86 hover:border-primary/16 hover:bg-white hover:shadow-card`
      } ${isUrgent && !selected ? 'ring-1 ring-destructive/16' : ''}`}
    >
      <div className="flex gap-3">
        <label className="mt-1 flex items-start">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            aria-label={`בחר קריאה ${ticket.id}`}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
        </label>

        <button type="button" onClick={onSelect} className="flex-1 text-right">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={selected ? 'secondary' : 'outline'} className="text-[11px]">
                  #{ticket.id}
                </Badge>
                <TicketSeverityBadge severity={ticket.severity} />
                <TicketStatusBadge status={ticket.status} />
                <SlaBadge state={ticket.slaState} />
              </div>

              <div className="min-w-0">
                <p className={`break-words text-[15px] font-bold leading-snug ${selected ? 'text-foreground' : 'text-slate-950'}`}>
                  {ticket.title}
                </p>
                <p className={`mt-1 line-clamp-2 break-words text-sm leading-6 ${selected ? 'text-secondary-foreground' : 'text-slate-500'}`}>
                  {ticket.description}
                </p>
              </div>

              <div className={`flex flex-wrap gap-x-3 gap-y-1.5 text-[13px] ${selected ? 'text-secondary-foreground' : 'text-slate-500'}`}>
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {ticket.building.name} • {ticket.unit.number}
                  </span>
                </span>
                <span className="inline-flex min-w-0 items-center gap-1">
                  <UserRound className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{ticket.residentName}</span>
                </span>
              </div>
            </div>

            <div className={`grid gap-2 sm:grid-cols-2 lg:w-[220px] lg:shrink-0 lg:grid-cols-1 ${selected ? 'text-secondary-foreground' : 'text-slate-600'}`}>
              <div className="rounded-xl border border-current/10 bg-white/45 px-3 py-2 text-sm">
                <p className="text-[11px] opacity-60">מטפל</p>
                <p className="mt-0.5 truncate font-semibold">{ticket.assignedTo?.email || 'לא הוקצה'}</p>
              </div>
              <div className="flex items-center justify-between gap-1.5 text-sm">
                <span className="inline-flex items-center gap-1 rounded-xl border border-current/10 px-2.5 py-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {ticket.commentCount}
                </span>
                <span className="inline-flex items-center gap-1 rounded-xl border border-current/10 px-2.5 py-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  {ticket.photoCount}
                </span>
                <span className="text-xs opacity-70">{formatRelative(ticket.latestActivityAt)}</span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
