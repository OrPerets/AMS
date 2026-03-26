"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLocale } from '../../lib/providers';
import { getTokenPayload, normalizeRole } from '../../lib/auth';
import { useRegisterBottomSurface } from '../../lib/bottom-surface';
import { getNavigationModel, type NavigationGroup, type NavigationItem } from '../../lib/navigation';
import { AmsCommandDrawer, type AmsCommandDrawerItem } from '../ui/ams-command-drawer';

const MAX_MORE_GROUPS = 3;
const MAX_MORE_ITEMS_TOTAL = 12;

function normalizeMoreGroups(groups: NavigationGroup[], primaryItems: NavigationItem[]): NavigationGroup[] {
  const primaryHrefs = new Set(primaryItems.map((item) => item.href));
  const seen = new Set<string>();
  let remaining = MAX_MORE_ITEMS_TOTAL;

  return groups.slice(0, MAX_MORE_GROUPS).reduce<NavigationGroup[]>((acc, group) => {
    if (remaining <= 0) return acc;

    const nextItems = group.items.filter((item) => {
      if (remaining <= 0) return false;
      if (primaryHrefs.has(item.href) || seen.has(item.href)) return false;
      seen.add(item.href);
      remaining -= 1;
      return true;
    });

    if (nextItems.length) {
      acc.push({ ...group, items: nextItems });
    }

    return acc;
  }, []);
}

export default function MobileBottomNav({ className, unreadNotifications = 0 }: { className?: string; unreadNotifications?: number }) {
  const router = useRouter();
  const { t } = useLocale();
  const [userRole, setUserRole] = useState<string>('RESIDENT');
  const [moreOpen, setMoreOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const { refCallback: navRef } = useRegisterBottomSurface('mobile-bottom-nav', 'essential');

  useEffect(() => {
    setMounted(true);
    const payload = getTokenPayload();
    setUserRole(normalizeRole(payload?.actAsRole || payload?.role) || 'RESIDENT');
  }, []);

  useEffect(() => {
    const payload = getTokenPayload();
    setUserRole(normalizeRole(payload?.actAsRole || payload?.role) || 'RESIDENT');
  }, [router.pathname]);

  if (!mounted) return null;

  const roleConfig = getNavigationModel(userRole, t);
  const primaryItems = roleConfig.mobilePrimary.slice(0, 4);
  const moreGroups = normalizeMoreGroups(roleConfig.mobileMoreGroups, primaryItems);
  const topActionItems = primaryItems.map((item) => ({
    id: item.id,
    title: item.title,
    href: item.href,
    icon: item.icon,
      hint: item.hint,
      badge: item.href === '/notifications' && unreadNotifications > 0 ? unreadNotifications : undefined,
    }));
  const allToolsItems = moreGroups.flatMap((group) =>
    group.items.map((item) => ({
      id: item.id,
      title: item.title,
      href: item.href,
      icon: item.icon,
      hint: item.hint,
      badge: item.href === '/notifications' && unreadNotifications > 0 ? unreadNotifications : undefined,
    })),
  );
  const commandSections = allToolsItems.length
    ? [
        {
          id: 'all-tools',
          title: 'כל הכלים',
          items: allToolsItems,
        },
      ]
    : [];
  const priorityItems = buildPriorityItems({
    role: userRole,
    primaryItems,
    allToolsItems,
    unreadNotifications,
    t,
  });
  const isActive = (href: string) => {
    const [path, query] = href.split('?');
    if (query) {
      return router.asPath === href;
    }
    return router.pathname === path || (path !== '/home' && router.pathname.startsWith(path));
  };

  const isMoreRouteActive = moreGroups.some((group) => group.items.some((item) => isActive(item.href)));

  return (
    <>
      <nav
        ref={navRef}
        className={cn(
          'glass-sticky-chrome fixed inset-x-0 bottom-0 z-40 border-t safe-pb thumb-zone md:hidden',
          className,
        )}
        role="navigation"
        aria-label={t('bottomNav.label')}
      >
        <div className="grid grid-cols-5 gap-1 px-2 py-1.5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-[20px] px-1 py-1 text-[10px] font-semibold transition-colors touch-manipulation active:scale-[0.98]',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
                aria-current={active ? 'page' : undefined}
                aria-label={item.hint ? `${item.title} · ${item.hint}` : item.title}
              >
                {active ? (
                  <motion.span
                    layoutId="mobile-bottom-nav-active"
                    className="gold-active-pill gold-current-pulse absolute inset-0 rounded-[20px]"
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  />
                ) : null}
                <span className={cn('relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-[14px] transition-colors', active ? 'bg-white/72 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.64)]' : 'text-muted-foreground')}>
                  <Icon className={cn('h-[18px] w-[18px]', active && 'scale-105')} strokeWidth={1.75} />
                </span>
                <span className="relative z-10 w-full text-center leading-tight">
                  <span className={cn('block truncate text-[10px]', active && 'font-bold')}>{item.title}</span>
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            className={cn(
              'relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-[20px] px-1 py-1 text-[10px] font-semibold transition-colors touch-manipulation active:scale-[0.98]',
              moreOpen || isMoreRouteActive ? 'text-primary' : 'text-muted-foreground',
            )}
            onClick={() => setMoreOpen((current) => !current)}
            aria-expanded={moreOpen}
            aria-label={t('bottomNav.more')}
            aria-controls="mobile-more-sheet"
          >
            {moreOpen || isMoreRouteActive ? (
              <span className="gold-active-pill gold-current-pulse absolute inset-0 rounded-[20px]" />
            ) : null}
            <span className={cn('relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-[14px] transition-colors', moreOpen || isMoreRouteActive ? 'bg-white/72 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.64)]' : 'text-muted-foreground')}>
              <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {unreadNotifications > 0 ? (
                <motion.span
                  key={unreadNotifications}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.3, 1] }}
                  className="absolute -end-1.5 -top-0.5 inline-flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] font-bold text-destructive-foreground"
                >
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </motion.span>
              ) : null}
            </span>
            <span className="relative z-10 text-center leading-tight">
              <span className={cn('block text-[10px]', (moreOpen || isMoreRouteActive) && 'font-bold')}>{t('bottomNav.more')}</span>
            </span>
          </button>
        </div>
      </nav>

      <AmsCommandDrawer
        isOpen={moreOpen}
        onOpenChange={setMoreOpen}
        title={t('bottomNav.moreMenu')}
        tone={userRole === 'RESIDENT' ? 'light' : 'dark'}
        query={commandQuery}
        onQueryChange={setCommandQuery}
        topActions={topActionItems}
        priorityItems={priorityItems}
        unreadCount={unreadNotifications}
        sections={commandSections.map((section) => ({
          ...section,
          items: section.items.map(toCommandItem),
        }))}
        isActive={isActive}
        onNavigate={(href) => {
          setMoreOpen(false);
          setCommandQuery('');
        }}
      />
    </>
  );
}

