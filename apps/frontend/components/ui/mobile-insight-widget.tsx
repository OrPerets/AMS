import * as React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';

type InsightTone = 'default' | 'warning' | 'danger' | 'success' | 'info';

type MobileInsightWidgetProps = {
  title: string;
  value: string | number;
  hint?: string;
  href?: string;
  onClick?: () => void;
  tone?: InsightTone;
  sparkline?: number[];
  ringProgress?: number;
  badge?: React.ReactNode;
  className?: string;
  surface?: 'light' | 'dark';
  pulse?: boolean;
};

function toneClasses(tone: InsightTone = 'default', surface: 'light' | 'dark' = 'light') {
  if (surface === 'dark') {
    if (tone === 'danger') return 'border-destructive/26 bg-destructive/10 text-destructive-foreground';
    if (tone === 'warning') return 'border-warning/24 bg-warning/14 text-white';
    if (tone === 'success') return 'border-success/24 bg-success/12 text-white';
    if (tone === 'info') return 'border-info/24 bg-info/12 text-white';
    return 'border-white/10 bg-white/8 text-white';
  }

  if (tone === 'danger') return 'border-destructive/18 bg-destructive/6 text-destructive';
  if (tone === 'warning') return 'border-warning/18 bg-warning/8 text-warning';
  if (tone === 'success') return 'border-success/18 bg-success/8 text-success';
  if (tone === 'info') return 'border-info/18 bg-info/8 text-info';
  return 'border-primary/14 bg-primary/6 text-primary';
}

function InsightSurface({
  href,
  onClick,
  className,
  children,
}: {
  href?: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    );
  }

  return <div className={className}>{children}</div>;
}

export function MiniSparkline({
  data,
  tone = 'default',
  surface = 'light',
  className,
}: {
  data: number[];
  tone?: InsightTone;
  surface?: 'light' | 'dark';
  className?: string;
}) {
  const sanitized = data.filter((value) => Number.isFinite(value));
  if (!sanitized.length) return null;

  const max = Math.max(...sanitized, 1);
  const min = Math.min(...sanitized);
  const width = 120;
  const height = 42;
  const points = sanitized
    .map((value, index) => {
      const x = sanitized.length === 1 ? width / 2 : (index / (sanitized.length - 1)) * width;
      const normalized = max === min ? 0.5 : (value - min) / (max - min);
      const y = height - normalized * (height - 10) - 5;
      return `${x},${y}`;
    })
    .join(' ');

  const stroke =
    tone === 'danger'
      ? surface === 'dark' ? 'rgba(255,187,187,0.95)' : 'rgba(220,38,38,0.88)'
      : tone === 'warning'
        ? surface === 'dark' ? 'rgba(255,237,191,0.96)' : 'rgba(217,119,6,0.9)'
        : tone === 'success'
          ? surface === 'dark' ? 'rgba(196,255,218,0.95)' : 'rgba(22,163,74,0.9)'
          : tone === 'info'
            ? surface === 'dark' ? 'rgba(191,234,255,0.95)' : 'rgba(14,165,233,0.9)'
            : surface === 'dark' ? 'rgba(255,232,194,0.96)' : 'rgba(180,122,38,0.92)';

  const fill =
    tone === 'danger'
      ? 'rgba(220,38,38,0.12)'
      : tone === 'warning'
        ? 'rgba(245,158,11,0.16)'
        : tone === 'success'
          ? 'rgba(34,197,94,0.14)'
          : tone === 'info'
            ? 'rgba(14,165,233,0.12)'
            : 'rgba(217,168,84,0.16)';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('h-10 w-full', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`spark-fill-${tone}-${surface}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-fill-${tone}-${surface})`}
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RingGauge({
  progress,
  tone = 'default',
  surface = 'light',
}: {
  progress: number;
  tone?: InsightTone;
  surface?: 'light' | 'dark';
}) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const bounded = Math.max(0, Math.min(progress, 100));
  const dashoffset = circumference - (bounded / 100) * circumference;
  const stroke =
    tone === 'danger'
      ? '#dc2626'
      : tone === 'warning'
        ? '#d97706'
        : tone === 'success'
          ? '#16a34a'
          : tone === 'info'
            ? '#0ea5e9'
            : '#cf9232';

  return (
    <svg viewBox="0 0 52 52" className="h-12 w-12 shrink-0" aria-hidden="true">
      <circle cx="26" cy="26" r={radius} fill="none" stroke={surface === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(36,24,14,0.08)'} strokeWidth="6" />
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        transform="rotate(-90 26 26)"
      />
    </svg>
  );
}

export function MobileInsightWidget({
  title,
  value,
  hint,
  href,
  onClick,
  tone = 'default',
  sparkline,
  ringProgress,
  badge,
  className,
  surface = 'light',
  pulse = false,
}: MobileInsightWidgetProps) {
  const reducedMotion = useReducedMotion();
  const interactive = Boolean(href || onClick);

  return (
    <motion.div
      whileTap={interactive && !reducedMotion ? { scale: 0.985 } : undefined}
      animate={
        pulse && !reducedMotion
          ? { boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 0 6px rgba(224,182,89,0)', '0 0 0 rgba(0,0,0,0)'] }
          : undefined
      }
      transition={pulse && !reducedMotion ? { duration: 1.2, repeat: 1, ease: 'easeOut' } : undefined}
    >
      <InsightSurface
        href={href}
        onClick={onClick}
        className={cn(
          'group flex min-h-[114px] flex-col justify-between rounded-[24px] border px-3.5 py-3 text-right shadow-[0_16px_28px_rgba(44,28,9,0.06)] transition hover:-translate-y-0.5',
          surface === 'dark'
            ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)]'
            : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)]',
          toneClasses(tone, surface),
          interactive && 'cursor-pointer',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={cn('text-[11px] font-semibold tracking-[0.14em]', surface === 'dark' ? 'text-white/68' : 'text-secondary-foreground')}>
              {title}
            </div>
            <div className={cn('mt-1 text-[1.45rem] font-black leading-none tabular-nums', surface === 'dark' ? 'text-white' : 'text-foreground')}>
              <bdi>{value}</bdi>
            </div>
          </div>
          {ringProgress !== undefined ? <RingGauge progress={ringProgress} tone={tone} surface={surface} /> : badge ? <div>{badge}</div> : null}
        </div>

        {sparkline?.length ? <MiniSparkline data={sparkline} tone={tone} surface={surface} className="mt-2.5" /> : null}

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className={cn('min-w-0 text-[12px] leading-4.5', surface === 'dark' ? 'text-white/72' : 'text-secondary-foreground')}>
            {hint}
          </div>
          {interactive ? (
            <ArrowUpRight className={cn('icon-directional h-4 w-4 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5', surface === 'dark' ? 'text-white/72' : 'text-primary')} strokeWidth={1.8} />
          ) : null}
        </div>
      </InsightSurface>
    </motion.div>
  );
}
