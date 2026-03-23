import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn, getStatusLabel } from '../../lib/utils';

export type TimelineDotTone = 'inactive' | 'active' | 'complete';

export function StatusTimelineDots({
  currentStatus,
  steps,
  className,
  locale = 'he',
}: {
  currentStatus: string;
  steps: readonly string[];
  className?: string;
  locale?: string;
}) {
  const reducedMotion = useReducedMotion();
  const currentIndex = React.useMemo(() => {
    const normalized = currentStatus.toUpperCase();
    const index = steps.findIndex((step) => step.toUpperCase() === normalized);
    return index === -1 ? 0 : index;
  }, [currentStatus, steps]);

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const tone: TimelineDotTone = index < currentIndex ? 'complete' : index === currentIndex ? 'active' : 'inactive';
          const connectorTone = index < currentIndex ? 'complete' : 'inactive';

          return (
            <React.Fragment key={step}>
              <div className="min-w-[68px] flex-1">
                <div className="flex items-center gap-2">
                  <motion.span
                    className={cn(
                      'relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      tone === 'complete' && 'border-success/50 bg-success text-success-foreground',
                      tone === 'active' && 'border-primary/40 bg-primary text-primary-foreground shadow-[0_0_0_6px_rgba(59,130,246,0.08)]',
                      tone === 'inactive' && 'border-subtle-border bg-muted/35 text-transparent',
                    )}
                    animate={
                      tone === 'active' && !reducedMotion
                        ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0 0 rgba(59,130,246,0.18)', '0 0 0 8px rgba(59,130,246,0.04)', '0 0 0 0 rgba(59,130,246,0)'] }
                        : { scale: 1, boxShadow: '0 0 0 0 rgba(0,0,0,0)' }
                    }
                    transition={tone === 'active' && !reducedMotion ? { duration: 1.25, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  </motion.span>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-tertiary">שלב {index + 1}</div>
                    <div className={cn('mt-0.5 text-xs font-semibold sm:text-sm', tone === 'inactive' ? 'text-muted-foreground' : 'text-foreground')}>
                      {getStatusLabel(step, locale)}
                    </div>
                  </div>
                </div>
              </div>
              {index < steps.length - 1 ? (
                <motion.div
                  className={cn(
                    'h-[2px] flex-1 rounded-full',
                    connectorTone === 'complete' ? 'bg-success/60' : 'bg-subtle-border',
                  )}
                  initial={false}
                  animate={connectorTone === 'complete' && !reducedMotion ? { opacity: [0.45, 1, 0.65] } : { opacity: 1 }}
                  transition={connectorTone === 'complete' && !reducedMotion ? { duration: 0.9, ease: 'easeInOut' } : { duration: 0.2 }}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
