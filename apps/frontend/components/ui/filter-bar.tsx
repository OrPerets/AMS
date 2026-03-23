import * as React from 'react';
import { cn } from '../../lib/utils';

export function FilterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('sticky top-12 z-20 rounded-2xl border border-subtle-border bg-background/92 p-3 shadow-elevation-1 backdrop-blur', className)}>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}
