import Link from 'next/link';
import { ArrowUpRight, Bell, Building2, CalendarClock, CreditCard, FileText, Home, ShieldCheck, Ticket, Wrench, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { CompactStatusStrip } from '../ui/compact-status-strip';
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
  const inbox = (
    <MobilePriorityInbox
      title={inboxTitle}
      subtitle={inboxSubtitle}
      items={inboxItems}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    />
  );
  const quickActionsGrid = <HomeQuickActionsGrid items={quickActions} />;

  return (
    <div className="space-y-2.5">
      <CompactStatusStrip
        roleLabel={roleLabel}
        icon={icon}
        metrics={statusMetrics.map((metric) => ({
          ...metric,
          onClick: metric.href
            ? () => {
                window.location.href = metric.href!;
              }
            : undefined,
        }))}
      />

      <PrimaryActionCard
        eyebrow={primaryAction.eyebrow}
        title={primaryAction.title}
        description={primaryAction.description}
        ctaLabel={primaryAction.ctaLabel}
        href={primaryAction.href}
        tone={primaryAction.tone}
        mobileHomeEffect
        secondaryAction={
          primaryAction.secondaryAction ? (
            <Link
              href={primaryAction.secondaryAction.href}
              className="inline-flex min-h-[40px] items-center rounded-xl border border-subtle-border px-3 py-2 text-xs font-semibold text-foreground"
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

export function HomeQuickActionsGrid({ items }: { items: HomeQuickAction[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.slice(0, 4).map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.id} href={item.href} className="block">
            <Card
              variant="elevated"
              className={cn(
                'h-full min-h-[104px] rounded-[20px] border transition duration-200 hover:-translate-y-0.5 hover:shadow-card',
                item.tone === 'warning' && 'border-warning/30 bg-warning/5',
                item.tone === 'danger' && 'border-destructive/30 bg-destructive/5',
                item.tone === 'success' && 'border-success/30 bg-success/5',
              )}
            >
              <CardContent className="flex h-full flex-col justify-between p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] font-semibold leading-5 text-foreground">{item.title}</div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </span>
                </div>
                <div>
                  <div className="text-[1.35rem] font-black leading-none text-foreground">
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
