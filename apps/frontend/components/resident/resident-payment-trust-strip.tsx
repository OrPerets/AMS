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
    if (tone === 'warning') return 'border-[rgba(224,182,89,0.22)] bg-[rgba(224,182,89,0.12)]';
    if (tone === 'success') return 'border-success/22 bg-success/10';
    return 'border-white/10 bg-white/6';
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
          ? 'border-white/10 bg-[linear-gradient(180deg,rgba(18,18,20,0.94)_0%,rgba(35,24,12,0.96)_100%)] text-inverse-text'
          : 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(249,245,238,0.94)_100%)]',
        className,
      )}
    >
      {eyebrow || title ? (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {eyebrow ? (
              <div className={cn('text-[11px] font-semibold uppercase tracking-[0.16em]', surface === 'dark' ? 'text-[#f0d48b]/72' : 'text-primary/72')}>
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <div className={cn('mt-1 text-[15px] font-semibold', surface === 'dark' ? 'text-inverse-text' : 'text-foreground')}>
                {title}
              </div>
            ) : null}
          </div>
          <Badge variant="outline" className={cn(surface === 'dark' ? 'border-white/12 bg-white/8 text-white/78' : 'border-primary/12 bg-primary/8 text-primary')}>
            מסלול מאובטח
          </Badge>
        </div>
      ) : null}

      <div className={cn('grid gap-2', compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3')}>
        {items.map((item) => (
          <div key={item.id} className={cn('rounded-[18px] border px-3 py-3 text-right', itemClass(item.tone, surface))}>
            <div className={cn('text-[11px] font-semibold', surface === 'dark' ? 'text-white/56' : 'text-secondary-foreground')}>
              {item.label}
            </div>
            <div className={cn('mt-1 text-[15px] font-black', surface === 'dark' ? 'text-inverse-text' : 'text-foreground')}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
