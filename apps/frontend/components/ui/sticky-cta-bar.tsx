import * as React from 'react';
import { cn } from '../../lib/utils';

export function StickyCtaBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('sticky bottom-[calc(54px+env(safe-area-inset-bottom)+12px)] z-30 rounded-2xl border border-subtle-border bg-background/96 p-2 shadow-raised backdrop-blur', className)}>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
