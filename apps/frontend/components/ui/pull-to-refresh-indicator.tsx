import { CheckCircle2, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  deltaChipCount,
  threshold = 84,
  label = 'משוך מטה כדי לרענן',
  releaseLabel = 'שחרר כדי לרענן',
  refreshingLabel = 'מרענן...',
  completedLabel = 'עודכן עכשיו',
}: {
  pullDistance: number;
  isRefreshing: boolean;
  deltaChipCount?: number | null;
  threshold?: number;
  label?: string;
  releaseLabel?: string;
  refreshingLabel?: string;
  completedLabel?: string;
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const wasRefreshingRef = useRef(false);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (wasRefreshingRef.current && !isRefreshing) {
      setShowCompleted(true);
      timeoutRef.current = window.setTimeout(() => {
        setShowCompleted(false);
      }, 1700);
    }

    wasRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isRefreshing && !showCompleted && pullDistance <= 0) {
    return null;
  }

  const progress = Math.min(pullDistance / threshold, 1);
  const isThresholdReached = pullDistance >= threshold;
  const state: 'idle' | 'threshold' | 'refreshing' | 'completed' = isRefreshing
    ? 'refreshing'
    : showCompleted
      ? 'completed'
      : isThresholdReached
        ? 'threshold'
        : 'idle';
  const text =
    state === 'refreshing'
      ? refreshingLabel
      : state === 'completed'
        ? completedLabel
        : state === 'threshold'
          ? releaseLabel
          : label;
  const chipText =
    deltaChipCount && deltaChipCount !== 0 ? `${deltaChipCount > 0 ? '+' : ''}${deltaChipCount}` : null;

  return (
    <div className="sticky top-2 z-20 flex justify-center lg:hidden">
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-subtle-border bg-background/95 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-raised backdrop-blur',
          state === 'refreshing' && 'text-foreground',
          state === 'threshold' && 'border-primary/50 text-foreground',
          state === 'completed' && 'border-emerald-500/50 text-emerald-700 dark:text-emerald-300',
        )}
        style={{
          transform:
            state === 'completed'
              ? 'translateY(0px) scale(1)'
              : `translateY(${Math.min(pullDistance, 28)}px) scale(${0.92 + progress * 0.08})`,
        }}
      >
        {state === 'completed' ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <RefreshCw className={cn('h-3.5 w-3.5', (isRefreshing || progress >= 1) && 'animate-spin')} />
        )}
        <span>{text}</span>
        {state === 'completed' && chipText ? (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            {chipText}
          </span>
        ) : null}
      </div>
    </div>
  );
}
