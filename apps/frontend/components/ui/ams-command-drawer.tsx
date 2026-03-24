"use client";

import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, Bell, Sparkles } from 'lucide-react';
import { AmsDrawer } from './ams-drawer';
import { AmsQueryField } from './ams-query-field';
import { cn } from '../../lib/utils';

export type AmsCommandDrawerItem = {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  hint?: string;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
};

type AmsCommandDrawerSection = {
  id: string;
  title: string;
  items: AmsCommandDrawerItem[];
};

type AmsCommandDrawerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  query: string;
  onQueryChange: (value: string) => void;
  queryPlaceholder?: string;
  topActions?: AmsCommandDrawerItem[];
  recentItems?: AmsCommandDrawerItem[];
  unreadCount?: number;
  sections: AmsCommandDrawerSection[];
  isActive?: (href: string) => boolean;
  onNavigate?: (href: string) => void;
};

export function AmsCommandDrawer({
  isOpen,
  onOpenChange,
  title,
  description,
  query,
  onQueryChange,
  queryPlaceholder = 'חפש יעד, פעולה או מסך',
  topActions = [],
  recentItems = [],
  unreadCount = 0,
  sections,
  isActive,
  onNavigate,
}: AmsCommandDrawerProps) {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = normalizedQuery
    ? sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            [item.title, item.hint, item.href].join(' ').toLowerCase().includes(normalizedQuery),
          ),
        }))
        .filter((section) => section.items.length)
    : sections;

  return (
    <AmsDrawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="md:hidden"
    >
      <div className="space-y-4 py-2">
        <AmsQueryField
          value={query}
          onChange={onQueryChange}
          placeholder={queryPlaceholder}
          ariaLabel="חיפוש מהיר"
          inputClassName="border-white/10 bg-white/8 text-inverse-text placeholder:text-white/45"
          className="[&_input]:text-inverse-text [&_svg]:text-white/56"
          autoFocus
        />

        {topActions.length ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56">Top actions</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white/45">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                עכשיו
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {topActions.slice(0, 4).map((item) => (
                <CommandTile
                  key={item.id}
                  item={item}
                  active={Boolean(isActive?.(item.href))}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ) : null}

        {unreadCount > 0 ? (
          <div className="rounded-[24px] border border-primary/18 bg-primary/12 p-3 text-inverse-text shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-primary">
                <Bell className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">מרכז עדכונים</div>
                <div className="mt-1 text-xs leading-5 text-white/70">
                  {unreadCount} התראות לא נקראו. פתח את ההתראות או המשך למסך הפעולה הבא.
                </div>
              </div>
              <div className="rounded-full bg-destructive px-2 py-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            </div>
          </div>
        ) : null}

        {recentItems.length && !normalizedQuery ? (
          <div className="space-y-2">
            <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56">Recently used</h3>
            <div className="space-y-1.5">
              {recentItems.map((item) => (
                <CommandLink
                  key={item.id}
                  item={item}
                  active={Boolean(isActive?.(item.href))}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ) : null}

        {filteredSections.map((section) => (
          <div key={section.id} className="space-y-2">
            <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56">{section.title}</h3>
            <div className="space-y-1.5">
              {section.items.map((item) => (
                <CommandLink
                  key={item.id}
                  item={item}
                  active={Boolean(isActive?.(item.href))}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}

        {!filteredSections.length ? (
          <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 text-center text-sm text-white/72">
            לא נמצאו תוצאות עבור "{query}".
          </div>
        ) : null}
      </div>
    </AmsDrawer>
  );
}

function CommandTile({
  item,
  active,
  onNavigate,
}: {
  item: AmsCommandDrawerItem;
  active: boolean;
  onNavigate?: (href: string) => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={() => onNavigate?.(item.href)}
      className={cn(
        'rounded-[22px] border p-3 text-start transition-[transform,box-shadow,border-color,background-color] duration-200 active:scale-[0.99]',
        active
          ? 'border-primary/20 bg-primary/12 text-inverse-text shadow-[0_18px_40px_rgba(0,0,0,0.18)]'
          : 'border-white/10 bg-white/6 text-white/84 hover:bg-white/8',
      )}
    >
      <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-2xl', active ? 'bg-white/10 text-primary' : 'bg-white/8 text-white/64')}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{item.title}</div>
          {item.hint ? <div className="mt-1 text-[11px] leading-5 text-white/58">{item.hint}</div> : null}
        </div>
        {item.badge ? (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/78">{item.badge}</span>
        ) : null}
      </div>
    </Link>
  );
}

function CommandLink({
  item,
  active,
  onNavigate,
}: {
  item: AmsCommandDrawerItem;
  active: boolean;
  onNavigate?: (href: string) => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={() => onNavigate?.(item.href)}
      className={cn(
        'flex min-h-[52px] items-center gap-3 rounded-[22px] border px-3.5 py-3 text-sm transition-[transform,box-shadow,border-color,background-color] duration-200 active:scale-[0.99]',
        active
          ? 'border-primary/18 bg-primary/12 text-inverse-text shadow-[0_16px_34px_rgba(0,0,0,0.18)]'
          : 'border-white/10 bg-white/6 text-white/84 hover:bg-white/8',
      )}
    >
      <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', active ? 'bg-white/10 text-primary' : 'bg-white/8 text-white/62')}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{item.title}</span>
        {item.hint ? <span className="mt-0.5 block truncate text-[11px] font-normal text-white/56">{item.hint}</span> : null}
      </span>
      {item.badge ? (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/78">{item.badge}</span>
      ) : item.meta ? (
        <span className="text-[10px] font-medium text-white/48">{item.meta}</span>
      ) : (
        <ArrowUpRight className="icon-directional h-4 w-4 text-white/34" strokeWidth={1.75} />
      )}
    </Link>
  );
}
