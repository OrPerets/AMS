"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Sun, Moon, Globe, ChevronLeft, ChevronRight, Bell, Command, Search, ArrowRight, AlertTriangle, Clock, Info, Home, Building2, Settings as SettingsIcon, Wrench, CreditCard, ClipboardList } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useTheme, useDirection, useLocale } from '../../lib/providers';
import { cn, formatDateTime } from '../../lib/utils';
import UserMenu from './UserMenu';
import { authFetch, getCurrentUserId, isMasterPendingRoleSelection } from '../../lib/auth';
import { websocketService } from '../../lib/websocket';
import { emitNotificationsChanged, subscribeToNotificationsChanged } from '../../lib/notification-events';
import { deriveNotificationPriority } from '../ui/notification-center';
import type { NotificationItem, NotificationPriority } from '../ui/notification-center';

interface HeaderProps {
  className?: string;
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCommandPaletteOpen?: () => void;
}

const priorityIcon: Record<NotificationPriority, React.FC<{ className?: string }>> = {
  critical: AlertTriangle,
  needs_action: Clock,
  informational: Info,
  completed: Bell,
};

const priorityColor: Record<NotificationPriority, string> = {
  critical: 'text-destructive',
  needs_action: 'text-warning',
  informational: 'text-primary',
  completed: 'text-muted-foreground',
};

function getMobileRouteContext(pathname: string) {
  const contexts = [
    { match: /^\/home$|^\/$/, title: 'מרכז העבודה', subtitle: 'הפעולות והסיכונים של היום', icon: Home },
    { match: /^\/notifications/, title: 'התראות ועדכונים', subtitle: 'פיד חי, מסננים והעדפות', icon: Bell },
    { match: /^\/settings/, title: 'הגדרות אישיות', subtitle: 'חשבון, אבטחה ושפה', icon: SettingsIcon },
    { match: /^\/resident\/account/, title: 'האזור האישי', subtitle: 'תשלומים, מסמכים ופניות', icon: CreditCard },
    { match: /^\/resident\/requests/, title: 'בקשות דייר', subtitle: 'פעולות שירות עצמי במקום אחד', icon: ClipboardList },
    { match: /^\/tickets/, title: 'לוח קריאות', subtitle: 'תור העבודה והעדכונים האחרונים', icon: Wrench },
    { match: /^\/buildings/, title: 'בניינים ונכסים', subtitle: 'קודים, פרטים ואנשי קשר', icon: Building2 },
    { match: /^\/payments/, title: 'גבייה ותשלומים', subtitle: 'יתרות, חיובים ופעולות גבייה', icon: CreditCard },
  ];

  return contexts.find((item) => item.match.test(pathname)) ?? {
    title: 'AMS',
    subtitle: 'פלטפורמת ניהול חכמה לבניינים',
    icon: Home,
  };
}

