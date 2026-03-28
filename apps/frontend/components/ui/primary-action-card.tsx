import * as React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, CircleAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useMobileDepthEffect, useTouchHoldLift } from './mobile-card-effects';
import { MOTION_DISTANCE, MOTION_SPRING } from '../../lib/motion-tokens';
import { resolveRouteTransitionTokensByHref } from '../../lib/route-transition-contract';

type PrimaryActionTone = 'default' | 'warning' | 'danger' | 'success';
type PrimaryActionPulseMetric = {
  id: string;
  label: string;
  value: string | number;
  meta?: string;
  tone?: PrimaryActionTone;
};

export function PrimaryActionCard({
  eyebrow,
  title,
  description,
  ctaLabel,
  href,
  onClick,
  onCtaClick,
  tone = 'default',
  secondaryAction,
  supportingContent,
  className,
  mobileHomeEffect = false,
  visualStyle = 'default',
  density = 'default',
  pulseMetrics,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  onClick?: () => void;
  onCtaClick?: () => void;
  tone?: PrimaryActionTone;
  secondaryAction?: React.ReactNode;
  supportingContent?: React.ReactNode;
  className?: string;
  mobileHomeEffect?: boolean;
  visualStyle?: 'default' | 'resident' | 'pm' | 'admin';
  density?: 'default' | 'compact';
  pulseMetrics?: PrimaryActionPulseMetric[];
}) {
  const reducedMotion = useReducedMotion();
  const Icon = tone === 'success' ? CheckCircle2 : CircleAlert;
  const depthRef = useMobileDepthEffect(mobileHomeEffect);
  const sharedTransitionTokens = resolveRouteTransitionTokensByHref(href);
  const iconLayoutId = reducedMotion ? undefined : sharedTransitionTokens?.icon;
  const badgeLayoutId = reducedMotion ? undefined : sharedTransitionTokens?.badge;
  const titleLayoutId = reducedMotion ? undefined : sharedTransitionTokens?.title;
  const hold = useTouchHoldLift(true);

  const panel = (
    <motion.div
      ref={depthRef as React.Ref<HTMLDivElement>}
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      animate={hold.isHolding && !reducedMotion ? { y: -MOTION_DISTANCE.xxs, scale: 1.01 } : { y: 0, scale: 1 }}
      transition={MOTION_SPRING.card}
      className={cn(
        'overflow-hidden border border-s-4 text-right transition-[transform,box-shadow,filter] duration-300',
        density === 'compact' ? 'rounded-2xl p-3 md:rounded-[22px] md:p-3' : 'rounded-2xl p-3 md:rounded-[26px] md:p-3.5',
        visualStyle === 'default' &&
          'border-primary/12 border-s-primary bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,255,0.94)_100%)] shadow-[0_18px_40px_rgba(15,23,42,0.10)]',
        visualStyle === 'resident' &&
          'border-primary/18 border-s-primary bg-[linear-gradient(180deg,rgba(255,249,240,0.98)_0%,rgba(255,255,255,0.94)_52%,rgba(248,243,232,0.92)_100%)] shadow-[0_20px_44px_rgba(84,58,15,0.12)]',
        visualStyle === 'pm' &&
          'border-primary/14 border-s-primary bg-[linear-gradient(180deg,rgba(255,250,244,0.98)_0%,rgba(255,255,255,0.95)_54%,rgba(247,242,233,0.92)_100%)] shadow-[0_20px_44px_rgba(84,58,15,0.10)]',
        visualStyle === 'admin' &&
          'border-primary/20 border-s-primary bg-[linear-gradient(180deg,rgba(255,248,238,0.99)_0%,rgba(255,255,255,0.95)_58%,rgba(247,241,229,0.94)_100%)] shadow-[0_24px_54px_rgba(84,58,15,0.14)]',
        tone === 'warning' && 'border-s-warning',
        tone === 'danger' && 'border-s-destructive',
        tone === 'success' && 'border-s-success',
        mobileHomeEffect &&
          '[box-shadow:0_calc(12px*var(--mobile-card-depth,0))_32px_rgba(84,58,15,0.12)] [filter:saturate(calc(1+var(--mobile-card-depth,0)*0.08))] [transform:translateY(calc(var(--mobile-card-depth,0)*-3px))]',
        hold.isHolding && 'shadow-[0_18px_40px_rgba(15,23,42,0.14)] ring-1 ring-primary/10',
        className,
      )}
      data-testid="primary-action-card"
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
            <motion.span
              layoutId={iconLayoutId}
              initial={reducedMotion ? { opacity: 0.94 } : false}
              animate={reducedMotion ? { opacity: 1 } : undefined}
              transition={reducedMotion ? { duration: 0.2, ease: 'easeOut' } : undefined}
              className="mt-0.5 shrink-0"
            >
              <Icon
                className={cn(
                  'h-4 w-4',
                  tone === 'warning' && 'text-warning',
                  tone === 'danger' && 'text-destructive',
                  tone === 'success' && 'text-success',
                  tone === 'default' && 'text-primary',
                )}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </motion.span>
            <div className="min-w-0">
              <motion.div
                layoutId={titleLayoutId}
                initial={reducedMotion ? { opacity: 0.94 } : false}
                animate={reducedMotion ? { opacity: 1 } : undefined}
                transition={reducedMotion ? { duration: 0.2, ease: 'easeOut' } : undefined}
                className={cn(
                  density === 'compact' ? 'text-[14px] leading-5 sm:text-[15px]' : 'text-[15px] leading-5 sm:text-base',
                  'font-semibold',
                  'text-foreground',
                )}
              >
                {title}
              </motion.div>
              <div
                className={cn(
                  density === 'compact' ? 'line-clamp-1 text-[11px] leading-4.5 sm:text-[12px]' : 'line-clamp-2 text-[12px] leading-4.5 sm:text-[13px] sm:leading-5',
                  'text-secondary-foreground',
                )}
              >
                {description}
              </div>
              {pulseMetrics?.length ? (
                <div className={cn('mt-2 grid gap-2', pulseMetrics.length > 1 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1')}>
                  {pulseMetrics.slice(0, 3).map((metric) => (
                    <div
                      key={metric.id}
                      className="rounded-[16px] border border-primary/10 bg-background/76 px-2.5 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.62)]"
                    >
                      <div className="text-[10px] font-semibold text-secondary-foreground">{metric.label}</div>
                      <div
                        className={cn(
                          'mt-1 text-[15px] font-black leading-none tabular-nums',
                          metric.tone === 'danger' && 'text-destructive',
                          metric.tone === 'warning' && 'text-warning',
                          metric.tone === 'success' && 'text-success',
                          (!metric.tone || metric.tone === 'default') && 'text-foreground',
                        )}
                      >
                        <bdi>{metric.value}</bdi>
                      </div>
                      {metric.meta ? <div className="mt-1 truncate text-[10px] text-secondary-foreground">{metric.meta}</div> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 sm:self-end">
          {href ? (
            <Link
              href={href}
              onClick={onCtaClick}
              className={cn(
                density === 'compact'
                  ? 'inline-flex min-h-[40px] w-full items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-center text-sm font-semibold sm:min-h-[42px] sm:w-auto'
                  : 'inline-flex min-h-[42px] w-full items-center justify-center gap-1 rounded-2xl px-3.5 py-2 text-center text-sm font-semibold sm:min-h-[46px] sm:w-auto',
                visualStyle === 'admin'
                  ? 'gold-sheen-button'
                  : 'gold-sheen-button',
              )}
              data-accent-sheen="true"
              data-testid="primary-action-cta"
            >
              <motion.span
                layoutId={badgeLayoutId}
                initial={reducedMotion ? { opacity: 0.92 } : false}
                animate={reducedMotion ? { opacity: 1 } : undefined}
                transition={reducedMotion ? { duration: 0.2, ease: 'easeOut' } : undefined}
              >
                {ctaLabel}
              </motion.span>
              <ArrowUpRight className="icon-directional h-4 w-4" strokeWidth={1.75} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                onCtaClick?.();
                onClick?.();
              }}
              className={cn(
                density === 'compact'
                  ? 'inline-flex min-h-[40px] w-full items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-center text-sm font-semibold sm:min-h-[42px] sm:w-auto'
                  : 'inline-flex min-h-[42px] w-full items-center justify-center gap-1 rounded-2xl px-3.5 py-2 text-center text-sm font-semibold sm:min-h-[46px] sm:w-auto',
                visualStyle === 'admin'
                  ? 'gold-sheen-button'
                  : 'gold-sheen-button',
              )}
              data-accent-sheen="true"
              data-testid="primary-action-cta"
            >
              <motion.span
                layoutId={badgeLayoutId}
                initial={reducedMotion ? { opacity: 0.92 } : false}
                animate={reducedMotion ? { opacity: 1 } : undefined}
                transition={reducedMotion ? { duration: 0.2, ease: 'easeOut' } : undefined}
              >
                {ctaLabel}
              </motion.span>
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
