import Link from 'next/link';
import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GlassSurface } from './glass-surface';
import { MOTION_DURATION, MOTION_EASE } from '../../lib/motion-tokens';

type ResidentListCardProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  endSlot?: React.ReactNode;
  accent?: 'default' | 'warning' | 'success' | 'info';
  delay?: number;
  className?: string;
};

function accentClass(accent: NonNullable<ResidentListCardProps['accent']>) {
  switch (accent) {
    case 'warning':
      return 'border-warning/16 bg-warning/10 text-warning';
    case 'success':
      return 'border-success/16 bg-success/10 text-success';
    case 'info':
      return 'border-info/16 bg-info/10 text-info';
    default:
      return 'border-primary/14 bg-primary/10 text-primary';
  }
}

export function ResidentListCard({
  title,
  subtitle,
  meta,
  icon: Icon,
  href,
  onClick,
  endSlot,
  accent = 'default',
  delay = 0,
  className,
}: ResidentListCardProps) {
  const reducedMotion = useReducedMotion();

  const inner = (
    <GlassSurface interactive className={cn('rounded-[28px] px-4 py-3.5 text-right', className)}>
      <div className="flex items-start gap-3 text-right">
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]', accentClass(accent))}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-right">
            <div className="line-clamp-2 text-[14px] font-semibold text-foreground">{title}</div>
            {meta ? <div className="shrink-0">{meta}</div> : null}
          </div>
          {subtitle ? <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-secondary-foreground">{subtitle}</div> : null}
        </div>
        {endSlot ?? <ChevronLeft className="icon-directional h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.85} />}
      </div>
    </GlassSurface>
  );

  const wrapperClass = 'block text-right';

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION.fast, delay: reducedMotion ? 0 : delay, ease: MOTION_EASE.emphasized }}
    >
      {href ? (
        <Link href={href} className={wrapperClass}>
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={cn(wrapperClass, 'w-full')}>
          {inner}
        </button>
      )}
    </motion.div>
  );
}
