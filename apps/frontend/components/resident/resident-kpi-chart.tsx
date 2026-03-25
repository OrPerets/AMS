import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

type ResidentKpiChartPoint = {
  label: string;
  value: number;
  note?: string;
  emphasis?: boolean;
};

type ResidentKpiChartProps = {
  title: string;
  subtitle: string;
  metricLabel: string;
  metricValue: React.ReactNode;
  points: ResidentKpiChartPoint[];
  tone?: 'default' | 'warning' | 'danger' | 'success';
  className?: string;
  compact?: boolean;
  summaryItems?: Array<{ label: string; value: React.ReactNode }>;
};

const toneMap = {
  default: {
    stroke: 'rgba(196,135,42,0.98)',
    fillStart: 'rgba(224,182,89,0.34)',
    fillEnd: 'rgba(224,182,89,0.03)',
    glow: 'rgba(224,182,89,0.22)',
  },
  warning: {
    stroke: 'rgba(217,119,6,0.98)',
    fillStart: 'rgba(245,158,11,0.28)',
    fillEnd: 'rgba(245,158,11,0.03)',
    glow: 'rgba(245,158,11,0.2)',
  },
  danger: {
    stroke: 'rgba(220,38,38,0.94)',
    fillStart: 'rgba(248,113,113,0.26)',
    fillEnd: 'rgba(248,113,113,0.03)',
    glow: 'rgba(248,113,113,0.18)',
  },
  success: {
    stroke: 'rgba(22,163,74,0.94)',
    fillStart: 'rgba(74,222,128,0.24)',
    fillEnd: 'rgba(74,222,128,0.03)',
    glow: 'rgba(74,222,128,0.18)',
  },
} as const;

function chartGeometry(points: ResidentKpiChartPoint[]) {
  const width = 312;
  const height = 152;
  const insetX = 14;
  const insetTop = 18;
  const insetBottom = 24;
  const values = points.map((point) => point.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max === min ? 1 : max - min;
  const usableWidth = width - insetX * 2;
  const usableHeight = height - insetTop - insetBottom;

  const normalized = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : insetX + (index / (points.length - 1)) * usableWidth;
    const y = insetTop + (1 - (point.value - min) / span) * usableHeight;
    return { ...point, x, y };
  });

  const linePath = normalized
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const areaPath = `${linePath} L ${normalized[normalized.length - 1]?.x ?? width - insetX} ${height - insetBottom} L ${normalized[0]?.x ?? insetX} ${height - insetBottom} Z`;

  return { width, height, insetBottom, normalized, linePath, areaPath };
}

