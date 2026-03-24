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
  mobileCompact?: boolean;
  variant?: 'brand' | 'operational';
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
  mobileCompact,
  variant = 'brand',
  className,
}: PageHeroProps) {
  const isOperational = variant === 'operational';

  if (compact || mobileCompact) {
    return (
      <section
        className={cn(
          isOperational
            ? 'surface-hero-operational relative overflow-hidden rounded-[24px] border border-subtle-border bg-card text-foreground shadow-card'
            : 'dark-surface surface-hero relative overflow-hidden rounded-[24px] border border-white/10 text-white shadow-hero',
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className={cn('absolute start-[-10%] top-[-24%] h-24 w-24 rounded-full blur-3xl sm:h-36 sm:w-36', isOperational ? 'bg-primary/10' : 'bg-white/8')} />
          <div className={cn('absolute end-[-6%] bottom-[-30%] h-20 w-20 rounded-full blur-3xl sm:h-32 sm:w-32', isOperational ? 'bg-primary/12' : 'bg-primary/20')} />
        </div>
        <div className="relative flex flex-col gap-2.5 p-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:p-5 lg:p-6">
          <div className="min-w-0 space-y-1.5">
            {eyebrow ? <div className="flex flex-wrap items-center gap-2">{eyebrow}</div> : null}
            {kicker ? (
              <div className={cn('text-[11px] font-medium uppercase tracking-[0.18em] sm:text-xs', isOperational ? 'text-tertiary' : 'text-white/62')}>
                {kicker}
              </div>
            ) : null}
            <div className="space-y-1">
              <h1 className={cn('max-w-[18ch] text-[1.1rem] font-bold leading-[1.05] sm:text-[1.45rem] lg:text-[1.7rem]', isOperational ? 'text-foreground' : 'text-white')}>
                {title}
              </h1>
              {description ? (
                <p className={cn('max-w-2xl text-[13px] leading-5 sm:text-sm sm:leading-6', isOperational ? 'text-muted-foreground' : 'text-white/76')}>
                  {description}
                </p>
              ) : null}
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
        isOperational
          ? 'surface-hero-operational relative overflow-hidden rounded-2xl border border-subtle-border bg-card text-foreground shadow-card sm:rounded-[28px]'
          : 'dark-surface surface-hero relative overflow-hidden rounded-2xl border border-white/10 text-white shadow-hero sm:rounded-[28px]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className={cn('absolute start-[-12%] top-[-16%] h-24 w-24 rounded-full blur-3xl sm:h-48 sm:w-48', isOperational ? 'bg-primary/10' : 'bg-white/8')} />
        <div className={cn('absolute end-[-5%] top-[18%] h-20 w-20 rounded-full blur-3xl sm:h-44 sm:w-44', isOperational ? 'bg-primary/10' : 'bg-primary/18')} />
        <div className={cn('absolute inset-x-0 bottom-0 h-20 bg-linear-to-t sm:h-24', isOperational ? 'from-primary/6 to-transparent' : 'from-black/16 to-transparent')} />
      </div>

      <div className="relative grid gap-2.5 p-3 sm:gap-5 sm:p-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(16rem,0.95fr)] lg:gap-8 lg:p-7">
        <div className="space-y-3 sm:space-y-5">
          <div className="space-y-2 sm:space-y-3">
            {eyebrow ? <div className="flex flex-wrap items-center gap-2">{eyebrow}</div> : null}
            <div className="space-y-1.5 sm:space-y-2">
              {kicker ? (
                <div className={cn('text-[11px] font-medium uppercase tracking-[0.22em] sm:text-xs', isOperational ? 'text-tertiary' : 'text-white/64')}>
                  {kicker}
                </div>
              ) : null}
              <h1 className={cn('max-w-[15ch] text-lg font-bold leading-[1.05] tracking-[-0.03em] sm:text-[2.35rem] lg:text-[3rem]', isOperational ? 'text-foreground' : 'text-white')}>
                {title}
              </h1>
              {description ? (
                <div className={cn('max-w-2xl text-[13px] leading-5 sm:text-[0.95rem] sm:leading-7', isOperational ? 'text-muted-foreground' : 'text-white/76')}>
                  {description}
                </div>
              ) : null}
            </div>
          </div>

          {actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
        </div>

        {aside ? (
          <div
            className={cn(
              'hidden rounded-[24px] p-3.5 md:block sm:p-4',
              isOperational
                ? 'border border-subtle-border bg-background/86 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]'
                : 'border border-white/10 bg-white/8 backdrop-blur-xl',
            )}
          >
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}
