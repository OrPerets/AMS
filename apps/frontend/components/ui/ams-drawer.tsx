"use client";

import * as React from 'react';
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader } from '@heroui/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

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
}: AmsDrawerProps) {
  const lightTone = tone === 'light';
  const contentRef = React.useRef<HTMLDivElement | null>(null);

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
            ? 'glass-surface-strong border border-subtle-border text-foreground shadow-[0_26px_70px_-44px_rgba(44,28,9,0.22)]'
            : 'drawer-premium-surface text-inverse-text',
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
                  scale: 1,
                  opacity: 1,
                  transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] },
                },
                exit: {
                  y: '100%',
                  scale: 0.985,
                  opacity: 0.96,
                  transition: { duration: 0.22, ease: [0.7, 0, 0.84, 0] },
                },
                initial: {
                  y: '100%',
                  scale: 0.97,
                  opacity: 0.92,
                },
              }
            : undefined,
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <div ref={contentRef} className="text-start">
            <div className="px-4 pt-3">
              <div className="gold-current-pulse mx-auto h-1.5 w-14 rounded-full bg-[linear-gradient(90deg,rgba(255,242,214,0.28),rgba(224,182,89,0.95),rgba(255,242,214,0.28))]" />
            </div>
            {(title || description || !hideCloseButton) ? (
              <DrawerHeader>
                <div className={cn('flex items-start justify-between gap-3 border-b pb-3', lightTone ? 'border-subtle-border/90' : 'border-white/8')}>
                  <div className="min-w-0">
                    {title ? <h2 className={cn('text-base font-semibold', lightTone ? 'text-foreground' : 'text-inverse-text')}>{title}</h2> : null}
                    {description ? <p className={cn('mt-1 text-sm leading-6', lightTone ? 'text-secondary-foreground' : 'text-white/70')}>{description}</p> : null}
                    <div className="gold-divider-line mt-3 h-px w-full" />
                  </div>
                  {!hideCloseButton ? (
                    <button
                      type="button"
                      onClick={onClose}
                      className={cn(
                        'touch-target inline-flex h-10 w-10 items-center justify-center rounded-full border transition',
                        lightTone
                          ? 'border-subtle-border bg-background text-secondary-foreground hover:bg-muted/80'
                          : 'border-white/12 bg-white/6 text-white/74 hover:bg-white/10',
                      )}
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
