import * as React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, CircleAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

type PrimaryActionTone = 'default' | 'warning' | 'danger' | 'success';

export function PrimaryActionCard({
  eyebrow,
  title,
  description,
  ctaLabel,
  href,
  onClick,
  tone = 'default',
  secondaryAction,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  onClick?: () => void;
  tone?: PrimaryActionTone;
  secondaryAction?: React.ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const Icon = tone === 'success' ? CheckCircle2 : CircleAlert;

  const panel = (
    <motion.div
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      className={cn(
        'max-h-[120px] overflow-hidden rounded-2xl border border-primary/12 border-s-4 border-s-primary bg-card p-3 shadow-raised',
        tone === 'warning' && 'border-s-warning',
        tone === 'danger' && 'border-s-destructive',
        tone === 'success' && 'border-s-success',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {eyebrow ? <div className="text-[10px] font-semibold uppercase text-secondary-foreground">{eyebrow}</div> : null}
          <div className="flex items-start gap-2">
            <Icon
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                tone === 'warning' && 'text-warning',
                tone === 'danger' && 'text-destructive',
                tone === 'success' && 'text-success',
                tone === 'default' && 'text-primary',
              )}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">{title}</div>
              <div className="line-clamp-2 text-[12px] leading-5 text-secondary-foreground">{description}</div>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          {href ? (
            <Link
              href={href}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              {ctaLabel}
              <ArrowUpRight className="icon-directional h-4 w-4" strokeWidth={1.75} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onClick}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              {ctaLabel}
              <ArrowUpRight className="icon-directional h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
      {secondaryAction ? <div className="mt-2">{secondaryAction}</div> : null}
    </motion.div>
  );

  return panel;
}
