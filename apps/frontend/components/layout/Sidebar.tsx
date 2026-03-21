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
  ShieldCheck,
  Globe,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';
import { useDirection, useLocale, useTheme } from '../../lib/providers';
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
      title: t('nav.group.dashboard'),
      roles: ['ADMIN', 'PM', 'TECH', 'RESIDENT', 'ACCOUNTANT'],
      items: [
        {
          title: t('nav.homeOverview'),
          href: '/home',
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
          title: t('nav.mayaDashboard'),
          href: '/maya-dashboard',
          icon: Ticket,
          roles: ['PM'],
        },
      ]
    },
    {
      title: t('nav.group.operations'),
      roles: ['ADMIN', 'PM', 'TECH', 'RESIDENT'],
      items: [
        {
          title: t('nav.tickets'),
          href: '/tickets',
          icon: Ticket,
          roles: ['ADMIN', 'PM', 'TECH', 'RESIDENT'],
        },
        {
          title: t('nav.newTicket'),
          href: '/create-call',
          icon: Ticket,
          roles: ['RESIDENT'],
        },
        {
          title: t('nav.maintenance'),
          href: '/maintenance',
          icon: CalendarClock,
          roles: ['ADMIN', 'PM', 'TECH'],
        },
        {
          title: t('nav.techJobs'),
          href: '/tech/jobs',
          icon: Wrench,
          roles: ['TECH'],
        },
        {
          title: t('nav.communications'),
          href: '/communications',
          icon: MessageCircle,
          roles: ['ADMIN', 'PM', 'TECH'],
        },
        {
          title: t('nav.announcements'),
          href: '/communications/announcements',
          icon: Bell,
          roles: ['ADMIN', 'PM'],
        },
        {
          title: t('nav.votes'),
          href: '/votes',
          icon: Vote,
          roles: ['ADMIN', 'PM', 'RESIDENT'],
        },
        {
          title: t('nav.residentRequests'),
          href: '/resident/requests',
          icon: ClipboardList,
          roles: ['RESIDENT'],
        },
        {
          title: t('nav.schedules'),
          href: '/schedules',
          icon: ClipboardList,
          roles: ['ADMIN', 'PM', 'TECH'],
        },
      ]
    },
    {
      title: t('nav.group.properties'),
      roles: ['ADMIN', 'PM', 'TECH'],
      items: [
        {
          title: t('nav.buildings'),
          href: '/buildings',
          icon: Building,
          roles: ['ADMIN', 'PM'],
        },
        {
          title: t('nav.assets'),
          href: '/assets',
          icon: Box,
          roles: ['ADMIN', 'PM', 'TECH'],
        },
        {
          title: t('nav.documents'),
          href: '/documents',
          icon: Folder,
          roles: ['ADMIN', 'PM', 'TECH', 'ACCOUNTANT'],
        },
        {
          title: t('nav.vendors'),
          href: '/vendors',
          icon: Users,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
        {
          title: t('nav.contracts'),
          href: '/contracts',
          icon: FileText,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
      ]
    },
    {
      title: t('nav.group.finance'),
      roles: ['ADMIN', 'PM', 'ACCOUNTANT', 'RESIDENT'],
      items: [
        {
          title: t('nav.payments'),
          href: '/payments',
          icon: CreditCard,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
        {
          title: t('nav.budgets'),
          href: '/finance/budgets',
          icon: Wallet,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
        {
          title: t('nav.financeReports'),
          href: '/finance/reports',
          icon: BarChart3,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
        {
          title: t('nav.unpaidInvoices'),
          href: '/admin/unpaid-invoices',
          icon: FileText,
          roles: ['ADMIN', 'ACCOUNTANT'],
        },
        {
          title: t('nav.operationsCalendar'),
          href: '/operations/calendar',
          icon: CalendarClock,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
      ]
    },
    {
      title: t('nav.group.admin'),
      roles: ['ADMIN', 'PM'],
      items: [
        {
          title: t('nav.configuration'),
          href: '/admin/configuration',
          icon: Settings,
          roles: ['ADMIN', 'PM'],
        },
        {
          title: t('nav.notifications'),
          href: '/admin/notifications',
          icon: Bell,
          roles: ['ADMIN', 'PM'],
        },
        {
          title: t('nav.activity'),
          href: '/admin/activity',
          icon: ShieldCheck,
          roles: ['ADMIN', 'PM'],
        },
        {
          title: t('nav.approvals'),
          href: '/admin/approvals',
          icon: ShieldCheck,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
        {
          title: t('nav.dataQuality'),
          href: '/admin/data-quality',
          icon: ShieldCheck,
          roles: ['ADMIN', 'PM', 'ACCOUNTANT'],
        },
        {
          title: t('nav.security'),
          href: '/admin/security',
          icon: ShieldCheck,
          roles: ['ADMIN'],
        },
      ]
    }
  ];

  return groups.filter(group => group.roles.includes(role));
};

export default function Sidebar({ className, open, onClose, collapsed }: SidebarProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();
  const { direction, setDirection } = useDirection();
  const { theme, setTheme } = useTheme();
  const [userRole, setUserRole] = useState<string>('RESIDENT');
  const [mounted, setMounted] = useState(false);
  const mobileDrawerRef = React.useRef<HTMLElement | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);

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
  const tooltipSide = direction === 'rtl' ? 'left' : 'right';

  const isActive = (href: string) => {
    if (href === '/' || href === '/home') {
      return router.pathname === '/' || router.pathname === '/home';
    }
    return router.pathname.startsWith(href);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const container = mobileDrawerRef.current;
      if (!container) {
        return;
      }

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  const toggleLocaleAndDirection = () => {
    setDirection(direction === 'rtl' ? 'ltr' : 'rtl');
    setLocale(locale === 'he' ? 'en' : 'he');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 z-30 hidden w-64 flex-col border-e border-white/10 bg-background/92 backdrop-blur-md md:flex",
        collapsed && "w-16",
        "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        className
      )}>
        <div className="flex h-16 items-center border-b px-6">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                A
              </div>
              <span>{t('app.shortName')}</span>
            </Link>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold mx-auto">
              A
            </div>
          )}
        </div>
        
        <TooltipProvider delayDuration={150}>
          <nav className="scrollbar-hide flex-1 space-y-6 overflow-y-auto p-4">
            {navigationGroups.map((group) => {
              const filteredItems = group.items.filter(item => item.roles.includes(userRole));
              if (filteredItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-2">
                  {!collapsed && (
                    <h4 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.title}
                    </h4>
                  )}
                  <div className="space-y-1">
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      const navLink = (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-label={collapsed ? item.title : undefined}
                          className={cn(
                            "touch-target flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-foreground/70 hover:bg-accent hover:text-accent-foreground",
                            collapsed && "justify-center px-2"
                          )}
                        >
                          <Icon className={cn("h-5 w-5 shrink-0", collapsed && "h-6 w-6")} />
                          {!collapsed && <span>{item.title}</span>}
                        </Link>
                      );

                      if (!collapsed) {
                        return navLink;
                      }

                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                          <TooltipContent side={tooltipSide}>{item.title}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </TooltipProvider>

        {/* Footer - Settings */}
        {!collapsed && (
          <div className="border-t p-4">
            <Link
              href="/settings"
              className="touch-target flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="h-5 w-5" />
              <span>{t('shell.settings')}</span>
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 z-30 flex w-[min(calc(100vw-2.5rem),22rem)] max-w-full flex-col border-e bg-background shadow-modal backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden",
        direction === 'rtl' ? "start-0" : "end-0",
        open
          ? "translate-x-0"
          : direction === 'rtl'
            ? "-translate-x-full"
            : "translate-x-full",
        className
      )}
      ref={mobileDrawerRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('shell.mainNavigation')}
      aria-hidden={!open}
      data-state={open ? 'open' : 'closed'}>
        <div className="safe-pt flex min-h-14 items-center justify-between border-b px-3.5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              A
            </div>
            <span className="text-sm">{t('app.shortName')}</span>
          </Link>
          <Button ref={closeButtonRef} variant="ghost" size="icon-sm" onClick={onClose} aria-label={t('shell.closeNavigation')}>
            <X className="h-4.5 w-4.5" />
            <span className="sr-only">{t('shell.closeNavigation')}</span>
          </Button>
        </div>
        
        <nav className="scrollbar-hide flex-1 space-y-4 overflow-y-auto px-3 py-3">
          {navigationGroups.map((group) => {
            const filteredItems = group.items.filter(item => item.roles.includes(userRole));
            if (filteredItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <h4 className="px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.title}
                </h4>
                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "touch-target flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground/75 hover:bg-muted active:bg-muted/80"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t px-3 py-3 safe-pb">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start text-xs" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                {theme === 'light' ? <Moon className="me-1.5 h-3.5 w-3.5" /> : <Sun className="me-1.5 h-3.5 w-3.5" />}
                {t('shell.theme')}
              </Button>
              <Button variant="outline" size="sm" className="justify-start text-xs" onClick={toggleLocaleAndDirection}>
                <Globe className="me-1.5 h-3.5 w-3.5" />
                {locale === 'he' ? 'English' : 'עברית'}
              </Button>
            </div>
            <Link
              href="/settings"
              onClick={onClose}
              className="touch-target flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <Settings className="h-[18px] w-[18px]" />
              <span>{t('shell.settings')}</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
