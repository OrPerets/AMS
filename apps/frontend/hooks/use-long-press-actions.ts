import * as React from 'react';

type UseLongPressActionsOptions = {
  onLongPress: () => void;
  delayMs?: number;
  moveTolerancePx?: number;
};

export function useLongPressActions({ onLongPress, delayMs = 420, moveTolerancePx = 12 }: UseLongPressActionsOptions) {
  const timeoutRef = React.useRef<number | null>(null);
  const startPointRef = React.useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = React.useRef(false);
  const suppressNextClickRef = React.useRef(false);

  const clearTimer = React.useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const cancelGesture = React.useCallback(() => {
    clearTimer();
    startPointRef.current = null;
    longPressTriggeredRef.current = false;
  }, [clearTimer]);

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType && event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

      clearTimer();
      longPressTriggeredRef.current = false;
      startPointRef.current = { x: event.clientX, y: event.clientY };

      timeoutRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        suppressNextClickRef.current = true;
        onLongPress();
      }, delayMs);
    },
    [clearTimer, delayMs, onLongPress],
  );

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!startPointRef.current) return;
      const deltaX = Math.abs(event.clientX - startPointRef.current.x);
      const deltaY = Math.abs(event.clientY - startPointRef.current.y);
      if (deltaX > moveTolerancePx || deltaY > moveTolerancePx) {
        cancelGesture();
      }
    },
    [cancelGesture, moveTolerancePx],
  );

  const onPointerUp = React.useCallback(() => {
    clearTimer();
    startPointRef.current = null;
    longPressTriggeredRef.current = false;
  }, [clearTimer]);

  const onClickCapture = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!suppressNextClickRef.current) return;
    suppressNextClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  React.useEffect(() => cancelGesture, [cancelGesture]);

  return {
    longPressProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: cancelGesture,
      onPointerLeave: cancelGesture,
      onClickCapture,
    },
  };
}
