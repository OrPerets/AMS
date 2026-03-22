import * as React from 'react';
import { cn } from '../../lib/utils';

type PageHeroProps = {
  eyebrow?: React.ReactNode;
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  compact?: boolean;
  className?: string;
};

export function PageHero({
  eyebrow,
  kicker,
  title,
  description,
  actions,
  aside,
  compact,
  className,
}: PageHeroProps) {
  if (compact) {
    return (
      <section
        className={cn(
          'dark-surface surface-hero relative overflow-hidden rounded-[24px] border border-white/10 text-white shadow-hero',
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute start-[-10%] top-[-24%] h-36 w-36 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute end-[-6%] bottom-[-30%] h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-3 p-3.5 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:p-5 lg:p-6">
          <div className="min-w-0 space-y-1.5">
            {eyebrow ? <div className="flex flex-wrap items-center gap-2">{eyebrow}</div> : null}
            {kicker ? <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/62 sm:text-xs">{kicker}</div> : null}
            <div className="space-y-1">
              <h1 className="max-w-[18ch] text-[1.1rem] font-bold leading-[1.05] text-white sm:text-[1.45rem] lg:text-[1.7rem]">{title}</h1>
              {description ? <p className="max-w-2xl text-[13px] leading-5 text-white/76 sm:text-sm sm:leading-6">{description}</p> : null}
            </div>
          </div>
          {actions ? <div className="relative flex shrink-0 flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        'dark-surface surface-hero relative overflow-hidden rounded-[28px] border border-white/10 text-white shadow-hero',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute start-[-12%] top-[-16%] h-36 w-36 rounded-full bg-white/8 blur-3xl sm:h-48 sm:w-48" />
        <div className="absolute end-[-5%] top-[18%] h-32 w-32 rounded-full bg-primary/18 blur-3xl sm:h-44 sm:w-44" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/16 to-transparent sm:h-24" />
      </div>

      <div className="relative grid gap-3 p-3.5 sm:gap-5 sm:p-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(16rem,0.95fr)] lg:gap-8 lg:p-7">
        <div className="space-y-3 sm:space-y-5">
          <div className="space-y-2 sm:space-y-3">
            {eyebrow ? <div className="flex flex-wrap items-center gap-2">{eyebrow}</div> : null}
            <div className="space-y-1.5 sm:space-y-2">
              {kicker ? <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/64 sm:text-xs">{kicker}</div> : null}
              <h1 className="max-w-[15ch] text-[1.4rem] font-bold leading-[0.98] tracking-[-0.03em] text-white sm:text-[2.35rem] lg:text-[3rem]">{title}</h1>
              {description ? <div className="max-w-2xl text-[13px] leading-5 text-white/76 sm:text-[0.95rem] sm:leading-7">{description}</div> : null}
            </div>
          </div>

          {actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
        </div>

        {aside ? (
          <div className="hidden rounded-[24px] border border-white/10 bg-white/8 p-3.5 backdrop-blur-xl md:block sm:p-4">
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}
