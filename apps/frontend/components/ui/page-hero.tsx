import * as React from 'react';
import { cn } from '../../lib/utils';

export function PageHero({
  eyebrow,
  kicker,
  title,
  description,
  actions,
  aside,
  className,
}: {
  eyebrow?: React.ReactNode;
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('surface-hero overflow-hidden rounded-[30px] border border-white/10 text-white', className)}>
      <div className="grid gap-5 p-4 sm:gap-6 sm:p-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8 lg:p-8">
        <div className="space-y-5 sm:space-y-6">
          <div className="space-y-2.5 sm:space-y-3">
            {eyebrow ? <div className="flex flex-wrap items-center gap-3">{eyebrow}</div> : null}
            <div className="space-y-2.5 sm:space-y-3">
              <div className="h-px w-16 sm:w-20 brand-divider" />
              <div className="space-y-2">
                {kicker ? <div className="text-sm font-medium leading-6 text-white/82 sm:text-base">{kicker}</div> : null}
                <h1 className="max-w-[12ch] text-[2rem] font-bold leading-[1.02] tracking-[-0.03em] text-white sm:text-[2.45rem] md:text-5xl">{title}</h1>
                {description ? <div className="max-w-3xl text-sm leading-6 text-white/80 sm:text-[15px] sm:leading-7">{description}</div> : null}
              </div>
            </div>
          </div>
          {actions ? <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">{actions}</div> : null}
        </div>
        {aside ? <div className="self-start rounded-[24px] border border-white/10 bg-black/18 p-3.5 backdrop-blur sm:rounded-[26px] sm:p-4">{aside}</div> : null}
      </div>
    </section>
  );
}
