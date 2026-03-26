import * as React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, CircleAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useMobileDepthEffect, useTouchHoldLift } from './mobile-card-effects';

type PrimaryActionTone = 'default' | 'warning' | 'danger' | 'success';

export function PrimaryActionCard({
  eyebrow,
  title,
  description,
  ctaLabel,
  href,
  onClick,
  tone = 'default',
  secondaryAction,
  supportingContent,
  className,
  mobileHomeEffect = false,
  visualStyle = 'default',
  density = 'default',
}: {
  eyebrow?: string;
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  onClick?: () => void;
  tone?: PrimaryActionTone;
  secondaryAction?: React.ReactNode;
  supportingContent?: React.ReactNode;
  className?: string;
  mobileHomeEffect?: boolean;
  visualStyle?: 'default' | 'resident' | 'pm' | 'admin';
  density?: 'default' | 'compact';
}) {
  const reducedMotion = useReducedMotion();
  const Icon = tone === 'success' ? CheckCircle2 : CircleAlert;
  const depthRef = useMobileDepthEffect(mobileHomeEffect);
  const hold = useTouchHoldLift(true);

  const panel = (
    <motion.div
      ref={depthRef as React.Ref<HTMLDivElement>}
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      animate={hold.isHolding && !reducedMotion ? { y: -3, scale: 1.01 } : { y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={cn(
        'overflow-hidden border border-s-4 text-right transition-[transform,box-shadow,filter] duration-300',
        density === 'compact' ? 'rounded-[20px] p-3 sm:rounded-[22px] sm:p-3' : 'rounded-[22px] p-3 sm:rounded-[26px] sm:p-3.5',
        visualStyle === 'default' &&
          'border-primary/12 border-s-primary bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,255,0.94)_100%)] shadow-[0_18px_40px_rgba(15,23,42,0.10)]',
        visualStyle === 'resident' &&
          'border-primary/18 border-s-primary bg-[linear-gradient(180deg,rgba(255,249,240,0.98)_0%,rgba(255,255,255,0.94)_52%,rgba(248,243,232,0.92)_100%)] shadow-[0_20px_44px_rgba(84,58,15,0.12)]',
        visualStyle === 'pm' &&
          'border-[hsl(var(--subtle-border))] border-s-primary bg-[linear-gradient(180deg,rgba(249,246,240,0.98)_0%,rgba(255,255,255,0.94)_100%)] shadow-[0_18px_34px_rgba(44,28,9,0.08)]',
        visualStyle === 'admin' &&
          'border-primary/18 border-s-primary bg-[linear-gradient(180deg,rgba(255,249,240,0.98)_0%,rgba(255,255,255,0.94)_58%,rgba(248,243,232,0.92)_100%)] shadow-[0_24px_54px_rgba(84,58,15,0.12)]',
        tone === 'warning' && 'border-s-warning',
        tone === 'danger' && 'border-s-destructive',
        tone === 'success' && 'border-s-success',
        mobileHomeEffect &&
          'md:shadow-raised [box-shadow:0_calc(12px*var(--mobile-card-depth,0))_32px_rgba(15,23,42,0.12)] [filter:saturate(calc(1+var(--mobile-card-depth,0)*0.08))] [transform:translateY(calc(var(--mobile-card-depth,0)*-3px))]',
        hold.isHolding && 'shadow-[0_18px_40px_rgba(15,23,42,0.14)] ring-1 ring-primary/10',
        className,
      )}
      {...hold.holdProps}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          {eyebrow ? (
            <div className={cn('text-[10px] font-semibold tracking-[0.12em]', visualStyle === 'admin' ? 'text-primary/72' : 'text-secondary-foreground')}>
              {eyebrow}
            </div>
          ) : null}
          <div className="flex items-start gap-2">
            <Icon
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                tone === 'warning' && 'text-warning',
                tone === 'danger' && 'text-destructive',
                tone === 'success' && 'text-success',
                tone === 'default' && 'text-primary',
              )}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div
                className={cn(
                  density === 'compact' ? 'text-[14px] leading-5 sm:text-[15px]' : 'text-[15px] leading-5 sm:text-base',
                  'font-semibold',
                  'text-foreground',
                )}
              >
                {title}
              </div>
              <div
                className={cn(
                  density === 'compact' ? 'line-clamp-1 text-[11px] leading-4.5 sm:text-[12px]' : 'line-clamp-2 text-[12px] leading-4.5 sm:text-[13px] sm:leading-5',
                  'text-secondary-foreground',
                )}
              >
                {description}
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 sm:self-end">
          {href ? (
            <Link
              href={href}
              className={cn(
                density === 'compact'
                  ? 'inline-flex min-h-[40px] w-full items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-center text-sm font-semibold sm:min-h-[42px] sm:w-auto'
                  : 'inline-flex min-h-[42px] w-full items-center justify-center gap-1 rounded-2xl px-3.5 py-2 text-center text-sm font-semibold sm:min-h-[46px] sm:w-auto',
                visualStyle === 'admin'
                  ? 'gold-sheen-button'
                  : 'gold-sheen-button',
              )}
              data-accent-sheen="true"
            >
              {ctaLabel}
              <ArrowUpRight className="icon-directional h-4 w-4" strokeWidth={1.75} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onClick}
              className={cn(
                density === 'compact'
                  ? 'inline-flex min-h-[40px] w-full items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-center text-sm font-semibold sm:min-h-[42px] sm:w-auto'
                  : 'inline-flex min-h-[42px] w-full items-center justify-center gap-1 rounded-2xl px-3.5 py-2 text-center text-sm font-semibold sm:min-h-[46px] sm:w-auto',
                visualStyle === 'admin'
                  ? 'gold-sheen-button'
                  : 'gold-sheen-button',
              )}
              data-accent-sheen="true"
            >
              {ctaLabel}
              <ArrowUpRight className="icon-directional h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
      {supportingContent ? <div className={cn(density === 'compact' ? 'mt-2' : 'mt-2.5')}>{supportingContent}</div> : null}
      {secondaryAction ? <div className={cn(density === 'compact' ? 'mt-2 flex justify-stretch sm:justify-end' : 'mt-2.5 flex justify-stretch sm:justify-end')}>{secondaryAction}</div> : null}
    </motion.div>
  );

  return panel;
}
