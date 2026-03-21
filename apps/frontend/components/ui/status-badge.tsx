import { Badge } from './badge';
import { cn } from '../../lib/utils';

type Tone = 'neutral' | 'active' | 'success' | 'warning' | 'danger' | 'finance';

const toneClasses: Record<Tone, string> = {
  neutral: 'border-subtle-border bg-muted/70 text-foreground',
  active: 'border-info/20 bg-info/10 text-info',
  success: 'border-success/20 bg-success/10 text-success',
  warning: 'border-warning/20 bg-warning/10 text-warning',
  danger: 'border-destructive/20 bg-destructive/10 text-destructive',
  finance: 'border-primary/20 bg-primary/10 text-foreground',
};

export function StatusBadge({ label, tone = 'neutral', className }: { label: string; tone?: Tone; className?: string }) {
  return <Badge variant="outline" className={cn('gap-1.5 rounded-full px-3 py-1 font-semibold', toneClasses[tone], className)}>{label}</Badge>;
}
