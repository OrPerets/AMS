import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Bell, Building2, CalendarClock, CreditCard, FileText, Home, ShieldCheck, Ticket, Wrench, Zap, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { CompactStatusStrip } from '../ui/compact-status-strip';
import { MobileActionHub } from '../ui/mobile-action-hub';
import { MobileMetricStrip } from '../ui/mobile-metric-strip';
import { MobilePriorityInbox, type MobilePriorityInboxItem } from '../ui/mobile-priority-inbox';
import { PrimaryActionCard } from '../ui/primary-action-card';
import { MiniSparkline } from '../ui/mobile-insight-widget';
import { GlassSurface } from '../ui/glass-surface';
import { AmsDrawer } from '../ui/ams-drawer';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { trackHomeFirstActionClick, trackHomeTopCardImpression, trackQuickActionClick } from '../../lib/analytics';
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
  meta?: string;
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

export type MetricPulseState = {
  id: string;
  label: string;
  value: string | number;
  meta?: string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
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

export type RoleContextPreviewItem = {
  id: string;
  label: string;
  value: string | number;
  meta: string;
  href?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'warning' | 'danger' | 'success';
};

export type RoleContextPreview = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  items: RoleContextPreviewItem[];
};

export type BottomSheetActionFlow = {
  title: string;
  description?: string;
  ctaLabel?: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    tone?: 'default' | 'warning' | 'danger' | 'success';
  }>;
};

export type HomeBlueprintShellProps = {
  roleLabel: string;
  roleKey: RoleKey;
  statusMetrics: HomeStatusMetric[];
  primaryAction: HomePrimaryAction;
  pulseMetrics?: MetricPulseState[];
  quickActions: HomeQuickAction[];
  contextPreview?: RoleContextPreview;
  launcher?: BottomSheetActionFlow;
  inboxTitle: string;
  inboxSubtitle: string;
  inboxItems: MobilePriorityInboxItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; href: string };
  prioritizeInbox?: boolean;
};

function enforceShellContract(props: HomeBlueprintShellProps) {
  if (props.statusMetrics.length < 2) {
    throw new Error(`RoleHomeShell requires at least 2 status metrics for ${props.roleKey}.`);
  }
  if (props.quickActions.length < 4) {
    throw new Error(`RoleHomeShell requires 4 quick actions for ${props.roleKey}.`);
  }
}

