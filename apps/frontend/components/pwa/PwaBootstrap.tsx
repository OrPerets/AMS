"use client";

import { useEffect } from 'react';

export function PwaBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const register = async () => {
      const isDevHost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (isDevHost) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        return;
      }

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
