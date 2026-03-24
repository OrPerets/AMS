"use client";

import * as React from 'react';
import { useRouter } from 'next/router';
import { ArrowUpRight, BellRing, Download, ExternalLink, FileCheck2, MoreVertical, Trash2, type LucideIcon } from 'lucide-react';
import { AmsDrawer } from './ams-drawer';
import { Button } from './button';
import { cn } from '../../lib/utils';

export type MobileRowActionItem = {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  href?: string;
  external?: boolean;
  tone?: 'default' | 'primary' | 'warning' | 'danger';
  disabled?: boolean;
  onSelect?: () => void | Promise<void>;
};

function resolveActionIcon(action: MobileRowActionItem) {
  if (action.icon) return action.icon;
  if (action.tone === 'danger') return Trash2;
  if (action.external) return ExternalLink;
  if (action.id.includes('report')) return Download;
  if (action.id.includes('reminder')) return BellRing;
  return FileCheck2;
}

export function MobileRowActionsSheet({
  title,
  description,
  actions,
  triggerLabel = 'פעולות נוספות',
  className,
}: {
  title: string;
  description?: string;
  actions: MobileRowActionItem[];
  triggerLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const primaryActions = actions.filter((action) => action.tone !== 'danger');
  const destructiveActions = actions.filter((action) => action.tone === 'danger');

  async function handleAction(action: MobileRowActionItem) {
    if (action.disabled) return;

    setOpen(false);

    if (action.onSelect) {
      await action.onSelect();
      return;
    }

    if (!action.href) return;

    if (action.external) {
      window.open(action.href, '_blank', 'noopener,noreferrer');
      return;
    }

    await router.push(action.href);
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          'touch-target inline-flex h-11 w-11 items-center justify-center rounded-full border border-subtle-border bg-background/92 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:border-primary/22 hover:text-primary',
          className,
        )}
        aria-label={triggerLabel}
        onClick={() => setOpen(true)}
      >
        <MoreVertical className="h-4 w-4" strokeWidth={1.85} />
      </button>

      <AmsDrawer
        isOpen={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        placement="bottom"
        size="lg"
      >
        <div className="space-y-3 pb-2">
          {primaryActions.map((action) => {
            const Icon = resolveActionIcon(action);
            return (
              <button
                key={action.id}
                type="button"
                className={cn(
                  'flex min-h-[64px] w-full items-center gap-3 rounded-[24px] border border-white/10 bg-white/6 px-4 py-3 text-start transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40',
                  action.tone === 'warning' && 'border-warning/20 bg-warning/10',
                  action.tone === 'primary' && 'gold-sheen-surface',
                )}
                data-accent-sheen={action.tone === 'primary' ? 'true' : undefined}
                onClick={() => void handleAction(action)}
                disabled={action.disabled}
              >
                <span
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
                    action.tone === 'warning'
                      ? 'border-warning/22 bg-warning/18 text-warning'
                      : 'border-primary/16 bg-primary/16 text-primary',
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.85} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">{action.label}</span>
                  {action.description ? <span className="mt-1 block text-xs leading-5 text-white/68">{action.description}</span> : null}
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/46" strokeWidth={1.75} />
              </button>
            );
          })}

          {destructiveActions.length ? (
            <div className="border-t border-white/10 pt-3">
              {destructiveActions.map((action) => {
                const Icon = resolveActionIcon(action);
                return (
                  <Button
                    key={action.id}
                    type="button"
                    variant="destructive"
                    className="w-full justify-between rounded-[22px]"
                    onClick={() => void handleAction(action)}
                    disabled={action.disabled}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" strokeWidth={1.8} />
                      {action.label}
                    </span>
                    <ExternalLink className="h-4 w-4 opacity-70" strokeWidth={1.7} />
                  </Button>
                );
              })}
            </div>
          ) : null}
        </div>
      </AmsDrawer>
    </>
  );
}
