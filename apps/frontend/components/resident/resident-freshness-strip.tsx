import { Radio, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

type ResidentFreshnessStripProps = {
  connected: boolean;
  lastUpdatedAt: number | null;
  unreadCount?: number;
  className?: string;
  compact?: boolean;
};

function formatFreshness(lastUpdatedAt: number | null) {
  if (!lastUpdatedAt) return 'ממתין לעדכון ראשון';

  const elapsedMs = Math.max(0, Date.now() - lastUpdatedAt);
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);

  if (elapsedMinutes < 1) return 'עודכן עכשיו';
  if (elapsedMinutes < 60) return `עודכן לפני ${elapsedMinutes} דק׳`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `עודכן לפני ${elapsedHours} שעות`;

  return 'עודכן לפני יותר מיום';
}

export function ResidentFreshnessStrip({
  connected,
  lastUpdatedAt,
  unreadCount,
  className,
  compact = false,
}: ResidentFreshnessStripProps) {
  const statusLabel = connected ? 'מחובר להתראות' : 'ממתין לחיבור';
  const freshnessLabel = formatFreshness(lastUpdatedAt);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-full border px-3.5 py-2.5 text-right shadow-[0_10px_20px_rgba(44,28,9,0.04)]',
        connected
          ? 'border-primary/14 bg-[linear-gradient(180deg,rgba(255,251,240,0.92)_0%,rgba(255,255,255,0.94)_100%)]'
          : 'border-warning/18 bg-[linear-gradient(180deg,rgba(255,248,236,0.94)_0%,rgba(255,255,255,0.94)_100%)]',
        compact ? 'px-3 py-2 text-[11px]' : 'text-xs',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            connected ? 'bg-primary/10 text-primary' : 'bg-warning/12 text-warning',
          )}
        >
          <Radio className="h-3.5 w-3.5" strokeWidth={1.9} />
        </span>
        <div>
          <div className="font-semibold text-foreground">{statusLabel}</div>
          <div className="text-[11px] text-secondary-foreground">{freshnessLabel}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-secondary-foreground">
        <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.8} />
        <span>{unreadCount ? `${unreadCount} עדכונים ממתינים` : 'אין עדכונים שמחכים לך'}</span>
      </div>
    </div>
  );
}
