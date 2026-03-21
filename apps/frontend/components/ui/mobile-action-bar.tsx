import * as React from 'react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

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
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn('mobile-bottom-bar lg:hidden', className)}>
      <div className="safe-pb safe-px flex justify-center pt-3">
        <div className="pointer-events-auto thumb-zone w-full max-w-md">
          <div className="rounded-[26px] border border-subtle-border/90 bg-card/96 p-2 shadow-card backdrop-blur-xl">
            {!open ? (
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-between rounded-[20px] px-4 py-3 text-right hover:bg-muted/60"
                onClick={() => setOpen(true)}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
                    <Sparkles className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">לחץ כאן לפעולות מהירות</span>
                    <span className="mt-0.5 block truncate text-xs leading-5 text-muted-foreground">{title}</span>
                  </span>
                </span>
                <span className="rounded-full border border-subtle-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
                  פתיחה
                </span>
              </Button>
            ) : (
              <div className="rounded-[22px] bg-background/72 p-2">
                <div className="mb-3 flex items-start justify-between gap-3 px-2 pt-1">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{title}</div>
                    {description ? <div className="mt-1 text-xs leading-5 text-muted-foreground">{description}</div> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {aside ? <div>{aside}</div> : null}
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="סגור פעולות מהירות">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="px-2 pb-2">{children}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
