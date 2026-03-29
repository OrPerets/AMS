"use client";

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING, MOBILE_MOTION_PRESET } from '../../lib/motion-tokens';
import { isMobileInteractionFeatureEnabled } from '../../lib/mobile-interaction-flags';

interface MetricFlipCounterProps {
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatOptions?: Intl.NumberFormatOptions;
  locale?: string;
  accentFlash?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles = {
  sm: 'text-lg font-semibold',
  md: 'text-2xl font-bold',
  lg: 'text-3xl font-bold tracking-tight',
  xl: 'text-4xl font-extrabold tracking-tight',
};

function useAnimatedNumber(target: number, enabled: boolean) {
  const motionValue = useMotionValue(target);
  const spring = useSpring(motionValue, {
    stiffness: MOTION_SPRING.metricFlip.stiffness,
    damping: MOTION_SPRING.metricFlip.damping,
    mass: 0.8,
  });

  React.useEffect(() => {
    if (enabled) {
      motionValue.set(target);
    }
  }, [target, enabled, motionValue]);

  return enabled ? spring : motionValue;
}

export function MetricFlipCounter({
  value,
  previousValue,
  prefix = '',
  suffix = '',
  className,
  formatOptions,
  locale,
  accentFlash = true,
  size = 'md',
}: MetricFlipCounterProps) {
  const reducedMotion = useReducedMotion();
  const flipEnabled = isMobileInteractionFeatureEnabled('mobile-wow-metric-flip');
  const shouldAnimate = flipEnabled && !reducedMotion;
  const [isFlashing, setIsFlashing] = React.useState(false);
  const prevValueRef = React.useRef(value);
  const flashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const animatedValue = useAnimatedNumber(value, shouldAnimate);

  const formatter = React.useMemo(() => {
    return new Intl.NumberFormat(locale, formatOptions);
  }, [locale, formatOptions]);

  const displayTransform = useTransform(animatedValue, (v) => {
    return `${prefix}${formatter.format(Math.round(v))}${suffix}`;
  });

  React.useEffect(() => {
    if (prevValueRef.current !== value && shouldAnimate && accentFlash) {
      prevValueRef.current = value;
      setIsFlashing(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setIsFlashing(false), 600);
    } else {
      prevValueRef.current = value;
    }
  }, [value, shouldAnimate, accentFlash]);

  React.useEffect(() => {
    return () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); };
  }, []);

  const delta = previousValue !== undefined ? value - previousValue : undefined;
  const direction = delta !== undefined ? (delta > 0 ? 'up' : delta < 0 ? 'down' : null) : null;

  if (!shouldAnimate) {
    return (
      <span className={cn(sizeStyles[size], className)}>
        {prefix}{formatter.format(value)}{suffix}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'relative inline-flex items-baseline gap-1.5',
        sizeStyles[size],
        className,
      )}
    >
      {isFlashing && (
        <motion.span
          className={cn(
            'absolute inset-0 -m-1 rounded-lg',
            direction === 'up' ? 'bg-success/20' : direction === 'down' ? 'bg-destructive/15' : 'bg-primary/12',
          )}
          initial={{ opacity: 1, scale: 0.95 }}
          animate={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: MOTION_EASE.standardOut }}
          aria-hidden
        />
      )}
      <motion.span className="relative tabular-nums">
        {displayTransform}
      </motion.span>
      <AnimatePresence mode="popLayout">
        {direction && delta !== undefined && (
          <motion.span
            key={`delta-${value}`}
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.8 }}
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.emphasized }}
            className={cn(
              'text-[0.45em] font-semibold',
              direction === 'up' ? 'text-success' : 'text-destructive',
            )}
          >
            {direction === 'up' ? '+' : ''}{formatter.format(delta)}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
