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
  className,
}: {
  roleLabel: string;
  icon?: React.ReactNode;
  metrics: StatusMetric[];
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <section
      className={cn(
        'flex h-12 items-center justify-between overflow-hidden rounded-2xl border border-subtle-border bg-card px-3 ps-3 pe-4 shadow-elevation-1',
        className,
      )}
      aria-label={roleLabel}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
          {icon ?? <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />}
        </span>
        <span className="truncate text-sm font-semibold text-foreground">{roleLabel}</span>
      </div>

      <div className="ms-3 flex min-w-0 items-center justify-end gap-1.5">
        {metrics.slice(0, 2).map((metric, index) => {
          const interactive = typeof metric.onClick === 'function';
          const content = (
            <>
              <span className="text-[10px] font-semibold text-secondary-foreground">{metric.label}</span>
              <span
                className={cn(
                  'text-sm font-extrabold tabular-nums text-start',
                  metric.tone === 'danger' && 'text-destructive',
                  metric.tone === 'warning' && 'text-warning',
                  metric.tone === 'success' && 'text-success',
                  metric.tone === 'default' && 'text-foreground',
                )}
                role="status"
                aria-live="polite"
              >
                <AnimatedMetricValue value={metric.value} />
              </span>
              {interactive ? <ChevronLeft className="icon-directional h-4 w-4 text-muted-foreground" strokeWidth={1.75} /> : null}
            </>
          );

          const wrapperClass = cn(
            'inline-flex min-w-0 items-center gap-1 rounded-full px-2 py-1 text-center',
            interactive ? 'min-h-[44px] cursor-pointer hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2' : '',
            index > 0 && 'border-s border-primary/8 ps-3',
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
    </section>
  );
}
