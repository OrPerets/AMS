"use client";

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react';
import { CircularProgress, Progress } from '@heroui/react';
import { cn } from '../../lib/utils';

type AmsMetricProgressProps = {
  label: string;
  value: string | number;
  progress: number;
  hint?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  href?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  variant?: 'light' | 'dark';
  className?: string;
};

export function AmsMetricProgress({
  label,
  value,
  progress,
  hint,
  trend,
  trendDirection = 'neutral',
  href,
  tone = 'default',
  variant = 'light',
  className,
}: AmsMetricProgressProps) {
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  const isDark = variant === 'dark';
  const progressColor =
    tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : tone === 'danger' ? 'danger' : 'primary';
  const surfaceClassName = isDark
    ? 'border-white/10 bg-white/6 text-inverse-text shadow-[0_18px_42px_rgba(0,0,0,0.18)]'
    : 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] text-foreground shadow-[0_18px_40px_rgba(44,28,9,0.08)]';
  const captionClassName = isDark ? 'text-white/64' : 'text-secondary-foreground';

  const content = (
    <div className={cn('rounded-[24px] border p-3.5', surfaceClassName, className)}>
      <div className="flex items-start gap-3">
        <CircularProgress
          aria-label={`${label} progress`}
          value={normalizedProgress}
          showValueLabel
          color={progressColor}
          classNames={{
            svg: 'h-14 w-14',
            track: isDark ? 'stroke-white/12' : 'stroke-[rgba(120,95,64,0.14)]',
            indicator: tone === 'danger' ? 'stroke-destructive' : tone === 'warning' ? 'stroke-warning' : tone === 'success' ? 'stroke-success' : 'stroke-primary',
            value: cn('text-[11px] font-black', isDark ? 'fill-white' : 'fill-foreground'),
          }}
        />
        <div className="min-w-0 flex-1">
          <div className={cn('text-[11px] font-semibold uppercase tracking-[0.16em]', captionClassName)}>{label}</div>
          <div className={cn('mt-1 text-[1.45rem] font-black leading-none tabular-nums', isDark ? 'text-inverse-text' : 'text-foreground')}>
            <bdi>{value}</bdi>
          </div>
          {hint ? <div className={cn('mt-1 text-xs leading-5', captionClassName)}>{hint}</div> : null}
          {trend ? (
            <div className={cn('mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold', isDark ? 'bg-white/8' : 'bg-background/80')}>
              {trendDirection === 'up' ? <TrendingUp className="h-3 w-3" strokeWidth={1.75} /> : null}
              {trendDirection === 'down' ? <TrendingDown className="h-3 w-3" strokeWidth={1.75} /> : null}
              <span>{trend}</span>
            </div>
          ) : null}
        </div>
      </div>
      <Progress
        aria-label={`${label} completion`}
        value={normalizedProgress}
        color={progressColor}
        classNames={{
          base: 'mt-3',
          track: cn('h-2', isDark ? 'bg-white/10' : 'bg-muted/80'),
          indicator: tone === 'danger' ? 'bg-destructive' : tone === 'warning' ? 'bg-warning' : tone === 'success' ? 'bg-success' : 'bg-primary',
        }}
      />
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block">
      <div className="group relative">
        {content}
        <span className={cn('pointer-events-none absolute end-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100', isDark ? 'bg-white/10 text-white/80' : 'bg-background/88 text-primary')}>
          <ArrowUpRight className="icon-directional h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>
    </Link>
  );
}
