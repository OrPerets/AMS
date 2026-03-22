import * as React from 'react';
import { Clock3, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge } from './badge';
import { cn } from '../../lib/utils';
import { useLocale } from '../../lib/providers';

type MobileContextBarProps = {
  roleLabel: string;
  contextLabel?: string;
  syncLabel?: string;
  lastUpdated?: string;
  chips?: string[];
  className?: string;
};

export function MobileContextBar({
  roleLabel,
  contextLabel,
  syncLabel,
  lastUpdated,
  chips = [],
  className,
}: MobileContextBarProps) {
  const { t } = useLocale();
  const resolvedSyncLabel = syncLabel ?? t('mobileContext.syncLive');

  return (
    <section
      className={cn(
        'mobile-context-bar rounded-[22px] border border-subtle-border bg-background/92 p-3 shadow-elevation-1 backdrop-blur-sm',
        className,
      )}
      aria-label={t('mobileContext.ariaLabel')}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="finance" className="gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          {roleLabel}
        </Badge>
        {contextLabel ? <Badge variant="outline">{contextLabel}</Badge> : null}
        <Badge variant="outline" className="gap-1.5 text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
          {resolvedSyncLabel}
        </Badge>
      </div>

      {chips.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Badge key={chip} variant="outline" className="bg-muted/45">
              {chip}
            </Badge>
          ))}
        </div>
      ) : null}

      {lastUpdated ? (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          <span>{t('common.updatedAt', { value: lastUpdated })}</span>
        </div>
      ) : null}
    </section>
  );
}
