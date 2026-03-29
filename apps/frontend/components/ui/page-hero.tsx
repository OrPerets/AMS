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
            : 'surface-hero-brand-light relative overflow-hidden rounded-[24px] border border-primary/14 bg-card text-foreground shadow-raised',
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className={cn('absolute start-[-10%] top-[-24%] h-24 w-24 rounded-full blur-3xl sm:h-36 sm:w-36', isOperational ? 'bg-primary/10' : 'bg-primary/10')} />
          <div className={cn('absolute end-[-6%] bottom-[-30%] h-20 w-20 rounded-full blur-3xl sm:h-32 sm:w-32', isOperational ? 'bg-primary/12' : 'bg-[hsl(var(--gold-300)/0.32)]')} />
        </div>
        <div className="relative flex flex-col gap-2.5 p-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:p-5 lg:p-6">
          <div className="min-w-0 space-y-1.5">
            {eyebrow ? <div className="flex flex-wrap items-center gap-2">{eyebrow}</div> : null}
            {kicker ? (
              <div className={cn('text-[11px] font-medium tracking-[0.12em] sm:text-xs', isOperational ? 'text-tertiary' : 'text-primary/72')}>
                {kicker}
              </div>
            ) : null}
            <div className="space-y-1">
              <h1 className={cn('max-w-[18ch] text-balance text-[1.05rem] font-bold leading-[1.05] sm:text-[1.45rem] lg:text-[1.7rem]', isOperational ? 'text-foreground' : 'text-foreground')}>
                {title}
              </h1>
              {description ? (
                <p className={cn('max-w-2xl text-[12px] leading-5 sm:text-sm sm:leading-6', mobileCompact ? 'line-clamp-2 sm:line-clamp-none' : '', isOperational ? 'text-muted-foreground' : 'text-secondary-foreground')}>
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="relative flex shrink-0 flex-wrap gap-2 sm:justify-end [&>*]:min-h-[40px] [&>*]:rounded-full">{actions}</div> : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        isOperational
          ? 'surface-hero-operational relative overflow-hidden rounded-2xl border border-subtle-border bg-card text-foreground shadow-card sm:rounded-[28px]'
          : 'surface-hero-brand-light relative overflow-hidden rounded-2xl border border-primary/14 bg-card text-foreground shadow-raised sm:rounded-[28px]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className={cn('absolute start-[-12%] top-[-16%] h-24 w-24 rounded-full blur-3xl sm:h-48 sm:w-48', isOperational ? 'bg-primary/10' : 'bg-primary/10')} />
        <div className={cn('absolute end-[-5%] top-[18%] h-20 w-20 rounded-full blur-3xl sm:h-44 sm:w-44', isOperational ? 'bg-primary/10' : 'bg-[hsl(var(--gold-300)/0.34)]')} />
        <div className={cn('absolute inset-x-0 bottom-0 h-20 bg-linear-to-t sm:h-24', isOperational ? 'from-primary/6 to-transparent' : 'from-primary/5 to-transparent')} />
      </div>

      <div className="relative grid gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(15rem,0.9fr)] lg:gap-6 lg:p-5">
        <div className="space-y-2.5 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2.5">
            {eyebrow ? <div className="flex flex-wrap items-center gap-2">{eyebrow}</div> : null}
            <div className="space-y-1.5 sm:space-y-2">
              {kicker ? (
                <div className={cn('text-[11px] font-medium tracking-[0.14em] sm:text-xs', isOperational ? 'text-tertiary' : 'text-primary/72')}>
                  {kicker}
                </div>
              ) : null}
              <h1 className={cn('max-w-[16ch] text-[1.1rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[1.95rem] lg:text-[2.4rem]', isOperational ? 'text-foreground' : 'text-foreground')}>
                {title}
              </h1>
              {description ? (
                <div className={cn('max-w-2xl text-[13px] leading-5 sm:text-sm sm:leading-6', isOperational ? 'text-muted-foreground' : 'text-secondary-foreground')}>
                  {description}
                </div>
              ) : null}
            </div>
          </div>

          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        {aside ? (
          <div
            className={cn(
              'hidden rounded-[24px] p-3 md:block sm:p-3.5',
              isOperational
                ? 'border border-subtle-border bg-background/86 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]'
                : 'border border-primary/12 bg-white/72 backdrop-blur-xl',
            )}
          >
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}
