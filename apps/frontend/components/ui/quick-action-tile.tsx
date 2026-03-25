import Link from 'next/link';
import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTouchHoldLift } from './mobile-card-effects';
import { GlassSurface } from './glass-surface';

type QuickActionTileProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  badge?: string | number | null;
  stateLabel?: string;
  tone?: 'default' | 'warning' | 'success' | 'info';
  delay?: number;
  fullCardTap?: boolean;
  className?: string;
};

function toneClasses(tone: NonNullable<QuickActionTileProps['tone']>) {
  switch (tone) {
    case 'warning':
      return 'border-warning/18 bg-warning/10 text-warning';
    case 'success':
      return 'border-success/18 bg-success/10 text-success';
    case 'info':
      return 'border-info/18 bg-info/10 text-info';
    default:
      return 'border-primary/14 bg-primary/10 text-primary';
  }
}

export function QuickActionTile({
  title,
  subtitle,
  icon: Icon,
  href,
  onClick,
  badge,
  stateLabel,
  tone = 'default',
  delay = 0,
  fullCardTap = true,
  className,
}: QuickActionTileProps) {
  const reducedMotion = useReducedMotion();
  const hold = useTouchHoldLift(Boolean(fullCardTap));
  const content = (
    <GlassSurface
      strength="default"
      interactive
      className={cn('group rounded-[30px] p-4', className)}
      data-interactive-card={fullCardTap ? 'true' : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-12 w-12 items-center justify-center rounded-[18px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]', toneClasses(tone))}>
          <Icon className="h-5 w-5" strokeWidth={1.85} />
        </span>
        {badge !== undefined && badge !== null ? (
          <span className="rounded-full border border-primary/14 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            <bdi>{badge}</bdi>
          </span>
        ) : stateLabel ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-subtle-border bg-background/72 px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
            {stateLabel}
          </span>
        ) : null}
      </div>
      <div className="mt-4">
        <div className="text-[15px] font-semibold leading-5 text-foreground">{title}</div>
        <div className="mt-1 text-[11px] leading-4.5 text-secondary-foreground">{subtitle}</div>
      </div>
      <div className="mt-3 flex justify-end text-primary">
        <ArrowUpRight className="icon-directional h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} />
      </div>
    </GlassSurface>
  );

  const motionProps = {
    initial: reducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 },
    animate: reducedMotion ? undefined : hold.isHolding ? { opacity: 1, y: -3, scale: 1.01 } : { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.24, delay: reducedMotion ? 0 : delay, ease: [0.16, 1, 0.3, 1] as const },
  };

  if (href) {
    return (
      <motion.div {...motionProps} {...hold.holdProps}>
        <Link href={href} className="block">
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button type="button" onClick={onClick} className="block w-full text-right" {...motionProps} {...hold.holdProps}>
      {content}
    </motion.button>
  );
}
