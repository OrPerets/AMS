import { useEffect, useRef, useState } from 'react';
import { isTouchDevice } from '../lib/mobile';

type UsePullToRefreshOptions = {
  enabled?: boolean;
  threshold?: number;
  onRefresh: () => Promise<void> | void;
};

export function usePullToRefresh({
  enabled = true,
  threshold = 84,
  onRefresh,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const shouldTrackRef = useRef(false);
  const refreshRef = useRef(onRefresh);
  const pullDistanceRef = useRef(0);

  refreshRef.current = onRefresh;
  pullDistanceRef.current = pullDistance;

  useEffect(() => {
    if (!enabled || !isTouchDevice()) {
      return;
    }

    const scrollContainer = document.querySelector<HTMLElement>('[data-scroll-container="app"]');
    if (!scrollContainer) {
      return;
    }

    const reset = () => {
      startYRef.current = null;
      shouldTrackRef.current = false;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (isRefreshing || event.touches.length !== 1) {
        return;
      }

      shouldTrackRef.current = scrollContainer.scrollTop <= 0;
      startYRef.current = shouldTrackRef.current ? event.touches[0].clientY : null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!shouldTrackRef.current || startYRef.current === null) {
        return;
      }

      const delta = event.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      event.preventDefault();
      const nextDistance = Math.min(delta * 0.6, threshold * 1.4);
      pullDistanceRef.current = nextDistance;
      setPullDistance(nextDistance);
    };

    const handleTouchEnd = async () => {
      if (!shouldTrackRef.current) {
        reset();
        return;
      }

      const shouldRefresh = pullDistanceRef.current >= threshold;
      reset();

      if (!shouldRefresh) {
        return;
      }

      try {
        setIsRefreshing(true);
        await refreshRef.current();
      } finally {
        setIsRefreshing(false);
      }
    };

    scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    scrollContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    scrollContainer.addEventListener('touchcancel', reset, { passive: true });

    return () => {
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchmove', handleTouchMove);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
      scrollContainer.removeEventListener('touchcancel', reset);
    };
  }, [enabled, isRefreshing, threshold]);

  return {
    isPulling: pullDistance > 0,
    isRefreshing,
    pullDistance,
  };
}
