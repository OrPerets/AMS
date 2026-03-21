// /Users/orperetz/Documents/AMS/apps/frontend/components/Layout.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDirection, useLocale } from '../lib/providers';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import { GlobalCommandPalette } from './layout/GlobalCommandPalette';
import Breadcrumbs from './layout/Breadcrumbs';
import Footer from './layout/Footer';
import { ErrorBoundary, CompactErrorFallback } from './ui/error-boundary';
import { cn } from '../lib/utils';
import { websocketService } from '../lib/websocket';
import { toast } from './ui/use-toast';
import { getAccessToken, isAuthenticated } from '../lib/auth';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { direction } = useDirection();
  const { t } = useLocale();
  const router = useRouter();
  const publicRoutes = new Set(['/', '/404', '/_error', '/login', '/privacy', '/terms', '/support']);
  const isPublicRoute = publicRoutes.has(router.pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isPublicRoute || isAuthenticated()) {
      return;
    }

    const next = encodeURIComponent(router.asPath);
    router.replace(`/login?next=${next}`);
  }, [isPublicRoute, mounted, router]);

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
      toast({
        title: 'עדכון בקריאה',
        description: `קריאה מספר ${ticket?.id} עודכנה - סטטוס: ${ticket?.status}`,
        duration: 5000,
      });
    };

    const handleNewNotification = (data: any) => {
      const notification = data.notification;
      toast({
        title: notification?.title || 'התראה חדשה',
        description: notification?.message,
        duration: 5000,
      });
    };

    websocketService.on('new_ticket', handleNewTicket);
    websocketService.on('ticket_updated', handleTicketUpdate);
    websocketService.on('new_notification', handleNewNotification);

    return () => {
      websocketService.off('new_ticket', handleNewTicket);
      websocketService.off('ticket_updated', handleTicketUpdate);
      websocketService.off('new_notification', handleNewNotification);
    };
  }, [isPublicRoute, mounted]);

  // Don't show layout on login page and landing page
  if (isPublicRoute) {
    return (
      <div className={cn("min-h-screen bg-background text-foreground")}>
        <a href="#main-content" className="skip-link">{t('shell.skipToContent')}</a>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    );
  }

  if (!mounted || !isAuthenticated()) {
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
        "app-main flex min-w-0 flex-col overflow-hidden",
        sidebarCollapsed ? "md:ms-16" : "md:ms-64",
        "transition-all duration-300"
      )} id="main-content" tabIndex={-1}>
        {/* Breadcrumbs */}
        <div className="border-b bg-background/85 backdrop-blur-sm">
          <div className="container px-3 py-2 sm:px-6 sm:py-3">
            <Breadcrumbs />
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto min-h-0" data-scroll-container="app">
          <div className="container min-h-full px-3 py-3 sm:px-6 sm:py-6 safe-pb">
            <ErrorBoundary fallback={CompactErrorFallback}>
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <Footer className="app-footer" />
      <GlobalCommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
