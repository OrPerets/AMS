import * as React from 'react';
import { cn } from '../../lib/utils';

export function SectionHeader({
  title,
  subtitle,
  actions,
  meta,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2.5 sm:gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="space-y-1 sm:space-y-1.5">
        <div className="text-lg sm:text-xl font-semibold text-foreground">{title}</div>
        {subtitle ? <p className="hidden sm:block text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="flex flex-col items-start gap-2 sm:gap-3 md:items-end">
        {meta ? <div className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.18em] sm:tracking-[0.22em] text-tertiary">{meta}</div> : null}
        {actions ? <div className="flex flex-wrap gap-2 sm:gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
