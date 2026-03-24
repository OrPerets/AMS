"use client";

import * as React from 'react';
import { cn } from '../../lib/utils';

export type AmsFilterTabItem = {
  key: string;
  label: React.ReactNode;
  badge?: React.ReactNode;
  description?: React.ReactNode;
};

type AmsFilterTabsProps = {
  items: AmsFilterTabItem[];
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  ariaLabel: string;
  className?: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
};

export function AmsFilterTabs({
  items,
  selectedKey,
  onSelectionChange,
  ariaLabel,
  className,
  size = 'md',
  fullWidth = false,
}: AmsFilterTabsProps) {
  const shellClassName =
    size === 'sm'
      ? 'rounded-[20px] p-1'
      : 'rounded-[24px] p-1.5';
  const itemClassName =
    size === 'sm'
      ? 'min-h-[42px] rounded-[16px] px-3 py-2 text-xs'
      : 'min-h-[48px] rounded-[18px] px-3.5 py-2.5 text-[13px]';

  return (
    <div className={cn('w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          'inline-flex min-w-full items-stretch gap-1 border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,243,234,0.94)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_18px_40px_rgba(44,28,9,0.08)]',
          shellClassName,
          fullWidth && 'grid'
        )}
        style={fullWidth ? { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` } : undefined}
      >
        {items.map((item) => {
          const selected = item.key === selectedKey;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onSelectionChange(item.key)}
              className={cn(
                'touch-target relative inline-flex items-center justify-center gap-2 whitespace-nowrap border transition-[transform,box-shadow,background-color,border-color,color] duration-200 active:scale-[0.985]',
                itemClassName,
                fullWidth && 'w-full',
                selected
                  ? 'border-primary/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,243,214,0.94)_100%)] text-foreground shadow-[0_16px_32px_rgba(44,28,9,0.12)]'
                  : 'border-transparent bg-transparent text-secondary-foreground hover:border-primary/14 hover:bg-background/70',
              )}
            >
              <span className={cn('font-semibold', selected && 'text-primary')}>{item.label}</span>
              {item.badge ? (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
                    selected ? 'bg-primary/12 text-primary' : 'bg-muted/80 text-muted-foreground',
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
