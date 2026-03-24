"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { MoreHorizontal, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLocale } from '../../lib/providers';
import { getTokenPayload, normalizeRole } from '../../lib/auth';
import { useRegisterBottomSurface } from '../../lib/bottom-surface';
import { getNavigationModel, type NavigationGroup, type NavigationItem } from '../../lib/navigation';
import { AmsDrawer } from '../ui/ams-drawer';

const RECENT_STORAGE_KEY = 'ams-mobile-nav-recent';
const MAX_MORE_GROUPS = 3;
const MAX_MORE_ITEMS_TOTAL = 12;

function loadRecentItems(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 2) : [];
  } catch {
    return [];
  }
}

function saveRecentItem(href: string) {
  if (typeof window === 'undefined') return;
  const next = [href, ...loadRecentItems().filter((item) => item !== href)].slice(0, 2);
  window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
}

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
  const [mounted, setMounted] = useState(false);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const { refCallback: navRef } = useRegisterBottomSurface('mobile-bottom-nav', 'essential');

  useEffect(() => {
    setMounted(true);
    const payload = getTokenPayload();
    setUserRole(normalizeRole(payload?.actAsRole || payload?.role) || 'RESIDENT');
    setRecentItems(loadRecentItems());
  }, []);

  useEffect(() => {
    const payload = getTokenPayload();
    setUserRole(normalizeRole(payload?.actAsRole || payload?.role) || 'RESIDENT');
  }, [router.pathname]);

  if (!mounted) return null;

  const roleConfig = getNavigationModel(userRole, t);
  const primaryItems = roleConfig.mobilePrimary.slice(0, 4);
  const moreGroups = normalizeMoreGroups(roleConfig.mobileMoreGroups, primaryItems);
  const recentNavItems = moreGroups.flatMap((group) => group.items).filter((item) => recentItems.includes(item.href));
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
          'fixed inset-x-0 bottom-0 z-40 border-t border-white/35 bg-[linear-gradient(180deg,rgba(255,252,247,0.92)_0%,rgba(248,244,236,0.98)_100%)] shadow-[0_-18px_40px_rgba(44,28,9,0.08)] backdrop-blur-xl safe-pb thumb-zone md:hidden',
          className,
        )}
        role="navigation"
        aria-label={t('bottomNav.label')}
      >
        <div className="grid grid-cols-5 gap-1.5 px-2 py-2">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => saveRecentItem(item.href)}
                className={cn(
                  'relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[10px] font-semibold transition-colors touch-manipulation active:scale-[0.98]',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
                aria-current={active ? 'page' : undefined}
                aria-label={item.hint ? `${item.title} · ${item.hint}` : item.title}
              >
                {active ? (
                  <motion.span
                    layoutId="mobile-bottom-nav-active"
                    className="absolute inset-0 rounded-2xl border border-primary/24 bg-primary/14 shadow-[0_12px_28px_rgba(44,28,9,0.12),inset_0_1px_0_rgba(255,255,255,0.58)]"
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  />
                ) : null}
                <span className={cn('relative z-10 flex h-8 w-8 items-center justify-center rounded-xl', active ? 'bg-background/88 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]' : 'text-muted-foreground')}>
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
              'relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[10px] font-semibold transition-colors touch-manipulation active:scale-[0.98]',
              moreOpen || isMoreRouteActive ? 'text-primary' : 'text-muted-foreground',
            )}
            onClick={() => setMoreOpen((current) => !current)}
            aria-expanded={moreOpen}
            aria-label={t('bottomNav.more')}
            aria-controls="mobile-more-sheet"
          >
            {moreOpen || isMoreRouteActive ? (
              <span className="absolute inset-0 rounded-2xl border border-primary/24 bg-primary/14 shadow-[0_12px_28px_rgba(44,28,9,0.12),inset_0_1px_0_rgba(255,255,255,0.58)]" />
            ) : null}
            <span className={cn('relative z-10 flex h-8 w-8 items-center justify-center rounded-xl', moreOpen || isMoreRouteActive ? 'bg-background/88 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]' : 'text-muted-foreground')}>
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

      <AmsDrawer
        isOpen={moreOpen}
        onOpenChange={setMoreOpen}
        title={t('bottomNav.moreMenu')}
        description="קיצורי דרך משלימים, בלי כפילויות מהסרגל התחתון."
        className="md:hidden"
      >
        <div className="space-y-4 py-2">
          {recentNavItems.length ? (
            <div className="space-y-2">
              <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56">Recently used</h3>
              <div className="space-y-1">
                {recentNavItems.map((item) => (
                  <MoreSheetLink
                    key={`recent-${item.href}`}
                    item={item}
                    active={isActive(item.href)}
                    unreadNotifications={unreadNotifications}
                    onNavigate={() => {
                      saveRecentItem(item.href);
                      setMoreOpen(false);
                    }}
                    tone="dark"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {moreGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56">{group.title}</h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <MoreSheetLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    unreadNotifications={unreadNotifications}
                    onNavigate={() => {
                      saveRecentItem(item.href);
                      setMoreOpen(false);
                    }}
                    tone="dark"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </AmsDrawer>
    </>
  );
}

function MoreSheetLink({
  item,
  active,
  unreadNotifications,
  onNavigate,
  tone = 'light',
}: {
  item: NavigationItem;
  active: boolean;
  unreadNotifications: number;
  onNavigate: () => void;
  tone?: 'light' | 'dark';
}) {
  const Icon = item.icon;
  const isDark = tone === 'dark';

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex min-h-[48px] items-center gap-3 rounded-2xl border px-3 py-2.5 text-[13px] font-medium transition-colors',
        isDark
          ? active
            ? 'border-primary/18 bg-primary/12 text-inverse-text shadow-[0_14px_34px_rgba(0,0,0,0.22)]'
            : 'border-white/10 bg-white/6 text-white/82 hover:bg-white/9 active:bg-white/12'
          : active
            ? 'surface-action text-foreground'
            : 'border-subtle-border text-foreground/80 hover:bg-muted/60 active:bg-muted/80',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          isDark
            ? active
              ? 'bg-primary/12 text-primary'
              : 'bg-white/8 text-white/62'
            : active
              ? 'bg-primary/12 text-primary'
              : 'bg-muted/60 text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="flex-1">
        <span className="block text-start">{item.title}</span>
        {item.hint ? (
          <span className={cn('mt-0.5 block text-[11px] font-normal', isDark ? 'text-white/56' : 'text-secondary-foreground')}>
            {item.hint}
          </span>
        ) : null}
      </span>
      {item.href === '/notifications' && unreadNotifications > 0 ? (
        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">{unreadNotifications}</span>
      ) : (
        <X className={cn('h-4 w-4 rotate-45', isDark ? 'text-white/35' : 'text-muted-foreground')} strokeWidth={1.75} />
      )}
    </Link>
  );
}
