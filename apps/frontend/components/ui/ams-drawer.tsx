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
};

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
}: AmsDrawerProps) {
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
        backdrop: 'bg-black/50 backdrop-blur-sm',
        wrapper: placement === 'bottom' ? 'items-end' : undefined,
        base: cn(
          'border border-white/12 bg-[linear-gradient(180deg,rgba(32,24,17,0.98)_0%,rgba(20,15,11,0.98)_100%)] text-inverse-text shadow-modal',
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
                  transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
                },
                exit: {
                  y: '100%',
                  transition: { duration: 0.18, ease: [0.7, 0, 0.84, 0] },
                },
              }
            : undefined,
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <div className="px-4 pt-3">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-white/18" />
            </div>
            {(title || description || !hideCloseButton) ? (
              <DrawerHeader>
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="min-w-0">
                    {title ? <h2 className="text-base font-semibold text-inverse-text">{title}</h2> : null}
                    {description ? <p className="mt-1 text-sm leading-6 text-white/70">{description}</p> : null}
                  </div>
                  {!hideCloseButton ? (
                    <button
                      type="button"
                      onClick={onClose}
                      className="touch-target inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/74 transition hover:bg-white/10"
                      aria-label="Close drawer"
                    >
                      <X className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  ) : null}
                </div>
              </DrawerHeader>
            ) : null}
            <DrawerBody>{children}</DrawerBody>
            {footer ? <DrawerFooter>{typeof footer === 'function' ? footer(onClose) : footer}</DrawerFooter> : null}
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