function toCommandItem(item: NavigationItem & { badge?: React.ReactNode }): AmsCommandDrawerItem {
  return {
    id: item.id,
    title: item.title,
    href: item.href,
    icon: item.icon,
    hint: item.hint,
    badge: item.badge,
  };
}

function buildPriorityItems({
  role,
  primaryItems,
  allToolsItems,
  unreadNotifications,
  t,
}: {
  role: string;
  primaryItems: NavigationItem[];
  allToolsItems: Array<NavigationItem & { badge?: React.ReactNode }>;
  unreadNotifications: number;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const byHref = new Map([...primaryItems, ...allToolsItems].map((item) => [item.href, item]));
  const items: AmsCommandDrawerItem[] = [];

  const addItem = (href: string, meta: string, badge?: React.ReactNode) => {
    const item = byHref.get(href);
    if (!item || items.some((candidate) => candidate.href === href)) return;
    items.push({
      id: `${item.id}-priority`,
      title: item.title,
      href: item.href,
      icon: item.icon,
      hint: item.hint,
      badge,
      meta,
    });
  };

  if (unreadNotifications > 0) {
    addItem('/notifications', 'לא נקראו', unreadNotifications > 9 ? '9+' : unreadNotifications);
  }

  switch (role) {
    case 'ADMIN':
      addItem('/tickets', 'תפעול');
      addItem('/admin/approvals', 'ממתין');
      break;
    case 'PM':
      addItem('/tickets', 'שיוך');
      addItem('/operations/calendar', 'היום');
      break;
    case 'TECH':
      addItem('/tech/jobs', 'הבא בתור');
      addItem('/tickets?mine=true', 'עדכון');
      break;
    case 'ACCOUNTANT':
      addItem('/payments', 'גבייה');
      addItem('/finance/budgets', 'בדיקה');
      break;
    case 'RESIDENT':
    default:
      addItem('/payments/resident', 'לטיפול');
      addItem('/resident/requests', 'מעקב');
      break;
  }

  return items.slice(0, 3).map((item) => ({
    ...item,
    title: item.href === '/notifications' ? t('nav.notifications') : item.title,
  }));
}
