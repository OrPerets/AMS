import Link from 'next/link';
import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAnimatedNumber } from '../../hooks/use-animated-number';

type StatusMetric = {
  id: string;
  label: string;
  value: string | number;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  onClick?: () => void;
};

type StatusContextChip = {
  id: string;
  label: string;
  href?: string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
};

const metricPriority: Record<NonNullable<StatusMetric['tone']>, number> = {
  danger: 4,
  warning: 3,
  success: 2,
  default: 1,
};

function AnimatedMetricValue({ value }: { value: string | number }) {
  if (typeof value !== 'number') {
    return <bdi>{value}</bdi>;
  }

  const animated = useAnimatedNumber(value);
  return <bdi>{Math.round(animated)}</bdi>;
}

export function CompactStatusStrip({
  roleLabel,
  icon,
  metrics,
  contextChips,
  className,
  tone = 'default',
}: {
  roleLabel: string;
  icon?: React.ReactNode;
  metrics: StatusMetric[];
  contextChips?: StatusContextChip[];
  className?: string;
  tone?: 'default' | 'resident' | 'pm' | 'admin';
}) {
  const reducedMotion = useReducedMotion();
  const [pulsingMetricId, setPulsingMetricId] = React.useState<string | null>(null);

  const highlightedMetricId = React.useMemo(() => {
    const visibleMetrics = metrics.slice(0, 2);
    if (!visibleMetrics.length) return null;

    return [...visibleMetrics]
      .sort((left, right) => {
        const rightPriority = metricPriority[right.tone ?? 'default'];
        const leftPriority = metricPriority[left.tone ?? 'default'];
        return rightPriority - leftPriority;
      })[0]?.id ?? null;
  }, [metrics]);

  React.useEffect(() => {
    if (reducedMotion || !highlightedMetricId) {
      setPulsingMetricId(null);
      return;
    }

    setPulsingMetricId(highlightedMetricId);
    const timeout = window.setTimeout(() => {
      setPulsingMetricId((current) => (current === highlightedMetricId ? null : current));
    }, 3600);

    return () => window.clearTimeout(timeout);
  }, [highlightedMetricId, reducedMotion]);

  return (
    <section
      className={cn(
        'flex min-h-[48px] flex-col items-stretch gap-2 overflow-hidden rounded-[20px] border px-3 py-2.5 shadow-elevation-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-2 sm:pe-4',
        tone === 'default' && 'border-subtle-border bg-card',
        tone === 'resident' &&
          'border-primary/14 bg-[linear-gradient(180deg,rgba(255,251,245,0.96)_0%,rgba(255,255,255,0.92)_100%)] shadow-[0_14px_30px_rgba(84,58,15,0.08)]',
        tone === 'pm' &&
          'border-[hsl(var(--subtle-border))] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(247,243,234,0.94)_100%)] shadow-[0_12px_26px_rgba(44,28,9,0.06)]',
        tone === 'admin' &&
          'border-primary/16 bg-[linear-gradient(180deg,rgba(255,249,240,0.98)_0%,rgba(255,255,255,0.94)_58%,rgba(248,243,232,0.92)_100%)] shadow-[0_18px_36px_rgba(84,58,15,0.12)]',
        className,
      )}
      aria-label={roleLabel}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            'flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-[14px]',
            'bg-primary/10 text-primary',
          )}
          aria-hidden="true"
        >
          {icon ?? <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />}
        </span>
        <span className="truncate text-[13px] font-semibold text-foreground">
          {roleLabel}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5 text-right sm:ms-3 sm:min-w-[min(18rem,100%)]">
        {contextChips?.length ? (
          <div className="flex flex-wrap justify-end gap-1.5">
            {contextChips.slice(0, 2).map((chip) =>
              chip.href ? (
                <Link
                  key={chip.id}
                  href={chip.href}
                  className={cn(
                    'inline-flex min-h-[28px] items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    chip.tone === 'danger'
                      ? 'border-destructive/18 bg-destructive/8 text-destructive'
                      : chip.tone === 'warning'
                        ? 'border-warning/18 bg-warning/8 text-warning'
                        : chip.tone === 'success'
                          ? 'border-success/18 bg-success/8 text-success'
                          : 'border-primary/12 bg-primary/8 text-primary',
                  )}
                >
                  {chip.label}
                </Link>
              ) : (
                <span
                  key={chip.id}
                  className={cn(
                    'inline-flex min-h-[28px] items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold',
                    chip.tone === 'danger'
                      ? 'border-destructive/18 bg-destructive/8 text-destructive'
                      : chip.tone === 'warning'
                        ? 'border-warning/18 bg-warning/8 text-warning'
                        : chip.tone === 'success'
                          ? 'border-success/18 bg-success/8 text-success'
                          : 'border-primary/12 bg-primary/8 text-primary',
                  )}
                >
                  {chip.label}
                </span>
              ),
            )}
          </div>
        ) : null}

        <div className="grid min-w-0 grid-cols-2 gap-1.5 text-right sm:flex sm:flex-nowrap">
        {metrics.slice(0, 2).map((metric, index) => {
          const interactive = typeof metric.onClick === 'function';
          const shouldPulse = pulsingMetricId === metric.id;
          const content = (
            <>
              <span className="text-[10px] font-semibold text-secondary-foreground">
                {metric.label}
              </span>
              <motion.span
                className={cn(
                  'relative text-[15px] font-extrabold tabular-nums text-start',
                  metric.tone === 'danger' && 'text-destructive',
                  metric.tone === 'warning' && 'text-warning',
                  metric.tone === 'success' && 'text-success',
                  metric.tone === 'default' && 'text-foreground',
                )}
                role="status"
                aria-live="polite"
                animate={
                  shouldPulse && !reducedMotion
                    ? {
                        scale: [1, 1.06, 1],
                        opacity: [1, 0.92, 1],
                      }
                    : { scale: 1, opacity: 1 }
                }
                transition={
                  shouldPulse && !reducedMotion
                    ? {
                        duration: 0.9,
                        repeat: 3,
                        ease: 'easeInOut',
                      }
                    : { duration: 0.2 }
                }
              >
                {shouldPulse && !reducedMotion ? (
                  <motion.span
                    className={cn(
                      'pointer-events-none absolute inset-[-5px] rounded-full',
                      metric.tone === 'danger' && 'bg-destructive/12',
                      metric.tone === 'warning' && 'bg-warning/14',
                      metric.tone === 'success' && 'bg-success/14',
                      (!metric.tone || metric.tone === 'default') && 'bg-primary/10',
                    )}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: [0.12, 0.28, 0], scale: [0.92, 1.18, 1.28] }}
                    transition={{ duration: 0.9, repeat: 3, ease: 'easeOut' }}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative z-[1]">
                  <AnimatedMetricValue value={metric.value} />
                </span>
              </motion.span>
              {interactive ? (
                <ChevronLeft
                  className="icon-directional h-4 w-4 text-muted-foreground"
                  strokeWidth={1.75}
                />
              ) : null}
            </>
          );

          const wrapperClass = cn(
            'inline-flex min-h-[42px] min-w-0 items-center justify-between gap-1 rounded-[16px] border px-2.5 py-1.5 text-right transition-colors',
            tone === 'admin' ? 'border-primary/12 bg-background/84' : 'border-subtle-border/70 bg-background/75',
            shouldPulse && !reducedMotion && 'bg-background/90 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]',
            interactive ? 'cursor-pointer hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2' : '',
            index > 0 && 'sm:border-s sm:border-primary/8 sm:ps-3',
          );

          if (!interactive) {
            return (
              <span key={metric.id} className={wrapperClass}>
                {content}
              </span>
            );
          }

          return (
            <motion.button
              key={metric.id}
              type="button"
              className={wrapperClass}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              onClick={metric.onClick}
              aria-label={`${metric.label} ${metric.value}`}
            >
              {content}
            </motion.button>
          );
        })}
        </div>
      </div>
    </section>
  );
}
