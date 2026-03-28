// /Users/orperetz/Documents/AMS/apps/frontend/components/Layout.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDirection, useLocale } from '../lib/providers';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import MobileBottomNav from './layout/MobileBottomNav';
import { GlobalCommandPalette } from './layout/GlobalCommandPalette';
import Breadcrumbs from './layout/Breadcrumbs';
import Footer from './layout/Footer';
import { ErrorBoundary, CompactErrorFallback } from './ui/error-boundary';
import { cn } from '../lib/utils';
import { websocketService } from '../lib/websocket';
import { toast } from './ui/use-toast';
import { authFetch, getAccessToken, getAuthSnapshot, getCurrentUserId, isMasterPendingRoleSelection } from '../lib/auth';
import { useBottomSurface } from '../lib/bottom-surface';
import { emitUIInteraction } from '../lib/ui-interaction-bus';
import { isFeatureEnabled } from '../lib/feature-flags';
import { trackLiveEventReceived } from '../lib/analytics';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { direction } = useDirection();
  const { t } = useLocale();
  const { totalOffset } = useBottomSurface();
  const router = useRouter();
  const publicRoutes = new Set(['/', '/404', '/_error', '/login', '/privacy', '/terms', '/support']);
  const isPublicRoute = publicRoutes.has(router.pathname);
  const authSnapshot = mounted ? getAuthSnapshot() : null;
  const liveChoreographyEnabled = Boolean(
    authSnapshot?.isAuthenticated &&
      isFeatureEnabled('mobile-interactions-live-choreography', {
        role: (authSnapshot?.role as any) ?? null,
        userId: authSnapshot?.userId ?? null,
      }),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isPublicRoute || authSnapshot?.isAuthenticated) {
      return;
    }

    const next = encodeURIComponent(router.asPath);
    void router.replace(`/login?next=${next}`);
  }, [authSnapshot?.isAuthenticated, isPublicRoute, mounted, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [router.asPath]);

  // WebSocket connection and notification handling
  useEffect(() => {
    if (!mounted || isPublicRoute) {
      websocketService.disconnect();
      return;
    }

    const token = getAccessToken();
    if (!token) {
      websocketService.disconnect();
      return;
    }

    if (!websocketService.isConnected()) {
      websocketService.connect(token);
    }

    const handleNewTicket = (data: any) => {
      const ticket = data.ticket;
      const buildingName = ticket?.unit?.building?.name || 'בניין';
      const urgency = ticket?.priority ?? (ticket?.status === 'URGENT' ? 'high' : 'normal');

      if (liveChoreographyEnabled) {
        const emitted = emitUIInteraction('live_event_received', {
          eventType: 'new_ticket',
          sourceSurface: 'websocket',
          destinationSurface: '/tickets',
          urgency,
          receivedAt: Date.now(),
          ticketId: ticket?.id ?? null,
        });
        trackLiveEventReceived({
          eventType: 'new_ticket',
          sourceSurface: 'websocket',
          destinationSurface: '/tickets',
          urgency: String(urgency),
          role: authSnapshot?.role,
        });
        emitUIInteraction('live_event_reaction_rendered', {
          eventType: 'new_ticket',
          sourceSurface: 'layout_toast',
          destinationSurface: '/tickets',
          receivedAt: emitted.timestamp,
          reactedAt: Date.now(),
        });
      }

      toast({
        title: 'קריאה חדשה נפתחה',
        description: `קריאה מספר ${ticket?.id} נפתחה בבניין ${buildingName}`,
        duration: 10000,
      });

      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => undefined);
      } catch {
        // Ignore audio failures.
      }
    };

    const handleTicketUpdate = (data: any) => {
      const ticket = data.ticket;
      const urgency = ticket?.priority ?? (ticket?.status === 'CRITICAL' ? 'high' : 'normal');
      if (liveChoreographyEnabled) {
        const emitted = emitUIInteraction('live_event_received', {
          eventType: 'ticket_updated',
          sourceSurface: 'websocket',
          destinationSurface: '/tickets',
          urgency,
          receivedAt: Date.now(),
          ticketId: ticket?.id ?? null,
        });
        trackLiveEventReceived({
          eventType: 'ticket_updated',
          sourceSurface: 'websocket',
          destinationSurface: '/tickets',
          urgency: String(urgency),
          role: authSnapshot?.role,
        });
        emitUIInteraction('live_event_reaction_rendered', {
          eventType: 'ticket_updated',
          sourceSurface: 'layout_toast',
          destinationSurface: '/tickets',
          receivedAt: emitted.timestamp,
          reactedAt: Date.now(),
        });
      }
      toast({
        title: 'עדכון בקריאה',
        description: `קריאה מספר ${ticket?.id} עודכנה - סטטוס: ${ticket?.status}`,
        duration: 5000,
      });
    };

    const handleNewNotification = (data: any) => {
      const notification = data.notification;
      if (liveChoreographyEnabled) {
        const emitted = emitUIInteraction('live_event_received', {
          eventType: 'new_notification',
          sourceSurface: 'websocket',
          destinationSurface: '/notifications',
          urgency: notification?.priority ?? 'normal',
          receivedAt: Date.now(),
          notificationId: notification?.id ?? null,
        });
        trackLiveEventReceived({
          eventType: 'new_notification',
          sourceSurface: 'websocket',
          destinationSurface: '/notifications',
          urgency: notification?.priority ?? 'normal',
          role: authSnapshot?.role,
        });
        emitUIInteraction('live_event_reaction_rendered', {
          eventType: 'new_notification',
          sourceSurface: 'layout_toast',
          destinationSurface: '/notifications',
          receivedAt: emitted.timestamp,
          reactedAt: Date.now(),
        });
      }
      toast({
        title: notification?.title || 'התראה חדשה',
        description: notification?.message,
        duration: 5000,
      });
      setUnreadNotifications((prev) => prev + 1);
    };

    websocketService.on('new_ticket', handleNewTicket);
    websocketService.on('ticket_updated', handleTicketUpdate);
    websocketService.on('new_notification', handleNewNotification);

    const userId = getCurrentUserId();
    if (userId && !isMasterPendingRoleSelection()) {
      authFetch(`/api/v1/notifications/user/${userId}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data: any[]) => setUnreadNotifications(Array.isArray(data) ? data.filter((n) => !n.read).length : 0))
        .catch(() => undefined);
    }

    return () => {
      websocketService.off('new_ticket', handleNewTicket);
      websocketService.off('ticket_updated', handleTicketUpdate);
      websocketService.off('new_notification', handleNewNotification);
    };
  }, [authSnapshot?.role, isPublicRoute, liveChoreographyEnabled, mounted]);

  // Don't show layout on login page and landing page
  if (isPublicRoute) {
    return (
      <div
        dir={direction}
        className={cn(
          "min-h-screen bg-background text-foreground",
          direction === 'rtl' ? 'text-right' : 'text-left',
        )}
      >
        <a href="#main-content" className="skip-link">{t('shell.skipToContent')}</a>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    );
  }

  if (!mounted || !authSnapshot?.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">{t('shell.loadingApp')}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      dir={direction}
      className={cn(
        "app-shell min-h-screen bg-background text-foreground",
        direction === 'rtl' ? 'rtl' : 'ltr'
      )}
      suppressHydrationWarning
    >
      <a href="#main-content" className="skip-link">{t('shell.skipToContent')}</a>
      {/* Header */}
      <Header 
        className="app-header"
        onMenuClick={() => setSidebarOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
      />
      
      {/* Sidebar */}
      <Sidebar
        className="app-sidebar"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
      />
      
      {/* Main Content */}
      <main className={cn(
        "app-main mobile-premium-shell flex min-w-0 flex-col",
        "overflow-x-hidden overflow-y-auto",
        sidebarCollapsed ? "md:ms-16" : "md:ms-64",
        "transition-all duration-300"
      )} id="main-content" tabIndex={-1} data-scroll-container="app" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Breadcrumbs */}
        <div className="hidden border-b bg-background/72 backdrop-blur-sm md:block">
          <div className="container px-3 py-2 sm:px-6 sm:py-3">
            <Breadcrumbs />
          </div>
        </div>

        {/* Page Content */}
        <div
          className="flex-1 min-h-0 overflow-x-hidden"
        >
          <div
            className={cn(
              "container min-h-full max-w-full px-3 py-3 sm:px-6 sm:py-6 safe-pb",
              direction === 'rtl' ? 'text-right' : 'text-left',
            )}
            style={
              totalOffset > 0
                ? { paddingBottom: `max(calc(env(safe-area-inset-bottom, 0px) + 1rem), ${totalOffset + 20}px)` }
                : undefined
            }
          >
            <ErrorBoundary key={router.asPath} fallback={CompactErrorFallback}>
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <Footer className="app-footer hidden md:block" />

      {/* Mobile Bottom Nav */}
      <MobileBottomNav unreadNotifications={unreadNotifications} />

      <GlobalCommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
