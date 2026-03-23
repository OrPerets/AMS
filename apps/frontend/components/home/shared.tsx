import Link from 'next/link';
import { ArrowUpRight, Bell, Building2, CalendarClock, CreditCard, FileText, Home, ShieldCheck, Ticket, Wrench, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { CompactStatusStrip } from '../ui/compact-status-strip';
import { MobileActionHub } from '../ui/mobile-action-hub';
import { MobilePriorityInbox, type MobilePriorityInboxItem } from '../ui/mobile-priority-inbox';
import { PrimaryActionCard } from '../ui/primary-action-card';
import { cn } from '../../lib/utils';

export type RoleKey = 'ADMIN' | 'PM' | 'TECH' | 'RESIDENT' | 'ACCOUNTANT' | 'MASTER';

export type HomeStatusMetric = {
  id: string;
  label: string;
  value: string | number;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  href?: string;
};

export type HomePrimaryAction = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  secondaryAction?: {
    label: string;
    href: string;
  };
};

export type HomeQuickAction = {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  href: string;
  icon: LucideIcon;
  tone?: 'default' | 'warning' | 'danger' | 'success';
};

export type HomeBlueprintShellProps = {
  roleLabel: string;
  roleKey: RoleKey;
  statusMetrics: HomeStatusMetric[];
  primaryAction: HomePrimaryAction;
  quickActions: HomeQuickAction[];
  inboxTitle: string;
  inboxSubtitle: string;
  inboxItems: MobilePriorityInboxItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  prioritizeInbox?: boolean;
};

export function RoleHomeShell({
  roleLabel,
  roleKey,
  statusMetrics,
  primaryAction,
  quickActions,
  inboxTitle,
  inboxSubtitle,
  inboxItems,
  emptyTitle,
  emptyDescription,
  prioritizeInbox = false,
}: HomeBlueprintShellProps) {
  const icon = getRoleStatusIcon(roleKey);
  const tone = roleKey === 'ADMIN' ? 'admin' : roleKey === 'PM' ? 'pm' : roleKey === 'RESIDENT' ? 'resident' : 'default';
  const shellMode = roleKey === 'ADMIN' ? 'admin' : roleKey === 'PM' ? 'pm' : 'default';
  const inbox = (
    <MobilePriorityInbox
      title={inboxTitle}
      subtitle={inboxSubtitle}
      items={inboxItems}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emphasizeFirst={roleKey !== 'ACCOUNTANT'}
    />
  );
  const quickActionsGrid = <HomeQuickActionsGrid items={quickActions} roleKey={roleKey} />;

  return (
    <div className="space-y-2.5">
      <CompactStatusStrip
        roleLabel={roleLabel}
        icon={icon}
        tone={tone}
        metrics={statusMetrics.map((metric) => ({
          ...metric,
          onClick: metric.href
            ? () => {
                window.location.href = metric.href!;
              }
            : undefined,
        }))}
      />

      {(roleKey === 'ADMIN' || roleKey === 'PM') && statusMetrics.length ? (
        <RoleCommandBand roleKey={roleKey} metrics={statusMetrics} />
      ) : null}

      <PrimaryActionCard
        eyebrow={primaryAction.eyebrow}
        title={primaryAction.title}
        description={primaryAction.description}
        ctaLabel={primaryAction.ctaLabel}
        href={primaryAction.href}
        tone={primaryAction.tone}
        visualStyle={tone}
        mobileHomeEffect
        secondaryAction={
          primaryAction.secondaryAction ? (
            <Link
              href={primaryAction.secondaryAction.href}
              className={cn(
                'inline-flex min-h-[40px] items-center rounded-xl border px-3 py-2 text-xs font-semibold',
                shellMode === 'admin'
                  ? 'border-white/10 text-inverse-text'
                  : 'border-subtle-border text-foreground',
              )}
            >
              {primaryAction.secondaryAction.label}
            </Link>
          ) : null
        }
      />

      {prioritizeInbox ? inbox : quickActionsGrid}
      {prioritizeInbox ? quickActionsGrid : inbox}
    </div>
  );
}

