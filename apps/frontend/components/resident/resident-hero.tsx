import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

type ResidentHeroProps = {
  eyebrow?: React.ReactNode;
  eyebrowIcon?: React.ReactNode | false;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  floatingCard?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  shellClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  floatingCardClassName?: string;
  bodyClassName?: string;
  density?: 'default' | 'compact';
};

export function ResidentHero({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  badge,
  floatingCard,
  children,
  className,
  shellClassName,
  headerClassName,
  titleClassName,
  subtitleClassName,
  floatingCardClassName,
  bodyClassName,
  density = 'default',
}: ResidentHeroProps) {
  const compact = density === 'compact';
  const resolvedEyebrowIcon =
    eyebrowIcon === undefined ? <Sparkles className="h-3.5 w-3.5" strokeWidth={1.9} /> : eyebrowIcon;

  return (
    <div
      className={cn(
        'glass-surface-strong overflow-hidden shadow-[0_34px_80px_rgba(44,28,9,0.14)]',
        compact ? 'rounded-[30px]' : 'rounded-[34px]',
        className,
      )}
    >
      <div
        className={cn(
          'resident-profile-hero-light relative text-foreground',
          compact ? 'px-4 pb-10 pt-5' : 'px-5 pb-14 pt-6',
          shellClassName,
        )}
      >
        <ResidentHeroPattern />
        <div className={cn('relative z-10 flex items-start justify-between gap-3', headerClassName)}>
          <div className="min-w-0 text-right">
            {eyebrow ? (
              <div
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border border-primary/12 bg-white/72 font-semibold tracking-[0.12em] text-primary',
                  compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1 text-[11px]',
                )}
              >
                {resolvedEyebrowIcon}
                <span>{eyebrow}</span>
              </div>
            ) : null}
            <h1 className={cn(compact ? 'mt-1.5 text-[24px]' : 'mt-2 text-[28px]', 'font-black leading-none text-foreground', titleClassName)}>{title}</h1>
            {subtitle ? (
              <div
                className={cn(
                  compact ? 'mt-1 max-w-[18rem] text-[13px] leading-5.5' : 'mt-1.5 max-w-[18rem] text-sm leading-6',
                  'text-secondary-foreground',
                  subtitleClassName,
                )}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
      </div>

      {floatingCard ? (
        <div className={cn('relative', compact ? 'px-4 pb-4' : 'px-5 pb-5')}>
          <div
            className={cn(
              'glass-surface shadow-[0_26px_56px_rgba(44,28,9,0.14)]',
              compact ? '-mt-7 rounded-[26px] p-3.5' : '-mt-10 rounded-[30px] p-4',
              floatingCardClassName,
            )}
          >
            {floatingCard}
          </div>
        </div>
      ) : null}

      {children ? <div className={cn(compact ? 'px-4 pb-4' : 'px-5 pb-5', bodyClassName)}>{children}</div> : null}
    </div>
  );
}

function ResidentHeroPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -end-10 top-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(224,182,89,0.28),rgba(224,182,89,0)_72%)]" />
      <div className="absolute -start-6 bottom-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(14,74,123,0.08),rgba(14,74,123,0)_74%)]" />
      <div className="absolute -end-6 top-4 h-24 w-24 rounded-[2rem] bg-primary/8" />
      <div className="absolute end-20 top-0 h-20 w-20 rounded-b-full rounded-t-[1.5rem] bg-primary/12" />
      <div className="absolute start-8 top-6 h-16 w-16 rounded-full border-[14px] border-primary/12 border-b-transparent border-s-transparent" />
      <div className="absolute start-20 top-16 h-28 w-28 rounded-full bg-[hsl(var(--gold-300)/0.18)]" />
      <div className="absolute bottom-6 start-0 h-16 w-32 rounded-e-full bg-primary/8" />
      <div className="absolute bottom-0 end-14 h-20 w-20 rounded-t-full bg-[hsl(var(--gold-300)/0.18)]" />
      <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,rgba(224,182,89,0.08))]" />
    </div>
  );
}
