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
  priorityItems?: AmsCommandDrawerItem[];
  recentItems?: AmsCommandDrawerItem[];
  unreadCount?: number;
  sections: AmsCommandDrawerSection[];
  isActive?: (href: string) => boolean;
  onNavigate?: (href: string) => void;
  tone?: 'dark' | 'light';
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
  priorityItems = [],
  recentItems = [],
  unreadCount = 0,
  sections,
  isActive,
  onNavigate,
  tone = 'light',
}: AmsCommandDrawerProps) {
  const lightTone = true;
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
      tone={tone}
    >
      <div className="space-y-4 py-2">
        <AmsQueryField
          value={query}
          onChange={onQueryChange}
          placeholder={queryPlaceholder}
          ariaLabel="חיפוש מהיר"
          inputClassName="border-subtle-border bg-background text-foreground placeholder:text-muted-foreground"
          className="[&_input]:text-foreground [&_svg]:text-muted-foreground"
          autoFocus
        />

        {topActions.length ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">מומלץ עכשיו</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
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
                  lightTone={lightTone}
                />
              ))}
            </div>
          </div>
        ) : null}

        {priorityItems.length && !normalizedQuery ? (
          <div className="space-y-2">
            <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">דורש פעולה</h3>
            <div className="space-y-1.5">
              {priorityItems.map((item) => (
                <CommandLink
                  key={item.id}
                  item={item}
                  active={Boolean(isActive?.(item.href))}
                  onNavigate={onNavigate}
                  lightTone={lightTone}
                />
              ))}
            </div>
          </div>
        ) : null}

        {unreadCount > 0 ? (
          <div className="gold-sheen-surface rounded-[24px] p-3 text-inverse" data-accent-sheen="true">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/68 text-primary">
                <Bell className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">מרכז עדכונים</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
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
            <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">אחרונים</h3>
            <div className="space-y-1.5">
              {recentItems.map((item) => (
                <CommandLink
                  key={item.id}
                  item={item}
                  active={Boolean(isActive?.(item.href))}
                  onNavigate={onNavigate}
                  lightTone={lightTone}
                />
              ))}
            </div>
          </div>
        ) : null}

        {filteredSections.map((section) => (
          <div key={section.id} className="space-y-2">
            <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">{section.title}</h3>
            <div className="gold-divider-line h-px w-full" />
            <div className="space-y-1.5">
              {section.items.map((item) => (
                <CommandLink
                  key={item.id}
                  item={item}
                  active={Boolean(isActive?.(item.href))}
                  onNavigate={onNavigate}
                  lightTone={lightTone}
                />
              ))}
            </div>
          </div>
        ))}

        {!filteredSections.length ? (
          <div className="rounded-[24px] border border-subtle-border bg-background p-4 text-center text-sm text-muted-foreground">
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
  lightTone,
}: {
  item: AmsCommandDrawerItem;
  active: boolean;
  onNavigate?: (href: string) => void;
  lightTone: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={() => onNavigate?.(item.href)}
      className={cn(
        'rounded-[22px] border p-3 text-start transition-[transform,box-shadow,border-color,background-color] duration-200 active:scale-[0.99]',
        active
          ? 'gold-sheen-surface text-inverse'
          : 'border-subtle-border bg-background text-foreground hover:bg-muted/60',
      )}
      data-accent-sheen={active ? 'true' : undefined}
    >
      <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-2xl', active ? 'bg-white/62 text-primary' : 'bg-primary/8 text-primary')}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{item.title}</div>
          {item.hint ? <div className={cn('mt-1 text-[11px] leading-5', active ? 'text-muted-foreground' : 'text-secondary-foreground')}>{item.hint}</div> : null}
        </div>
        {item.badge ? (
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', active ? 'bg-white/70 text-primary' : 'bg-primary/10 text-primary')}>{item.badge}</span>
        ) : null}
      </div>
    </Link>
  );
}

function CommandLink({
  item,
  active,
  onNavigate,
  lightTone,
}: {
  item: AmsCommandDrawerItem;
  active: boolean;
  onNavigate?: (href: string) => void;
  lightTone: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={() => onNavigate?.(item.href)}
      className={cn(
        'flex min-h-[52px] items-center gap-3 rounded-[22px] border px-3.5 py-3 text-sm transition-[transform,box-shadow,border-color,background-color] duration-200 active:scale-[0.99]',
        active
          ? 'gold-sheen-surface text-inverse'
          : 'border-subtle-border bg-background text-foreground hover:bg-muted/60',
      )}
      data-accent-sheen={active ? 'true' : undefined}
    >
      <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', active ? 'bg-white/62 text-primary' : 'bg-primary/8 text-primary')}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{item.title}</span>
        {item.hint ? <span className={cn('mt-0.5 block truncate text-[11px] font-normal', active ? 'text-muted-foreground' : 'text-secondary-foreground')}>{item.hint}</span> : null}
      </span>
      {item.badge ? (
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', active ? 'bg-white/70 text-primary' : 'bg-primary/10 text-primary')}>{item.badge}</span>
      ) : item.meta ? (
        <span className="text-[10px] font-medium text-muted-foreground">{item.meta}</span>
      ) : (
        <ArrowUpRight className={cn('icon-directional h-4 w-4', active ? 'text-primary/72' : 'text-primary/60')} strokeWidth={1.75} />
      )}
    </Link>
  );
}
