"use client";

import * as React from 'react';
import { Tab, Tabs } from '@heroui/react';
import { cn } from '../../lib/utils';

export type AmsTabItem = {
  key: string;
  title: React.ReactNode;
  content?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
};

type AmsTabsProps = {
  items: AmsTabItem[];
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  ariaLabel: string;
  className?: string;
  panelClassName?: string;
  listClassName?: string;
  destroyInactiveTabPanel?: boolean;
};

export function AmsTabs({
  items,
  selectedKey,
  onSelectionChange,
  ariaLabel,
  className,
  panelClassName,
  listClassName,
  destroyInactiveTabPanel = false,
}: AmsTabsProps) {
  return (
    <Tabs
      aria-label={ariaLabel}
      selectedKey={selectedKey}
      onSelectionChange={(key) => onSelectionChange(String(key))}
      destroyInactiveTabPanel={destroyInactiveTabPanel}
      className={className}
      classNames={{
        base: 'w-full',
        tabList: cn(
          'mobile-segmented-shell grid w-full grid-cols-2 rounded-[24px] p-1.5',
          listClassName,
        ),
        cursor:
          'gold-active-pill gold-current-pulse rounded-[18px]',
        tab: 'min-h-[48px] px-3 transition-transform data-[pressed=true]:scale-[0.98]',
        tabContent: 'flex items-center gap-2 text-[14px] font-semibold text-muted-foreground transition-colors group-data-[selected=true]:text-foreground',
        panel: cn('pt-4', panelClassName),
      }}
      variant="light"
    >
      {items.map((item) => (
        <Tab
          key={item.key}
          title={
            <span className="flex items-center gap-2">
              {item.icon}
              <span>{item.title}</span>
              {item.badge ? <span className="text-[11px] text-primary">{item.badge}</span> : null}
            </span>
          }
        >
          {item.content ?? null}
        </Tab>
      ))}
    </Tabs>
  );
}
