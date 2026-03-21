import { Command, HelpCircle, Plus, RefreshCw, Search } from 'lucide-react';
import type { RefObject } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import type { DispatchResponse, TechnicianOption } from './types';
import { SummaryCard, summaryCards } from './presentation';

export function DispatchToolbar({
  dispatchData,
  technicians,
  searchInput,
  buildingFilter,
  assigneeFilter,
  sort,
  refreshing,
  searchRef,
  onSearchInputChange,
  onBuildingChange,
  onAssigneeChange,
  onSortChange,
  onOpenCreate,
  onExport,
  onRefresh,
  onOpenCommandPalette,
  onOpenHelp,
}: {
  dispatchData: DispatchResponse | null;
  technicians: TechnicianOption[];
  searchInput: string;
  buildingFilter: string;
  assigneeFilter: string;
  sort: string;
  refreshing: boolean;
  searchRef: RefObject<HTMLInputElement | null>;
  onSearchInputChange: (value: string) => void;
  onBuildingChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onOpenCreate: () => void;
  onExport: () => void;
  onRefresh: () => void;
  onOpenCommandPalette: () => void;
  onOpenHelp: () => void;
}) {
  return (
    <section className="surface-hero overflow-hidden rounded-[24px] border border-white/10 text-white sm:rounded-[30px]">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                מרכז שליטה לקריאות שירות
              </Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {dispatchData?.meta.total ?? 0} קריאות בתצוגה
              </span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">קריאות שירות</h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
                מסך עבודה למיון, שיוך, ניווט במקלדת, בחירה מרובה ויצירת הזמנות עבודה בלי לעזוב את הזרימה.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button className="w-full bg-white text-slate-950 hover:bg-slate-100 sm:w-auto" onClick={onOpenCreate}>
              <Plus className="me-2 h-4 w-4" />
              קריאה חדשה
            </Button>
            <Button variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto" onClick={onOpenCommandPalette}>
              <Command className="me-2 h-4 w-4" />
              לוח פקודות
            </Button>
            <Button variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto" onClick={onExport}>
              ייצוא
            </Button>
            <Button
              variant="outline"
              className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
              onClick={onRefresh}
            >
              <RefreshCw className={`me-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              רענון
            </Button>
            <Button variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto" onClick={onOpenHelp}>
              <HelpCircle className="me-2 h-4 w-4" />
              קיצורים
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4 rounded-[26px] border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="relative">
              <Search className="absolute inset-y-0 start-4 my-auto h-4 w-4 text-slate-400" />
              <Input
                ref={searchRef}
                value={searchInput}
                onChange={(event) => onSearchInputChange(event.target.value)}
                placeholder="חיפוש לפי מספר קריאה, תיאור, בניין, יחידה או מטפל"
                className="h-12 border-white/10 bg-slate-950/30 ps-11 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Select value={buildingFilter} onValueChange={onBuildingChange}>
                <SelectTrigger className="border-white/10 bg-slate-950/30 text-white">
                  <SelectValue placeholder="בניין" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">כל הבניינים</SelectItem>
                  {dispatchData?.filterOptions.buildings.map((building) => (
                    <SelectItem key={building.id} value={String(building.id)}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
                <SelectTrigger className="border-white/10 bg-slate-950/30 text-white">
                  <SelectValue placeholder="מטפל" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">כל המטפלים</SelectItem>
                  {technicians.map((technician) => (
                    <SelectItem key={technician.id} value={String(technician.id)}>
                      {technician.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={onSortChange}>
                <SelectTrigger className="border-white/10 bg-slate-950/30 text-white">
                  <SelectValue placeholder="מיון" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">עדיפות וסיכון</SelectItem>
                  <SelectItem value="oldest">הוותיקות ביותר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map((card) => (
              <SummaryCard
                key={card.key}
                title={card.title}
                value={dispatchData?.summary[card.key as keyof DispatchResponse['summary']] ?? 0}
                icon={card.icon}
                tone={card.tone}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
