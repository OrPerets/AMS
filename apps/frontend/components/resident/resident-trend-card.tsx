import { Sparkles } from 'lucide-react';
import { ResidentKpiChart } from './resident-kpi-chart';
import { cn } from '../../lib/utils';

type ResidentTrendPoint = {
  label: string;
  value: number;
  note?: string;
  emphasis?: boolean;
};

type ResidentTrendCardProps = {
  title: string;
  subtitle: string;
  metricLabel: string;
  metricValue: string | number;
  points: ResidentTrendPoint[];
  insight: string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  summaryItems?: Array<{ label: string; value: string | number }>;
  className?: string;
};

export function ResidentTrendCard({
  title,
  subtitle,
  metricLabel,
  metricValue,
  points,
  insight,
  tone = 'default',
  summaryItems = [],
  className,
}: ResidentTrendCardProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <ResidentKpiChart
        title={title}
        subtitle={subtitle}
        metricLabel={metricLabel}
        metricValue={metricValue}
        points={points}
        tone={tone}
        summaryItems={summaryItems}
      />

      <div className="flex items-start gap-3 rounded-[24px] border border-primary/14 bg-[linear-gradient(180deg,rgba(255,251,240,0.94)_0%,rgba(255,255,255,0.96)_100%)] px-4 py-3 shadow-[0_12px_24px_rgba(44,28,9,0.04)]">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" strokeWidth={1.85} />
        </span>
        <div className="text-right">
          <div className="text-sm font-semibold text-foreground">קריאה מהירה</div>
          <div className="mt-1 text-[13px] leading-6 text-secondary-foreground">{insight}</div>
        </div>
      </div>
    </div>
  );
}
