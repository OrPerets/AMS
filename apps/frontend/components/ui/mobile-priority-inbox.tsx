import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CircleAlert, Clock3, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { StatusBadge } from './status-badge';
import { Button } from './button';
import { ToastAction } from './toast';
import { toast } from './use-toast';
import { cn } from '../../lib/utils';
import { useDirection, useLocale } from '../../lib/providers';
import { triggerHaptic } from '../../lib/mobile';
import { trackInteractionLifecycle, trackLiveEventReactionRendered } from '../../lib/analytics';
import { useTouchHoldLift } from './mobile-card-effects';
import { INTERACTION_THRESHOLDS, MOTION_DISTANCE, MOTION_DURATION, MOTION_SPRING, MOTION_STAGGER } from '../../lib/motion-tokens';
import { subscribeUIInteraction } from '../../lib/ui-interaction-bus';

type InboxTone = 'neutral' | 'active' | 'success' | 'warning' | 'danger';

type SwipeAction = {
  label: string;
  tone: 'primary' | 'success' | 'warning' | 'danger';
  href?: string;
  onClick?: (item: MobilePriorityInboxItem) => void;
};

export type MobilePriorityInboxItem = {
  id: string;
  status: string;
  tone: InboxTone;
  title: string;
  reason: string;
  meta?: string;
  href?: string;
  ctaLabel?: string;
};

function resolveSwipeAction(item: MobilePriorityInboxItem, roleHint: 'resident' | 'admin' | 'operations'): SwipeAction {
  if (item.tone === 'danger') {
    return {
      label: item.ctaLabel ?? (roleHint === 'admin' ? 'הסלם עכשיו' : roleHint === 'resident' ? 'טפל בבקשה' : 'טפל עכשיו'),
      tone: 'danger',
      href: item.href,
    };
  }
  if (item.tone === 'warning') {
    return {
      label: item.ctaLabel ?? (roleHint === 'admin' ? 'בדוק SLA' : roleHint === 'resident' ? 'בדוק סטטוס' : 'בדוק עכשיו'),
      tone: 'warning',
      href: item.href,
    };
  }
  if (item.tone === 'success') {
    return { label: item.ctaLabel ?? 'צפה בסיכום', tone: 'success', href: item.href };
  }
  return {
    label: item.ctaLabel ?? (roleHint === 'resident' ? 'פתח מעקב' : roleHint === 'admin' ? 'פתח לטיפול' : 'פתח פריט'),
    tone: 'primary',
    href: item.href,
  };
}

function actionToneClasses(tone: SwipeAction['tone']) {
  switch (tone) {
    case 'danger':
      return 'bg-destructive text-destructive-foreground';
    case 'warning':
      return 'bg-warning text-warning-foreground';
    case 'success':
      return 'bg-success text-success-foreground';
    case 'primary':
    default:
      return 'bg-primary text-primary-foreground';
  }
}

