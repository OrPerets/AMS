"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Bottom surface classification.
 * - essential: always shown (e.g. MobileBottomNav)
 * - contextual: shown on specific pages (e.g. MobileActionBar)
 * - promotional: dismissible, max one at a time (e.g. PwaInstallPrompt)
 */
export type SurfaceKind = 'essential' | 'contextual' | 'promotional';

type SurfaceEntry = {
  id: string;
  kind: SurfaceKind;
  height: number;
};

type BottomSurfaceState = {
  surfaces: SurfaceEntry[];
  register: (id: string, kind: SurfaceKind, height: number) => void;
  unregister: (id: string) => void;
  updateHeight: (id: string, height: number) => void;
  /** Total offset (in px) that the main scroll container should add as bottom padding. */
  totalOffset: number;
  /** Height of only essential surfaces (e.g. the bottom nav). */
  essentialOffset: number;
  /** Whether a promotional surface is currently visible. */
  hasPromotional: boolean;
};

const BottomSurfaceContext = createContext<BottomSurfaceState>({
  surfaces: [],
  register: () => undefined,
  unregister: () => undefined,
  updateHeight: () => undefined,
  totalOffset: 0,
  essentialOffset: 0,
  hasPromotional: false,
});

export function BottomSurfaceProvider({ children }: { children: React.ReactNode }) {
  const [surfaces, setSurfaces] = useState<SurfaceEntry[]>([]);
  const surfacesRef = useRef<SurfaceEntry[]>([]);

  const register = useCallback((id: string, kind: SurfaceKind, height: number) => {
    setSurfaces((prev) => {
      if (prev.some((s) => s.id === id)) return prev;
      const next = [...prev, { id, kind, height }];
      surfacesRef.current = next;
      return next;
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setSurfaces((prev) => {
      const next = prev.filter((s) => s.id !== id);
      surfacesRef.current = next;
      return next;
    });
  }, []);

  const updateHeight = useCallback((id: string, height: number) => {
    setSurfaces((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1 || prev[idx].height === height) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], height };
      surfacesRef.current = next;
      return next;
    });
  }, []);

  const totalOffset = useMemo(() => surfaces.reduce((sum, s) => sum + s.height, 0), [surfaces]);
  const essentialOffset = useMemo(
    () => surfaces.filter((s) => s.kind === 'essential').reduce((sum, s) => sum + s.height, 0),
    [surfaces],
  );
  const hasPromotional = useMemo(() => surfaces.some((s) => s.kind === 'promotional'), [surfaces]);

  const value = useMemo<BottomSurfaceState>(
    () => ({ surfaces, register, unregister, updateHeight, totalOffset, essentialOffset, hasPromotional }),
    [surfaces, register, unregister, updateHeight, totalOffset, essentialOffset, hasPromotional],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bottom-surface-offset', `${totalOffset}px`);
    root.style.setProperty('--bottom-essential-offset', `${essentialOffset}px`);
    return () => {
      root.style.removeProperty('--bottom-surface-offset');
      root.style.removeProperty('--bottom-essential-offset');
    };
  }, [totalOffset, essentialOffset]);

  return <BottomSurfaceContext.Provider value={value}>{children}</BottomSurfaceContext.Provider>;
}

export function useBottomSurface() {
  return useContext(BottomSurfaceContext);
}

/**
 * Hook for a component that owns a bottom surface.
 * Returns a ref callback to measure the element, plus the current essential offset
 * so the surface can stack above other surfaces.
 */
export function useRegisterBottomSurface(id: string, kind: SurfaceKind) {
  const { register, unregister, updateHeight, essentialOffset, hasPromotional } = useBottomSurface();
  const measuredRef = useRef<HTMLDivElement | null>(null);

  const refCallback = useCallback(
    (node: HTMLDivElement | null) => {
      measuredRef.current = node;
      if (node) {
        const h = node.getBoundingClientRect().height;
        register(id, kind, h);
      }
    },
    [id, kind, register],
  );

  useEffect(() => {
    if (!measuredRef.current) return;
    const measuredNode = measuredRef.current;

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          updateHeight(id, entry.contentRect.height);
        }
      });
      observer.observe(measuredNode);
      return () => observer.disconnect();
    }

    const updateFromNode = () => {
      if (!measuredRef.current) return;
      updateHeight(id, measuredRef.current.getBoundingClientRect().height);
    };

    updateFromNode();
    window.addEventListener('resize', updateFromNode);
    window.addEventListener('orientationchange', updateFromNode);

    return () => {
      window.removeEventListener('resize', updateFromNode);
      window.removeEventListener('orientationchange', updateFromNode);
    };
  }, [id, updateHeight]);

  useEffect(() => {
    return () => unregister(id);
  }, [id, unregister]);

  return { refCallback, essentialOffset, hasPromotional };
}
