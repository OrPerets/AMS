"use client";

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { MOBILE_MOTION_PRESET, MOTION_DURATION } from '../../lib/motion-tokens';
import { isMobileInteractionFeatureEnabled } from '../../lib/mobile-interaction-flags';

interface LivePulseBadgeProps {
  isLive: boolean;
  label?: string;
  className?: string;
  lastUpdated?: Date | null;
  showTimestamp?: boolean;
}

function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

function formatAbsoluteTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function LivePulseBadge({
  isLive,
  label = 'Live',
  className,
  lastUpdated,
  showTimestamp = true,
}: LivePulseBadgeProps) {
  const reducedMotion = useReducedMotion();
  const featureEnabled = isMobileInteractionFeatureEnabled('mobile-interactions-live-choreography');
  const [showAbsolute, setShowAbsolute] = React.useState(false);
  const [relativeLabel, setRelativeLabel] = React.useState('');
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!lastUpdated || !showTimestamp) return;
    setRelativeLabel(getRelativeTime(lastUpdated));
    const interval = setInterval(() => {
      setRelativeLabel(getRelativeTime(lastUpdated));
    }, 5000);
    return () => clearInterval(interval);
  }, [lastUpdated, showTimestamp]);

  const handlePointerDown = React.useCallback(() => {
    if (!lastUpdated) return;
    longPressTimerRef.current = setTimeout(() => setShowAbsolute(true), 500);
  }, [lastUpdated]);

  const handlePointerUp = React.useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    setShowAbsolute(false);
  }, []);

  React.useEffect(() => {
    return () => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); };
  }, []);

  if (!isLive && !lastUpdated) return null;

  const shouldAnimate = featureEnabled && !reducedMotion && isLive;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium select-none',
        isLive
          ? 'bg-success/12 text-success'
          : 'bg-muted text-muted-foreground',
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="status"
      aria-live="polite"
      aria-label={isLive ? `${label} - actively updating` : 'Data paused'}
    >
      {shouldAnimate ? (
        <motion.span
          className="inline-block h-1.5 w-1.5 rounded-full bg-current"
          animate={{
            scale: [1, 1.05, 1] as number[],
            opacity: [1, 0.9, 1] as number[],
          }}
          transition={{
            ...MOBILE_MOTION_PRESET.liveBadge.transition,
            repeat: Infinity,
            repeatType: 'loop',
          }}
          aria-hidden
        />
      ) : (
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full',
            isLive ? 'bg-success' : 'bg-muted-foreground/50',
          )}
          aria-hidden
        />
      )}
      <span>{isLive ? label : 'Paused'}</span>
      {showTimestamp && lastUpdated && (
        <span className="text-[10px] opacity-70">
          {showAbsolute ? formatAbsoluteTime(lastUpdated) : relativeLabel}
        </span>
      )}
    </span>
  );
}
