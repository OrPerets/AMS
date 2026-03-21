import * as React from 'react';
import { cn } from '../../lib/utils';

export function PageHero({
  eyebrow,
  kicker,
  title,
  description,
  actions,
  aside,
  compact,
  className,
}: {
  eyebrow?: React.ReactNode;
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <section className={cn('dark-surface surface-hero overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 text-white', className)}>
        <div className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 lg:p-6">
          <div className="min-w-0 space-y-1">
            {eyebrow ? <div className="flex flex-wrap items-center gap-1.5">{eyebrow}</div> : null}
            <h1 className="text-base font-bold leading-tight text-white sm:text-lg md:text-xl">{title}</h1>
            {kicker ? <div className="text-[11px] text-white/65 sm:text-xs">{kicker}</div> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      </section>
    );
  }

  return (
    <section className={cn('dark-surface surface-hero overflow-hidden rounded-2xl sm:rounded-[28px] border border-white/10 text-white', className)}>
      <div className="grid gap-4 p-3.5 sm:gap-5 sm:p-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8 lg:p-8">
        <div className="space-y-3.5 sm:space-y-5">
          <div className="space-y-2 sm:space-y-3">
            {eyebrow ? <div className="flex flex-wrap items-center gap-2 sm:gap-3">{eyebrow}</div> : null}
            <div className="space-y-2 sm:space-y-3">
              <div className="h-px w-12 sm:w-20 brand-divider" />
              <div className="space-y-1.5 sm:space-y-2">
                {kicker ? <div className="text-xs font-medium leading-5 text-white/78 sm:text-sm sm:leading-6">{kicker}</div> : null}
                <h1 className="max-w-[14ch] text-[1.5rem] font-bold leading-[1.08] tracking-[-0.02em] text-white sm:text-[2.15rem] md:text-5xl">{title}</h1>
                {description ? <div className="max-w-3xl text-[13px] leading-[1.55] text-white/78 sm:text-sm sm:leading-7">{description}</div> : null}
              </div>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2 sm:flex-row sm:gap-3">{actions}</div> : null}
        </div>
        {aside ? <div className="hidden sm:block self-start rounded-xl sm:rounded-[24px] border border-white/10 bg-black/15 p-3 backdrop-blur sm:p-4">{aside}</div> : null}
      </div>
    </section>
  );
}
