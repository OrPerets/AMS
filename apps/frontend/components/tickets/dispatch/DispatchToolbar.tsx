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
  roleLabel,
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
  roleLabel: string;
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
    <section className="surface-hero-brand-light overflow-hidden rounded-[24px] border border-primary/14 text-foreground shadow-raised sm:rounded-[30px]">
      <div className="space-y-4 p-4 sm:space-y-5 sm:p-5 lg:space-y-6 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)] lg:gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-primary/12 bg-white/72 text-primary">
                {roleLabel}
              </Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/18 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {dispatchData?.meta.total ?? 0} קריאות בתצוגה
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-[11px] font-semibold tracking-[0.12em] text-primary/72">מוקד קריאות</div>
              <h1 className="max-w-[12ch] text-[1.55rem] font-black leading-[1.04] tracking-[-0.03em] sm:text-[2rem] lg:text-[2.4rem]">קריאות שירות</h1>
              <p className="max-w-2xl text-[13px] leading-6 text-secondary-foreground sm:text-sm sm:leading-6">
                מסך עבודה אחד למיון, שיוך, עדכון SLA ויצירת הזמנות עבודה בלי לצאת מההקשר.
              </p>
            </div>

            <div className="rounded-[24px] border border-primary/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.94)_100%)] p-3.5 shadow-[0_18px_40px_rgba(84,58,15,0.10)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold tracking-[0.12em] text-primary/72">פעולה מהירה</div>
                  <div className="mt-1 text-lg font-black leading-none text-foreground">פתיחת קריאה או תיעוד</div>
                  <div className="mt-1.5 text-xs leading-5 text-secondary-foreground">
                    כניסה מהירה ליצירה, פקודות ורענון בלי להעמיס על המסך.
                  </div>
                </div>
                <div className="rounded-2xl border border-primary/12 bg-white/76 px-3 py-2 text-right">
                  <div className="text-[10px] font-semibold tracking-[0.12em] text-secondary-foreground">ללא שיוך</div>
                  <div className="mt-1 text-xl font-black tabular-nums text-primary">{dispatchData?.summary.unassigned ?? 0}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Button className="sm:h-10 sm:px-4" onClick={onOpenCreate}>
                  <Plus className="me-2 h-4 w-4" />
                  קריאה חדשה
                </Button>
                <Button variant="outline" className="border-primary/14 bg-white/78 text-foreground hover:bg-white sm:h-10 sm:px-4" onClick={onOpenCommandPalette}>
                  <Command className="me-2 h-4 w-4" />
                  לוח פקודות
                </Button>
                <Button variant="outline" className="border-primary/14 bg-white/78 text-foreground hover:bg-white sm:h-10 sm:px-4" onClick={onExport}>
                  ייצוא
                </Button>
                <Button
                  variant="outline"
                  className="border-primary/14 bg-white/78 text-foreground hover:bg-white sm:h-10 sm:px-4"
                  onClick={onRefresh}
                >
                  <RefreshCw className={`me-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  רענון
                </Button>
                <Button variant="outline" className="border-primary/14 bg-white/78 text-foreground hover:bg-white sm:h-10 sm:px-4" onClick={onOpenHelp}>
                  <HelpCircle className="me-2 h-4 w-4" />
                  קיצורים
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3 self-start lg:sticky lg:top-16">
            <div className="rounded-2xl border border-primary/12 bg-white/76 px-3 py-2 text-[11px] text-secondary-foreground">
              {buildingFilter === 'ALL' ? 'כל הבניינים' : `בניין #${buildingFilter}`} · {assigneeFilter === 'ALL' ? 'כל המטפלים' : 'מטפל נבחר'} · {sort === 'priority' ? 'מיון לפי עדיפות' : 'מיון לפי ותיקות'}
            </div>
            <div className="space-y-4 rounded-[26px] border border-primary/12 bg-white/76 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur">
              <div className="text-[11px] font-semibold tracking-[0.12em] text-secondary-foreground">חיפוש וסינון</div>
              <div className="relative">
                <Search className="absolute inset-y-0 start-4 my-auto h-4 w-4 text-slate-400" />
                <Input
                  ref={searchRef}
                  value={searchInput}
                  onChange={(event) => onSearchInputChange(event.target.value)}
                  placeholder="חיפוש לפי מספר קריאה, תיאור, בניין, יחידה או מטפל"
                  className="h-12 border-primary/12 bg-white ps-11 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Select value={buildingFilter} onValueChange={onBuildingChange}>
                  <SelectTrigger className="border-primary/12 bg-white text-foreground">
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
                  <SelectTrigger className="border-primary/12 bg-white text-foreground">
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
                  <SelectTrigger className="border-primary/12 bg-white text-foreground">
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
      </div>
    </section>
  );
}