function RoleCommandBand({
  roleKey,
  metrics,
}: {
  roleKey: RoleKey;
  metrics: HomeStatusMetric[];
}) {
  const primaryMetric = metrics[0];
  const secondaryMetric = metrics[1];

  if (!primaryMetric) return null;

  const shellTone = roleKey === 'ADMIN'
    ? 'border-primary/16 bg-[linear-gradient(180deg,rgba(42,31,18,0.98)_0%,rgba(24,18,12,0.98)_100%)] text-inverse-text'
    : 'border-[hsl(var(--subtle-border))] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,243,234,0.94)_100%)] text-foreground';

  const chipTone = roleKey === 'ADMIN'
    ? 'border-white/8 bg-white/6 text-white/74'
    : 'border-subtle-border/80 bg-background/75 text-secondary-foreground';

  return (
    <div className={cn('rounded-2xl border p-3 shadow-[0_16px_34px_rgba(44,28,9,0.08)] sm:rounded-[24px]', shellTone)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn('text-[10px] font-semibold uppercase tracking-[0.18em]', roleKey === 'ADMIN' ? 'text-white/56' : 'text-secondary-foreground')}>
            {roleKey === 'ADMIN' ? 'Control Zone' : 'Dispatch Lane'}
          </div>
          <div className={cn('mt-1 text-[15px] font-semibold leading-5', roleKey === 'ADMIN' ? 'text-inverse-text' : 'text-foreground')}>
            {primaryMetric.label}
          </div>
          <div className={cn('mt-1 text-[28px] font-black leading-none tabular-nums', roleKey === 'ADMIN' ? 'text-primary' : 'text-foreground')}>
            <bdi>{primaryMetric.value}</bdi>
          </div>
        </div>

        {secondaryMetric ? (
          <div className={cn('rounded-2xl border px-3 py-2 text-start', chipTone)}>
            <div className="text-[10px] font-semibold">{secondaryMetric.label}</div>
            <div className={cn('mt-1 text-[16px] font-black tabular-nums', roleKey === 'ADMIN' ? 'text-inverse-text' : 'text-foreground')}>
              <bdi>{secondaryMetric.value}</bdi>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function HomeQuickActionsGrid({ items, roleKey = 'RESIDENT' }: { items: HomeQuickAction[]; roleKey?: RoleKey }) {
  if (roleKey === 'PM' || roleKey === 'ADMIN') {
    return (
      <MobileActionHub
        title={roleKey === 'ADMIN' ? 'פעולות בקרה' : 'פעולות ניהול'}
        subtitle={roleKey === 'ADMIN' ? 'סיכון, בקרה ויומן בלי לרדת למסכים משניים.' : 'תיעדוף קריאות, בניינים ויומן התפעול בתצוגה אחת.'}
        layout="hierarchy"
        items={items.slice(0, 4).map((item, index) => ({
          id: item.id,
          label: item.title,
          description: `${item.subtitle} · ${item.value}`,
          href: item.href,
          icon: item.icon,
          accent:
            item.tone === 'danger'
              ? 'warning'
              : item.tone === 'warning'
                ? 'warning'
                : item.tone === 'success'
                  ? 'success'
                  : index === 0
                    ? 'primary'
                    : 'neutral',
          badge: typeof item.value === 'number' && item.value > 0 ? item.value : undefined,
          emphasize: index === 0,
          priority: index === 0 ? 'primary' : index < 3 ? 'secondary' : 'utility',
        }))}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.slice(0, 4).map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.id} href={item.href} className="block">
            <Card
              variant="elevated"
              className={cn(
                'h-full min-h-[88px] rounded-2xl border transition duration-200 hover:-translate-y-0.5 hover:shadow-card',
                'bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(248,244,236,0.92)_100%)]',
                item.tone === 'warning' && 'border-warning/30 bg-warning/5',
                item.tone === 'danger' && 'border-destructive/30 bg-destructive/5',
                item.tone === 'success' && 'border-success/30 bg-success/5',
              )}
            >
              <CardContent className="flex h-full flex-col justify-between p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] font-semibold leading-5 text-foreground">{item.title}</div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                </div>
                <div>
                  <div className="text-xl font-extrabold leading-none tabular-nums text-foreground">
                    <bdi>{item.value}</bdi>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] leading-4 text-secondary-foreground">
                    <span>{item.subtitle}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      פתח
                      <ArrowUpRight className="icon-directional h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export function getRoleStatusIcon(role: RoleKey) {
  switch (role) {
    case 'ADMIN':
      return <Building2 className="h-4 w-4" strokeWidth={1.75} />;
    case 'PM':
      return <Building2 className="h-4 w-4" strokeWidth={1.75} />;
    case 'TECH':
      return <Wrench className="h-4 w-4" strokeWidth={1.75} />;
    case 'RESIDENT':
      return <Home className="h-4 w-4" strokeWidth={1.75} />;
    case 'ACCOUNTANT':
      return <CreditCard className="h-4 w-4" strokeWidth={1.75} />;
    default:
      return <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />;
  }
}

export const homeIcons = {
  ticket: Ticket,
  dashboard: Building2,
  calendar: CalendarClock,
  maintenance: Wrench,
  payments: CreditCard,
  reports: FileText,
  notifications: Bell,
  supervision: ShieldCheck,
};
