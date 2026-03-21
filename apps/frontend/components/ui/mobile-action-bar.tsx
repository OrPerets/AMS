import * as React from 'react';
import { cn } from '../../lib/utils';

type MobileActionBarProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function MobileActionBar({
  title,
  description,
  aside,
  children,
  className,
}: MobileActionBarProps) {
  return (
    <div className={cn('mobile-bottom-bar lg:hidden', className)}>
      <div className="safe-pb safe-px pt-3">
        <div className="thumb-zone rounded-[24px] border border-subtle-border bg-card p-3 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{title}</div>
              {description ? <div className="mt-1 text-xs leading-5 text-muted-foreground">{description}</div> : null}
            </div>
            {aside ? <div className="shrink-0">{aside}</div> : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