const PriorityInboxItemCard = React.forwardRef<HTMLDivElement, {
  item: MobilePriorityInboxItem;
  index: number;
  swipeDirection: 1 | -1;
  roleHint: 'resident' | 'admin' | 'operations';
  onActionCommitted?: (item: MobilePriorityInboxItem) => void;
}>(({
  item,
  index,
  swipeDirection,
  roleHint,
  onActionCommitted,
}, ref) => {
  const reducedMotion = useReducedMotion();
  const [offset, setOffset] = React.useState(0);
  const [isPrepared, setIsPrepared] = React.useState(false);
  const [isCommitArmed, setIsCommitArmed] = React.useState(false);
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const swipeLockedRef = React.useRef(false);
  const revealCrossedRef = React.useRef(false);
  const commitCrossedRef = React.useRef(false);
  const action = resolveSwipeAction(item, roleHint);
  const hold = useTouchHoldLift(true);
  const revealThreshold = INTERACTION_THRESHOLDS.swipeReveal;
  const commitThreshold = INTERACTION_THRESHOLDS.swipeCommit;
  const maxSwipeDistance = INTERACTION_THRESHOLDS.swipeMaxDistance;

  return (
    <motion.div
      ref={ref}
      layout
      initial={reducedMotion ? false : { opacity: 0, y: -MOTION_DISTANCE.sm, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -MOTION_DISTANCE.xs, scale: 0.98 }}
      transition={{ layout: MOTION_SPRING.layout, duration: MOTION_DURATION.moderate, delay: reducedMotion ? 0 : index * MOTION_STAGGER.quick }}
      role="listitem"
      aria-label={`${item.status} ${item.title}`}
      className="relative overflow-hidden rounded-2xl"
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 flex items-center px-4 text-[11px] font-semibold transition-opacity duration-150',
          swipeDirection === 1 ? 'left-0 justify-start' : 'right-0 justify-end',
          actionToneClasses(action.tone),
        )}
        style={{ opacity: isPrepared ? 1 : 0 }}
        aria-hidden="true"
      >
        {action.label}
      </div>

      <motion.div
        className={cn(
          'rounded-2xl border border-subtle-border bg-background p-3 will-change-transform',
          hold.isHolding && 'shadow-raised ring-1 ring-primary/14',
        )}
        layout
        style={{ x: offset, touchAction: 'pan-y' }}
        animate={hold.isHolding && !reducedMotion ? { y: -MOTION_DISTANCE.xxs, scale: 1.01 } : { y: 0, scale: 1 }}
        transition={MOTION_SPRING.cardTight}
        onTouchStart={(event) => {
          touchStartXRef.current = event.touches[0]?.clientX ?? null;
          touchStartYRef.current = event.touches[0]?.clientY ?? null;
          swipeLockedRef.current = false;
          setOffset(0);
          setIsPrepared(false);
          setIsCommitArmed(false);
          revealCrossedRef.current = false;
          commitCrossedRef.current = false;
          trackInteractionLifecycle('interaction_started', {
            pathname: window.location.pathname,
            sourceSurface: 'mobile_priority_inbox',
            destinationSurface: item.href ?? null,
            interactionType: 'swipe',
            interactionId: item.id,
            tone: item.tone,
          });
        }}
        onTouchMove={(event) => {
          if (reducedMotion || touchStartXRef.current === null || touchStartYRef.current === null) return;
          const deltaX = event.touches[0].clientX - touchStartXRef.current;
          const deltaY = event.touches[0].clientY - touchStartYRef.current;

          if (!swipeLockedRef.current) {
            if (Math.abs(deltaY) > Math.abs(deltaX) || Math.abs(deltaX) < 18) {
              return;
            }
            swipeLockedRef.current = true;
          }

          const directionalDelta = deltaX * swipeDirection;
          const clamped = Math.max(0, Math.min(directionalDelta, maxSwipeDistance)) * swipeDirection;
          const absoluteOffset = Math.abs(clamped);
          const isRevealActive = absoluteOffset >= revealThreshold;
          const isCommitActive = absoluteOffset >= commitThreshold;

          if (isRevealActive !== revealCrossedRef.current) {
            revealCrossedRef.current = isRevealActive;
            if (isRevealActive) {
              triggerHaptic('light');
              trackInteractionLifecycle('interaction_threshold_reached', {
                pathname: window.location.pathname,
                sourceSurface: 'mobile_priority_inbox',
                destinationSurface: item.href ?? null,
                interactionType: 'swipe',
                interactionId: item.id,
                tone: item.tone,
              });
            }
          }

          if (isCommitActive !== commitCrossedRef.current) {
            commitCrossedRef.current = isCommitActive;
            if (isCommitActive) {
              triggerHaptic(item.tone === 'danger' ? 'warning' : 'light');
            }
          }

          setIsPrepared(isRevealActive);
          setIsCommitArmed(isCommitActive);
          setOffset(clamped);
        }}
        onTouchEnd={() => {
          const crossedThreshold = isCommitArmed && Math.sign(offset || 0) === swipeDirection;
          if (crossedThreshold && (action.href || action.onClick)) {
            triggerHaptic(item.tone === 'danger' ? 'warning' : 'success');
            trackInteractionLifecycle('interaction_committed', {
              pathname: window.location.pathname,
              sourceSurface: 'mobile_priority_inbox',
              destinationSurface: item.href ?? null,
              interactionType: 'swipe',
              interactionId: item.id,
              tone: item.tone,
            });
            onActionCommitted?.(item);
            if (action.onClick) {
              action.onClick(item);
            } else if (action.href) {
              window.location.assign(action.href);
            }
          } else {
            trackInteractionLifecycle('interaction_cancelled', {
              pathname: window.location.pathname,
              sourceSurface: 'mobile_priority_inbox',
              destinationSurface: item.href ?? null,
              interactionType: 'swipe',
              interactionId: item.id,
              tone: item.tone,
              cancelledAfterThreshold: commitCrossedRef.current || revealCrossedRef.current,
            });
          }
          touchStartXRef.current = null;
          touchStartYRef.current = null;
          swipeLockedRef.current = false;
          revealCrossedRef.current = false;
          commitCrossedRef.current = false;
          setIsPrepared(false);
          setIsCommitArmed(false);
          setOffset(0);
        }}
        onTouchCancel={() => {
          touchStartXRef.current = null;
          touchStartYRef.current = null;
          swipeLockedRef.current = false;
          revealCrossedRef.current = false;
          commitCrossedRef.current = false;
          setIsPrepared(false);
          setIsCommitArmed(false);
          setOffset(0);
        }}
        {...hold.holdProps}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={item.status} tone={item.tone} />
              {item.meta ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-secondary-foreground">
                  <Clock3 className="h-3 w-3" strokeWidth={1.75} />
                  {item.meta}
                </span>
              ) : null}
            </div>
            <div className="text-sm font-semibold text-foreground">{item.title}</div>
            <div className="line-clamp-2 text-[13px] leading-5 text-secondary-foreground">{item.reason}</div>
          </div>
          <CircleAlert className={cn('mt-0.5 h-4 w-4 shrink-0', item.tone === 'danger' ? 'text-destructive' : item.tone === 'warning' ? 'text-warning' : 'text-primary')} strokeWidth={1.75} />
        </div>
        {item.href && item.ctaLabel ? (
          <motion.div layout className="mt-3">
            <Button asChild size="sm" variant="outline" className="w-full justify-between">
              <Link href={item.href}>
                {item.ctaLabel}
                <ArrowUpRight className="icon-directional h-4 w-4" strokeWidth={1.75} />
              </Link>
            </Button>
          </motion.div>
        ) : null}
      </motion.div>
    </motion.div>
  );
});

