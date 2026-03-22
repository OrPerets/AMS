import * as React from 'react';
import { cn } from '../../lib/utils';

type SectionHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  subtitle,
  actions,
  meta,
  eyebrow,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0 space-y-1.5 sm:space-y-2">
        {eyebrow ? <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-tertiary sm:text-xs">{eyebrow}</div> : null}
        <div className="text-lg font-semibold leading-tight text-foreground sm:text-[1.35rem]">{title}</div>
        {subtitle ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
      </div>
      {(meta || actions) ? (
        <div className="flex shrink-0 flex-col items-start gap-2 sm:gap-3 md:items-end">
          {meta ? <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-tertiary sm:text-xs">{meta}</div> : null}
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