export function RoleHomeShell({
  roleLabel,
  roleKey,
  statusMetrics,
  primaryAction,
  pulseMetrics,
  quickActions,
  contextPreview,
  launcher,
  inboxTitle,
  inboxSubtitle,
  inboxItems,
  emptyTitle,
  emptyDescription,
  emptyAction,
  prioritizeInbox = false,
}: HomeBlueprintShellProps) {
  enforceShellContract({
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
    prioritizeInbox,
  });
  const hasTrackedTopCardImpression = useRef(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const icon = getRoleStatusIcon(roleKey);
  const tone = roleKey === 'ADMIN' ? 'admin' : roleKey === 'PM' ? 'pm' : roleKey === 'RESIDENT' ? 'resident' : 'resident';
  const shellMode = roleKey === 'ADMIN' ? 'admin' : roleKey === 'PM' ? 'pm' : 'default';
  const operatorMode = roleKey === 'ADMIN' || roleKey === 'PM' || roleKey === 'ACCOUNTANT' || roleKey === 'TECH';
  const operationalPulseMetrics = (pulseMetrics?.length ? pulseMetrics : statusMetrics.slice(0, 3)).slice(0, 3);
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

  useEffect(() => {
    if (hasTrackedTopCardImpression.current) return;
    hasTrackedTopCardImpression.current = true;
    trackHomeTopCardImpression(roleKey, primaryAction.href);
  }, [primaryAction.href, roleKey]);

  return (
    <>
      <div className="space-y-3">
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
        contextChips={quickActions.slice(0, 2).map((item) => ({
          id: `chip-${item.id}`,
          label: `${item.title} · ${item.previewValue ?? item.value}`,
          href: item.href,
          tone: item.tone,
        }))}
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
        onCtaClick={() => trackHomeFirstActionClick(roleKey, primaryAction.href, primaryAction.href)}
        tone={primaryAction.tone}
        visualStyle={tone}
        pulseMetrics={operationalPulseMetrics.map((metric) => ({
          id: metric.id,
          label: metric.label,
          value: metric.value,
          meta: metric.meta,
          tone: metric.tone,
        }))}
        mobileHomeEffect
        density={operatorMode ? 'compact' : 'default'}
        className={operatorMode ? 'shadow-[0_16px_34px_rgba(44,28,9,0.10)]' : undefined}
        supportingContent={operatorMode ? (
            <OperationalPulseRow metrics={operationalPulseMetrics} shellMode={shellMode} />
          ) : null
        }
        secondaryAction={
          primaryAction.secondaryAction || launcher ? (
            <div className="flex flex-wrap justify-stretch gap-2 sm:justify-end">
              {primaryAction.secondaryAction ? (
                <Link
                  href={primaryAction.secondaryAction.href}
                  className={cn(
                    'inline-flex min-h-[40px] items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold',
                    shellMode === 'admin'
                      ? 'border-primary/12 text-foreground'
                      : 'border-subtle-border text-foreground',
                  )}
                >
                  {primaryAction.secondaryAction.label}
                </Link>
              ) : null}
              {launcher ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-[40px] rounded-xl px-3 text-xs"
                  onClick={() => setLauncherOpen(true)}
                >
                  <Zap className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {launcher.ctaLabel ?? 'פעולות מהירות'}
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      {contextPreview ? <RoleContextPreviewCard preview={contextPreview} /> : null}

      <GlassSurface className="rounded-[28px] px-3 py-3 sm:px-4 sm:py-4">
        {prioritizeInbox ? inbox : quickActionsGrid}
      </GlassSurface>
      <GlassSurface className="rounded-[28px] px-3 py-3 sm:px-4 sm:py-4">
        {prioritizeInbox ? quickActionsGrid : inbox}
      </GlassSurface>
      </div>

      {launcher ? (
        <AmsDrawer
          isOpen={launcherOpen}
          onOpenChange={setLauncherOpen}
          title={launcher.title}
          description={launcher.description}
          tone="light"
          size="md"
        >
          <div className="space-y-3 pb-2">
            {launcher.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex min-h-[72px] items-center gap-3 rounded-[22px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)] px-4 py-3 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card"
                  onClick={() => setLauncherOpen(false)}
                >
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border',
                      item.tone === 'danger'
                        ? 'border-destructive/15 bg-destructive/10 text-destructive'
                        : item.tone === 'warning'
                          ? 'border-warning/15 bg-warning/10 text-warning'
                          : item.tone === 'success'
                            ? 'border-success/15 bg-success/10 text-success'
                            : 'border-primary/15 bg-primary/10 text-primary',
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.85} />
                  </span>
                  <span className="min-w-0 flex-1 text-right">
                    <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                    <span className="mt-0.5 block text-[12px] leading-5 text-secondary-foreground">{item.description}</span>
                  </span>
                  <ArrowUpRight className="icon-directional h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                </Link>
              );
            })}
          </div>
        </AmsDrawer>
      ) : null}
    </>
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

  if (roleKey === 'PM' || roleKey === 'ADMIN' || roleKey === 'TECH' || roleKey === 'ACCOUNTANT') {
    return (
      <MobileActionHub
        title={
          roleKey === 'ADMIN'
            ? 'פעולות בקרה'
            : roleKey === 'PM'
              ? 'פעולות ניהול'
              : roleKey === 'TECH'
                ? 'פעולות שטח'
                : 'מהלכי גבייה'
        }
        subtitle={
          roleKey === 'ADMIN'
            ? 'מוקד הפעולה הבא.'
            : roleKey === 'PM'
              ? 'המשימות הקרובות במקום אחד.'
              : roleKey === 'TECH'
                ? 'התחנה הבאה, עדכון סטטוס וגיבוי תפעולי.'
                : 'גבייה, תקציב ודוחות במסלול מקוצר.'
        }
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

function RoleContextPreviewCard({ preview }: { preview: RoleContextPreview }) {
  return (
    <GlassSurface className="rounded-[28px] px-4 py-4 sm:px-5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 text-right">
          {preview.eyebrow ? (
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">{preview.eyebrow}</div>
          ) : null}
          <div className="mt-1 text-[15px] font-semibold text-foreground">{preview.title}</div>
          {preview.subtitle ? <div className="mt-0.5 text-[12px] leading-5 text-secondary-foreground">{preview.subtitle}</div> : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {preview.items.slice(0, 4).map((item) => {
          const Icon = item.icon ?? ShieldCheck;
          const content = (
            <div
              className={cn(
                'flex min-h-[88px] flex-col justify-between rounded-[22px] border px-3 py-3 text-right transition-[transform,box-shadow,border-color] duration-200',
                item.tone === 'danger'
                  ? 'border-destructive/18 bg-[linear-gradient(180deg,rgba(255,247,247,0.98)_0%,rgba(255,255,255,0.94)_100%)]'
                  : item.tone === 'warning'
                    ? 'border-warning/18 bg-[linear-gradient(180deg,rgba(255,250,241,0.98)_0%,rgba(255,255,255,0.94)_100%)]'
                    : item.tone === 'success'
                      ? 'border-success/18 bg-[linear-gradient(180deg,rgba(245,252,247,0.98)_0%,rgba(255,255,255,0.94)_100%)]'
                      : 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)]',
                item.href && 'hover:-translate-y-0.5 hover:border-primary/24 hover:shadow-card',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-2xl border',
                    item.tone === 'danger'
                      ? 'border-destructive/12 bg-destructive/10 text-destructive'
                      : item.tone === 'warning'
                        ? 'border-warning/12 bg-warning/10 text-warning'
                        : item.tone === 'success'
                          ? 'border-success/12 bg-success/10 text-success'
                          : 'border-primary/12 bg-primary/10 text-primary',
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="truncate text-[10px] font-semibold text-secondary-foreground">{item.label}</div>
              </div>
              <div className="mt-2">
                <div className="truncate text-[16px] font-black leading-none text-foreground">
                  <bdi>{item.value}</bdi>
                </div>
                <div className="mt-1 line-clamp-2 text-[11px] leading-4.5 text-secondary-foreground">{item.meta}</div>
              </div>
            </div>
          );

          if (!item.href) {
            return <div key={item.id}>{content}</div>;
          }

          return (
            <Link key={item.id} href={item.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </GlassSurface>
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
            <span className={cn('block text-[10px] font-semibold', shellMode === 'admin' ? 'text-secondary-foreground' : 'text-secondary-foreground')}>
              {metric.label}
            </span>
            <span
              className={cn(
                'mt-1 block text-[15px] font-black leading-none tabular-nums',
                metric.tone === 'danger' && 'text-destructive',
                metric.tone === 'warning' && 'text-warning',
                metric.tone === 'success' && 'text-success',
                (!metric.tone || metric.tone === 'default') && 'text-foreground',
              )}
            >
              <bdi>{metric.value}</bdi>
            </span>
            <span className="mt-1 block truncate text-[10px] text-secondary-foreground">
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
                shellMode === 'admin' ? 'border-subtle-border bg-background/72' : 'border-subtle-border bg-background/72',
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
                ? 'border-subtle-border bg-background/72 hover:bg-background/90'
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
