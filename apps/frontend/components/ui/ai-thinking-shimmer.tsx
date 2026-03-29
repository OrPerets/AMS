"use client";

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { MOTION_DURATION, MOTION_EASE } from '../../lib/motion-tokens';
import { isMobileInteractionFeatureEnabled } from '../../lib/mobile-interaction-flags';

interface AIThinkingShimmerProps {
  isThinking: boolean;
  label?: string;
  className?: string;
  lines?: number;
  compact?: boolean;
}

export function AIThinkingShimmer({
  isThinking,
  label = 'Generating summary…',
  className,
  lines = 3,
  compact = false,
}: AIThinkingShimmerProps) {
  const reducedMotion = useReducedMotion();
  const featureEnabled = isMobileInteractionFeatureEnabled('mobile-wow-ai-shimmer');

  if (!isThinking) return null;

  const shouldAnimate = featureEnabled && !reducedMotion;

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm',
        compact ? 'p-3' : 'p-4',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="mb-3 flex items-center gap-2">
        {shouldAnimate ? (
          <motion.div
            className="flex gap-1"
            aria-hidden
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.15, 0.8],
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: MOTION_EASE.standardInOut,
                }}
              />
            ))}
          </motion.div>
        ) : (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden />
        )}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>

      <div className={cn('space-y-2', compact && 'space-y-1.5')}>
        {Array.from({ length: lines }).map((_, i) => {
          const widths = ['100%', '88%', '72%', '60%', '80%'];
          const width = widths[i % widths.length];

          return shouldAnimate ? (
            <motion.div
              key={i}
              className="h-3 rounded-full"
              style={{
                width,
                background: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--primary)/0.15) 50%, hsl(var(--muted)) 100%)',
                backgroundSize: '200% 100%',
              }}
              animate={{
                backgroundPosition: ['200% 0', '-200% 0'],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.15,
              }}
            />
          ) : (
            <div
              key={i}
              className="h-3 animate-pulse rounded-full bg-muted"
              style={{ width }}
            />
          );
        })}
      </div>
    </div>
  );
}

interface AIStreamingTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

export function AIStreamingText({ text, isStreaming, className }: AIStreamingTextProps) {
  const reducedMotion = useReducedMotion();
  const featureEnabled = isMobileInteractionFeatureEnabled('mobile-wow-ai-shimmer');
  const shouldAnimate = featureEnabled && !reducedMotion;

  return (
    <span className={cn('relative', className)}>
      {text}
      {isStreaming && shouldAnimate && (
        <motion.span
          className="inline-block h-[1.1em] w-0.5 bg-primary align-text-bottom"
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'linear',
          }}
          aria-hidden
        />
      )}
      {isStreaming && !shouldAnimate && (
        <span className="inline-block h-[1.1em] w-0.5 animate-pulse bg-primary align-text-bottom" aria-hidden />
      )}
    </span>
  );
}
