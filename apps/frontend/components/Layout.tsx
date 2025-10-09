// /Users/orperetz/Documents/AMS/apps/frontend/components/Layout.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDirection } from '../lib/providers';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import Breadcrumbs from './layout/Breadcrumbs';
import Footer from './layout/Footer';
import { ErrorBoundary, CompactErrorFallback } from './ui/error-boundary';
import { cn } from '../lib/utils';
import { websocketService } from '../lib/websocket';
import { toast } from './ui/use-toast';
import { Bell } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { direction } = useDirection();
  const router = useRouter();

  // WebSocket connection and notification handling
  useEffect(() => {
    // Only connect WebSocket when user is logged in (not on login or landing page)
    if (router.pathname !== '/login' && router.pathname !== '/') {
      const token = localStorage.getItem('token');
      
      if (token && !websocketService.isConnected()) {
        // Connect to WebSocket
        websocketService.connect(token);

        // Listen for new ticket notifications
        const handleNewTicket = (data: any) => {
          const ticket = data.ticket;
          const buildingName = ticket?.unit?.building?.name || 'בניין';
          
          toast({
            title: "קריאה חדשה נפתחה",
            description: `קריאה מספר ${ticket?.id} נפתחה בבניין ${buildingName}`,
            duration: 10000,
          });

          // Play notification sound (optional)
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {
              // Ignore if sound fails to play
            });
          } catch (error) {
            // Ignore audio errors
          }
        };

        // Listen for ticket updates
        const handleTicketUpdate = (data: any) => {
          const ticket = data.ticket;
          toast({
            title: "עדכון בקריאה",
            description: `קריאה מספר ${ticket?.id} עודכנה - סטטוס: ${ticket?.status}`,
            duration: 5000,
          });
        };

        // Listen for general notifications
        const handleNewNotification = (data: any) => {
          const notification = data.notification;
          toast({
            title: notification?.title || "התראה חדשה",
            description: notification?.message,
            duration: 5000,
          });
        };

        // Register event listeners
        websocketService.on('new_ticket', handleNewTicket);
        websocketService.on('ticket_updated', handleTicketUpdate);
        websocketService.on('new_notification', handleNewNotification);

        // Cleanup on unmount
        return () => {
          websocketService.off('new_ticket', handleNewTicket);
          websocketService.off('ticket_updated', handleTicketUpdate);
          websocketService.off('new_notification', handleNewNotification);
        };
      }
    }
  }, [router.pathname, router]);

  // Don't show layout on login page and landing page
  if (router.pathname === '/login' || router.pathname === '/') {
    return (
      <div className={cn("min-h-screen bg-background text-foreground")}>
        {children}
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
      {/* Header */}
      <Header 
        className="app-header"
        onMenuClick={() => setSidebarOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
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
        "app-main flex flex-col overflow-hidden",
        sidebarCollapsed ? "md:ms-16" : "md:ms-64",
        "transition-all duration-300"
      )}>
        {/* Breadcrumbs */}
        <div className="border-b bg-background/50 backdrop-blur-sm">
          <div className="container px-4 py-3 sm:px-6">
            <Breadcrumbs />
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="container px-4 py-6 sm:px-6">
            <ErrorBoundary fallback={CompactErrorFallback}>
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <Footer className="app-footer" />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
