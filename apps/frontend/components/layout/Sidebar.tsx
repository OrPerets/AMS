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
  Bell,
  CalendarClock,
  Wallet,
  Folder,
  Box,
  MessageCircle,
  X,
  Vote,
  ClipboardList,
  ShieldCheck
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

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
  roles: string[];
}

interface NavigationItem {
  title: string;
  href: string;
  icon: any;
  roles: string[];
}

// Navigation items configuration with logical grouping
const getNavigationGroups = (role: string, t: (key: string) => string): NavigationGroup[] => {
  const groups: NavigationGroup[] = [
    {
      title: 'לוח בקרה',
      roles: ['ADMIN', 'PM', 'TECH', 'RESIDENT', 'ACCOUNTANT'],
      items: [
        {
          title: 'סקירה כללית',
          href: '/home',
          icon: Home,
          roles: ['ADMIN', 'PM', 'TECH', 'RESIDENT', 'ACCOUNTANT'],
        },
        {
          title: 'לוח ניהול',
          href: '/admin/dashboard',
          icon: BarChart3,
          roles: ['ADMIN', 'PM'],
        },
        {
          title: 'לוח קריאות - מאיה',
          href: '/maya-dashboard',
          icon: Ticket,
          roles: ['PM'],
        },
      ]
    },
    {
      title: 'תפעול יומיומי',
      roles: ['ADMIN', 'PM', 'TECH', 'RESIDENT'],
      items: [
        {
          title: 'קריאות שירות',
          href: '/tickets',
          icon: Ticket,
          roles: ['ADMIN', 'PM', 'TECH', 'RESIDENT'],
        },
        {
          title: 'פתיחת קריאה חדשה',
          href: '/create-call',
          icon: Ticket,
          roles: ['RESIDENT'],
        },
        {
          title: 'תחזוקה מתוכננת',
          href: '/maintenance',
          icon: CalendarClock,
          roles: ['ADMIN', 'PM', 'TECH'],
        },
        {
          title: 'משימות שטח',
          href: '/tech/jobs',
          icon: Wrench,
          roles: ['TECH'],
        },
        {
          title: 'מרכז תקשורת',
          href: '/communications',
          icon: MessageCircle,
          roles: ['ADMIN', 'PM', 'TECH'],
        },
        {
          title: 'הודעות ממוקדות',
          href: '/communications/announcements',
          icon: Bell,
          roles: ['ADMIN', 'PM'],
        },
        {
          title: 'הצבעות',
          href: '/votes',
          icon: Vote,
          roles: ['ADMIN', 'PM', 'RESIDENT'],
        },
        {
          title: 'בקשות דייר',
          href: '/resident/requests',
          icon: ClipboardList,
          roles: ['RESIDENT'],
        },
        {
          title: 'לוחות זמנים',
          href: '/schedules',
          icon: ClipboardList,
          roles: ['ADMIN', 'PM', 'TECH'],
        },
      ]
    },
    {
      title: 'ניהול נכסים',
      roles: ['ADMIN', 'PM', 'TECH'],
      items: [
        {
          title: 'בניינים ויחידות',
          href: '/buildings',
          icon: Building,
          roles: ['ADMIN', 'PM'],
        },
        {
          title: 'ציוד ונכסים',
          href: '/assets',
          icon: Box,
          roles: ['ADMIN', 'PM', 'TECH'],
        },
        {
          title: 'מסמכים',
          href: '/documents',
          icon: Folder,
          roles: ['ADMIN', 'PM', 'TECH', 'ACCOUNTANT'],
        },
        {
          title: 'ספקים',
          href: '/vendors',
          icon: Users,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
        {
          title: 'חוזים',
          href: '/contracts',
          icon: FileText,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
      ]
    },
    {
      title: 'ניהול פיננסי',
      roles: ['ADMIN', 'PM', 'ACCOUNTANT', 'RESIDENT'],
      items: [
        {
          title: 'תשלומים',
          href: '/payments',
          icon: CreditCard,
          roles: ['ADMIN', 'PM', 'RESIDENT', 'ACCOUNTANT'],
        },
        {
          title: 'תקציבים והוצאות',
          href: '/finance/budgets',
          icon: Wallet,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
        {
          title: 'דוחות פיננסיים',
          href: '/finance/reports',
          icon: BarChart3,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
        {
          title: 'חשבוניות ממתינות',
          href: '/admin/unpaid-invoices',
          icon: FileText,
          roles: ['ADMIN', 'ACCOUNTANT'],
        },
        {
          title: 'יומן תפעול',
          href: '/operations/calendar',
          icon: CalendarClock,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
      ]
    },
    {
      title: 'ניהול המערכת',
      roles: ['ADMIN', 'PM'],
      items: [
        {
          title: 'התראות',
          href: '/admin/notifications',
          icon: Bell,
          roles: ['ADMIN', 'PM'],
        },
        {
          title: 'יומן פעילות',
          href: '/admin/activity',
          icon: ShieldCheck,
          roles: ['ADMIN', 'PM'],
        },
        {
          title: 'מרכז אישורים',
          href: '/admin/approvals',
          icon: ShieldCheck,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
        {
          title: 'איכות נתונים',
          href: '/admin/data-quality',
          icon: ShieldCheck,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
      ]
    }
  ];

  return groups.filter(group => group.roles.includes(role));
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

  // Listen for route changes to re-read token payload (for role changes)
  useEffect(() => {
    const payload = getTokenPayload();
    setUserRole(payload?.actAsRole || payload?.role || 'RESIDENT');
  }, [router.pathname]);
  
  const navigationGroups = getNavigationGroups(userRole, t);

  const isActive = (href: string) => {
    if (href === '/' || href === '/home') {
      return router.pathname === '/' || router.pathname === '/home';
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
        
        <nav className="flex-1 space-y-6 p-4 overflow-y-auto">
          {navigationGroups.map((group) => {
            const filteredItems = group.items.filter(item => item.roles.includes(userRole));
            if (filteredItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-2">
                {!collapsed && (
                  <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </h4>
                )}
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground/70 hover:bg-accent hover:text-accent-foreground",
                          collapsed && "justify-center px-2"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", collapsed && "h-6 w-6")} />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
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
        
        <nav className="flex-1 space-y-6 p-4 overflow-y-auto">
          {navigationGroups.map((group) => {
            const filteredItems = group.items.filter(item => item.roles.includes(userRole));
            if (filteredItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-2">
                <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.title}
                </h4>
                <div className="space-y-1">
                  {filteredItems.map((item) => {
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
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
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
