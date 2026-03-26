import Link from 'next/link';
import { ArrowUpRight, Bell, Building2, CalendarClock, CreditCard, FileText, Home, ShieldCheck, Ticket, Wrench, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { CompactStatusStrip } from '../ui/compact-status-strip';
import { MobileActionHub } from '../ui/mobile-action-hub';
import { MobileMetricStrip } from '../ui/mobile-metric-strip';
import { MobilePriorityInbox, type MobilePriorityInboxItem } from '../ui/mobile-priority-inbox';
import { PrimaryActionCard } from '../ui/primary-action-card';
import { MiniSparkline } from '../ui/mobile-insight-widget';
import { cn } from '../../lib/utils';
import { trackQuickActionClick } from '../../lib/analytics';
import { addRecentAction, getRecentActions } from '../../lib/engagement';
import { getCurrentUserId, getEffectiveRole } from '../../lib/auth';

export type RoleKey = 'ADMIN' | 'PM' | 'TECH' | 'RESIDENT' | 'ACCOUNTANT' | 'MASTER';

export type HomeStatusMetric = {
  id: string;
  label: string;
  value: string | number;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  href?: string;
  progress?: number;
  hint?: string;
  trendLabel?: string;
  sparkline?: number[];
  emphasis?: boolean;
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
  previewValue?: string | number;
  microViz?: number[];
  fullCardTap?: boolean;
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
  emptyAction?: { label: string; href: string };
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
  emptyAction,
  prioritizeInbox = false,
}: HomeBlueprintShellProps) {
  const icon = getRoleStatusIcon(roleKey);
  const tone = roleKey === 'ADMIN' ? 'admin' : roleKey === 'PM' ? 'pm' : roleKey === 'RESIDENT' ? 'resident' : 'default';
  const shellMode = roleKey === 'ADMIN' ? 'admin' : roleKey === 'PM' ? 'pm' : 'default';
  const operatorMode = roleKey === 'ADMIN' || roleKey === 'PM' || roleKey === 'ACCOUNTANT' || roleKey === 'TECH';
  const operationalPulseMetrics = statusMetrics.slice(0, 3);
  const inbox = (
    <MobilePriorityInbox
      title={inboxTitle}
      subtitle={inboxSubtitle}
      items={inboxItems}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
      emphasizeFirst={roleKey !== 'ACCOUNTANT'}
      maxItems={operatorMode ? 2 : 3}
      compact={operatorMode}
    />
  );
  const quickActionsGrid = <HomeQuickActionsGrid items={quickActions} roleKey={roleKey} />;

  return (
    <div className="space-y-2">
      {roleKey !== 'RESIDENT' ? (
        <div className="px-1 text-right">
          <h1 className="text-[18px] font-black tracking-[-0.02em] text-foreground">מרכז העבודה</h1>
          <p className="mt-0.5 text-[12px] text-secondary-foreground">מה דורש טיפול עכשיו ומה המהלך הבא.</p>
        </div>
      ) : null}

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

      {(roleKey === 'ADMIN' || roleKey === 'PM' || roleKey === 'ACCOUNTANT') && statusMetrics.length ? (
        <div className="hidden md:block">
          <MobileMetricStrip roleKey={roleKey} metrics={statusMetrics} quickActions={quickActions} />
        </div>
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
        density={operatorMode ? 'compact' : 'default'}
        className={operatorMode ? 'shadow-[0_16px_34px_rgba(44,28,9,0.10)]' : undefined}
        supportingContent={
          roleKey === 'ADMIN' || roleKey === 'PM' || roleKey === 'ACCOUNTANT' ? (
            <OperationalPulseRow metrics={operationalPulseMetrics} shellMode={shellMode} />
          ) : null
        }
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

function handleQuickActionClick(item: HomeQuickAction, roleKey: RoleKey) {
  trackQuickActionClick(item.id, 'home', roleKey);
  addRecentAction(
    { id: `qa-${item.id}`, label: item.title, href: item.href, screen: 'home', role: roleKey },
    getCurrentUserId(),
  );
}

function sortByRecentUsage(items: HomeQuickAction[], roleKey: RoleKey): HomeQuickAction[] {
  const recent = getRecentActions(getCurrentUserId(), getEffectiveRole());
  if (!recent.length) return items;

  const recentIds = new Set(recent.map((r) => r.id.replace('qa-', '')));
  const hasWarning = items.some((i) => i.tone === 'warning' || i.tone === 'danger');
  if (hasWarning) return items;

  return [...items].sort((a, b) => {
    const aRecent = recentIds.has(a.id) ? 1 : 0;
    const bRecent = recentIds.has(b.id) ? 1 : 0;
    return bRecent - aRecent;
  });
}

export function HomeQuickActionsGrid({ items, roleKey = 'RESIDENT' }: { items: HomeQuickAction[]; roleKey?: RoleKey }) {
  const sorted = sortByRecentUsage(items, roleKey);
  const compactDensity = roleKey === 'PM' || roleKey === 'ADMIN' || roleKey === 'TECH';

  if (roleKey === 'PM' || roleKey === 'ADMIN') {
    return (
      <MobileActionHub
        title={roleKey === 'ADMIN' ? 'פעולות בקרה' : 'פעולות ניהול'}
        subtitle={roleKey === 'ADMIN' ? 'מוקד הפעולה הבא.' : 'המשימות הקרובות במקום אחד.'}
        layout="hierarchy"
        density="compact"
        items={sorted.slice(0, 4).map((item, index) => ({
          id: item.id,
          label: item.title,
          description: item.subtitle,
          href: item.href,
          icon: item.icon,
          previewValue: item.previewValue,
          microViz: item.microViz,
          fullCardTap: item.fullCardTap,
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
          onClick: () => handleQuickActionClick(item, roleKey),
        }))}
      />
    );
  }

  return (
      <div className="grid grid-cols-2 gap-2.5">
      {sorted.slice(0, 4).map((item, index) => {
        const Icon = item.icon;
        const isLeading = index === 0 && (item.tone === 'warning' || item.tone === 'danger');
        return (
          <Link
            key={item.id}
            href={item.href}
            className="block"
            onClick={() => handleQuickActionClick(item, roleKey)}
          >
            <Card
              variant="elevated"
              className={cn(
                'h-full border transition duration-200 hover:-translate-y-0.5 hover:shadow-card',
                compactDensity ? 'min-h-[80px] rounded-[20px]' : 'min-h-[88px] rounded-2xl',
                'bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(248,244,236,0.92)_100%)]',
                item.tone === 'warning' && 'border-warning/30 bg-warning/5',
                item.tone === 'danger' && 'border-destructive/30 bg-destructive/5',
                item.tone === 'success' && 'border-success/30 bg-success/5',
                isLeading && 'ring-2 ring-primary/20',
              )}
            >
              <CardContent className={cn('flex h-full flex-col justify-between', compactDensity ? 'p-2.5' : 'p-3')}>
                <div className="flex items-start justify-between gap-2">
                  <div className={cn(compactDensity ? 'text-[12px]' : 'text-[13px]', 'font-semibold leading-5 text-foreground')}>{item.title}</div>
                  <span className={cn('flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary', compactDensity ? 'h-7 w-7' : 'h-8 w-8')}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                </div>
                <div>
                  <div className={cn(compactDensity ? 'text-[1.05rem]' : 'text-xl', 'font-extrabold leading-none tabular-nums text-foreground')}>
                    <bdi>{item.previewValue ?? item.value}</bdi>
                  </div>
                  {item.microViz?.length ? (
                    <MiniSparkline data={item.microViz} tone={item.tone} className="mt-2 h-7" />
                  ) : null}
                  <div className={cn(compactDensity ? 'text-[10px]' : 'text-[11px]', 'mt-1 flex items-center justify-between gap-2 leading-4 text-secondary-foreground')}>
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

function OperationalPulseRow({
  metrics,
  shellMode,
}: {
  metrics: HomeStatusMetric[];
  shellMode: 'default' | 'pm' | 'admin';
}) {
  if (!metrics.length) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {metrics.map((metric) => {
        const content = (
          <>
            <span className={cn('block text-[10px] font-semibold', shellMode === 'admin' ? 'text-white/64' : 'text-secondary-foreground')}>
              {metric.label}
            </span>
            <span
              className={cn(
                'mt-1 block text-[15px] font-black leading-none tabular-nums',
                metric.tone === 'danger' && 'text-destructive',
                metric.tone === 'warning' && 'text-warning',
                metric.tone === 'success' && 'text-success',
                (!metric.tone || metric.tone === 'default') && (shellMode === 'admin' ? 'text-inverse-text' : 'text-foreground'),
              )}
            >
              <bdi>{metric.value}</bdi>
            </span>
            <span className={cn('mt-1 block truncate text-[10px]', shellMode === 'admin' ? 'text-white/56' : 'text-secondary-foreground')}>
              {metric.trendLabel ?? metric.hint ?? 'פעיל עכשיו'}
            </span>
          </>
        );

        if (!metric.href) {
          return (
            <div
              key={metric.id}
              className={cn(
                'rounded-[16px] border px-2.5 py-2 text-right',
                shellMode === 'admin' ? 'border-white/10 bg-white/6' : 'border-subtle-border bg-background/72',
              )}
            >
              {content}
            </div>
          );
        }

        return (
          <Link
            key={metric.id}
            href={metric.href}
            className={cn(
              'rounded-[16px] border px-2.5 py-2 text-right transition-colors active:scale-[0.99]',
              shellMode === 'admin'
                ? 'border-white/10 bg-white/6 hover:bg-white/8'
                : 'border-subtle-border bg-background/72 hover:bg-background/90',
            )}
          >
            {content}
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
