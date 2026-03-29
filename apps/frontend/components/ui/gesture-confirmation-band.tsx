"use client";

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { INTERACTION_THRESHOLDS, MOTION_DURATION, MOTION_EASE } from '../../lib/motion-tokens';
import { isMobileInteractionFeatureEnabled } from '../../lib/mobile-interaction-flags';

interface GestureConfirmationBandProps {
  offset: number;
  commitThreshold?: number;
  maxDistance?: number;
  direction: 'start' | 'end';
  tone?: 'primary' | 'success' | 'warning' | 'danger';
  isRTL?: boolean;
  className?: string;
}

const toneColors: Record<string, { bg: string; border: string }> = {
  primary: { bg: 'bg-primary/10', border: 'border-primary/30' },
  success: { bg: 'bg-success/10', border: 'border-success/30' },
  warning: { bg: 'bg-warning/10', border: 'border-warning/30' },
  danger: { bg: 'bg-destructive/10', border: 'border-destructive/30' },
};

export function GestureConfirmationBand({
  offset,
  commitThreshold = INTERACTION_THRESHOLDS.swipeCommit,
  maxDistance = INTERACTION_THRESHOLDS.swipeMaxDistance,
  direction,
  tone = 'primary',
  isRTL = false,
  className,
}: GestureConfirmationBandProps) {
  const reducedMotion = useReducedMotion();
  const featureEnabled = isMobileInteractionFeatureEnabled('mobile-wow-gesture-polish');

  if (!featureEnabled) return null;

  const absoluteOffset = Math.abs(offset);
  const progress = Math.min(absoluteOffset / commitThreshold, 1);
  const isCommitReady = absoluteOffset >= commitThreshold;
  const colors = toneColors[tone] || toneColors.primary;

  const bandSide = direction === 'start'
    ? (isRTL ? 'right-0' : 'left-0')
    : (isRTL ? 'left-0' : 'right-0');

  if (absoluteOffset < INTERACTION_THRESHOLDS.swipeReveal) return null;

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-y-0 z-10',
        bandSide,
        className,
      )}
      style={{ width: Math.min(absoluteOffset, maxDistance) }}
      aria-hidden
    >
      {reducedMotion ? (
        <div
          className={cn(
            'h-full border-2 transition-colors',
            colors.bg,
            isCommitReady ? colors.border : 'border-transparent',
          )}
          style={{ opacity: progress * 0.8 }}
        />
      ) : (
        <motion.div
          className={cn(
            'h-full border-2',
            colors.bg,
            isCommitReady ? colors.border : 'border-transparent',
          )}
          initial={{ opacity: 0 }}
          animate={{
            opacity: progress * 0.8,
            scale: isCommitReady ? [1, 1.02, 1] : 1,
          }}
          transition={{
            opacity: { duration: 0 },
            scale: isCommitReady
              ? { duration: MOTION_DURATION.fast, ease: MOTION_EASE.standardOut }
              : { duration: 0 },
          }}
        />
      )}
      {isCommitReady && !reducedMotion && (
        <motion.div
          className={cn(
            'absolute inset-0 border-2',
            colors.border,
          )}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', repeat: Infinity }}
        />
      )}
    </div>
  );
}
