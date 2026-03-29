"use client";

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { MOTION_DURATION, MOTION_EASE, MOBILE_MOTION_PRESET } from '../../lib/motion-tokens';
import { isMobileInteractionFeatureEnabled } from '../../lib/mobile-interaction-flags';

type DiffDirection = 'up' | 'down' | 'neutral';

interface LiveDiffValueProps {
  value: string | number;
  previousValue?: string | number;
  className?: string;
  formatValue?: (value: string | number) => string;
  highlightDuration?: number;
  showDirection?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function getDiffDirection(current: string | number, previous?: string | number): DiffDirection {
  if (previous === undefined || previous === current) return 'neutral';
  const numCurrent = typeof current === 'number' ? current : parseFloat(String(current));
  const numPrevious = typeof previous === 'number' ? previous : parseFloat(String(previous));
  if (isNaN(numCurrent) || isNaN(numPrevious)) {
    return current !== previous ? 'up' : 'neutral';
  }
  return numCurrent > numPrevious ? 'up' : numCurrent < numPrevious ? 'down' : 'neutral';
}

const diffTintClasses: Record<DiffDirection, string> = {
  up: 'bg-success/15',
  down: 'bg-destructive/12',
  neutral: 'bg-primary/8',
};

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl font-bold',
};

export function LiveDiffValue({
  value,
  previousValue,
  className,
  formatValue,
  highlightDuration = MOTION_DURATION.diffDecay * 1000,
  showDirection = true,
  size = 'md',
}: LiveDiffValueProps) {
  const reducedMotion = useReducedMotion();
  const diffEnabled = isMobileInteractionFeatureEnabled('mobile-wow-live-diff');
  const [isHighlighted, setIsHighlighted] = React.useState(false);
  const [direction, setDirection] = React.useState<DiffDirection>('neutral');
  const prevRef = React.useRef(value);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    if (prevRef.current !== value) {
      const dir = getDiffDirection(value, prevRef.current);
      prevRef.current = value;
      if (dir !== 'neutral' && diffEnabled) {
        setDirection(dir);
        setIsHighlighted(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsHighlighted(false);
          setDirection('neutral');
        }, highlightDuration);
      }
    }
  }, [value, diffEnabled, highlightDuration]);

  React.useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const displayValue = formatValue ? formatValue(value) : String(value);

  const shouldAnimate = diffEnabled && !reducedMotion;

  return (
    <span
      className={cn(
        'relative inline-flex items-center gap-1 rounded-md px-1 transition-colors',
        sizeClasses[size],
        isHighlighted && diffTintClasses[direction],
        className,
      )}
      style={{
        transitionDuration: isHighlighted ? '150ms' : `${highlightDuration}ms`,
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={shouldAnimate ? { opacity: 0, y: direction === 'up' ? 8 : direction === 'down' ? -8 : 0, filter: 'blur(2px)' } : false}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={shouldAnimate ? { opacity: 0, y: direction === 'up' ? -8 : 8, filter: 'blur(2px)' } : undefined}
          transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.emphasized }}
          className="inline-block"
        >
          {displayValue}
        </motion.span>
      </AnimatePresence>
      {showDirection && isHighlighted && direction !== 'neutral' && (
        <motion.span
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          className={cn(
            'text-[0.65em]',
            direction === 'up' ? 'text-success' : 'text-destructive',
          )}
          aria-hidden
        >
          {direction === 'up' ? '▲' : '▼'}
        </motion.span>
      )}
    </span>
  );
}

interface LiveDiffStatusProps {
  status: string;
  previousStatus?: string;
  className?: string;
  statusColorMap?: Record<string, string>;
}

export function LiveDiffStatus({
  status,
  previousStatus,
  className,
  statusColorMap,
}: LiveDiffStatusProps) {
  const reducedMotion = useReducedMotion();
  const diffEnabled = isMobileInteractionFeatureEnabled('mobile-wow-live-diff');
  const [isHighlighted, setIsHighlighted] = React.useState(false);
  const prevRef = React.useRef(status);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    if (prevRef.current !== status && diffEnabled) {
      prevRef.current = status;
      setIsHighlighted(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsHighlighted(false), MOTION_DURATION.diffDecay * 1000);
    }
  }, [status, diffEnabled]);

  React.useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const color = statusColorMap?.[status];

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={status}
        initial={diffEnabled && !reducedMotion ? { opacity: 0, scale: 0.9, filter: 'blur(2px)' } : false}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={diffEnabled && !reducedMotion ? { opacity: 0, scale: 0.9, filter: 'blur(2px)' } : undefined}
        transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.emphasized }}
        className={cn(
          'inline-block rounded-md px-1.5 py-0.5 text-sm transition-colors',
          isHighlighted && 'bg-primary/10 ring-1 ring-primary/20',
          className,
        )}
        style={{
          transitionDuration: isHighlighted ? '150ms' : `${MOTION_DURATION.diffDecay * 1000}ms`,
          color,
        }}
      >
        {status}
      </motion.span>
    </AnimatePresence>
  );
}
