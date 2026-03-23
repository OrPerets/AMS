import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, CircleAlert, Clock3, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { StatusBadge } from './status-badge';
import { Button } from './button';
import { cn } from '../../lib/utils';
import { useLocale } from '../../lib/providers';

type InboxTone = 'neutral' | 'active' | 'success' | 'warning' | 'danger';

export type MobilePriorityInboxItem = {
  id: string;
  status: string;
  tone: InboxTone;
  title: string;
  reason: string;
  meta?: string;
  href?: string;
  ctaLabel?: string;
};

export function MobilePriorityInbox({
  title,
  subtitle,
  items,
  emptyTitle,
  emptyDescription,
  className,
}: {
  title?: string;
  subtitle?: string;
  items: MobilePriorityInboxItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  const { t } = useLocale();
  const resolvedTitle = title ?? t('mobilePriority.title');
  const resolvedEmptyTitle = emptyTitle ?? t('mobilePriority.emptyTitle');
  const resolvedEmptyDescription = emptyDescription ?? t('mobilePriority.emptyDescription');

  return (
    <Card variant="elevated" className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" strokeWidth={1.75} />
              {resolvedTitle}
            </CardTitle>
            {subtitle ? <p className="mt-1 text-[13px] leading-5 text-secondary-foreground">{subtitle}</p> : null}
          </div>
          <div className="rounded-full border border-subtle-border bg-muted/35 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            {t('common.itemsCount', { count: items.length })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5" role="list">
        {items.length ? (
          items.slice(0, 3).map((item) => (
            <div key={item.id} className="rounded-2xl border border-subtle-border bg-background/88 p-3" role="listitem" aria-label={`${item.status} ${item.title}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={item.status} tone={item.tone} />
                    {item.meta ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-secondary-foreground">
                        <Clock3 className="h-3 w-3" strokeWidth={1.75} />
                        {item.meta}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-foreground">{item.title}</div>
                  <div className="text-[13px] leading-5 text-secondary-foreground">{item.reason}</div>
                </div>
                <CircleAlert className={cn('mt-0.5 h-4 w-4 shrink-0', item.tone === 'danger' ? 'text-destructive' : item.tone === 'warning' ? 'text-warning' : 'text-primary')} strokeWidth={1.75} />
              </div>
              {item.href && item.ctaLabel ? (
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline" className="w-full justify-between">
                    <Link href={item.href}>
                      {item.ctaLabel}
                      <ArrowUpRight className="icon-directional h-4 w-4" strokeWidth={1.75} />
                    </Link>
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-[20px] border border-dashed border-subtle-border bg-muted/18 p-4">
            <div className="text-sm font-semibold text-foreground">{resolvedEmptyTitle}</div>
            <div className="mt-1 text-[13px] leading-5 text-muted-foreground">{resolvedEmptyDescription}</div>
          </div>
        )}
        {items.length > 3 ? (
          <div className="flex justify-end">
            <Link href={items[0]?.href || '/notifications'} className="text-[12px] font-semibold text-primary">
              צפה בכל הפריטים
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
