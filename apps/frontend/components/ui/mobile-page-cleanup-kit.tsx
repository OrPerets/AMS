import * as React from 'react';
import { AlertCircle, CalendarClock, Loader2, UserRound } from 'lucide-react';
import { Badge } from './badge';
import { Card, CardContent } from './card';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';
import { cn } from '../../lib/utils';

export function CompactContextHeader({
  title,
  description,
  context,
  chips = [],
  actions,
  className,
}: {
  title: string;
  description: string;
  context?: string;
  chips?: string[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card variant="featured" className={cn('overflow-hidden rounded-[22px]', className)}>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {context ? <Badge variant="finance">{context}</Badge> : null}
              {chips.map((chip) => (
                <Badge key={chip} variant="outline">
                  {chip}
                </Badge>
              ))}
            </div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-secondary-foreground">{description}</p>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function FilterActionBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[22px] border border-subtle-border bg-background/88 p-3 shadow-elevation-1',
        'grid gap-3 sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ListItemMetaRow({
  status,
  urgency,
  owner,
  dueLabel,
}: {
  status: string;
  urgency: string;
  owner: string;
  dueLabel: string;
}) {
  return (
    <div className="grid gap-2 rounded-[14px] border border-subtle-border/70 bg-muted/24 px-3 py-2 text-xs sm:grid-cols-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>סטטוס: {status}</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5" />
        <span>דחיפות: {urgency}</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <UserRound className="h-3.5 w-3.5" />
        <span>אחראי: {owner}</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5" />
        <span>{dueLabel}</span>
      </div>
    </div>
  );
}

export function ConsistencyStateBlock({
  state,
  emptyTitle = 'אין נתונים להצגה',
  emptyDescription = 'נסה לשנות מסננים או לרענן.',
  errorTitle = 'טעינת המידע נכשלה',
  errorDescription = 'נסה לרענן בעוד רגע.',
  onRetry,
  children,
}: {
  state: 'loading' | 'error' | 'empty' | 'ready';
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (state === 'loading') {
    return <Skeleton className="h-40 rounded-[24px]" variant="morph" />;
  }

  if (state === 'error') {
    return (
      <EmptyState
        type="error"
        title={errorTitle}
        description={errorDescription}
        action={onRetry ? { label: 'נסה שוב', onClick: onRetry, variant: 'outline' } : undefined}
      />
    );
  }

  if (state === 'empty') {
    return <EmptyState title={emptyTitle} description={emptyDescription} type="empty" />;
  }

  return <>{children}</>;
}
