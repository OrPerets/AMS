import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export function PullToRefresh({
  progress,
  active,
  className,
}: {
  progress: number;
  active: boolean;
  className?: string;
}) {
  const rotation = Math.min(progress, 1) * 270;
  return (
    <div className={cn('flex items-center justify-center py-2', className)} aria-hidden="true">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/8 text-primary">
        <RefreshCw className={cn('h-4 w-4', active && 'animate-spin')} strokeWidth={1.75} style={{ transform: `rotate(${rotation}deg)` }} />
      </span>
    </div>
  );
}
