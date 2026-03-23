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
  className,
  mobileHomeEffect = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  onClick?: () => void;
  tone?: PrimaryActionTone;
  secondaryAction?: React.ReactNode;
  className?: string;
  mobileHomeEffect?: boolean;
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
        'overflow-hidden rounded-[24px] border border-primary/12 border-s-4 border-s-primary bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,255,0.94)_100%)] p-3.5 text-right shadow-[0_18px_40px_rgba(15,23,42,0.10)] transition-[transform,box-shadow,filter] duration-300 sm:rounded-[28px] sm:p-4',
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          {eyebrow ? <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-foreground">{eyebrow}</div> : null}
          <div className="flex items-start gap-2.5">
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
              <div className="text-[15px] font-semibold leading-6 text-foreground sm:text-base">{title}</div>
              <div className="text-[13px] leading-5 text-secondary-foreground sm:line-clamp-2">{description}</div>
            </div>
          </div>
        </div>

        <div className="shrink-0 sm:self-end">
          {href ? (
            <Link
              href={href}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-1 rounded-2xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-[0_10px_22px_rgba(59,130,246,0.24)] sm:min-h-[48px] sm:w-auto"
            >
              {ctaLabel}
              <ArrowUpRight className="icon-directional h-4 w-4" strokeWidth={1.75} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onClick}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-1 rounded-2xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-[0_10px_22px_rgba(59,130,246,0.24)] sm:min-h-[48px] sm:w-auto"
            >
              {ctaLabel}
              <ArrowUpRight className="icon-directional h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
      {secondaryAction ? <div className="mt-3 flex justify-stretch sm:justify-end">{secondaryAction}</div> : null}
    </motion.div>
  );

  return panel;
}
