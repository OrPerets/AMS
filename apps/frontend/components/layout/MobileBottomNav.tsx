"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Home,
  Ticket,
  CreditCard,
  Wrench,
  Bell,
  MoreHorizontal,
  ClipboardList,
  BarChart3,
  Building,
  CalendarClock,
  Settings,
  Box,
  FileText,
  Users,
  Folder,
  ShieldCheck,
  Vote,
  MessageCircle,
  Wallet,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDirection, useLocale } from '../../lib/providers';
import { getTokenPayload } from '../../lib/auth';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

type SecondaryGroup = {
  title: string;
  items: NavItem[];
};

function getRoleBottomNav(role: string, t: (key: string) => string): NavItem[] {
  switch (role) {
    case 'ADMIN':
      return [
        { label: t('nav.homeOverview'), href: '/home', icon: Home },
        { label: t('nav.dashboard'), href: '/admin/dashboard', icon: BarChart3 },
        { label: t('nav.tickets'), href: '/tickets', icon: Ticket },
        { label: t('nav.notifications'), href: '/notifications', icon: Bell },
      ];
    case 'PM':
      return [
        { label: t('nav.homeOverview'), href: '/home', icon: Home },
        { label: t('nav.tickets'), href: '/tickets', icon: Ticket },
        { label: t('nav.buildings'), href: '/buildings', icon: Building },
        { label: t('nav.notifications'), href: '/notifications', icon: Bell },
      ];
    case 'TECH':
      return [
        { label: t('nav.homeOverview'), href: '/home', icon: Home },
        { label: t('nav.techJobs'), href: '/tech/jobs', icon: Wrench },
        { label: t('nav.tickets'), href: '/tickets', icon: Ticket },
        { label: t('nav.notifications'), href: '/notifications', icon: Bell },
      ];
    case 'RESIDENT':
      return [
        { label: t('nav.homeOverview'), href: '/home', icon: Home },
        { label: t('nav.residentRequests'), href: '/resident/requests', icon: ClipboardList },
        { label: t('nav.tickets'), href: '/tickets', icon: Ticket },
        { label: t('nav.notifications'), href: '/notifications', icon: Bell },
      ];
    case 'ACCOUNTANT':
      return [
        { label: t('nav.homeOverview'), href: '/home', icon: Home },
        { label: t('nav.payments'), href: '/payments', icon: CreditCard },
        { label: t('nav.budgets'), href: '/finance/budgets', icon: Wallet },
        { label: t('nav.notifications'), href: '/notifications', icon: Bell },
      ];
    default:
      return [
        { label: t('nav.homeOverview'), href: '/home', icon: Home },
        { label: t('nav.tickets'), href: '/tickets', icon: Ticket },
        { label: t('nav.notifications'), href: '/notifications', icon: Bell },
      ];
  }
}

function getRoleSecondaryGroups(role: string, t: (key: string) => string): SecondaryGroup[] {
  const groups: SecondaryGroup[] = [];

  const operations: NavItem[] = [];
  const properties: NavItem[] = [];
  const finance: NavItem[] = [];
  const admin: NavItem[] = [];

  if (['ADMIN', 'PM', 'TECH'].includes(role)) {
    operations.push({ label: t('nav.maintenance'), href: '/maintenance', icon: CalendarClock });
  }
  if (['ADMIN', 'PM', 'TECH'].includes(role)) {
    operations.push({ label: t('nav.communications'), href: '/communications', icon: MessageCircle });
  }
  if (['ADMIN', 'PM', 'RESIDENT'].includes(role)) {
    operations.push({ label: t('nav.votes'), href: '/votes', icon: Vote });
  }
  if (['ADMIN', 'PM', 'TECH'].includes(role)) {
    operations.push({ label: t('nav.schedules'), href: '/schedules', icon: ClipboardList });
  }
  if (role === 'RESIDENT') {
    operations.push({ label: t('nav.newTicket'), href: '/create-call', icon: Ticket });
  }

  if (['ADMIN', 'PM'].includes(role)) {
    properties.push({ label: t('nav.buildings'), href: '/buildings', icon: Building });
  }
  if (['ADMIN', 'PM', 'TECH'].includes(role)) {
    properties.push({ label: t('nav.assets'), href: '/assets', icon: Box });
  }
  if (['ADMIN', 'PM', 'TECH', 'ACCOUNTANT'].includes(role)) {
    properties.push({ label: t('nav.documents'), href: '/documents', icon: Folder });
  }
  if (['ADMIN', 'PM', 'ACCOUNTANT'].includes(role)) {
    properties.push({ label: t('nav.vendors'), href: '/vendors', icon: Users });
    properties.push({ label: t('nav.contracts'), href: '/contracts', icon: FileText });
  }

  if (['ADMIN', 'PM', 'ACCOUNTANT'].includes(role)) {
    finance.push({ label: t('nav.payments'), href: '/payments', icon: CreditCard });
    finance.push({ label: t('nav.budgets'), href: '/finance/budgets', icon: Wallet });
    finance.push({ label: t('nav.financeReports'), href: '/finance/reports', icon: BarChart3 });
    finance.push({ label: t('nav.operationsCalendar'), href: '/operations/calendar', icon: CalendarClock });
  }

  if (['ADMIN', 'PM'].includes(role)) {
    admin.push({ label: t('nav.configuration'), href: '/admin/configuration', icon: Settings });
    admin.push({ label: t('nav.notifications'), href: '/admin/notifications', icon: Bell });
    admin.push({ label: t('nav.activity'), href: '/admin/activity', icon: ShieldCheck });
    admin.push({ label: t('nav.approvals'), href: '/admin/approvals', icon: ShieldCheck });
    admin.push({ label: t('nav.dataQuality'), href: '/admin/data-quality', icon: ShieldCheck });
  }
  if (role === 'ADMIN') {
    admin.push({ label: t('nav.security'), href: '/admin/security', icon: ShieldCheck });
  }

  if (operations.length) groups.push({ title: t('nav.group.operations'), items: operations });
  if (properties.length) groups.push({ title: t('nav.group.properties'), items: properties });
  if (finance.length) groups.push({ title: t('nav.group.finance'), items: finance });
  if (admin.length) groups.push({ title: t('nav.group.admin'), items: admin });

  groups.push({
    title: t('shell.settings'),
    items: [{ label: t('shell.settings'), href: '/settings', icon: Settings }],
  });

  return groups;
}

