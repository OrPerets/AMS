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
      <div className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
        <div className="space-y-6">
          <div className="space-y-3">
            {eyebrow ? <div className="flex flex-wrap items-center gap-3">{eyebrow}</div> : null}
            <div className="space-y-3">
              <div className="h-px w-20 brand-divider" />
              <div className="space-y-2">
                {kicker ? <div className="text-lg font-medium text-white/72">{kicker}</div> : null}
                <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">{title}</h1>
                {description ? <div className="max-w-3xl text-base leading-7 text-white/72">{description}</div> : null}
              </div>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {aside ? <div className="self-start rounded-[26px] border border-white/10 bg-white/5 p-4 backdrop-blur">{aside}</div> : null}
      </div>
    </section>
  );
}
