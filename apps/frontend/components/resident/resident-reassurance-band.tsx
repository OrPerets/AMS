import * as React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

type ReassuranceTone = 'default' | 'warning' | 'success';

type ResidentReassuranceItem = {
  id: string;
  label: string;
  value: React.ReactNode;
  tone?: ReassuranceTone;
  icon?: React.ReactNode;
};

export function ResidentReassuranceBand({
  title,
  subtitle,
  items,
  className,
}: {
  title: string;
  subtitle?: string;
  items: ResidentReassuranceItem[];
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[24px] border border-primary/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)] p-3.5 shadow-[0_14px_30px_rgba(44,28,9,0.05)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-[0.16em] text-primary/72">Trust Layer</div>
          <div className="mt-1 text-[15px] font-semibold text-foreground">{title}</div>
          {subtitle ? <div className="mt-0.5 text-[12px] leading-5 text-secondary-foreground">{subtitle}</div> : null}
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/12 bg-primary/10 text-primary">
          <ShieldCheck className="h-4 w-4" strokeWidth={1.85} />
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex min-h-[52px] items-center gap-2 rounded-[18px] border px-3 py-2.5 text-right',
              item.tone === 'warning'
                ? 'border-warning/18 bg-warning/[0.06]'
                : item.tone === 'success'
                  ? 'border-success/18 bg-success/[0.06]'
                  : 'border-primary/10 bg-white/72',
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                item.tone === 'warning'
                  ? 'bg-warning/12 text-warning'
                  : item.tone === 'success'
                    ? 'bg-success/12 text-success'
                    : 'bg-primary/10 text-primary',
              )}
            >
              {item.icon ?? <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.85} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold text-secondary-foreground">{item.label}</span>
              <span className="mt-0.5 block truncate text-[12px] font-semibold text-foreground">{item.value}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
