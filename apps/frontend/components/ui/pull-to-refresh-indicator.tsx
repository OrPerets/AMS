import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 84,
  label = 'משוך מטה כדי לרענן',
  releaseLabel = 'שחרר כדי לרענן',
}: {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
  label?: string;
  releaseLabel?: string;
}) {
  if (!isRefreshing && pullDistance <= 0) {
    return null;
  }

  const progress = Math.min(pullDistance / threshold, 1);
  const isThresholdReached = pullDistance >= threshold;
  const text = isRefreshing ? 'מרענן...' : isThresholdReached ? releaseLabel : label;

  return (
    <div className="sticky top-2 z-20 flex justify-center lg:hidden">
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-subtle-border bg-background/95 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-raised backdrop-blur',
          isRefreshing && 'text-foreground',
        )}
        style={{ transform: `translateY(${Math.min(pullDistance, 28)}px) scale(${0.92 + progress * 0.08})` }}
      >
        <RefreshCw className={cn('h-3.5 w-3.5', (isRefreshing || progress >= 1) && 'animate-spin')} />
        <span>{text}</span>
      </div>
    </div>
  );
}
