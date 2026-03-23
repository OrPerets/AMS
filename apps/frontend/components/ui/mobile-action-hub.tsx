import * as React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useMobileDepthEffect, useTouchHoldLift } from './mobile-card-effects';

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;

export type MobileActionHubItem = {
  id: string;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  icon: IconType;
  badge?: string | number;
  accent?: 'primary' | 'success' | 'warning' | 'info' | 'neutral';
  emphasize?: boolean;
};

function toneClasses(accent: MobileActionHubItem['accent']) {
  switch (accent) {
    case 'success':
      return 'border-success/16 bg-success/8 text-success';
    case 'warning':
      return 'border-warning/18 bg-warning/10 text-warning';
    case 'info':
      return 'border-info/18 bg-info/10 text-info';
    case 'neutral':
      return 'border-subtle-border bg-muted/45 text-foreground';
    case 'primary':
    default:
      return 'border-primary/16 bg-primary/10 text-primary';
  }
}

function TileShell({
  children,
  href,
  onClick,
  className,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function ActionTile({
  item,
  mobileHomeEffect,
}: {
  item: MobileActionHubItem;
  mobileHomeEffect: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const depthRef = useMobileDepthEffect(mobileHomeEffect);
  const hold = useTouchHoldLift(true);
  const Icon = item.icon;

  return (
    <motion.div
      ref={depthRef as React.Ref<HTMLDivElement>}
      animate={hold.isHolding && !reducedMotion ? { y: -3, scale: 1.01 } : { y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={cn(
        mobileHomeEffect &&
          '[box-shadow:0_calc(10px*var(--mobile-card-depth,0))_24px_rgba(15,23,42,0.10)] [filter:saturate(calc(1+var(--mobile-card-depth,0)*0.06))] [transform:translateY(calc(var(--mobile-card-depth,0)*-2px))]',
        hold.isHolding && 'rounded-2xl shadow-[0_16px_32px_rgba(15,23,42,0.14)] ring-1 ring-primary/10',
      )}
      {...hold.holdProps}
    >
      <TileShell
        href={item.href}
        onClick={item.onClick}
        className={cn(
          'group block min-h-[96px] rounded-[22px] border bg-card/96 p-3 text-center shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/28 hover:shadow-raised active:translate-y-0 touch-target sm:min-h-[104px] sm:rounded-[26px] sm:p-3.5',
          item.emphasize && 'border-primary/25 bg-primary/[0.06] shadow-[0_16px_36px_rgba(59,130,246,0.12)]',
          !item.href && !item.onClick && 'pointer-events-none',
        )}
      >
        <div className="flex h-full flex-col items-center">
          <div className="flex w-full items-start justify-between gap-2">
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] sm:h-12 sm:w-12',
                toneClasses(item.accent),
              )}
            >
              <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={1.9} />
            </span>
            {item.badge !== undefined && item.badge !== '' ? (
              <span className="rounded-full border border-primary/16 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {item.badge}
              </span>
            ) : null}
          </div>

          <div className="mt-2.5 flex-1">
            <div className="text-[15px] font-semibold leading-5 text-foreground sm:text-sm">{item.label}</div>
            {item.description ? <div className="mt-1 line-clamp-2 text-[12px] leading-4.5 text-secondary-foreground sm:line-clamp-1 sm:leading-5">{item.description}</div> : null}
          </div>

          {(item.href || item.onClick) && item.description ? (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary sm:mt-2">
              <ArrowUpRight className="icon-directional h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} />
            </div>
          ) : null}
        </div>
      </TileShell>
    </motion.div>
  );
}

export function MobileActionHub({
  title,
  subtitle,
  items,
  className,
  mobileHomeEffect = false,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  items: MobileActionHubItem[];
  className?: string;
  mobileHomeEffect?: boolean;
}) {
  return (
    <section className={cn('space-y-3', className)} aria-label={typeof title === 'string' ? title : undefined}>
      {title || subtitle ? (
        <div className="flex items-end justify-between gap-3 text-right">
          <div>
            {title ? <h2 className="text-[15px] font-semibold text-foreground">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-[12px] leading-5 text-secondary-foreground">{subtitle}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 max-[350px]:grid-cols-1 sm:gap-2.5 lg:grid-cols-3">
        {items.map((item) => (
          <ActionTile key={item.id} item={item} mobileHomeEffect={mobileHomeEffect} />
        ))}
      </div>
    </section>
  );
}
