import * as React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useMobileDepthEffect, useTouchHoldLift } from './mobile-card-effects';
import { MiniSparkline } from './mobile-insight-widget';
import { MobileRowActionsSheet, type MobileRowActionItem } from './mobile-row-actions-sheet';
import { useLongPressActions } from '../../hooks/use-long-press-actions';

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;
type LongPressActionType = 'tickets' | 'notifications' | 'requests' | 'jobs';

const SHARED_PRIORITY_LAYOUTS = {
  tickets: { icon: 'priority-tile-icon-tickets', badge: 'priority-tile-badge-tickets' },
  notifications: { icon: 'priority-tile-icon-notifications', badge: 'priority-tile-badge-notifications' },
  requests: { icon: 'priority-tile-icon-resident-requests', badge: 'priority-tile-badge-resident-requests' },
  payments: { icon: 'priority-tile-icon-payments', badge: 'priority-tile-badge-payments' },
} as const;

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
  selected?: boolean;
  priority?: 'primary' | 'secondary' | 'utility';
  previewValue?: string | number;
  microViz?: number[];
  fullCardTap?: boolean;
  actionType?: LongPressActionType;
};

const LONG_PRESS_CONTEXT_ACTIONS: Record<LongPressActionType, MobileRowActionItem[]> = {
  tickets: [
    { id: 'tickets-open', label: 'פתח קריאות', description: 'מעבר לכל הקריאות הפעילות.', href: '/tickets' },
    { id: 'tickets-mine', label: 'הקריאות שלי', description: 'קריאות שמוקצות אליך.', href: '/tickets?mine=true' },
  ],
  notifications: [
    { id: 'notifications-open', label: 'מרכז ההתראות', description: 'צפה בכל ההתראות האחרונות.', href: '/notifications' },
    { id: 'notifications-action', label: 'דורש טיפול', description: 'סינון התראות עם פעולה פתוחה.', href: '/notifications?filter=needs_action' },
  ],
  requests: [
    { id: 'requests-open', label: 'מעקב בקשות', description: 'מעבר לכל בקשות הדיירים.', href: '/resident/requests?view=history' },
    { id: 'requests-new', label: 'בקשה חדשה', description: 'יצירה מהירה של בקשה חדשה.', href: '/create-call' },
  ],
  jobs: [
    { id: 'jobs-open', label: 'תור משימות', description: 'צפייה בכל המשימות הפעילות.', href: '/tech/jobs' },
    { id: 'jobs-today', label: 'משימות להיום', description: 'פתיחה מהירה של משימות היום.', href: '/tech/jobs?view=today' },
  ],
};

function composeHandlers<T>(...handlers: Array<((event: T) => void) | undefined>) {
  return (event: T) => {
    handlers.forEach((handler) => handler?.(event));
  };
}

function resolveActionType(item: MobileActionHubItem): LongPressActionType | null {
  if (item.actionType) return item.actionType;
  const route = item.href?.split('?')[0] ?? '';
  if (route.startsWith('/tickets')) return 'tickets';
  if (route.startsWith('/notifications')) return 'notifications';
  if (route.startsWith('/resident/requests')) return 'requests';
  if (route.startsWith('/tech/jobs') || route.startsWith('/work-orders')) return 'jobs';
  if (item.id.includes('ticket')) return 'tickets';
  if (item.id.includes('notification')) return 'notifications';
  if (item.id.includes('request')) return 'requests';
  if (item.id.includes('job')) return 'jobs';
  return null;
}

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

function resolveSharedPriorityLayout(item: MobileActionHubItem) {
  const href = item.href?.split('?')[0] ?? '';
  if (href.startsWith('/tickets')) return SHARED_PRIORITY_LAYOUTS.tickets;
  if (href.startsWith('/notifications')) return SHARED_PRIORITY_LAYOUTS.notifications;
  if (href.startsWith('/resident/requests')) return SHARED_PRIORITY_LAYOUTS.requests;
  if (href.startsWith('/payments')) return SHARED_PRIORITY_LAYOUTS.payments;
  return null;
}

