"use client";

import Link from 'next/link';
import { Progress } from '@heroui/react';
import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MiniSparkline } from './mobile-insight-widget';

type MetricTone = 'default' | 'warning' | 'danger' | 'success';

type StripMetric = {
  id: string;
  label: string;
  value: string | number;
  href?: string;
  hint?: string;
  tone?: MetricTone;
  trendLabel?: string;
  sparkline?: number[];
  emphasis?: boolean;
};

type StripQuickAction = {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  href: string;
  tone?: MetricTone;
  previewValue?: string | number;
  microViz?: number[];
};

function progressFromMetric(metric: StripMetric) {
  if (typeof metric.value === 'number') {
    return Math.max(12, Math.min(metric.value * 12, 100));
  }

  if (metric.tone === 'danger') return 34;
  if (metric.tone === 'warning') return 58;
  if (metric.tone === 'success') return 84;
  return 66;
}

function metricToneClasses(tone: MetricTone = 'default') {
  if (tone === 'danger') return { badge: 'text-destructive', bar: 'danger', trend: TrendingDown };
  if (tone === 'warning') return { badge: 'text-warning', bar: 'warning', trend: TrendingUp };
  if (tone === 'success') return { badge: 'text-success', bar: 'success', trend: TrendingUp };
  return { badge: 'text-primary', bar: 'primary', trend: TrendingUp };
}

function stripCopy(roleKey: 'ADMIN' | 'PM' | 'ACCOUNTANT') {
  switch (roleKey) {
    case 'ADMIN':
      return { title: 'מדדי שליטה', description: 'תצוגת חריגים מהירה לפני ירידה למסכי בקרה.' };
    case 'PM':
      return { title: 'תמונת עומס', description: 'קריאות, דחופים ותנועה תפעולית במסך אחד.' };
    case 'ACCOUNTANT':
    default:
      return { title: 'בקרת גבייה', description: 'המספרים שדורשים החלטה ראשונה, בלי לפתוח דוח מלא.' };
  }
}

function MetricSurface({
  href,
  children,
  className,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!href) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function MobileMetricStrip({
  roleKey,
  metrics,
  quickActions,
}: {
  roleKey: 'ADMIN' | 'PM' | 'ACCOUNTANT';
  metrics: StripMetric[];
  quickActions: StripQuickAction[];
}) {
  const [featuredMetric, secondaryMetric] = metrics.slice(0, 2);
  const compactActions = quickActions.slice(0, 2);
  const copy = stripCopy(roleKey);

  if (!featuredMetric) return null;

  const featuredTone = metricToneClasses(featuredMetric.tone ?? 'default');
  const secondaryTone = secondaryMetric ? metricToneClasses(secondaryMetric.tone ?? 'default') : null;
  const FeaturedTrendIcon = featuredTone.trend;
  const SecondaryTrendIcon = secondaryTone?.trend;

  return (
    <section className="space-y-3" aria-label={copy.title}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">{copy.title}</h2>
          <p className="mt-1 text-[12px] leading-5 text-secondary-foreground">{copy.description}</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <MetricSurface
          href={featuredMetric.href}
          className="group rounded-[26px] border border-primary/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,243,234,0.94)_100%)] p-4 shadow-[0_20px_44px_rgba(44,28,9,0.08)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-foreground">{featuredMetric.label}</div>
              <div className="mt-2 text-[2rem] font-black leading-none text-foreground tabular-nums">
                <bdi>{featuredMetric.value}</bdi>
              </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold">
                <FeaturedTrendIcon className={cn('h-3.5 w-3.5', featuredTone.badge)} strokeWidth={1.85} />
                <span className={featuredTone.badge}>{featuredMetric.trendLabel ?? featuredMetric.hint ?? 'עדכון חי למסך הניהול'}</span>
              </div>
            </div>
            {featuredMetric.href ? <ArrowUpRight className="h-4 w-4 shrink-0 text-primary opacity-70 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} /> : null}
          </div>
          {featuredMetric.sparkline?.length ? <MiniSparkline data={featuredMetric.sparkline} tone={featuredMetric.tone} className="mt-3 h-8" /> : null}
          <Progress
            aria-label={`${featuredMetric.label} progress`}
            value={progressFromMetric(featuredMetric)}
            color={featuredTone.bar as 'primary' | 'success' | 'warning' | 'danger'}
            classNames={{
              base: 'mt-4',
              track: 'h-2 bg-muted/80',
              indicator: featuredMetric.tone === 'danger' ? 'bg-destructive' : featuredMetric.tone === 'warning' ? 'bg-warning' : featuredMetric.tone === 'success' ? 'bg-success' : 'bg-primary',
            }}
          />
        </MetricSurface>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {secondaryMetric ? (
            <MetricSurface
              href={secondaryMetric.href}
              className="group rounded-[24px] border border-subtle-border bg-card/96 p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-foreground">{secondaryMetric.label}</div>
                  <div className="mt-2 text-[1.7rem] font-black leading-none text-foreground tabular-nums">
                    <bdi>{secondaryMetric.value}</bdi>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold">
                    {SecondaryTrendIcon ? <SecondaryTrendIcon className={cn('h-3.5 w-3.5', secondaryTone?.badge)} strokeWidth={1.85} /> : null}
                    <span className={secondaryTone?.badge}>{secondaryMetric.trendLabel ?? secondaryMetric.hint ?? 'תנועה עדכנית במסלול הפעולה'}</span>
                  </div>
                </div>
                {secondaryMetric.href ? <ArrowUpRight className="h-4 w-4 shrink-0 text-primary opacity-70 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} /> : null}
              </div>
              {secondaryMetric.sparkline?.length ? <MiniSparkline data={secondaryMetric.sparkline} tone={secondaryMetric.tone} className="mt-3 h-7" /> : null}
            </MetricSurface>
          ) : null}

          {compactActions.length ? (
            <div className={cn('grid gap-3', compactActions.length > 1 && 'grid-cols-2', compactActions.length === 1 && 'grid-cols-1')}>
              {compactActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="rounded-[22px] border border-subtle-border bg-card/94 p-3 shadow-[0_14px_30px_rgba(44,28,9,0.06)]"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground">{action.title}</div>
                  <div className="mt-1 text-xl font-black leading-none text-foreground tabular-nums">
                    <bdi>{action.previewValue ?? action.value}</bdi>
                  </div>
                  {action.microViz?.length ? <MiniSparkline data={action.microViz} tone={action.tone} className="mt-2 h-6" /> : null}
                  <div className="mt-1 text-[12px] leading-5 text-secondary-foreground">{action.subtitle}</div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
