import * as React from 'react';
import { useReducedMotion } from 'framer-motion';
import { isTouchDevice } from '../../lib/mobile';

export function useMobileDepthEffect(active: boolean) {
  const reducedMotion = useReducedMotion();
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || !active || reducedMotion || typeof IntersectionObserver === 'undefined') {
      if (node) {
        node.style.setProperty('--mobile-card-depth', '0');
      }
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        const depth = Math.max(0, Math.min(1, 1 - ratio));
        node.style.setProperty('--mobile-card-depth', depth.toFixed(3));
      },
      {
        threshold: [0.2, 0.4, 0.6, 0.8, 1],
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      node.style.setProperty('--mobile-card-depth', '0');
    };
  }, [active, reducedMotion]);

  return ref;
}

export function useTouchHoldLift(enabled: boolean) {
  const reducedMotion = useReducedMotion();
  const timeoutRef = React.useRef<number | null>(null);
  const [isHolding, setIsHolding] = React.useState(false);
  const isEnabled = enabled && !reducedMotion && isTouchDevice();

  const clearHold = React.useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHolding(false);
  }, []);

  const startHold = React.useCallback(() => {
    if (!isEnabled || typeof window === 'undefined') return;
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setIsHolding(true);
    }, 180);
  }, [isEnabled]);

  React.useEffect(() => clearHold, [clearHold]);

  return {
    isHolding: isEnabled && isHolding,
    holdProps: isEnabled
      ? {
          onPointerDown: startHold,
          onPointerUp: clearHold,
          onPointerLeave: clearHold,
          onPointerCancel: clearHold,
          onBlur: clearHold,
        }
      : {},
  };
}
