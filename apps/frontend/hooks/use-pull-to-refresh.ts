import { useEffect, useRef, useState } from 'react';
import { isTouchDevice } from '../lib/mobile';

const PULL_TO_REFRESH_PRESETS = {
  list: { threshold: 84 },
  dashboard: { threshold: 96 },
  detail: { threshold: 72 },
} as const;

type PullToRefreshPreset = keyof typeof PULL_TO_REFRESH_PRESETS;

type UsePullToRefreshOptions = {
  enabled?: boolean;
  threshold?: number;
  preset?: PullToRefreshPreset;
  onThresholdReached?: () => void;
  onRefresh: () => Promise<void> | void;
};

function mapPullDistanceElastic(deltaY: number, threshold: number) {
  const maxPullDistance = threshold * 1.4;
  const resistance = maxPullDistance / 0.6;
  return maxPullDistance * (1 - Math.exp(-Math.max(deltaY, 0) / resistance));
}

export function usePullToRefresh({
  enabled = true,
  threshold: customThreshold,
  preset = 'list',
  onThresholdReached,
  onRefresh,
}: UsePullToRefreshOptions) {
  const threshold = customThreshold ?? PULL_TO_REFRESH_PRESETS[preset].threshold;
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const shouldTrackRef = useRef(false);
  const refreshRef = useRef(onRefresh);
  const pullDistanceRef = useRef(0);
  const thresholdReachedRef = useRef(false);
  const thresholdCallbackRef = useRef(onThresholdReached);

  refreshRef.current = onRefresh;
  thresholdCallbackRef.current = onThresholdReached;
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
      startXRef.current = null;
      shouldTrackRef.current = false;
      pullDistanceRef.current = 0;
      thresholdReachedRef.current = false;
      setPullDistance(0);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (isRefreshing || event.touches.length !== 1) {
        return;
      }

      shouldTrackRef.current = scrollContainer.scrollTop <= 0;
      startYRef.current = shouldTrackRef.current ? event.touches[0].clientY : null;
      startXRef.current = shouldTrackRef.current ? event.touches[0].clientX : null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!shouldTrackRef.current || startYRef.current === null || startXRef.current === null) {
        return;
      }

      if (scrollContainer.scrollTop > 0) {
        reset();
        return;
      }

      const touch = event.touches[0];
      const deltaY = touch.clientY - startYRef.current;
      const deltaX = touch.clientX - startXRef.current;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        reset();
        return;
      }

      if (deltaY <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      // Let small gestures scroll naturally; only hijack once an intentional pull begins.
      if (deltaY > 10 && event.cancelable) {
        event.preventDefault();
      }

      const nextDistance = mapPullDistanceElastic(deltaY, threshold);

      if (!thresholdReachedRef.current && nextDistance >= threshold) {
        thresholdReachedRef.current = true;
        thresholdCallbackRef.current?.();
      }

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
    pullProgress: Math.min(pullDistance / threshold, 1),
    threshold,
    thresholdReached: pullDistance >= threshold,
  };
}
