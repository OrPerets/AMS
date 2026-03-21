"use client";

import { useEffect } from 'react';

export function PwaBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch {
        // PWA support is progressive enhancement.
      }
    };

    void register();
  }, []);

  return null;
}
