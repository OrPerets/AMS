"use client";

import * as React from 'react';
import { Accordion, AccordionItem } from '@heroui/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export type AmsDisclosureItem = {
  key: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  startContent?: React.ReactNode;
  content: React.ReactNode;
};

type AmsDisclosureProps = {
  items: AmsDisclosureItem[];
  className?: string;
  defaultExpandedKeys?: string[];
  selectionMode?: 'single' | 'multiple';
  variant?: 'elevated' | 'dark';
};

export function AmsDisclosure({
  items,
  className,
  defaultExpandedKeys = [],
  selectionMode = 'multiple',
  variant = 'elevated',
}: AmsDisclosureProps) {
  const sharedItemClasses =
    variant === 'dark'
      ? {
          base: 'mb-2 overflow-hidden rounded-[24px] border border-white/10 bg-white/6 text-inverse-text shadow-[0_16px_42px_rgba(0,0,0,0.18)]',
          trigger: 'px-4 py-4',
          title: 'text-[15px] font-semibold text-inverse-text',
          subtitle: 'mt-1 text-[12px] leading-5 text-white/68',
          content: 'px-4 pb-4 pt-0 text-sm leading-6 text-white/76',
          indicator: 'text-primary',
        }
      : {
          base: 'mb-2 overflow-hidden rounded-[24px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] shadow-[0_18px_40px_rgba(44,28,9,0.08)]',
          trigger: 'px-4 py-4',
          title: 'text-[15px] font-semibold text-foreground',
          subtitle: 'mt-1 text-[12px] leading-5 text-secondary-foreground',
          content: 'px-4 pb-4 pt-0 text-sm leading-6 text-secondary-foreground',
          indicator: 'text-primary',
        };

  return (
    <Accordion
      selectionMode={selectionMode}
      defaultExpandedKeys={defaultExpandedKeys}
      showDivider={false}
      keepContentMounted
      className={cn('w-full', className)}
      itemClasses={sharedItemClasses}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.key}
          aria-label={typeof item.title === 'string' ? item.title : item.key}
          title={item.title}
          subtitle={item.subtitle}
          startContent={item.startContent}
          indicator={({ indicator, isOpen }) => (
            <span className={cn('inline-flex transition-transform duration-200', isOpen && 'rotate-180')}>
              {indicator ?? <ChevronDown className="h-4 w-4" strokeWidth={1.75} />}
            </span>
          )}
        >
          {item.content}
        </AccordionItem>
      ))}
    </Accordion>
  );
}
