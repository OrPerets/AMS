// /Users/orperetz/Documents/AMS/apps/frontend/components/Layout.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useDirection, useTheme, useLocale } from '../lib/providers';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import Breadcrumbs from './layout/Breadcrumbs';
import Footer from './layout/Footer';
import { cn } from '../lib/utils';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { direction } = useDirection();
  const router = useRouter();

  // Don't show layout on login page
  if (router.pathname === '/login') {
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
          <div className="container py-3">
            <Breadcrumbs />
          </div>
        </div>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="container py-6">
            {children}
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
