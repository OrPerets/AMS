// /Users/orperetz/Documents/AMS/apps/frontend/components/layout/Header.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, Sun, Moon, Globe, ChevronLeft, ChevronRight, Bell, Command, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme, useDirection, useLocale } from '../../lib/providers';
import { cn, formatDateTime } from '../../lib/utils';
import UserMenu from './UserMenu';
import { authFetch, getCurrentUserId } from '../../lib/auth';
import { websocketService } from '../../lib/websocket';
import { emitNotificationsChanged, subscribeToNotificationsChanged } from '../../lib/notification-events';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface HeaderProps {
  className?: string;
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCommandPaletteOpen?: () => void;
}

export default function Header({
  className,
  onMenuClick,
  sidebarCollapsed,
  onToggleCollapse,
  onCommandPaletteOpen,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { direction, setDirection } = useDirection();
  const { locale, setLocale, t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const currentUserId = getCurrentUserId();

  // Load notifications for current user
  const loadNotifications = async () => {
    if (!currentUserId) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const response = await authFetch(`/api/v1/notifications/user/${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.slice(0, 5)); // Show only latest 5 in header
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await authFetch(`/api/v1/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      emitNotificationsChanged();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadNotifications();

    const handleNewNotification = (event: { notification?: any }) => {
      if (!event.notification) return;
      setNotifications((prev) => [event.notification, ...prev.filter((item) => item.id !== event.notification.id)].slice(0, 5));
    };

    const unsubscribe = subscribeToNotificationsChanged(loadNotifications);
    websocketService.on('new_notification', handleNewNotification);

    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => {
      clearInterval(interval);
      unsubscribe();
      websocketService.off('new_notification', handleNewNotification);
    };
  }, [currentUserId]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleDirection = () => {
    setDirection(direction === 'rtl' ? 'ltr' : 'rtl');
    setLocale(locale === 'he' ? 'en' : 'he');
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur-md",
      className
    )}>
      <div className="container flex h-12 sm:h-16 items-center justify-between gap-1.5 sm:gap-2 px-3 sm:px-6">
        {/* Left section */}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-4">
          {/* Mobile: back/logo only */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
              A
            </div>
          </Link>

          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden md:flex"
          >
            {direction === 'rtl' ? (
              sidebarCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />
            ) : (
              sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />
            )}
            <span className="sr-only">{t('header.toggleSidebar')}</span>
          </Button>

          {/* Desktop Logo */}
          <Link href="/" className="hidden md:flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              A
            </div>
            <span className="truncate font-bold">
              {t('app.shortName')}
            </span>
          </Link>
        </div>

        {/* Desktop center: command palette search */}
        <div className="hidden flex-1 justify-center md:flex">
          <Button
            variant="outline"
            className="h-10 min-w-[22rem] justify-between rounded-full border-subtle-border bg-card/88 text-muted-foreground shadow-card backdrop-blur transition hover:border-strong-border hover:bg-muted/70"
            onClick={onCommandPaletteOpen}
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {t('header.searchPlaceholder')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-subtle-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground">
              <Command className="h-3 w-3" />
              K
            </span>
          </Button>
        </div>

        {/* Mobile center: page context (kept empty to allow flex spacing) */}
        <div className="flex-1 md:hidden" />

        {/* Right section */}
        <div className="flex items-center gap-0.5 sm:gap-1.5">
          {/* Mobile: single search button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCommandPaletteOpen}
            className="shrink-0 md:hidden"
            aria-label={t('header.openCommandPalette')}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Desktop: search button (separate from center bar) */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCommandPaletteOpen}
            className="hidden md:inline-flex sm:h-9 sm:w-9 shrink-0"
            aria-label={t('header.openCommandPalette')}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Theme toggle - desktop only */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              className="hidden md:inline-flex sm:h-9 sm:w-9 shrink-0"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="sr-only">{t('header.toggleTheme')}</span>
            </Button>
          )}

          {/* Notification bell - desktop only (mobile uses bottom nav) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative hidden md:inline-flex sm:h-9 sm:w-9 shrink-0"
                aria-label={t('header.notifications')}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -end-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <DropdownMenuLabel className="text-sm font-semibold">
                {t('header.notifications')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t('common.loading')}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t('header.noNotifications')}
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className={`flex flex-col items-start gap-1 p-3 ${!notification.read ? 'bg-primary/5' : ''}`}
                    onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium">{notification.title}</span>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(notification.createdAt, locale)}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="justify-center text-sm font-medium text-primary">
                <Link href="/notifications">
                  {t('header.viewAllNotifications')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Direction/Language toggle - desktop only */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleDirection}
              className="hidden shrink-0 md:inline-flex sm:h-9 sm:w-9"
              aria-label={t('header.toggleLocale')}
            >
              <Globe className="h-4 w-4" />
              <span className="sr-only">{t('header.toggleLocale')}</span>
            </Button>
          )}

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
