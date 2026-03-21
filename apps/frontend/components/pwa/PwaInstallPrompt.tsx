"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from '../ui/button';
import { isTouchDevice } from '../../lib/mobile';
import { cn } from '../../lib/utils';
import { useRegisterBottomSurface } from '../../lib/bottom-surface';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = 'amit-pwa-install-dismissed';
const INTERACTION_THRESHOLD = 2;

function isStandalone() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaInstallPrompt() {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [interactions, setInteractions] = useState(0);

  const { refCallback, essentialOffset } = useRegisterBottomSurface('pwa-install-prompt', 'promotional');

  useEffect(() => {
    const handleRoute = () => setInteractions((c) => c + 1);
    router.events.on('routeChangeComplete', handleRoute);
    return () => router.events.off('routeChangeComplete', handleRoute);
  }, [router.events]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const shouldDismiss = window.localStorage.getItem(DISMISS_KEY) === 'true';

    setIsIos(ios);
    setDismissed(shouldDismiss || isStandalone() || !isTouchDevice());
    setShowIosHint(ios && !isStandalone());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setDismissed(shouldDismiss || isStandalone() || !isTouchDevice());
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setDismissed(true);
      window.localStorage.setItem(DISMISS_KEY, 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const canShow = useMemo(() => {
    if (dismissed || isStandalone()) {
      return false;
    }

    if (interactions < INTERACTION_THRESHOLD) {
      return false;
    }

    return Boolean(deferredPrompt) || showIosHint;
  }, [deferredPrompt, dismissed, showIosHint, interactions]);

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, 'true');
    }

    setDismissed(true);
  };

  const install = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
      setDismissed(true);
    }
  };

  if (!canShow) {
    return null;
  }

  return (
    <div
      ref={refCallback}
      className="pointer-events-none fixed inset-x-0 z-45 px-3 pb-3 sm:px-6 md:hidden"
      style={{ bottom: `${essentialOffset}px` }}
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto flex max-w-md items-start gap-3 rounded-3xl border border-white/60",
          "bg-background/95 p-4 shadow-[0_18px_48px_rgba(14,74,123,0.18)] backdrop-blur-xl"
        )}
      >
        <div className="mt-0.5 rounded-2xl bg-primary/10 p-2 text-primary">
          {deferredPrompt ? <Download className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">התקנה למסך הבית</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {deferredPrompt
              ? 'התקינו את AMIT כדי לקבל חוויית מובייל מלאה, פתיחה מהירה ומסך מלא.'
              : isIos
                ? 'ב-iPhone אפשר לפתוח את תפריט השיתוף ב-Safari ולבחור "Add to Home Screen".'
                : 'אפשר להתקין את AMIT למסך הבית לחוויית שימוש מהירה ונקייה יותר.'}
          </p>
          <div className="mt-3 flex items-center gap-2">
            {deferredPrompt ? (
              <Button size="sm" onClick={() => void install()}>
                התקן עכשיו
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={dismiss}>
              אחר כך
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="סגור"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
