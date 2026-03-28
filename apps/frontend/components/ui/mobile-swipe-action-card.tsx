"use client";

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { triggerHaptic } from '../../lib/mobile';
import { useDirection } from '../../lib/providers';
import { cn } from '../../lib/utils';

type SwipeActionTone = 'primary' | 'success' | 'warning' | 'danger';
type SwipeActionSide = 'start' | 'end';

export type MobileSwipeAction = {
  id: string;
  label: string;
  tone: SwipeActionTone;
  side: SwipeActionSide;
  onCommit: () => void | Promise<void>;
};

function toneClasses(tone: SwipeActionTone) {
  switch (tone) {
    case 'success':
      return 'bg-success text-success-foreground';
    case 'warning':
      return 'bg-warning text-warning-foreground';
    case 'danger':
      return 'bg-destructive text-destructive-foreground';
    case 'primary':
    default:
      return 'bg-primary text-primary-foreground';
  }
}

export function MobileSwipeActionCard({
  children,
  actions,
  className,
  contentClassName,
  disabled = false,
  revealThreshold = 34,
  commitThreshold = 88,
  maxDistance = 124,
}: {
  children: React.ReactNode;
  actions: MobileSwipeAction[];
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  revealThreshold?: number;
  commitThreshold?: number;
  maxDistance?: number;
}) {
  const reducedMotion = useReducedMotion();
  const { isRTL } = useDirection();
  const [offset, setOffset] = React.useState(0);
  const [isPrepared, setIsPrepared] = React.useState(false);
  const [armedActionId, setArmedActionId] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const swipeLockedRef = React.useRef(false);
  const suppressClickRef = React.useRef(false);
  const revealCrossedRef = React.useRef(false);
  const commitCrossedRef = React.useRef(false);

  const resolvedActions = React.useMemo(() => {
    return actions.map((action) => ({
      ...action,
      sign: action.side === 'start' ? (isRTL ? 1 : -1) : isRTL ? -1 : 1,
    }));
  }, [actions, isRTL]);

  const startAction = resolvedActions.find((action) => action.side === 'start');
  const endAction = resolvedActions.find((action) => action.side === 'end');
  const activeAction =
    offset === 0 ? null : resolvedActions.find((action) => Math.sign(offset) === action.sign) ?? null;

  const resetSwipe = React.useCallback(() => {
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    swipeLockedRef.current = false;
    revealCrossedRef.current = false;
    commitCrossedRef.current = false;
    setIsDragging(false);
    setIsPrepared(false);
    setArmedActionId(null);
    setOffset(0);
  }, []);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
    swipeLockedRef.current = false;
    suppressClickRef.current = false;
    setIsDragging(false);
    setIsPrepared(false);
    setArmedActionId(null);
    setOffset(0);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || touchStartXRef.current === null || touchStartYRef.current === null) return;

    const deltaX = event.touches[0].clientX - touchStartXRef.current;
    const deltaY = event.touches[0].clientY - touchStartYRef.current;

    if (!swipeLockedRef.current) {
      if (Math.abs(deltaX) < 18 || Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }
      swipeLockedRef.current = true;
    }

    suppressClickRef.current = true;
    setIsDragging(true);

    let nextOffset = deltaX;
    if (deltaX < 0 && !resolvedActions.some((action) => action.sign === -1)) nextOffset = 0;
    if (deltaX > 0 && !resolvedActions.some((action) => action.sign === 1)) nextOffset = 0;
    nextOffset = Math.max(-maxDistance, Math.min(maxDistance, nextOffset));

    const nextActiveAction =
      nextOffset === 0 ? null : resolvedActions.find((action) => Math.sign(nextOffset) === action.sign) ?? null;
    const absoluteOffset = Math.abs(nextOffset);
    const isRevealActive = absoluteOffset >= revealThreshold && Boolean(nextActiveAction);
    const isCommitActive = absoluteOffset >= commitThreshold && Boolean(nextActiveAction);

    if (isRevealActive !== revealCrossedRef.current) {
      revealCrossedRef.current = isRevealActive;
      if (isRevealActive) triggerHaptic('light');
    }

    if (isCommitActive !== commitCrossedRef.current) {
      commitCrossedRef.current = isCommitActive;
      if (isCommitActive) {
        triggerHaptic(nextActiveAction?.tone === 'danger' ? 'warning' : 'light');
      }
    }

    setOffset(nextOffset);
    setIsPrepared(isRevealActive);
    setArmedActionId(isCommitActive && nextActiveAction ? nextActiveAction.id : null);
  };

  const handleTouchEnd = () => {
    const committedAction = armedActionId ? resolvedActions.find((action) => action.id === armedActionId) ?? null : null;
    if (committedAction) {
      triggerHaptic(committedAction.tone === 'danger' ? 'warning' : 'success');
      void committedAction.onCommit();
    }
    resetSwipe();
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 40);
  };

  return (
    <div className={cn('relative overflow-hidden rounded-[inherit]', className)}>
      {startAction ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-y-0 flex items-center px-4 text-[11px] font-semibold transition-opacity duration-150',
            isRTL ? 'right-0 justify-end text-right' : 'left-0 justify-start text-left',
            toneClasses(startAction.tone),
          )}
          style={{ opacity: activeAction?.id === startAction.id && isPrepared ? 1 : 0 }}
          aria-hidden="true"
        >
          {startAction.label}
        </div>
      ) : null}
      {endAction ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-y-0 flex items-center px-4 text-[11px] font-semibold transition-opacity duration-150',
            isRTL ? 'left-0 justify-start text-left' : 'right-0 justify-end text-right',
            toneClasses(endAction.tone),
          )}
          style={{ opacity: activeAction?.id === endAction.id && isPrepared ? 1 : 0 }}
          aria-hidden="true"
        >
          {endAction.label}
        </div>
      ) : null}

      <motion.div
        className={cn('will-change-transform', contentClassName)}
        style={{ x: offset, touchAction: 'pan-y' }}
        animate={reducedMotion ? { x: offset } : { x: offset }}
        transition={
          isDragging
            ? { duration: 0 }
            : { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }
        }
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resetSwipe}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
