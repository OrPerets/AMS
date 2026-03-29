"use client";

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { MOBILE_MOTION_PRESET, MOTION_DURATION, MOTION_STAGGER, MOTION_EASE } from '../../lib/motion-tokens';
import { isMobileInteractionFeatureEnabled } from '../../lib/mobile-interaction-flags';
import { Skeleton } from './skeleton';

type LoadState = 'skeleton' | 'content' | 'error';

interface SkeletonToContentProps {
  isLoading: boolean;
  isError?: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  errorFallback?: React.ReactNode;
  className?: string;
  stageIndex?: number;
}

export function SkeletonToContent({
  isLoading,
  isError = false,
  skeleton,
  children,
  errorFallback,
  className,
  stageIndex = 0,
}: SkeletonToContentProps) {
  const reducedMotion = useReducedMotion();
  const featureEnabled = isMobileInteractionFeatureEnabled('mobile-wow-skeleton-lifecycle');
  const shouldAnimate = featureEnabled && !reducedMotion;

  const state: LoadState = isError ? 'error' : isLoading ? 'skeleton' : 'content';

  if (!shouldAnimate) {
    if (state === 'error' && errorFallback) return <>{errorFallback}</>;
    if (state === 'skeleton') return <>{skeleton}</>;
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait" initial={false}>
        {state === 'skeleton' && (
          <motion.div
            key="skeleton"
            initial={false}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.standardOut }}
          >
            {skeleton}
          </motion.div>
        )}
        {state === 'content' && (
          <motion.div
            key="content"
            initial={MOBILE_MOTION_PRESET.skeletonToContent.initial}
            animate={MOBILE_MOTION_PRESET.skeletonToContent.animate}
            transition={{
              ...MOBILE_MOTION_PRESET.skeletonToContent.transition,
              delay: stageIndex * MOTION_STAGGER.standard,
            }}
          >
            {children}
          </motion.div>
        )}
        {state === 'error' && errorFallback && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: MOTION_DURATION.fast }}
          >
            {errorFallback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface StagedRevealProps {
  isLoading: boolean;
  children: React.ReactNode[];
  skeletons?: React.ReactNode[];
  className?: string;
  gap?: string;
}

export function StagedReveal({
  isLoading,
  children,
  skeletons,
  className,
  gap = 'gap-4',
}: StagedRevealProps) {
  return (
    <div className={cn('flex flex-col', gap, className)}>
      {React.Children.map(children, (child, index) => (
        <SkeletonToContent
          key={index}
          isLoading={isLoading}
          skeleton={
            skeletons?.[index] ?? (
              <Skeleton className="h-24 rounded-2xl" variant="morph" />
            )
          }
          stageIndex={index}
        >
          {child}
        </SkeletonToContent>
      ))}
    </div>
  );
}

interface ProgressiveCardRevealProps {
  isLoading: boolean;
  heroSkeleton?: React.ReactNode;
  children: React.ReactNode;
  heroContent: React.ReactNode;
  className?: string;
}

export function ProgressiveCardReveal({
  isLoading,
  heroSkeleton,
  children,
  heroContent,
  className,
}: ProgressiveCardRevealProps) {
  const reducedMotion = useReducedMotion();
  const featureEnabled = isMobileInteractionFeatureEnabled('mobile-wow-skeleton-lifecycle');
  const shouldAnimate = featureEnabled && !reducedMotion;

  return (
    <div className={cn('space-y-4', className)}>
      <SkeletonToContent
        isLoading={isLoading}
        skeleton={
          heroSkeleton ?? <Skeleton className="h-48 rounded-[28px]" variant="morph" />
        }
        stageIndex={0}
      >
        {shouldAnimate ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: MOTION_DURATION.heroReveal, ease: MOTION_EASE.emphasized }}
          >
            {heroContent}
          </motion.div>
        ) : (
          heroContent
        )}
      </SkeletonToContent>
      {children}
    </div>
  );
}
