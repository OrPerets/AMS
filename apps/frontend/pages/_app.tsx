// /Users/orperetz/Documents/AMS/apps/frontend/pages/_app.tsx
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Fraunces, Heebo, Inter } from 'next/font/google';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import '../styles/globals.css';
import '../styles/gardens.css';
import '../styles/premium-theme.css';
import 'react-day-picker/dist/style.css';
import Layout from '../components/Layout';
import { AppProviders } from '../lib/providers';
import { cn } from '../lib/utils';
import { Toaster as SonnerToaster } from 'sonner';
import { PwaInstallPrompt } from '../components/pwa/PwaInstallPrompt';
import { BottomSurfaceProvider } from '../lib/bottom-surface';
import { MOTION_DISTANCE, MOTION_DURATION, MOTION_EASE } from '../lib/motion-tokens';
import { resolveRouteTransitionTokensByHref } from '../lib/route-transition-contract';

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const heebo = Heebo({
  subsets: ['hebrew'],
  variable: '--font-heebo',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

function RouteTransitionIndicator({ active }: { active: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {active ? (
        <motion.div
          key="route-transition-indicator"
          className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-1 origin-left bg-gradient-to-r from-primary via-primary/80 to-primary/30 shadow-[0_0_24px_rgba(201,156,72,0.35)]"
          initial={{ opacity: 0, scaleX: MOTION_DISTANCE.routeIndicatorStartScaleX }}
          animate={{ opacity: 1, scaleX: MOTION_DISTANCE.routeIndicatorMidScaleX }}
          exit={{ opacity: 0, scaleX: 1 }}
          transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.emphasized }}
        />
      ) : null}
    </AnimatePresence>
  );
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [isRoutePending, setIsRoutePending] = useState(false);
  const [contentRevealReady, setContentRevealReady] = useState(true);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMorphRouteRef = useRef(false);

  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      if (url === router.asPath) return;
      const sourceHasMorph = Boolean(resolveRouteTransitionTokensByHref(router.asPath));
      const destinationHasMorph = Boolean(resolveRouteTransitionTokensByHref(url));
      isMorphRouteRef.current = sourceHasMorph && destinationHasMorph;
      setIsRoutePending(true);
      if (!reducedMotion && isMorphRouteRef.current) {
        setContentRevealReady(false);
      } else {
        setContentRevealReady(true);
      }
    };
    const handleRouteChangeDone = () => {
      setIsRoutePending(false);
      if (reducedMotion || !isMorphRouteRef.current) {
        setContentRevealReady(true);
        return;
      }
      if (revealTimeoutRef.current) {
        window.clearTimeout(revealTimeoutRef.current);
      }
      revealTimeoutRef.current = window.setTimeout(() => setContentRevealReady(true), 140);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeDone);
    router.events.on('routeChangeError', handleRouteChangeDone);

    return () => {
      if (revealTimeoutRef.current) {
        window.clearTimeout(revealTimeoutRef.current);
      }
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeDone);
      router.events.off('routeChangeError', handleRouteChangeDone);
    };
  }, [reducedMotion, router.asPath, router.events]);

  return (
    <div className={cn(inter.variable, heebo.variable, fraunces.variable, "font-sans")}>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>
      <AppProviders>
        <BottomSurfaceProvider>
          <RouteTransitionIndicator active={isRoutePending} />
          <LayoutGroup id="mobile-route-shared-layout">
            <Layout>
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={router.asPath}
                  initial={reducedMotion ? { opacity: 1 } : { opacity: 0.92, y: MOTION_DISTANCE.xxs }}
                  animate={reducedMotion ? { opacity: 1 } : { opacity: contentRevealReady ? 1 : 0.9, y: contentRevealReady ? 0 : MOTION_DISTANCE.xxs }}
                  exit={reducedMotion ? { opacity: 1 } : { opacity: 0.98, y: -MOTION_DISTANCE.xxs }}
                  transition={{ duration: MOTION_DURATION.instant, ease: MOTION_EASE.emphasized }}
                >
                  <Component {...pageProps} />
                </motion.div>
              </AnimatePresence>
            </Layout>
          </LayoutGroup>
          <PwaInstallPrompt />
          <SonnerToaster position="top-center" richColors />
        </BottomSurfaceProvider>
      </AppProviders>
    </div>
  );
}
