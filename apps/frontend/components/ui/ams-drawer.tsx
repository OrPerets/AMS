"use client";

import * as React from 'react';
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader } from '@heroui/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MOTION_DISTANCE, MOTION_DURATION, MOTION_EASE } from '../../lib/motion-tokens';
import { trackInteractionLifecycle } from '../../lib/analytics';

type AmsDrawerProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode | ((onClose: () => void) => React.ReactNode);
  placement?: 'bottom' | 'top' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  hideCloseButton?: boolean;
  backdrop?: 'opaque' | 'blur' | 'transparent';
  scrollBehavior?: 'inside' | 'outside';
  tone?: 'dark' | 'light';
  preferSharedTransition?: boolean;
  enableSnapPoints?: boolean;
  drawerKey?: string;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  onSnapPointChange?: (snapPoint: number) => void;
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function AmsDrawer({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  placement = 'bottom',
  size = 'full',
  className,
  bodyClassName,
  headerClassName,
  hideCloseButton = false,
  backdrop = 'blur',
  scrollBehavior = 'inside',
  tone = 'light',
  preferSharedTransition = false,
  enableSnapPoints = false,
  drawerKey,
  snapPoints = [0.34, 0.62, 0.92],
  defaultSnapPoint = 1,
  onSnapPointChange,
}: AmsDrawerProps) {
  const lightTone = tone === 'light';
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const dragStartRef = React.useRef<{ y: number; ratio: number; time: number } | null>(null);
  const dragLastRef = React.useRef<{ y: number; time: number } | null>(null);
  const [activeSnapPoint, setActiveSnapPoint] = React.useState(() => {
    const fallback = snapPoints[Math.min(Math.max(defaultSnapPoint, 0), snapPoints.length - 1)] ?? 1;
    return fallback;
  });
  const [viewportHeight, setViewportHeight] = React.useState(900);

  const normalizedSnapPoints = React.useMemo(
    () =>
      Array.from(new Set(snapPoints.map((point) => Math.min(1, Math.max(0.2, point))))).sort((a, b) => a - b),
    [snapPoints],
  );

  const saveSnapPoint = React.useCallback(
    (point: number) => {
      if (!drawerKey || typeof window === 'undefined') return;
      try {
        window.sessionStorage.setItem(`ams-drawer-snap:${drawerKey}`, point.toString());
      } catch {}
    },
    [drawerKey],
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncViewportHeight = () => setViewportHeight(window.innerHeight);
    syncViewportHeight();
    window.addEventListener('resize', syncViewportHeight);
    return () => window.removeEventListener('resize', syncViewportHeight);
  }, []);

  React.useEffect(() => {
    if (!enableSnapPoints || !isOpen || placement !== 'bottom' || !drawerKey || typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem(`ams-drawer-snap:${drawerKey}`);
      if (!raw) return;
      const parsed = Number(raw);
      if (Number.isNaN(parsed)) return;
      const nearest = normalizedSnapPoints.reduce((closest, candidate) => {
        return Math.abs(candidate - parsed) < Math.abs(closest - parsed) ? candidate : closest;
      }, normalizedSnapPoints[normalizedSnapPoints.length - 1] ?? 1);
      setActiveSnapPoint(nearest);
    } catch {}
  }, [drawerKey, enableSnapPoints, isOpen, normalizedSnapPoints, placement]);

  React.useEffect(() => {
    if (!isOpen || placement !== 'bottom') return;
    const appSurface = document.querySelector<HTMLElement>('[data-scroll-container="app"]');
    if (!appSurface) return;
    const backdropProgress = enableSnapPoints ? activeSnapPoint : 1;
    appSurface.style.transition = 'transform 220ms ease, filter 220ms ease';
    appSurface.style.transformOrigin = '50% 8%';
    appSurface.style.transform = `scale(${1 - backdropProgress * 0.015})`;
    appSurface.style.filter = `saturate(${1 - backdropProgress * 0.08})`;
    return () => {
      appSurface.style.transform = '';
      appSurface.style.filter = '';
      appSurface.style.transition = '';
      appSurface.style.transformOrigin = '';
    };
  }, [activeSnapPoint, enableSnapPoints, isOpen, placement]);

  React.useEffect(() => {
    if (!isOpen) return;

    const container = contentRef.current;
    if (!container) return;

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1,
      );

    const focusable = getFocusable();
    const firstFocusable = focusable[0];
    if (firstFocusable && document.activeElement && !container.contains(document.activeElement)) {
      window.setTimeout(() => firstFocusable.focus(), 0);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = getFocusable();
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!active || active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const commitSnapPoint = React.useCallback(
    (nextPoint: number) => {
      const nearest = normalizedSnapPoints.reduce((closest, candidate) => {
        return Math.abs(candidate - nextPoint) < Math.abs(closest - nextPoint) ? candidate : closest;
      }, normalizedSnapPoints[normalizedSnapPoints.length - 1] ?? 1);
      setActiveSnapPoint(nearest);
      saveSnapPoint(nearest);
      onSnapPointChange?.(nearest);
      if (typeof window !== 'undefined' && enableSnapPoints) {
        const snapType = nearest <= 0.36 ? 'peek' : nearest <= 0.7 ? 'half' : 'full';
        trackInteractionLifecycle('interaction_committed', {
          pathname: window.location.pathname,
          sourceSurface: 'drawer',
          destinationSurface: 'drawer',
          interactionType: 'drawer_snap',
          interactionId: drawerKey,
          tone: snapType,
        });
      }
    },
    [normalizedSnapPoints, onSnapPointChange, saveSnapPoint, enableSnapPoints, drawerKey],
  );

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enableSnapPoints || placement !== 'bottom') return;
    const startPoint = event.clientY;
    dragStartRef.current = { y: startPoint, ratio: activeSnapPoint, time: Date.now() };
    dragLastRef.current = { y: startPoint, time: Date.now() };
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enableSnapPoints || placement !== 'bottom' || !dragStartRef.current) return;
    const maxHeight = Math.max(window.innerHeight * 0.88, 1);
    const delta = dragStartRef.current.y - event.clientY;
    const nextRatio = Math.min(1, Math.max(0.2, dragStartRef.current.ratio + delta / maxHeight));
    setActiveSnapPoint(nextRatio);
    dragLastRef.current = { y: event.clientY, time: Date.now() };
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enableSnapPoints || placement !== 'bottom' || !dragStartRef.current) return;
    const start = dragStartRef.current;
    const last = dragLastRef.current ?? { y: event.clientY, time: Date.now() };
    const elapsedMs = Math.max(last.time - start.time, 1);
    const velocity = (last.y - start.y) / elapsedMs;
    const lowestSnap = normalizedSnapPoints[0] ?? 0.34;
    if (velocity > 0.95 && activeSnapPoint <= lowestSnap + 0.05) {
      if (typeof window !== 'undefined') {
        trackInteractionLifecycle('interaction_cancelled', {
          pathname: window.location.pathname,
          sourceSurface: 'drawer',
          destinationSurface: null,
          interactionType: 'drawer_dismiss',
          interactionId: drawerKey,
        });
      }
      onOpenChange(false);
    } else {
      commitSnapPoint(activeSnapPoint);
    }
    dragStartRef.current = null;
    dragLastRef.current = null;
    (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement={placement}
      size={size}
      backdrop={backdrop}
      scrollBehavior={scrollBehavior}
      shouldBlockScroll
      classNames={{
        backdrop: lightTone ? 'bg-black/30 backdrop-blur-[2px]' : 'bg-black/50 backdrop-blur-sm',
        wrapper: placement === 'bottom' ? 'items-end' : undefined,
        base: cn(
          lightTone
            ? 'mobile-unified-drawer'
            : 'mobile-unified-drawer',
          placement === 'bottom' && 'm-0 max-h-[88dvh] rounded-t-[30px] rounded-b-none',
          placement !== 'bottom' && 'rounded-[28px]',
          className,
        ),
        body: cn('px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-0', bodyClassName),
        header: cn('px-4 pb-3 pt-0', headerClassName),
        footer: 'px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2',
        closeButton: 'hidden',
      }}
      motionProps={{
        variants:
          placement === 'bottom'
            ? {
                enter: {
                  y: 0,
                  scale: MOTION_DISTANCE.drawerEnterScale,
                  opacity: 1,
                  transition: { duration: MOTION_DURATION.standard, ease: MOTION_EASE.emphasized },
                },
                exit: {
                  y: preferSharedTransition ? 0 : MOTION_DISTANCE.drawerHiddenY,
                  scale: MOTION_DISTANCE.drawerExitScale,
                  opacity: 0.96,
                  transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.emphasizedExit },
                },
                initial: {
                  y: preferSharedTransition ? 0 : MOTION_DISTANCE.drawerHiddenY,
                  scale: MOTION_DISTANCE.drawerInitialScale,
                  opacity: 0.92,
                },
              }
            : undefined,
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <div
            ref={contentRef}
            className="text-start"
            style={
              placement === 'bottom' && enableSnapPoints
                ? {
                  height: `${Math.max(viewportHeight * 0.88 * activeSnapPoint, 220)}px`,
                    maxHeight: '88dvh',
                    transition: dragStartRef.current ? undefined : 'height 240ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                  }
                : undefined
            }
          >
            <div className="px-4 pt-3">
              <div
                onPointerDown={handleDragStart}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                onPointerCancel={handleDragEnd}
                className={cn(enableSnapPoints && placement === 'bottom' && 'cursor-grab touch-none active:cursor-grabbing')}
                aria-label="Drawer resize handle"
              >
                <div className="gold-current-pulse mx-auto h-1.5 w-14 rounded-full bg-[linear-gradient(90deg,rgba(255,242,214,0.28),rgba(224,182,89,0.95),rgba(255,242,214,0.28))]" />
              </div>
            </div>
            {(title || description || !hideCloseButton) ? (
              <DrawerHeader>
                <div className="flex items-start justify-between gap-3 border-b border-subtle-border/90 pb-3">
                  <div className="min-w-0">
                    {title ? <h2 className="text-base font-semibold text-foreground">{title}</h2> : null}
                    {description ? <p className="mt-1 text-sm leading-6 text-secondary-foreground">{description}</p> : null}
                    <div className="gold-divider-line mt-3 h-px w-full" />
                  </div>
                  {!hideCloseButton ? (
                    <button
                      type="button"
                      onClick={onClose}
                      className="touch-target inline-flex h-10 w-10 items-center justify-center rounded-full border border-subtle-border bg-background text-secondary-foreground transition hover:bg-muted/80"
                      aria-label="סגור חלון"
                    >
                      <X className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  ) : null}
                </div>
              </DrawerHeader>
            ) : null}
            <DrawerBody>{children}</DrawerBody>
            {footer ? <DrawerFooter>{typeof footer === 'function' ? footer(onClose) : footer}</DrawerFooter> : null}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
