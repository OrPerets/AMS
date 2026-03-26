import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export type ResidentPaymentTrustItem = {
  id: string;
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'success';
};

type ResidentPaymentTrustStripProps = {
  eyebrow?: string;
  title?: string;
  items: ResidentPaymentTrustItem[];
  className?: string;
  surface?: 'light' | 'dark';
  compact?: boolean;
};

function itemClass(tone: ResidentPaymentTrustItem['tone'], surface: 'light' | 'dark') {
  if (surface === 'dark') {
    if (tone === 'warning') return 'border-warning/18 bg-[linear-gradient(180deg,rgba(255,248,236,0.98)_0%,rgba(255,255,255,0.94)_100%)]';
    if (tone === 'success') return 'border-success/18 bg-[linear-gradient(180deg,rgba(244,252,247,0.98)_0%,rgba(255,255,255,0.94)_100%)]';
    return 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.94)_100%)]';
  }

  if (tone === 'warning') return 'border-warning/18 bg-[linear-gradient(180deg,rgba(255,248,236,0.98)_0%,rgba(255,255,255,0.94)_100%)]';
  if (tone === 'success') return 'border-success/18 bg-[linear-gradient(180deg,rgba(244,252,247,0.98)_0%,rgba(255,255,255,0.94)_100%)]';
  return 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.94)_100%)]';
}

export function ResidentPaymentTrustStrip({
  eyebrow,
  title,
  items,
  className,
  surface = 'light',
  compact = false,
}: ResidentPaymentTrustStripProps) {
  if (!items.length) return null;

  return (
    <div
      className={cn(
        'rounded-[24px] border p-3.5 shadow-[0_14px_30px_rgba(44,28,9,0.06)]',
        surface === 'dark'
          ? 'border-primary/14 bg-[linear-gradient(180deg,rgba(255,250,242,0.98)_0%,rgba(255,255,255,0.94)_58%,rgba(248,243,232,0.92)_100%)] text-foreground'
          : 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(249,245,238,0.94)_100%)]',
        className,
      )}
    >
      {eyebrow || title ? (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {eyebrow ? (
              <div className="text-[11px] font-semibold tracking-[0.12em] text-primary/72">
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <div className="mt-1 text-[15px] font-semibold text-foreground">
                {title}
              </div>
            ) : null}
          </div>
          <Badge variant="outline" className="border-primary/12 bg-primary/8 text-primary">
            מסלול מאובטח
          </Badge>
        </div>
      ) : null}

      <div className={cn('grid gap-2', compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3')}>
        {items.map((item) => (
          <div key={item.id} className={cn('rounded-[18px] border px-3 py-3 text-right', itemClass(item.tone, surface))}>
            <div className="text-[11px] font-semibold text-secondary-foreground">
              {item.label}
            </div>
            <div className="mt-1 text-[15px] font-black text-foreground">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
