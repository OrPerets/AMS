"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
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
  Leaf,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLocale } from '../../lib/providers';
import { getTokenPayload } from '../../lib/auth';
import { useRegisterBottomSurface } from '../../lib/bottom-surface';
import { lockAppScroll } from '../../lib/scroll-lock';

type NavItem = {
  label: string;
  hint?: string;
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
        { label: t('nav.homeOverview'), hint: 'סקירה', href: '/home', icon: Home },
        { label: t('nav.dashboard'), hint: 'בקרה', href: '/admin/dashboard', icon: BarChart3 },
        { label: t('nav.tickets'), hint: 'מוקד', href: '/tickets', icon: Ticket },
      ];
    case 'PM':
      return [
        { label: t('nav.homeOverview'), hint: 'סקירה', href: '/home', icon: Home },
        { label: t('nav.tickets'), hint: 'משימות', href: '/tickets', icon: Ticket },
        { label: t('nav.buildings'), hint: 'נכסים', href: '/buildings', icon: Building },
      ];
    case 'TECH':
      return [
        { label: t('nav.homeOverview'), hint: 'סקירה', href: '/home', icon: Home },
        { label: 'גינון', hint: 'חודש', href: '/gardens', icon: Leaf },
        { label: t('nav.techJobs'), hint: 'שטח', href: '/tech/jobs', icon: Wrench },
      ];
    case 'RESIDENT':
      return [
        { label: t('nav.homeOverview'), hint: 'היום', href: '/home', icon: Home },
        { label: t('nav.residentRequests'), hint: 'בקשות', href: '/resident/requests', icon: ClipboardList },
        { label: t('nav.tickets'), hint: 'שירות', href: '/tickets', icon: Ticket },
      ];
    case 'ACCOUNTANT':
      return [
        { label: t('nav.homeOverview'), hint: 'סקירה', href: '/home', icon: Home },
        { label: t('nav.payments'), hint: 'גבייה', href: '/payments', icon: CreditCard },
        { label: t('nav.budgets'), hint: 'תקציב', href: '/finance/budgets', icon: Wallet },
      ];
    default:
      return [
        { label: t('nav.homeOverview'), hint: 'סקירה', href: '/home', icon: Home },
        { label: t('nav.tickets'), hint: 'מוקד', href: '/tickets', icon: Ticket },
      ];
  }
}

function getRoleSecondaryGroups(role: string, t: (key: string) => string): SecondaryGroup[] {
  const groups: SecondaryGroup[] = [];

  const operations: NavItem[] = [];
  const properties: NavItem[] = [];
  const finance: NavItem[] = [];
  const admin: NavItem[] = [];
  const system: NavItem[] = [
    { label: t('nav.notifications'), hint: 'עדכונים', href: '/notifications', icon: Bell },
    { label: t('shell.settings'), hint: 'העדפות', href: '/settings', icon: Settings },
  ];

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
  if (['ADMIN', 'PM', 'TECH'].includes(role)) {
    operations.push({ label: 'ניהול גננים', href: '/gardens', icon: Leaf });
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
    title: t('bottomNav.moreMenu'),
    items: system,
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
  const [userRole, setUserRole] = useState<string>('RESIDENT');
  const [moreOpen, setMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const moreSheetRef = React.useRef<HTMLDivElement>(null);
  const { refCallback: navRef } = useRegisterBottomSurface('mobile-bottom-nav', 'essential');

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
    const unlock = lockAppScroll();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      unlock();
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

  return (
    <>
      <nav
        ref={navRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t shell-frost md:hidden',
          'safe-pb thumb-zone',
          className,
        )}
        role="navigation"
        aria-label={t('bottomNav.label')}
      >
        <div className="grid grid-cols-4 gap-0.5 px-1.5 py-1.5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-[18px] px-1 py-1.5 text-[10px] font-medium transition-colors touch-manipulation active:scale-95',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="mobile-bottom-nav-active"
                    className="absolute inset-0 rounded-[18px] bg-primary/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  />
                ) : null}
                <span className="relative z-10 flex h-7 w-7 items-center justify-center">
                  <Icon className={cn('h-[18px] w-[18px] transition-transform duration-200', active && 'scale-110')} />
                </span>
                <span className="relative z-10 w-full text-center leading-tight">
                  <span className="block truncate text-[9px] font-semibold">{item.label}</span>
                  <span className="mt-0.5 block truncate text-[8px] text-muted-foreground">{item.hint || ''}</span>
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            className={cn(
              'relative flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-[18px] px-1 py-1.5 text-[10px] font-medium transition-colors touch-manipulation active:scale-95',
              moreOpen ? 'text-primary' : 'text-muted-foreground',
            )}
            onClick={() => setMoreOpen(!moreOpen)}
            aria-expanded={moreOpen}
            aria-label={t('bottomNav.more')}
          >
            {moreOpen ? (
              <span className="absolute inset-0 rounded-[18px] bg-primary/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]" />
            ) : null}
            <span className="relative z-10 flex h-7 w-7 items-center justify-center">
              <MoreHorizontal className="h-[18px] w-[18px]" />
              {unreadNotifications > 0 ? (
                <span className="absolute -end-1.5 -top-0.5 inline-flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] font-bold text-destructive-foreground">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              ) : null}
            </span>
            <span className="relative z-10 text-center leading-tight">
              <span className="block text-[9px] font-semibold">{t('bottomNav.more')}</span>
              <span className="mt-0.5 block text-[8px] text-muted-foreground">עוד</span>
            </span>
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
          'fixed inset-x-0 bottom-0 z-50 max-h-[78vh] overflow-y-auto overscroll-contain rounded-t-[28px] border-t bg-background shadow-modal md:hidden',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          moreOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ WebkitOverflowScrolling: 'touch' }}
        role="dialog"
        aria-modal="true"
        aria-label={t('bottomNav.moreMenu')}
        aria-hidden={!moreOpen}
      >
        <div className="sticky top-0 z-10 border-b bg-background/92 px-4 pb-3 pt-3 backdrop-blur-xl">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/25" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">{t('bottomNav.moreMenu')}</h2>
              <p className="text-xs text-muted-foreground">פעולות משלימות לפי משימה, לא לפי מבנה ארגוני.</p>
            </div>
          <button
            type="button"
            onClick={() => setMoreOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label={t('shell.closeNavigation')}
          >
            <X className="h-4 w-4" />
          </button>
          </div>
        </div>

        <div className="space-y-4 px-3 py-3 safe-pb">
          {secondaryGroups.map((group) => (
            <div key={group.title} className="mobile-shell-panel space-y-2 px-2 py-2.5">
              <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex min-h-[52px] items-center gap-3 rounded-[18px] px-3 py-3 text-[13px] font-medium transition-colors',
                        active
                          ? 'surface-action text-foreground'
                          : 'text-foreground/75 hover:bg-muted/60 active:bg-muted/80',
                      )}
                    >
                      <span className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl',
                        active ? 'bg-primary/12 text-primary' : 'bg-muted/60 text-muted-foreground',
                      )}>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="flex-1">
                        <span className="block">{item.label}</span>
                        {item.hint ? <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">{item.hint}</span> : null}
                      </span>
                      {item.href === '/notifications' && unreadNotifications > 0 ? (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                          {unreadNotifications}
                        </span>
                      ) : null}
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
