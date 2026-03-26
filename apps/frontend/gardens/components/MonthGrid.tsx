import { parseISO, getDaysInMonth, format } from 'date-fns';
import { he } from 'date-fns/locale';
import DayCell, { DayBuildingOption, DayEntry } from './DayCell';

// Hebrew weekday names with semantic meaning
const weekdays = [
  { short: 'א׳', full: 'ראשון', key: 'sunday' },
  { short: 'ב׳', full: 'שני', key: 'monday' },
  { short: 'ג׳', full: 'שלישי', key: 'tuesday' },
  { short: 'ד׳', full: 'רביעי', key: 'wednesday' },
  { short: 'ה׳', full: 'חמישי', key: 'thursday' },
  { short: 'ו׳', full: 'שישי', key: 'friday' },
  { short: 'ש׳', full: 'שבת', key: 'saturday' },
];

interface MonthGridProps {
  /** Month in YYYY-MM format */
  month: string;
  entries: Record<string, DayEntry>;
  buildingOptions?: DayBuildingOption[];
  onChange: (
    date: string,
    value: DayEntry | null,
    bulk?: 'weekdays' | 'weekends' | 'all',
  ) => void;
  /** Optional loading state for better UX */
  isLoading?: boolean;
  /** Optional read-only mode */
  readOnly?: boolean;
  /** Optional building list loading state */
  buildingsLoading?: boolean;
}

export default function MonthGrid({
  month,
  entries,
  buildingOptions = [],
  onChange,
  isLoading = false,
  readOnly = false,
  buildingsLoading = false,
}: MonthGridProps) {
  const start = parseISO(`${month}-01`);
  const daysInMonth = getDaysInMonth(start);
  const firstDay = start.getDay(); // Sunday = 0
  
  // Create month title with Hebrew formatting
  const monthTitle = format(start, 'MMMM yyyy', { locale: he });

  const cells: Array<string | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${month}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    
    const target = e.target as HTMLElement;
    if (target.tagName !== 'BUTTON') return;
    
    const idx = Number(target.dataset.index);
    const isRtl = document.documentElement.dir === 'rtl';
    let next = idx;
    
    switch (e.key) {
      case 'ArrowRight':
        next = idx + (isRtl ? -1 : 1);
        break;
      case 'ArrowLeft':
        next = idx + (isRtl ? 1 : -1);
        break;
      case 'ArrowDown':
        next = idx + 7;
        break;
      case 'ArrowUp':
        next = idx - 7;
        break;
      case 'Home':
        // Go to first day of week
        next = idx - (idx % 7);
        e.preventDefault();
        break;
      case 'End':
        // Go to last day of week  
        next = idx + (6 - (idx % 7));
        e.preventDefault();
        break;
      default:
        return;
    }
    
    // Find next valid cell
    let date: string | null | undefined = cells[next];
    let attempts = 0;
    while (next >= 0 && next < cells.length && !date && attempts < 42) {
      next += e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      date = cells[next];
      attempts++;
    }
    
    if (date && next >= 0 && next < cells.length) {
      e.preventDefault();
      document.getElementById(`day-${date}`)?.focus();
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-4">
          <div className="skeleton h-6 w-32 mx-auto mb-2" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekdays.map((w) => (
            <div key={w.key} className="skeleton h-8" />
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-3 text-center sm:mb-4">
        <h2 className="text-lg font-semibold text-foreground text-hebrew sm:text-xl">
          {monthTitle}
        </h2>
        <div className="mt-1 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full sm:w-16" />
      </div>

      <div
        className="select-none"
        role="grid"
        aria-label={`לוח חודש ${monthTitle}`}
        onKeyDown={handleKeyDown}
      >
        {/* Enhanced weekday headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {weekdays.map((w) => (
            <div
              key={w.key}
              className="text-center py-2 px-1 text-sm font-medium text-muted-foreground
                         bg-muted/30 rounded-xl border border-muted-foreground/10"
              role="columnheader"
              aria-label={w.full}
              title={w.full}
            >
              <span className="text-hebrew">{w.short}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid with enhanced spacing and animations */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {cells.map((date, idx) => {
            const delay = `${(idx % 7) * 50}ms`;
            
            return date ? (
              <div
                key={date}
                className="animate-scale-in"
                style={{ animationDelay: delay }}
              >
                <DayCell
                  id={`day-${date}`}
                  dataIndex={idx}
                  date={date}
                  value={entries[date]}
                  buildingOptions={buildingOptions}
                  buildingsLoading={buildingsLoading}
                  onChange={readOnly ? () => {} : onChange}
                  readOnly={readOnly}
                  isWeekend={[5, 6].includes(new Date(date).getDay())}
                />
              </div>
            ) : (
              <div key={idx} className="aspect-square" />
            );
          })}
        </div>
      </div>

      {/* Progress indicator for filled days */}
      {Object.values(entries).some((entry) => entry?.address?.trim()) && (
        <div className="mt-4 animate-slide-down">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(
                    (Object.values(entries).filter((entry) => entry?.address?.trim()).length / daysInMonth) * 100,
                    100,
                  )}%`,
                }}
              />
            </div>
            <span className="text-xs font-medium whitespace-nowrap">
              {Object.values(entries).filter((entry) => entry?.address?.trim()).length}/{daysInMonth} ימים
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