export function ResidentKpiChart({
  title,
  subtitle,
  metricLabel,
  metricValue,
  points,
  tone = 'default',
  className,
  compact = false,
  summaryItems = [],
}: ResidentKpiChartProps) {
  const reducedMotion = useReducedMotion();
  const baseId = React.useId().replace(/:/g, '');
  const palette = toneMap[tone];
  const safePoints = points.filter((point) => Number.isFinite(point.value)).slice(-6);

  if (!safePoints.length) {
    return null;
  }

  const { width, height, normalized, linePath, areaPath } = chartGeometry(safePoints);
  const emphasisIndex = normalized.findIndex((point) => point.emphasis);
  const activeIndex = emphasisIndex >= 0 ? emphasisIndex : normalized.length - 1;
  const activePoint = normalized[Math.max(activeIndex, 0)];

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[30px] border border-[rgba(224,182,89,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(251,247,240,0.96)_100%)] p-4 shadow-[0_20px_48px_rgba(44,28,9,0.08)]',
        compact ? 'rounded-[26px] p-3.5' : '',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/72">{title}</div>
          <div className={cn('mt-2 text-[30px] font-black leading-none tracking-[-0.03em] text-foreground', compact ? 'text-[24px]' : '')}>
            {metricValue}
          </div>
          <div className="mt-1 text-[12px] font-semibold text-secondary-foreground">{metricLabel}</div>
        </div>
        <div className="max-w-[11rem] text-[12px] leading-5 text-secondary-foreground">{subtitle}</div>
      </div>

      <div
        className={cn(
          'relative mt-4 overflow-hidden rounded-[24px] border border-primary/10 bg-[radial-gradient(circle_at_top,rgba(255,244,220,0.72),rgba(255,255,255,0.98)_54%,rgba(248,242,231,0.94)_100%)] px-3 py-3',
          compact ? 'mt-3 rounded-[20px] px-2.5 py-2.5' : '',
        )}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-5 h-px bg-[linear-gradient(90deg,transparent,rgba(196,135,42,0.16),transparent)]" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-[linear-gradient(90deg,transparent,rgba(36,24,14,0.08),transparent)]" />
          <div className="absolute inset-x-0 bottom-5 h-px bg-[linear-gradient(90deg,transparent,rgba(36,24,14,0.06),transparent)]" />
          {normalized.map((point) => (
            <div
              key={`${point.label}-rail`}
              className="absolute bottom-0 top-0 w-px bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(36,24,14,0.04),rgba(255,255,255,0))]"
              style={{ left: point.x }}
            />
          ))}
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className={cn('relative z-10 w-full', compact ? 'h-[9rem]' : 'h-[11rem]')} aria-label={title}>
          <defs>
            <linearGradient id={`${baseId}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.fillStart} />
              <stop offset="100%" stopColor={palette.fillEnd} />
            </linearGradient>
            <filter id={`${baseId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor={palette.glow} />
            </filter>
          </defs>

          <motion.path
            d={areaPath}
            fill={`url(#${baseId}-fill)`}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={reducedMotion ? undefined : { opacity: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke={palette.stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${baseId}-glow)`}
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0.6 }}
            animate={reducedMotion ? undefined : { pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />

          {normalized.map((point, index) => (
            <motion.g
              key={point.label}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.7 }}
              animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, delay: reducedMotion ? 0 : 0.16 + index * 0.05, ease: 'easeOut' }}
            >
              <circle cx={point.x} cy={point.y} r={index === activeIndex ? 5.5 : 4} fill="white" stroke={palette.stroke} strokeWidth="2.5" />
            </motion.g>
          ))}

          {activePoint ? (
            <motion.g
              animate={
                reducedMotion
                  ? undefined
                  : { opacity: [0.12, 0.3, 0.12], scale: [1, 1.16, 1] }
              }
              transition={reducedMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <circle cx={activePoint.x} cy={activePoint.y} r="16" fill={palette.glow} />
            </motion.g>
          ) : null}
        </svg>

        <div className="relative z-10 mt-1 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {safePoints.map((point, index) => (
            <div
              key={`${point.label}-label`}
              className={cn(
                'rounded-[16px] px-2 py-2 text-right',
                index === activeIndex ? 'bg-[rgba(255,248,233,0.84)]' : 'bg-white/62',
              )}
            >
              <div className="text-[11px] font-semibold text-secondary-foreground">{point.label}</div>
              <div className="mt-0.5 text-[13px] font-semibold text-foreground tabular-nums">
                <bdi>{point.value}</bdi>
              </div>
              {point.note ? <div className="mt-0.5 text-[10px] leading-4 text-secondary-foreground/90">{point.note}</div> : null}
            </div>
          ))}
        </div>
      </div>

      {summaryItems.length ? (
        <div className={cn('mt-3 grid grid-cols-3 gap-2', compact ? 'mt-2.5' : '')}>
          {summaryItems.slice(0, 3).map((item) => (
            <div key={item.label} className="rounded-[18px] border border-primary/10 bg-white/76 px-3 py-2.5 text-right">
              <div className="text-[11px] font-semibold text-secondary-foreground">{item.label}</div>
              <div className="mt-1 text-[15px] font-black text-foreground">
                <bdi>{item.value}</bdi>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
