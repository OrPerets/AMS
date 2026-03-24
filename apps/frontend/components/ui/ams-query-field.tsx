"use client";

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { cn } from '../../lib/utils';

type AmsQueryFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
};

export function AmsQueryField({
  value,
  onChange,
  placeholder = 'חיפוש',
  ariaLabel,
  className,
  inputClassName,
  autoFocus = false,
}: AmsQueryFieldProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoFocus={autoFocus}
        inputSize="lg"
        startIcon={<Search className="h-4 w-4" strokeWidth={1.75} />}
        className={cn(
          'border-subtle-border/80 bg-background/92 shadow-[0_12px_32px_rgba(44,28,9,0.08)]',
          inputClassName,
        )}
      />
      {value ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => onChange('')}
          aria-label="נקה חיפוש"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      ) : null}
    </div>
  );
}
