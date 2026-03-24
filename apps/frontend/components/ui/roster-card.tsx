"use client";

import Link from 'next/link';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { AvatarStack, type AvatarStackItem } from './avatar-stack';
import { Button } from './button';
import { Card, CardContent } from './card';
import { MobileRowActionsSheet, type MobileRowActionItem } from './mobile-row-actions-sheet';
import { cn } from '../../lib/utils';

export type RosterCardDetail = {
  label: string;
  value: string;
};

export function RosterCard({
  title,
  subtitle,
  badges,
  avatarItems,
  details,
  note,
  primaryAction,
  secondaryActions = [],
  className,
}: {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  avatarItems: AvatarStackItem[];
  details: RosterCardDetail[];
  note?: React.ReactNode;
  primaryAction: {
    label: string;
    href: string;
    icon?: LucideIcon;
  };
  secondaryActions?: MobileRowActionItem[];
  className?: string;
}) {
  const PrimaryActionIcon = primaryAction.icon ?? ArrowUpRight;

  return (
    <Card variant="action" className={cn('overflow-hidden rounded-[28px]', className)}>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <AvatarStack items={avatarItems} />
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-foreground">{title}</div>
                {subtitle ? <div className="truncate text-[13px] leading-5 text-secondary-foreground">{subtitle}</div> : null}
              </div>
            </div>
            {badges ? <div className="mt-3 flex flex-wrap gap-2">{badges}</div> : null}
          </div>

          {secondaryActions.length ? (
            <MobileRowActionsSheet
              title={title}
              description={subtitle}
              actions={secondaryActions}
            />
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {details.map((detail) => (
            <div key={detail.label} className="rounded-[20px] border border-subtle-border/80 bg-background/78 p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary-foreground">{detail.label}</div>
              <div className="mt-2 text-sm font-semibold leading-6 text-foreground">{detail.value}</div>
            </div>
          ))}
        </div>

        {note ? (
          <div className="rounded-[22px] border border-warning/20 bg-warning/8 p-4 text-sm leading-6 text-foreground">
            {note}
          </div>
        ) : null}

        <Button asChild className="w-full justify-between">
          <Link href={primaryAction.href}>
            <span>{primaryAction.label}</span>
            <PrimaryActionIcon className="h-4 w-4" strokeWidth={1.8} />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
