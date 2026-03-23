"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { MoreHorizontal, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLocale } from '../../lib/providers';
import { getTokenPayload, normalizeRole } from '../../lib/auth';
import { useRegisterBottomSurface } from '../../lib/bottom-surface';
import { lockAppScroll } from '../../lib/scroll-lock';
import { useFocusTrap } from '../../hooks/use-focus-trap';
import { getNavigationModel, type NavigationGroup, type NavigationItem } from '../../lib/navigation';

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
  const [moreScrollTop, setMoreScrollTop] = useState(0);
  const moreSheetRef = useRef<HTMLDivElement>(null);
  const { refCallback: navRef } = useRegisterBottomSurface('mobile-bottom-nav', 'essential');
  useFocusTrap(moreSheetRef, moreOpen);

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

  useEffect(() => {
    if (!moreOpen) return;
    const unlock = lockAppScroll();
    const node = moreSheetRef.current;
    if (node) node.scrollTop = moreScrollTop;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      unlock();
      document.removeEventListener('keydown', handleKey);
      setMoreScrollTop(node?.scrollTop ?? 0);
    };
  }, [moreOpen, moreScrollTop]);

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
        className={cn('fixed inset-x-0 bottom-0 z-40 border-t shell-frost safe-pb thumb-zone md:hidden', className)}
        role="navigation"
        aria-label={t('bottomNav.label')}
      >
        <div className="grid grid-cols-5 gap-1 px-1.5 py-1.5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => saveRecentItem(item.href)}
                className={cn(
                  'relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-1.5 text-[10px] font-semibold transition-colors touch-manipulation active:scale-[0.98]',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
                aria-current={active ? 'page' : undefined}
                aria-label={item.hint ? `${item.title} · ${item.hint}` : item.title}
              >
                {active ? (
                  <motion.span
                    layoutId="mobile-bottom-nav-active"
                    className="absolute inset-0 rounded-[18px] border border-primary/22 bg-primary/18 shadow-[0_10px_24px_rgba(15,23,42,0.1),inset_0_1px_0_rgba(255,255,255,0.52)]"
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  />
                ) : null}
                <span className={cn('relative z-10 flex h-8 w-8 items-center justify-center rounded-[14px]', active ? 'bg-background/82 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]' : 'text-muted-foreground')}>
                  <Icon className={cn('h-[18px] w-[18px]', active && 'scale-105')} strokeWidth={1.85} />
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
              'relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-1.5 text-[10px] font-semibold transition-colors touch-manipulation active:scale-[0.98]',
              moreOpen || isMoreRouteActive ? 'text-primary' : 'text-muted-foreground',
            )}
            onClick={() => setMoreOpen((current) => !current)}
            aria-expanded={moreOpen}
            aria-label={t('bottomNav.more')}
            aria-controls="mobile-more-sheet"
          >
            {moreOpen || isMoreRouteActive ? (
              <span className="absolute inset-0 rounded-[18px] border border-primary/22 bg-primary/18 shadow-[0_10px_24px_rgba(15,23,42,0.1),inset_0_1px_0_rgba(255,255,255,0.52)]" />
            ) : null}
            <span className={cn('relative z-10 flex h-8 w-8 items-center justify-center rounded-[14px]', moreOpen || isMoreRouteActive ? 'bg-background/82 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]' : 'text-muted-foreground')}>
              <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.85} />
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

      {moreOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" aria-hidden="true" onClick={() => setMoreOpen(false)} />
      ) : null}

      <div
        id="mobile-more-sheet"
        ref={moreSheetRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto overscroll-contain rounded-t-[28px] border-t bg-background shadow-modal md:hidden',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          moreOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ WebkitOverflowScrolling: 'touch' }}
        role="dialog"
        aria-modal="true"
        aria-label={t('bottomNav.moreMenu')}
        aria-describedby="mobile-more-sheet-description"
        aria-hidden={!moreOpen}
      >
        <div className="sticky top-0 z-10 border-b bg-background/92 px-4 pb-3 pt-3 backdrop-blur-xl">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/25" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">{t('bottomNav.moreMenu')}</h2>
              <p id="mobile-more-sheet-description" className="text-xs text-secondary-foreground">
                פעולות משלימות לפי משימה. בלי כפילויות מהסרגל התחתון.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              className="touch-target rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              aria-label={t('shell.closeNavigation')}
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-3 py-3 safe-pb">
          {recentNavItems.length ? (
            <div className="mobile-shell-panel space-y-2 px-2 py-2.5">
              <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recently Used</h3>
              <div className="space-y-1">
                {recentNavItems.map((item) => (
                  <MoreSheetLink key={`recent-${item.href}`} item={item} active={isActive(item.href)} unreadNotifications={unreadNotifications} onNavigate={() => { saveRecentItem(item.href); setMoreOpen(false); }} />
                ))}
              </div>
            </div>
          ) : null}

          {moreGroups.map((group) => (
            <div key={group.title} className="mobile-shell-panel space-y-2 px-2 py-2.5">
              <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <MoreSheetLink key={item.href} item={item} active={isActive(item.href)} unreadNotifications={unreadNotifications} onNavigate={() => { saveRecentItem(item.href); setMoreOpen(false); }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function MoreSheetLink({
  item,
  active,
  unreadNotifications,
  onNavigate,
}: {
  item: NavigationItem;
  active: boolean;
  unreadNotifications: number;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex min-h-[48px] items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition-colors',
        active ? 'surface-action text-foreground' : 'text-foreground/80 hover:bg-muted/60 active:bg-muted/80',
      )}
    >
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', active ? 'bg-primary/12 text-primary' : 'bg-muted/60 text-muted-foreground')}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="flex-1">
        <span className="block text-start">{item.title}</span>
        {item.hint ? <span className="mt-0.5 block text-[11px] font-normal text-secondary-foreground">{item.hint}</span> : null}
      </span>
      {item.href === '/notifications' && unreadNotifications > 0 ? (
        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">{unreadNotifications}</span>
      ) : null}
    </Link>
  );
}
