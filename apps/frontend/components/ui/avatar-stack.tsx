"use client";

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { cn } from '../../lib/utils';

export type AvatarStackItem = {
  id: string;
  label: string;
  imageSrc?: string | null;
  fallback?: string;
  tone?: 'primary' | 'info' | 'success' | 'warning' | 'neutral';
};

const toneClasses: Record<NonNullable<AvatarStackItem['tone']>, string> = {
  primary: 'bg-[linear-gradient(135deg,rgba(191,219,254,1)_0%,rgba(129,140,248,1)_100%)] text-slate-950',
  info: 'bg-[linear-gradient(135deg,rgba(186,230,253,1)_0%,rgba(59,130,246,1)_100%)] text-slate-950',
  success: 'bg-[linear-gradient(135deg,rgba(187,247,208,1)_0%,rgba(16,185,129,1)_100%)] text-slate-950',
  warning: 'bg-[linear-gradient(135deg,rgba(253,230,138,1)_0%,rgba(245,158,11,1)_100%)] text-slate-950',
  neutral: 'bg-[linear-gradient(135deg,rgba(226,232,240,1)_0%,rgba(148,163,184,1)_100%)] text-slate-950',
};

function getInitials(label: string, fallback?: string) {
  if (fallback) return fallback.slice(0, 2).toUpperCase();

  const words = label.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'AM';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export function AvatarStack({
  items,
  maxVisible = 3,
  size = 'md',
  className,
  ariaLabel,
}: {
  items: AvatarStackItem[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}) {
  const visibleItems = items.slice(0, maxVisible);
  const overflowCount = Math.max(items.length - visibleItems.length, 0);
  const sizeClassName = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-[13px]';

  if (!items.length) return null;

  return (
    <div
      className={cn('flex items-center -space-x-2 rtl:space-x-reverse', className)}
      role="img"
      aria-label={ariaLabel ?? visibleItems.map((item) => item.label).join(', ')}
    >
      {visibleItems.map((item, index) => (
        <Avatar
          key={item.id}
          className={cn(
            'ring-2 ring-background shadow-[0_10px_22px_rgba(15,23,42,0.12)]',
            sizeClassName,
            index > 0 && 'rtl:translate-x-1',
          )}
        >
          {item.imageSrc ? <AvatarImage src={item.imageSrc} alt={item.label} /> : null}
          <AvatarFallback className={cn('font-semibold', toneClasses[item.tone ?? 'primary'])}>
            {getInitials(item.label, item.fallback)}
          </AvatarFallback>
        </Avatar>
      ))}

      {overflowCount > 0 ? (
        <div
          className={cn(
            'flex items-center justify-center rounded-full border border-subtle-border bg-muted/85 font-semibold text-foreground ring-2 ring-background',
            sizeClassName,
          )}
          aria-label={`+${overflowCount}`}
        >
          +{overflowCount}
        </div>
      ) : null}
    </div>
  );
}
