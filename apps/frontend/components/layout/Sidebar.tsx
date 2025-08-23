// /Users/orperetz/Documents/AMS/apps/frontend/components/layout/Sidebar.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Home, 
  Building, 
  Ticket, 
  CreditCard, 
  BarChart3, 
  Wrench,
  Settings,
  Users,
  FileText,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useLocale } from '../../lib/providers';
import { getTokenPayload } from '../../lib/auth';

interface SidebarProps {
  className?: string;
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
}

// Navigation items configuration
const getNavigationItems = (role: string, t: (key: string) => string) => {
  const baseItems = [
    {
      title: t('nav.home'),
      href: '/',
      icon: Home,
      roles: ['ADMIN', 'PM', 'TECH', 'RESIDENT', 'ACCOUNTANT'],
    },
    {
      title: t('nav.dashboard'),
      href: '/admin/dashboard',
      icon: BarChart3,
      roles: ['ADMIN', 'PM'],
    },
    {
      title: t('nav.tickets'),
      href: '/tickets',
      icon: Ticket,
      roles: ['ADMIN', 'PM', 'TECH', 'RESIDENT'],
    },
    {
      title: t('nav.tech-jobs'),
      href: '/tech/jobs',
      icon: Wrench,
      roles: ['TECH'],
    },
    {
      title: t('nav.buildings'),
      href: '/buildings',
      icon: Building,
      roles: ['ADMIN', 'PM'],
    },
    {
      title: t('nav.payments'),
      href: '/payments',
      icon: CreditCard,
      roles: ['ADMIN', 'PM', 'RESIDENT', 'ACCOUNTANT'],
    },
    {
      title: 'חשבוניות שלא שולמו',
      href: '/admin/unpaid-invoices',
      icon: FileText,
      roles: ['ADMIN', 'ACCOUNTANT'],
    },
  ];

  return baseItems.filter(item => item.roles.includes(role));
};

export default function Sidebar({ className, open, onClose, collapsed }: SidebarProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [userRole, setUserRole] = useState<string>('RESIDENT');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const payload = getTokenPayload();
    setUserRole(payload?.actAsRole || payload?.role || 'RESIDENT');
  }, []);
  
  const navigationItems = getNavigationItems(userRole, t);

  const isActive = (href: string) => {
    if (href === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 z-30 hidden w-64 flex-col border-e bg-background md:flex",
        collapsed && "w-16",
        "transition-all duration-300",
        className
      )}>
        <div className="flex h-16 items-center border-b px-6">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                A
              </div>
              <span>עמית אחזקות</span>
            </Link>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold mx-auto">
              A
            </div>
          )}
        </div>
        
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-5 w-5", collapsed && "h-6 w-6")} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer - Settings */}
        {!collapsed && (
          <div className="border-t p-4">
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="h-5 w-5" />
              <span>הגדרות</span>
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 z-30 flex w-64 flex-col border-e bg-background transition-transform duration-300 md:hidden",
        open ? "translate-x-0" : (
          // RTL: slide to right when closed, LTR: slide to left when closed
          "translate-x-full"
        ),
        className
      )}>
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              A
            </div>
            <span>עמית אחזקות</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">סגור תפריט</span>
          </Button>
        </div>
        
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer - Settings */}
        <div className="border-t p-4">
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="h-5 w-5" />
            <span>הגדרות</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
