// /Users/orperetz/Documents/AMS/apps/frontend/components/layout/Header.tsx
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Menu, Sun, Moon, Globe, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme, useDirection, useLocale } from '../../lib/providers';
import { cn } from '../../lib/utils';
import UserMenu from './UserMenu';
import { authFetch, getCurrentUserId } from '../../lib/auth';
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
}

export default function Header({
  className,
  onMenuClick,
  sidebarCollapsed,
  onToggleCollapse
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { direction, setDirection } = useDirection();
  const { locale, setLocale } = useLocale();
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
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
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
      "sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm",
      className
    )}>
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left section: Menu & Logo */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">פתח תפריט</span>
          </Button>

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
            <span className="sr-only">הסתר/הצג סיידבר</span>
          </Button>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              A
            </div>
            <span className="hidden font-bold sm:inline-block">
              עמית אקסלנס אחזקות
            </span>
          </Link>
        </div>

        {/* Center section: Empty for now */}
        <div className="flex-1"></div>

        {/* Right section: Controls & User Menu */}
        <div className="flex items-center gap-2">
          {/* Theme toggle - only render after mount */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="sr-only">החלף ערכת נושא</span>
            </Button>
          )}

          {/* Notification bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                aria-label="התראות"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -end-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto sm:w-80 w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)]">
              <DropdownMenuLabel className="text-sm font-semibold">
                התראות אחרונות
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  טוען התראות...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  אין התראות חדשות
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
                      {new Date(notification.createdAt).toLocaleDateString('he-IL', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="justify-center text-sm font-medium text-primary">
                <Link href="/notifications">
                  הצג את כל ההתראות
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Direction/Language toggle - only render after mount */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDirection}
              className="h-9 w-9"
            >
              <Globe className="h-4 w-4" />
              <span className="sr-only">החלף שפה וכיוון</span>
            </Button>
          )}

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
