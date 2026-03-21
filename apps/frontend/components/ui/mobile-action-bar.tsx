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
      <div className="safe-pb safe-px flex justify-center pt-2">
        <div className="pointer-events-auto thumb-zone w-full max-w-md">
          <div className="rounded-2xl border border-subtle-border/80 bg-card/97 p-1.5 shadow-elevation-3 backdrop-blur-xl">
            {!open ? (
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-between rounded-xl px-3 py-2.5 text-right hover:bg-muted/60 active:bg-muted/80"
                onClick={() => setOpen(true)}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-foreground">פעולות מהירות</span>
                    <span className="mt-0.5 block truncate text-[11px] leading-4 text-muted-foreground">{title}</span>
                  </span>
                </span>
                <span className="rounded-full border border-subtle-border bg-background px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                  פתח
                </span>
              </Button>
            ) : (
              <div className="rounded-xl bg-background/75 p-2">
                <div className="mb-2.5 flex items-start justify-between gap-2 px-1.5 pt-0.5">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-foreground">{title}</div>
                    {description ? <div className="mt-0.5 text-[11px] leading-4 text-muted-foreground line-clamp-2">{description}</div> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {aside ? <div>{aside}</div> : null}
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="סגור פעולות מהירות">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="px-1.5 pb-1.5">{children}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
