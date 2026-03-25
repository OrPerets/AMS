import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

type ResidentStepSummaryTile = {
  id: string;
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'warning' | 'success' | 'danger';
};

type ResidentStepSummaryTilesProps = {
  items: ResidentStepSummaryTile[];
  className?: string;
  columns?: 2 | 3;
  surface?: 'light' | 'dark';
};

function toneClass(tone: ResidentStepSummaryTile['tone'], surface: 'light' | 'dark') {
  if (surface === 'dark') {
    if (tone === 'warning') return 'border-[rgba(224,182,89,0.24)] bg-[rgba(224,182,89,0.14)]';
    if (tone === 'success') return 'border-success/24 bg-success/10';
    if (tone === 'danger') return 'border-destructive/24 bg-destructive/10';
    return 'border-white/10 bg-white/6';
  }

  if (tone === 'warning') return 'border-warning/18 bg-[linear-gradient(180deg,rgba(255,248,236,0.98)_0%,rgba(255,255,255,0.94)_100%)]';
  if (tone === 'success') return 'border-success/18 bg-[linear-gradient(180deg,rgba(244,252,247,0.98)_0%,rgba(255,255,255,0.94)_100%)]';
  if (tone === 'danger') return 'border-destructive/18 bg-[linear-gradient(180deg,rgba(254,242,242,0.98)_0%,rgba(255,255,255,0.94)_100%)]';
  return 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.94)_100%)]';
}

export function ResidentStepSummaryTiles({
  items,
  className,
  columns = 3,
  surface = 'light',
}: ResidentStepSummaryTilesProps) {
  const reducedMotion = useReducedMotion();
  if (!items.length) return null;

  return (
    <div className={cn('grid gap-2', columns === 2 ? 'grid-cols-2' : 'grid-cols-3', className)}>
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.3,
            delay: reducedMotion ? 0 : index * 0.05,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={cn(
            'rounded-[18px] border px-3 py-3 text-right shadow-[0_12px_24px_rgba(44,28,9,0.05)]',
            toneClass(item.tone, surface),
          )}
        >
          <div className={cn('text-[11px] font-semibold', surface === 'dark' ? 'text-white/58' : 'text-secondary-foreground')}>
            {item.label}
          </div>
          <div className={cn('mt-1 text-[16px] font-black leading-none tabular-nums', surface === 'dark' ? 'text-inverse-text' : 'text-foreground')}>
            <bdi>{item.value}</bdi>
          </div>
          {item.hint ? (
            <div className={cn('mt-1 text-[10px] leading-4', surface === 'dark' ? 'text-white/58' : 'text-secondary-foreground/90')}>
              {item.hint}
            </div>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}
