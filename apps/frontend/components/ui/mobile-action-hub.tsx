import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;

export type MobileActionHubItem = {
  id: string;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  icon: IconType;
  badge?: string | number;
  accent?: 'primary' | 'success' | 'warning' | 'info' | 'neutral';
};

function toneClasses(accent: MobileActionHubItem['accent']) {
  switch (accent) {
    case 'success':
      return 'border-success/16 bg-success/8 text-success';
    case 'warning':
      return 'border-warning/18 bg-warning/10 text-warning';
    case 'info':
      return 'border-info/18 bg-info/10 text-info';
    case 'neutral':
      return 'border-subtle-border bg-muted/45 text-foreground';
    case 'primary':
    default:
      return 'border-primary/16 bg-primary/10 text-primary';
  }
}

function TileShell({
  children,
  href,
  onClick,
  className,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function MobileActionHub({
  title,
  subtitle,
  items,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  items: MobileActionHubItem[];
  className?: string;
}) {
  return (
    <section className={cn('space-y-3', className)} aria-label={typeof title === 'string' ? title : undefined}>
      {title || subtitle ? (
        <div className="flex items-end justify-between gap-3">
          <div>
            {title ? <h2 className="text-[15px] font-semibold text-foreground">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-[12px] leading-5 text-secondary-foreground">{subtitle}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <TileShell
              key={item.id}
              href={item.href}
              onClick={item.onClick}
              className={cn(
                'group min-h-[88px] rounded-2xl border bg-card/96 p-3 text-start shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/28 hover:shadow-raised active:translate-y-0 touch-target',
                !item.href && !item.onClick && 'pointer-events-none',
              )}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
                      toneClasses(item.accent),
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  {item.badge !== undefined && item.badge !== '' ? (
                    <span className="rounded-full border border-primary/16 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {item.badge}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex-1">
                  <div className="text-sm font-semibold text-foreground">{item.label}</div>
                  {item.description ? (
                    <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-secondary-foreground">{item.description}</div>
                  ) : null}
                </div>

                {(item.href || item.onClick) ? (
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    פתח
                    <ArrowUpRight className="icon-directional h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} />
                  </div>
                ) : null}
              </div>
            </TileShell>
          );
        })}
      </div>
    </section>
  );
}
