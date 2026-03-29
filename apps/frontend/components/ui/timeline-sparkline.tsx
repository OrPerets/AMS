"use client";

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { MOTION_DURATION, MOTION_EASE } from '../../lib/motion-tokens';
import { isMobileInteractionFeatureEnabled } from '../../lib/mobile-interaction-flags';

type SparklinePoint = {
  timestamp: number | Date;
  status: string;
};

interface TimelineSparklineProps {
  points: SparklinePoint[];
  className?: string;
  height?: number;
  width?: number;
  statusColorMap?: Record<string, string>;
  showLatestDot?: boolean;
}

const DEFAULT_STATUS_COLORS: Record<string, string> = {
  OPEN: 'hsl(var(--warning))',
  ASSIGNED: 'hsl(var(--primary))',
  IN_PROGRESS: 'hsl(var(--info, 199 89% 48%))',
  RESOLVED: 'hsl(var(--success))',
  COMPLETED: 'hsl(var(--success))',
  HIGH: 'hsl(var(--destructive))',
  CRITICAL: 'hsl(var(--destructive))',
};

function statusToY(status: string): number {
  const ORDER: Record<string, number> = {
    OPEN: 0.85,
    ASSIGNED: 0.65,
    IN_PROGRESS: 0.4,
    RESOLVED: 0.15,
    COMPLETED: 0.1,
    HIGH: 0.9,
    CRITICAL: 0.95,
    MEDIUM: 0.5,
    LOW: 0.25,
  };
  return ORDER[status?.toUpperCase()] ?? 0.5;
}

function buildPath(
  points: SparklinePoint[],
  width: number,
  height: number,
): { d: string; segments: Array<{ x: number; y: number; status: string }> } {
  if (points.length === 0) return { d: '', segments: [] };

  const sorted = [...points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const tMin = new Date(sorted[0].timestamp).getTime();
  const tMax = new Date(sorted[sorted.length - 1].timestamp).getTime();
  const tRange = Math.max(tMax - tMin, 1);

  const padding = 4;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  const segments = sorted.map((p) => ({
    x: padding + ((new Date(p.timestamp).getTime() - tMin) / tRange) * drawWidth,
    y: padding + statusToY(p.status) * drawHeight,
    status: p.status,
  }));

  const parts = segments.map((seg, i) => {
    if (i === 0) return `M ${seg.x} ${seg.y}`;
    const prev = segments[i - 1];
    const cpX = (prev.x + seg.x) / 2;
    return `C ${cpX} ${prev.y}, ${cpX} ${seg.y}, ${seg.x} ${seg.y}`;
  });

  return { d: parts.join(' '), segments };
}

export function TimelineSparkline({
  points,
  className,
  height = 32,
  width = 120,
  statusColorMap,
  showLatestDot = true,
}: TimelineSparklineProps) {
  const reducedMotion = useReducedMotion();
  const featureEnabled = isMobileInteractionFeatureEnabled('mobile-wow-timeline-sparkline');

  const colors = React.useMemo(
    () => ({ ...DEFAULT_STATUS_COLORS, ...statusColorMap }),
    [statusColorMap],
  );

  const { d, segments } = React.useMemo(
    () => buildPath(points, width, height),
    [points, width, height],
  );

  if (!points.length || !d) return null;

  const latestSegment = segments[segments.length - 1];
  const latestColor = colors[latestSegment?.status?.toUpperCase()] ?? 'hsl(var(--primary))';
  const shouldAnimate = featureEnabled && !reducedMotion;

  return (
    <svg
      className={cn('inline-block align-middle', className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      role="img"
      aria-label={`Timeline: ${points.length} transitions, latest ${latestSegment?.status ?? 'unknown'}`}
    >
      {shouldAnimate ? (
        <motion.path
          d={d}
          stroke={latestColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: MOTION_DURATION.deliberate, ease: MOTION_EASE.emphasized }}
        />
      ) : (
        <path
          d={d}
          stroke={latestColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}

      {showLatestDot && latestSegment && (
        <>
          {shouldAnimate ? (
            <motion.circle
              cx={latestSegment.x}
              cy={latestSegment.y}
              r={3}
              fill={latestColor}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: MOTION_DURATION.deliberate, duration: MOTION_DURATION.fast }}
            />
          ) : (
            <circle cx={latestSegment.x} cy={latestSegment.y} r={3} fill={latestColor} />
          )}
          <circle
            cx={latestSegment.x}
            cy={latestSegment.y}
            r={6}
            fill={latestColor}
            opacity={0.2}
          />
        </>
      )}

      {segments.map((seg, i) => {
        if (i === segments.length - 1 && showLatestDot) return null;
        const segColor = colors[seg.status?.toUpperCase()] ?? 'hsl(var(--muted-foreground))';
        return (
          <circle
            key={i}
            cx={seg.x}
            cy={seg.y}
            r={1.5}
            fill={segColor}
            opacity={0.5}
          />
        );
      })}
    </svg>
  );
}
