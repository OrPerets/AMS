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
}: ResidentHeroProps) {
  const resolvedEyebrowIcon =
    eyebrowIcon === undefined ? <Sparkles className="h-3.5 w-3.5" strokeWidth={1.9} /> : eyebrowIcon;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,251,244,0.99)_0%,rgba(255,255,255,0.97)_42%,rgba(249,243,234,0.98)_100%)] shadow-[0_34px_80px_rgba(44,28,9,0.14)]',
        className,
      )}
    >
      <div
        className={cn(
          'resident-profile-hero-surface relative px-5 pb-12 pt-5 text-white',
          shellClassName,
        )}
      >
        <ResidentHeroPattern />
        <div className={cn('relative z-10 flex items-start justify-between gap-3', headerClassName)}>
          <div className="min-w-0 text-right">
            {eyebrow ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-white/82">
                {resolvedEyebrowIcon}
                <span>{eyebrow}</span>
              </div>
            ) : null}
            <h1 className={cn('mt-2 text-[28px] font-black leading-none text-white', titleClassName)}>{title}</h1>
            {subtitle ? (
              <div className={cn('mt-1.5 max-w-[18rem] text-sm leading-6 text-white/76', subtitleClassName)}>{subtitle}</div>
            ) : null}
          </div>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
      </div>

      {floatingCard ? (
        <div className="relative px-5 pb-5">
          <div
            className={cn(
              '-mt-10 rounded-[30px] border border-primary/14 bg-white/95 p-4 shadow-[0_26px_56px_rgba(44,28,9,0.14)] backdrop-blur-sm',
              floatingCardClassName,
            )}
          >
            {floatingCard}
          </div>
        </div>
      ) : null}

      {children ? <div className={cn('px-5 pb-5', bodyClassName)}>{children}</div> : null}
    </div>
  );
}

function ResidentHeroPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(255,236,185,0.48),rgba(255,236,185,0)_70%)]" />
      <div className="absolute -left-6 bottom-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),rgba(255,255,255,0)_72%)]" />
      <div className="absolute -right-6 top-4 h-24 w-24 rounded-[2rem] bg-white/10" />
      <div className="absolute right-20 top-0 h-20 w-20 rounded-b-full rounded-t-[1.5rem] bg-primary/80" />
      <div className="absolute left-8 top-6 h-16 w-16 rounded-full border-[14px] border-white/18 border-b-transparent border-l-transparent" />
      <div className="absolute left-20 top-16 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute bottom-6 left-0 h-16 w-32 rounded-r-full bg-white/10" />
      <div className="absolute bottom-0 right-14 h-20 w-20 rounded-t-full bg-white/14" />
      <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.1))]" />
    </div>
  );
}