function TileShell({
  children,
  href,
  onClick,
  className,
  selected,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
}) {
  if (href) {
    return (
      <Link href={href} className={className} aria-current={selected ? 'page' : undefined}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-pressed={selected}>
      {children}
    </button>
  );
}

function ActionTile({
  item,
  mobileHomeEffect,
  layout,
  density,
}: {
  item: MobileActionHubItem;
  mobileHomeEffect: boolean;
  layout: 'grid' | 'hierarchy';
  density: 'default' | 'compact';
}) {
  const reducedMotion = useReducedMotion();
  const depthRef = useMobileDepthEffect(mobileHomeEffect);
  const hold = useTouchHoldLift(true);
  const Icon = item.icon;
  const isSelected = Boolean(item.selected || item.emphasize);
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const priority = item.priority ?? (isSelected ? 'primary' : 'secondary');
  const sharedPriorityLayout = priority === 'primary' ? resolveSharedPriorityLayout(item) : null;
  const iconLayoutId = reducedMotion ? undefined : sharedPriorityLayout?.icon;
  const badgeLayoutId = reducedMotion ? undefined : sharedPriorityLayout?.badge;
  const resolvedActionType = resolveActionType(item);
  const rowActions = React.useMemo<MobileRowActionItem[]>(() => {
    const destinationActions = resolvedActionType ? LONG_PRESS_CONTEXT_ACTIONS[resolvedActionType] : [];
    const quickOpenAction =
      item.href || item.onClick
        ? [
            {
              id: `open-${item.id}`,
              label: `פתח ${item.label}`,
              description: 'מעבר מהיר למסך הנבחר.',
              tone: 'primary' as const,
              ...(item.href ? { href: item.href } : { onSelect: item.onClick }),
            },
          ]
        : [];
    const dedupedContext = destinationActions.filter((action) => !item.href || action.href !== item.href);
    return [...quickOpenAction, ...dedupedContext];
  }, [item.href, item.id, item.label, item.onClick, resolvedActionType]);
  const { longPressProps } = useLongPressActions({
    onLongPress: () => {
      if (!rowActions.length) return;
      setActionsOpen(true);
    },
  });

  return (
    <>
    <motion.div
      ref={depthRef as React.Ref<HTMLDivElement>}
      animate={hold.isHolding && !reducedMotion ? { y: -3, scale: 1.01 } : { y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={cn(
        mobileHomeEffect &&
          '[box-shadow:0_calc(10px*var(--mobile-card-depth,0))_24px_rgba(84,58,15,0.10)] [filter:saturate(calc(1+var(--mobile-card-depth,0)*0.06))] [transform:translateY(calc(var(--mobile-card-depth,0)*-2px))]',
        hold.isHolding && 'rounded-2xl shadow-[0_16px_32px_rgba(84,58,15,0.14)] ring-1 ring-primary/10',
      )}
      onPointerDown={composeHandlers(hold.holdProps.onPointerDown, longPressProps.onPointerDown)}
      onPointerMove={longPressProps.onPointerMove}
      onPointerUp={composeHandlers(hold.holdProps.onPointerUp, longPressProps.onPointerUp)}
      onPointerLeave={composeHandlers(hold.holdProps.onPointerLeave, longPressProps.onPointerLeave)}
      onPointerCancel={composeHandlers(hold.holdProps.onPointerCancel, longPressProps.onPointerCancel)}
      onBlur={hold.holdProps.onBlur}
      onClickCapture={longPressProps.onClickCapture}
    >
      <TileShell
        href={item.href}
        onClick={item.onClick}
        selected={isSelected}
        className={cn(
          'group block rounded-2xl border bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(248,243,234,0.94)_100%)] text-center shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/28 hover:shadow-raised active:translate-y-0 touch-target',
          density === 'compact' ? 'rounded-2xl p-2 md:rounded-[20px] md:p-2.5' : 'p-2.5 md:rounded-[24px] md:p-3.5',
          layout === 'grid' && (density === 'compact' ? 'min-h-[74px] sm:min-h-[82px]' : 'min-h-[80px] sm:min-h-[90px]'),
          layout === 'hierarchy' && priority === 'primary' && (density === 'compact' ? 'min-h-[84px] text-start sm:min-h-[96px]' : 'min-h-[92px] text-start sm:min-h-[110px]'),
          layout === 'hierarchy' && priority === 'secondary' && (density === 'compact' ? 'min-h-[74px]' : 'min-h-[80px]'),
          layout === 'hierarchy' && priority === 'utility' && (density === 'compact' ? 'min-h-[68px] bg-[linear-gradient(180deg,rgba(252,249,243,0.94),rgba(246,241,232,0.9))] shadow-elevation-1' : 'min-h-[72px] bg-[linear-gradient(180deg,rgba(252,249,243,0.94),rgba(246,241,232,0.9))] shadow-elevation-1'),
          isSelected && 'gold-sheen-surface gold-current-pulse border-primary/35 ring-1 ring-primary/10',
          !item.href && !item.onClick && 'pointer-events-none',
        )}
        data-accent-sheen={isSelected ? 'true' : undefined}
      >
        <div className={cn('flex h-full flex-col', layout === 'hierarchy' && priority === 'primary' ? 'items-stretch text-start' : 'items-center')}>
          <div className="flex w-full items-start justify-between gap-2">
            <motion.span
              layoutId={iconLayoutId}
              initial={reducedMotion ? { opacity: 0.94 } : false}
              animate={reducedMotion ? { opacity: 1 } : undefined}
              transition={reducedMotion ? { duration: 0.2, ease: 'easeOut' } : undefined}
              className={cn(
                'flex items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
                layout === 'hierarchy' && priority === 'utility'
                  ? density === 'compact'
                    ? 'h-7.5 w-7.5'
                    : 'h-8 w-8'
                  : density === 'compact'
                    ? 'h-9 w-9'
                    : 'h-10 w-10',
                toneClasses(item.accent),
              )}
            >
              <Icon className={cn(density === 'compact' ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-4 w-4 sm:h-5 sm:w-5')} strokeWidth={1.75} />
            </motion.span>
            {item.badge !== undefined && item.badge !== '' ? (
              <motion.span
                layoutId={badgeLayoutId}
                initial={reducedMotion ? { opacity: 0.92 } : false}
                animate={reducedMotion ? { opacity: 1 } : undefined}
                transition={reducedMotion ? { duration: 0.2, ease: 'easeOut' } : undefined}
                className="rounded-full border border-primary/16 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
              >
                {item.badge}
              </motion.span>
            ) : isSelected ? (
              <motion.span
                layoutId={badgeLayoutId}
                initial={reducedMotion ? { opacity: 0.92 } : false}
                animate={reducedMotion ? { opacity: 1 } : undefined}
                transition={reducedMotion ? { duration: 0.2, ease: 'easeOut' } : undefined}
                className="inline-flex items-center gap-1 rounded-full border border-primary/18 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
              >
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.9} />
                נבחר
              </motion.span>
            ) : null}
          </div>

          <div className={cn('mt-2 flex-1', layout === 'hierarchy' && priority === 'primary' && 'w-full')}>
            {item.previewValue !== undefined ? (
              <div className={cn(density === 'compact' ? 'mb-1 text-[1.2rem]' : 'mb-1.5 text-[1.35rem]', 'font-black leading-none tabular-nums', isSelected ? 'text-foreground' : 'text-foreground')}>
                <bdi>{item.previewValue}</bdi>
              </div>
            ) : null}
            <div className={cn(priority === 'primary' ? (density === 'compact' ? 'text-[14px]' : 'text-[15px]') : density === 'compact' ? 'text-[13px] sm:text-[13px]' : 'text-[14px] sm:text-sm', 'font-semibold leading-5 text-foreground')}>
              {item.label}
            </div>
            {item.description ? (
              <div
                className={cn(
                  'mt-1 text-secondary-foreground',
                  priority === 'utility'
                    ? 'line-clamp-1 text-[11px] leading-4'
                    : density === 'compact'
                      ? 'line-clamp-1 text-[10px] leading-4.5 sm:text-[11px]'
                      : 'line-clamp-1 text-[11px] leading-4.5 sm:text-[12px] sm:leading-5',
                )}
              >
                {item.description}
              </div>
            ) : null}
            {item.microViz?.length ? (
              <MiniSparkline
                data={item.microViz}
                tone={item.accent === 'warning' ? 'warning' : item.accent === 'success' ? 'success' : item.accent === 'info' ? 'info' : 'default'}
                className="mt-2 h-7"
              />
            ) : null}
          </div>

          {(item.href || item.onClick) && item.description && priority === 'primary' ? (
            <div className={cn('mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary sm:mt-2', layout === 'hierarchy' && priority === 'primary' && 'justify-start')}>
              <ArrowUpRight className="icon-directional h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} />
            </div>
          ) : null}
        </div>
      </TileShell>
    </motion.div>
    <MobileRowActionsSheet
      title={item.label}
      description={item.description}
      actions={rowActions}
      open={actionsOpen}
      onOpenChange={setActionsOpen}
      hideTrigger
    />
    </>
  );
}

export function MobileActionHub({
  title,
  subtitle,
  items,
  className,
  mobileHomeEffect = false,
  gridClassName,
  layout = 'grid',
  density = 'default',
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  items: MobileActionHubItem[];
  className?: string;
  mobileHomeEffect?: boolean;
  gridClassName?: string;
  layout?: 'grid' | 'hierarchy';
  density?: 'default' | 'compact';
}) {
  return (
    <section className={cn('space-y-3', className)} aria-label={typeof title === 'string' ? title : undefined}>
      {title || subtitle ? (
        <div className="flex items-end justify-between gap-3 text-right">
          <div>
            {title ? <h2 className="text-[15px] font-semibold text-foreground">{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-[11px] leading-4.5 text-secondary-foreground">{subtitle}</p> : null}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          layout === 'grid' && 'grid grid-cols-2 gap-2 max-[350px]:grid-cols-1 sm:gap-2.5 lg:grid-cols-3',
          layout === 'hierarchy' && 'grid grid-cols-2 gap-2.5',
          gridClassName,
        )}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              layout === 'hierarchy' && (item.priority ?? (item.emphasize ? 'primary' : 'secondary')) === 'primary' && 'col-span-2',
            )}
          >
            <ActionTile item={item} mobileHomeEffect={mobileHomeEffect} layout={layout} density={density} />
          </div>
        ))}
      </div>
    </section>
  );
}
