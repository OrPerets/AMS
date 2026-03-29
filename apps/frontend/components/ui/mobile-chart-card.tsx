"use client";

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import { cn } from '../../lib/utils';
import { MOBILE_MOTION_PRESET, MOTION_DURATION, MOTION_EASE } from '../../lib/motion-tokens';
import { isMobileInteractionFeatureEnabled } from '../../lib/mobile-interaction-flags';

type LegendChip = {
  label: string;
  color: string;
  value?: string | number;
};

interface MobileChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  height?: number;
  legendChips?: LegendChip[];
  accessibilityLabel?: string;
  onTooltipOpen?: () => void;
}

const MOBILE_BREAKPOINT = 360;

function abbreviateLabel(label: string, maxLen = 3): string {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen);
}

const MobileChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl border border-border bg-popover px-3 py-2 shadow-lg"
      style={{ minWidth: 120, touchAction: 'none' }}
    >
      {label && <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>}
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-semibold text-foreground">{entry.value}</span>
          <span className="text-xs text-muted-foreground">{entry.name}</span>
        </div>
      ))}
    </div>
  );
};

function LegendChipRow({ chips }: { chips: LegendChip[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {chips.map((chip, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: chip.color }}
          />
          {chip.label}
          {chip.value !== undefined && (
            <span className="font-semibold">{chip.value}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function MobileChartCard({
  title,
  description,
  children,
  className,
  height = 220,
  legendChips,
  accessibilityLabel,
  onTooltipOpen,
}: MobileChartCardProps) {
  const reducedMotion = useReducedMotion();
  const chartEnabled = isMobileInteractionFeatureEnabled('mobile-wow-chart-wrappers');
  const hasMounted = React.useRef(false);
  const [hasAnimated, setHasAnimated] = React.useState(false);

  React.useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      const timer = setTimeout(() => setHasAnimated(true), MOTION_DURATION.deliberate * 1000 + 50);
      return () => clearTimeout(timer);
    }
  }, []);

  const animationProps =
    chartEnabled && !reducedMotion && !hasAnimated
      ? MOBILE_MOTION_PRESET.chartReveal
      : { initial: false as const, animate: { opacity: 1 } };

  return (
    <Card variant="elevated" className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <motion.div
          {...animationProps}
          role="img"
          aria-label={accessibilityLabel || `${title} chart`}
          className="w-full"
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {React.Children.only(children) as React.ReactElement}
          </ResponsiveContainer>
        </motion.div>
        {legendChips && legendChips.length > 0 && <LegendChipRow chips={legendChips} />}
      </CardContent>
    </Card>
  );
}

export function mobileChartXAxisProps(containerWidth?: number) {
  const isNarrow = (containerWidth ?? 360) < MOBILE_BREAKPOINT;
  return {
    className: 'text-muted-foreground' as const,
    fontSize: isNarrow ? 10 : 12,
    tickFormatter: isNarrow ? abbreviateLabel : undefined,
    tick: { fill: 'hsl(var(--muted-foreground))' },
    axisLine: false,
    tickLine: false,
  };
}

export function mobileChartYAxisProps(containerWidth?: number) {
  const isNarrow = (containerWidth ?? 360) < MOBILE_BREAKPOINT;
  return {
    className: 'text-muted-foreground' as const,
    fontSize: isNarrow ? 10 : 12,
    width: isNarrow ? 28 : 40,
    tick: { fill: 'hsl(var(--muted-foreground))' },
    axisLine: false,
    tickLine: false,
  };
}

export function mobileChartGridProps(containerWidth?: number) {
  const isNarrow = (containerWidth ?? 360) < MOBILE_BREAKPOINT;
  return {
    strokeDasharray: '3 3',
    className: 'stroke-muted' as const,
    horizontal: true,
    vertical: !isNarrow,
  };
}

export function mobileChartTooltipProps(onOpen?: () => void) {
  return {
    content: <MobileChartTooltip />,
    cursor: { stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' },
    wrapperStyle: { touchAction: 'none' as const, zIndex: 50 },
    allowEscapeViewBox: { x: false, y: true },
  };
}

export { MobileChartTooltip, LegendChipRow, abbreviateLabel };
