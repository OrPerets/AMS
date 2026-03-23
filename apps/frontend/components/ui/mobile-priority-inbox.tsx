import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CircleAlert, Clock3, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { StatusBadge } from './status-badge';
import { Button } from './button';
import { cn } from '../../lib/utils';
import { useDirection, useLocale } from '../../lib/providers';
import { triggerHaptic } from '../../lib/mobile';
import { useTouchHoldLift } from './mobile-card-effects';

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
}>(({
  item,
  index,
  swipeDirection,
  roleHint,
}, ref) => {
  const reducedMotion = useReducedMotion();
  const [offset, setOffset] = React.useState(0);
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const swipeLockedRef = React.useRef(false);
  const action = resolveSwipeAction(item, roleHint);
  const hold = useTouchHoldLift(true);

  return (
    <motion.div
      ref={ref}
      layout
      initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.98 }}
      transition={{ layout: { type: 'spring', stiffness: 320, damping: 30 }, duration: 0.28, delay: reducedMotion ? 0 : index * 0.04 }}
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
        style={{ opacity: Math.abs(offset) > 10 ? 1 : 0 }}
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
        animate={hold.isHolding && !reducedMotion ? { y: -3, scale: 1.01 } : { y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        onTouchStart={(event) => {
          touchStartXRef.current = event.touches[0]?.clientX ?? null;
          touchStartYRef.current = event.touches[0]?.clientY ?? null;
          swipeLockedRef.current = false;
          setOffset(0);
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
          const clamped = Math.max(0, Math.min(directionalDelta, 116)) * swipeDirection;
          setOffset(clamped);
        }}
        onTouchEnd={() => {
          const crossedThreshold = Math.abs(offset) > 78 && Math.sign(offset || 0) === swipeDirection;
          if (crossedThreshold && (action.href || action.onClick)) {
            triggerHaptic(item.tone === 'danger' ? 'warning' : 'light');
            if (action.onClick) {
              action.onClick(item);
            } else if (action.href) {
              window.location.assign(action.href);
            }
          }
          touchStartXRef.current = null;
          touchStartYRef.current = null;
          swipeLockedRef.current = false;
          setOffset(0);
        }}
        onTouchCancel={() => {
          touchStartXRef.current = null;
          touchStartYRef.current = null;
          swipeLockedRef.current = false;
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
  className,
}: {
  title?: string;
  subtitle?: string;
  items: MobilePriorityInboxItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  const { t } = useLocale();
  const { isRTL } = useDirection();
  const router = useRouter();
  const resolvedTitle = title ?? t('mobilePriority.title');
  const resolvedEmptyTitle = emptyTitle ?? t('mobilePriority.emptyTitle');
  const resolvedEmptyDescription = emptyDescription ?? t('mobilePriority.emptyDescription');
  const visibleItems = items.slice(0, 3);
  const swipeDirection = isRTL ? 1 : -1;
  const roleHint: 'resident' | 'admin' | 'operations' = router.pathname.startsWith('/resident')
    ? 'resident'
    : router.pathname.startsWith('/admin')
      ? 'admin'
      : 'operations';

  return (
    <Card variant="elevated" className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" strokeWidth={1.75} />
              {resolvedTitle}
            </CardTitle>
            {subtitle ? <p className="mt-1 text-[13px] leading-5 text-secondary-foreground">{subtitle}</p> : null}
          </div>
          <motion.div layout className="rounded-full border border-subtle-border bg-muted/35 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            {t('common.itemsCount', { count: items.length })}
          </motion.div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5" role="list">
        {visibleItems.length ? (
          <AnimatePresence initial={false} mode="popLayout">
            {visibleItems.map((item, index) => (
              <PriorityInboxItemCard key={item.id} item={item} index={index} swipeDirection={swipeDirection} roleHint={roleHint} />
            ))}
          </AnimatePresence>
        ) : (
          <motion.div layout className="rounded-[20px] border border-dashed border-subtle-border bg-muted/18 p-4">
            <div className="text-sm font-semibold text-foreground">{resolvedEmptyTitle}</div>
            <div className="mt-1 text-[13px] leading-5 text-muted-foreground">{resolvedEmptyDescription}</div>
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