export default function Header({
  className,
  sidebarCollapsed,
  onToggleCollapse,
  onCommandPaletteOpen,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { direction, setDirection } = useDirection();
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const currentUserId = getCurrentUserId();

  const loadNotifications = async () => {
    if (!currentUserId || isMasterPendingRoleSelection()) {
      setNotifications([]);
      return;
    }
    try {
      setLoading(true);
      const response = await authFetch(`/api/v1/notifications/user/${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await authFetch(`/api/v1/notifications/${notificationId}/read`, { method: 'POST' });
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

    const interval = setInterval(loadNotifications, 30000);
    return () => {
      clearInterval(interval);
      unsubscribe();
      websocketService.off('new_notification', handleNewNotification);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (previewOpen) {
      const close = () => setPreviewOpen(false);
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [previewOpen]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleDirection = () => {
    setDirection(direction === 'rtl' ? 'ltr' : 'rtl');
    setLocale(locale === 'he' ? 'en' : 'he');
  };

  const topPreview = useMemo(() => {
    return notifications
      .filter(n => !n.read)
      .slice(0, 3)
      .map(n => ({ ...n, _priority: deriveNotificationPriority(n) }));
  }, [notifications]);
  const mobileContext = useMemo(() => getMobileRouteContext(router.pathname), [router.pathname]);
  const MobileContextIcon = mobileContext.icon;

  const navigateToInbox = () => {
    setPreviewOpen(false);
    router.push('/notifications');
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b bg-background/72 backdrop-blur-xl",
      className
    )}>
      <div className="container px-3 sm:px-6">
        <div className="flex items-center gap-1.5 py-2 md:hidden" style={{ maxWidth: '100vw' }}>
          <Link href="/home" className="mobile-shell-panel flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border touch-manipulation">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-card">
              A
            </div>
          </Link>

          <Link
            href={router.pathname === '/home' ? '/home' : router.asPath}
            className="mobile-shell-panel flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 touch-manipulation"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
              <MobileContextIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-tertiary">{t('app.shortName')}</div>
              <div className="truncate text-[13px] font-semibold leading-tight text-foreground">{mobileContext.title}</div>
              <div className="truncate text-[10px] leading-tight text-muted-foreground">{mobileContext.subtitle}</div>
            </div>
          </Link>

          <Button
            variant="outline"
            size="icon"
            onClick={onCommandPaletteOpen}
            className="mobile-touch-strip h-10 w-10 shrink-0 border-0 px-0 shadow-none shell-frost touch-manipulation"
            aria-label={t('header.openCommandPalette')}
          >
            <Search className="h-4 w-4" />
          </Button>

          <Link href="/notifications" className="relative mobile-shell-panel flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border touch-manipulation">
            <Bell className="h-4 w-4 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -end-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="mobile-shell-panel shrink-0 rounded-full border p-0.5 touch-manipulation">
            <UserMenu />
          </div>
        </div>

        <div className="hidden h-12 items-center justify-between gap-1.5 sm:h-16 sm:gap-2 md:flex">
        {/* Left section */}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-4">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
              A
            </div>
          </Link>

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

        {/* Right section */}
        <div className="flex items-center gap-0.5 sm:gap-1.5">
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

          {/* Notification bell — lightweight preview (desktop) */}
          <div className="relative hidden md:block" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative sm:h-9 sm:w-9 shrink-0"
              aria-label={t('header.notifications')}
              onClick={() => setPreviewOpen((o) => !o)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -end-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>

            {previewOpen && (
              <div className="absolute end-0 top-full z-50 mt-2 w-80 rounded-xl border bg-popover p-0 shadow-lg">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <span className="text-sm font-semibold">{t('notifications.previewTitle')}</span>
                  {unreadCount > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {t('common.loading')}
                    </div>
                  ) : topPreview.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {t('notifications.noUrgent')}
                    </div>
                  ) : (
                    topPreview.map((notification) => {
                      const PIcon = priorityIcon[notification._priority];
                      return (
                        <button
                          key={notification.id}
                          type="button"
                          className="flex w-full items-start gap-3 px-4 py-3 text-start hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            if (!notification.read && typeof notification.id === 'number') {
                              markNotificationAsRead(notification.id);
                            }
                          }}
                        >
                          <PIcon className={cn('mt-0.5 h-4 w-4 shrink-0', priorityColor[notification._priority])} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium">{notification.title}</span>
                              {!notification.read && (
                                <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                              )}
                            </div>
                            <span className="line-clamp-1 text-xs text-muted-foreground">
                              {notification.message}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateTime(notification.createdAt as string, locale)}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <button
                  type="button"
                  onClick={navigateToInbox}
                  className="flex w-full items-center justify-center gap-2 border-t px-4 py-3 text-sm font-medium text-primary hover:bg-muted/50 transition-colors"
                >
                  {t('notifications.viewFullInbox')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

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
      </div>
    </header>
  );
}