interface MobileBottomNavProps {
  className?: string;
  unreadNotifications?: number;
}

export default function MobileBottomNav({ className, unreadNotifications = 0 }: MobileBottomNavProps) {
  const router = useRouter();
  const { t } = useLocale();
  const { direction } = useDirection();
  const [userRole, setUserRole] = useState<string>('RESIDENT');
  const [moreOpen, setMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const moreSheetRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const payload = getTokenPayload();
    setUserRole(payload?.actAsRole || payload?.role || 'RESIDENT');
  }, []);

  useEffect(() => {
    const payload = getTokenPayload();
    setUserRole(payload?.actAsRole || payload?.role || 'RESIDENT');
  }, [router.pathname]);

  useEffect(() => {
    setMoreOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKey);
    };
  }, [moreOpen]);

  if (!mounted) return null;

  const primaryItems = getRoleBottomNav(userRole, t);
  const secondaryGroups = getRoleSecondaryGroups(userRole, t);

  const isActive = (href: string) => {
    if (href === '/' || href === '/home') {
      return router.pathname === '/' || router.pathname === '/home';
    }
    return router.pathname.startsWith(href);
  };

  const primaryItemsWithBadges = primaryItems.map((item) => ({
    ...item,
    badge: item.href === '/notifications' ? unreadNotifications : undefined,
  }));

  return (
    <>
      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t bg-background/92 backdrop-blur-lg md:hidden',
          'safe-pb thumb-zone',
          className,
        )}
        role="navigation"
        aria-label={t('bottomNav.label')}
      >
        <div className="flex items-stretch justify-around px-1">
          {primaryItemsWithBadges.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span className="relative">
                  <Icon className={cn('h-5 w-5', active && 'scale-110')} />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -end-2.5 -top-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </span>
                <span className="truncate max-w-[64px]">{item.label}</span>
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}

          <button
            type="button"
            className={cn(
              'relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium transition-colors',
              moreOpen ? 'text-primary' : 'text-muted-foreground',
            )}
            onClick={() => setMoreOpen(!moreOpen)}
            aria-expanded={moreOpen}
            aria-label={t('bottomNav.more')}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>{t('bottomNav.more')}</span>
          </button>
        </div>
      </nav>

      {/* More Sheet Overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          aria-hidden="true"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More Sheet */}
      <div
        ref={moreSheetRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t bg-background shadow-modal md:hidden',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          moreOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t('bottomNav.moreMenu')}
        aria-hidden={!moreOpen}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur-sm">
          <h2 className="text-sm font-semibold">{t('bottomNav.moreMenu')}</h2>
          <button
            type="button"
            onClick={() => setMoreOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label={t('shell.closeNavigation')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-3 py-3 safe-pb">
          {secondaryGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-foreground/75 hover:bg-muted active:bg-muted/80',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