PriorityInboxItemCard.displayName = 'PriorityInboxItemCard';

export function MobilePriorityInbox({
  title,
  subtitle,
  items,
  emptyTitle,
  emptyDescription,
  emptyAction,
  className,
  emphasizeFirst = true,
  maxItems = 3,
  compact = false,
  onActionCommitted,
}: {
  title?: string;
  subtitle?: string;
  items: MobilePriorityInboxItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; href: string };
  className?: string;
  emphasizeFirst?: boolean;
  maxItems?: number;
  compact?: boolean;
  onActionCommitted?: (item: MobilePriorityInboxItem) => void;
}) {
  const { t } = useLocale();
  const { isRTL } = useDirection();
  const router = useRouter();
  const resolvedTitle = title ?? t('mobilePriority.title');
  const resolvedEmptyTitle = emptyTitle ?? t('mobilePriority.emptyTitle');
  const resolvedEmptyDescription = emptyDescription ?? t('mobilePriority.emptyDescription');
  const [optimisticallyHiddenIds, setOptimisticallyHiddenIds] = React.useState<string[]>([]);
  const [undoStack, setUndoStack] = React.useState<Array<{ id: string; index: number; expiresAt: number }>>([]);
  const [liveAttention, setLiveAttention] = React.useState(false);
  const undoTimeoutsRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const filteredItems = React.useMemo(
    () => items.filter((item) => !optimisticallyHiddenIds.includes(item.id)),
    [items, optimisticallyHiddenIds],
  );
  const pendingUndoCount = undoStack.length;
  const visibleItems = filteredItems.slice(0, maxItems);
  const swipeDirection = isRTL ? 1 : -1;
  const roleHint: 'resident' | 'admin' | 'operations' = router.pathname.startsWith('/resident')
    ? 'resident'
    : router.pathname.startsWith('/admin')
      ? 'admin'
      : 'operations';
  const removeUndoEntry = React.useCallback((id: string) => {
    const timeout = undoTimeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      undoTimeoutsRef.current.delete(id);
    }
    setUndoStack((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const handleActionCommitted = React.useCallback((item: MobilePriorityInboxItem) => {
    const filteredIndex = filteredItems.findIndex((candidate) => candidate.id === item.id);
    if (filteredIndex === -1) return;

    const expiresAt = Date.now() + 8000;

    setOptimisticallyHiddenIds((current) => (current.includes(item.id) ? current : [...current, item.id]));
    setUndoStack((current) => {
      const withoutCurrent = current.filter((entry) => entry.id !== item.id);
      return [...withoutCurrent, { id: item.id, index: filteredIndex, expiresAt }];
    });

    const existingTimeout = undoTimeoutsRef.current.get(item.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    undoTimeoutsRef.current.set(
      item.id,
      setTimeout(() => {
        removeUndoEntry(item.id);
      }, Math.max(0, expiresAt - Date.now())),
    );

    toast({
      title: 'הפריט הועבר לטיפול',
      description: pendingUndoCount > 0 ? `${item.title} · ${pendingUndoCount + 1} ממתינים לאישור` : item.title,
      action: (
        <ToastAction
          altText="בטל"
          onClick={() => {
            setOptimisticallyHiddenIds((current) => current.filter((id) => id !== item.id));
            removeUndoEntry(item.id);
            trackInteractionLifecycle('interaction_undone', {
              pathname: window.location.pathname,
              sourceSurface: 'mobile_priority_inbox',
              destinationSurface: item.href ?? null,
              interactionType: 'swipe',
              interactionId: item.id,
              tone: item.tone,
            });
          }}
        >
          בטל
        </ToastAction>
      ),
    });

    onActionCommitted?.(item);
  }, [filteredItems, onActionCommitted, pendingUndoCount, removeUndoEntry]);

  React.useEffect(() => {
    setOptimisticallyHiddenIds((current) => current.filter((id) => items.some((item) => item.id === id)));
    setUndoStack((current) => current.filter((entry) => items.some((item) => item.id === entry.id) && entry.expiresAt > Date.now()));
  }, [items]);

  React.useEffect(() => () => {
    undoTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    undoTimeoutsRef.current.clear();
  }, []);

  React.useEffect(() => {
    const timeouts = new Set<number>();
    const unsubscribe = subscribeUIInteraction((event) => {
      if (event.name !== 'live_event_received') return;
      const destinationSurface = String(event.payload.destinationSurface ?? '');
      if (!destinationSurface || (!destinationSurface.includes('/notifications') && !destinationSurface.includes('/tickets'))) {
        return;
      }
      setLiveAttention(true);
      trackLiveEventReactionRendered({
        eventType: String(event.payload.eventType ?? 'unknown'),
        surface: 'mobile_priority_inbox',
        destinationSurface,
        reactionLatencyMs: Date.now() - event.timestamp,
      });
      const timeout = window.setTimeout(() => {
        setLiveAttention(false);
        timeouts.delete(timeout);
      }, 3800);
      timeouts.add(timeout);
    });
    return () => {
      unsubscribe();
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  return (
    <Card
      variant="elevated"
      className={cn(
        'overflow-hidden',
        compact && 'rounded-[24px]',
        liveAttention && 'ring-1 ring-primary/18 shadow-[0_0_0_1px_rgba(224,182,89,0.24)]',
        className,
      )}
    >
      <CardHeader className={cn(compact ? 'pb-2.5 pt-4' : 'pb-3')}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" strokeWidth={1.75} />
              {resolvedTitle}
            </CardTitle>
            {subtitle ? <p className={cn(compact ? 'mt-0.5 text-[12px] leading-4.5' : 'mt-1 text-[13px] leading-5', 'text-secondary-foreground')}>{subtitle}</p> : null}
          </div>
          <motion.div layout className="rounded-full border border-subtle-border bg-muted/35 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            {t('common.itemsCount', { count: items.length })}
          </motion.div>
        </div>
      </CardHeader>
      <CardContent className={cn(compact ? 'space-y-2 pb-4' : 'space-y-2.5', '')} role="list">
        {visibleItems.length ? (
          <AnimatePresence initial={false} mode="popLayout">
            {visibleItems.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  index === 0 && emphasizeFirst && 'rounded-[22px] bg-[linear-gradient(180deg,rgba(255,250,244,0.75)_0%,rgba(255,255,255,0)_100%)] p-[1px]',
                )}
              >
                <PriorityInboxItemCard
                  item={item}
                  index={index}
                  swipeDirection={swipeDirection}
                  roleHint={roleHint}
                  onActionCommitted={handleActionCommitted}
                />
              </div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div layout className="rounded-[20px] border border-dashed border-subtle-border bg-muted/18 p-4">
            <div className="text-sm font-semibold text-foreground">{resolvedEmptyTitle}</div>
            <div className="mt-1 text-[13px] leading-5 text-muted-foreground">{resolvedEmptyDescription}</div>
            {emptyAction ? (
              <Link href={emptyAction.href} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">
                {emptyAction.label}
                <ArrowUpRight className="icon-directional h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            ) : null}
          </motion.div>
        )}
        {items.length > 3 ? (
          <div className="flex justify-end">
            <Link href={items[0]?.href || '/notifications'} className="text-[12px] font-semibold text-primary">
              צפה בכל הפריטים
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
