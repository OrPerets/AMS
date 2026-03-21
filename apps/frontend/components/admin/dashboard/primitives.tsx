import { ReactNode } from 'react';
import { Badge } from '../../ui/badge';

export function MetricPill({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string | number;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 transition-colors ${
        warning
          ? 'border-warning/25 bg-warning/10 hover:bg-warning/15'
          : 'border-subtle-border bg-card hover:bg-muted/40'
      }`}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-lg font-black ${warning ? 'text-warning-foreground' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}

export function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-subtle-border bg-card px-4 py-3 transition-colors hover:bg-muted/40">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

export function LoadBadge({ tone, children }: { tone: 'balanced' | 'busy' | 'critical'; children: ReactNode }) {
  const variant = tone === 'critical' ? 'destructive' : tone === 'busy' ? 'warning' : 'secondary';
  return <Badge variant={variant}>{children}</Badge>;
}
