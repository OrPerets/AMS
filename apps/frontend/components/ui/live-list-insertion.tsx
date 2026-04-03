"use client";

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { MOBILE_MOTION_PRESET, MOTION_SPRING, MOTION_DURATION } from '../../lib/motion-tokens';
import { isMobileInteractionFeatureEnabled } from '../../lib/mobile-interaction-flags';

interface LiveListInsertionProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  gap?: string;
}

export function LiveListInsertion<T>({
  items,
  keyExtractor,
  renderItem,
  className,
  gap = 'gap-3',
}: LiveListInsertionProps<T>) {
  const reducedMotion = useReducedMotion();
  const choreographyEnabled = isMobileInteractionFeatureEnabled('mobile-wow-insertion-choreography');
  const liveEnabled = isMobileInteractionFeatureEnabled('mobile-interactions-live-choreography');
  const shouldAnimate = (choreographyEnabled || liveEnabled) && !reducedMotion;

  return (
    <div className={cn('flex flex-col', gap, className)}>
      <AnimatePresence initial={false}>
        {items.map((item, index) => {
          const key = keyExtractor(item);
          return shouldAnimate ? (
            <motion.div
              key={key}
              layout
              initial={MOBILE_MOTION_PRESET.liveInsertion.initial}
              animate={MOBILE_MOTION_PRESET.liveInsertion.animate}
              exit={MOBILE_MOTION_PRESET.liveInsertion.exit}
              transition={MOBILE_MOTION_PRESET.liveInsertion.transition}
            >
              {renderItem(item, index)}
            </motion.div>
          ) : (
            <div key={key}>{renderItem(item, index)}</div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
  layoutId?: string;
}

export function AnimatedListItem({ children, className, layoutId }: AnimatedListItemProps) {
  const reducedMotion = useReducedMotion();
  const choreographyEnabled = isMobileInteractionFeatureEnabled('mobile-wow-insertion-choreography');
  const shouldAnimate = choreographyEnabled && !reducedMotion;

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      layout
      layoutId={layoutId}
      initial={MOBILE_MOTION_PRESET.liveInsertion.initial}
      animate={MOBILE_MOTION_PRESET.liveInsertion.animate}
      exit={MOBILE_MOTION_PRESET.liveInsertion.exit}
      transition={MOBILE_MOTION_PRESET.liveInsertion.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
