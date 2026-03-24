"use client";

import * as React from 'react';
import { cn } from '../../lib/utils';

type SegmentedOption = {
  value: string;
  label: string;
  description?: string;
};

type AmsSegmentedChoiceProps = {
  value: string;
  options: ReadonlyArray<SegmentedOption>;
  onChange: (value: string) => void;
  columns?: 1 | 2;
  className?: string;
};

export function AmsSegmentedChoice({
  value,
  options,
  onChange,
  columns = 2,
  className,
}: AmsSegmentedChoiceProps) {
  return (
    <div className={cn(`grid gap-2 ${columns === 1 ? 'grid-cols-1' : 'grid-cols-1 min-[390px]:grid-cols-2'}`, className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              'touch-target rounded-[20px] border px-4 py-3 text-start transition-[transform,box-shadow,border-color,background] duration-200 active:scale-[0.99]',
              selected
                ? 'border-primary/28 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,243,214,0.94)_100%)] text-foreground shadow-[0_14px_32px_rgba(44,28,9,0.12)]'
                : 'border-subtle-border bg-background text-foreground/80 hover:border-primary/20 hover:bg-muted/30',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={cn('text-sm font-semibold', selected ? 'text-primary' : 'text-foreground')}>{option.label}</span>
              {selected ? <span className="rounded-full border border-primary/16 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">נבחר</span> : null}
            </div>
            {option.description ? <div className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</div> : null}
          </button>
        );
      })}
    </div>
  );
}
