import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, ExternalLink, Filter, Radio, RefreshCw, Settings, SlidersHorizontal } from 'lucide-react';
import { authFetch, getAccessToken, getCurrentUserId } from '../lib/auth';
import { triggerHaptic } from '../lib/mobile';
import { emitNotificationsChanged } from '../lib/notification-events';
import { useLocale } from '../lib/providers';
import { websocketService } from '../lib/websocket';
import { NotificationCenter, NotificationItem, deriveNotificationPriority } from '../components/ui/notification-center';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { PageHero } from '../components/ui/page-hero';
import { PullToRefreshIndicator } from '../components/ui/pull-to-refresh-indicator';
import { SectionHeader } from '../components/ui/section-header';
import { StatusBadge } from '../components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from '../components/ui/use-toast';
import { usePullToRefresh } from '../hooks/use-pull-to-refresh';

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  ticketUpdates: boolean;
  maintenanceReminders: boolean;
  paymentReminders: boolean;
  announcements: boolean;
  emergencyAlerts: boolean;
  workOrderUpdates: boolean;
  general: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email: true,
  sms: true,
  push: true,
  ticketUpdates: true,
  maintenanceReminders: true,
  paymentReminders: true,
  announcements: true,
  emergencyAlerts: true,
  workOrderUpdates: true,
  general: true,
};

type QuickFilter = 'all' | 'unread' | 'urgent' | 'assigned' | 'archived';

const FILTER_STORAGE_KEY = 'amit-notification-filters';

function loadPersistedFilters(): { quickFilter: QuickFilter; searchTerm: string } {
  if (typeof window === 'undefined') return { quickFilter: 'all', searchTerm: '' };
  try {
    const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { quickFilter: 'all', searchTerm: '' };
}

function persistFilters(quickFilter: QuickFilter, searchTerm: string) {
  try {
    sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({ quickFilter, searchTerm }));
  } catch {}
}

export default function NotificationsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Array<number | string>>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  const persisted = useMemo(() => loadPersistedFilters(), []);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(persisted.quickFilter);
  const [searchTerm, setSearchTerm] = useState(persisted.searchTerm);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    persistFilters(quickFilter, searchTerm);
  }, [quickFilter, searchTerm]);

  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
  }, []);

  const normalizeNotifications = (items: any[]): NotificationItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      type: item.type,
      createdAt: item.createdAt,
      read: item.read,
      metadata: item.metadata,
    }));

  const loadNotifications = useCallback(
    async (userId = currentUserId) => {
      if (!userId) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await authFetch(`/api/v1/notifications/user/${userId}`);
        if (!response.ok) throw new Error(await response.text());
        setNotifications(normalizeNotifications(await response.json()));
      } catch {
        toast({
          title: t('notifications.loadFailedTitle'),
          description: t('notifications.loadFailedDescription'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, t],
  );

  const loadPreferences = useCallback(
    async (userId = currentUserId) => {
      if (!userId) return;
      try {
        setPreferencesLoading(true);
        const response = await authFetch(`/api/v1/notifications/user/${userId}/preferences`);
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        setPreferences({ ...defaultPreferences, ...data });
      } catch {
        toast({
          title: t('notifications.preferencesLoadFailedTitle'),
          description: t('notifications.preferencesLoadFailedDescription'),
          variant: 'destructive',
        });
      } finally {
        setPreferencesLoading(false);
      }
    },
    [currentUserId, t],
  );

  useEffect(() => {
    if (!currentUserId) return;
    loadNotifications(currentUserId);
    loadPreferences(currentUserId);

    const token = getAccessToken();
    if (!token) return;

    websocketService.connect(token);
    setLiveConnected(websocketService.isConnected());

    const handleNewNotification = (event: { notification?: any }) => {
      const notification = event.notification;
      if (!notification) return;
      setNotifications((current) => [
        normalizeNotifications([notification])[0],
        ...current.filter((item) => item.id !== notification.id),
      ]);
      emitNotificationsChanged();
      toast({ title: t('notifications.newToastTitle'), description: notification.title });
    };

    websocketService.on('new_notification', handleNewNotification);

    const refreshStatus = window.setInterval(() => {
      setLiveConnected(websocketService.isConnected());
    }, 5000);

    return () => {
      websocketService.off('new_notification', handleNewNotification);
      window.clearInterval(refreshStatus);
    };
  }, [currentUserId, loadNotifications, loadPreferences, t]);

  const markAsRead = async (id: number | string) => {
    try {
      const response = await authFetch(`/api/v1/notifications/${id}/read`, { method: 'POST' });
      if (!response.ok) throw new Error(await response.text());
      setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
      emitNotificationsChanged();
      triggerHaptic('success');
    } catch {
      toast({
        title: t('notifications.readFailedTitle'),
        description: t('notifications.readFailedDescription'),
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((item) => !item.read).map((item) => item.id);
    try {
      await Promise.all(unreadIds.map((id) => authFetch(`/api/v1/notifications/${id}/read`, { method: 'POST' })));
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      emitNotificationsChanged();
      toast({ title: t('notifications.markAllDone') });
      triggerHaptic('success');
    } catch {
      toast({
        title: t('notifications.markAllFailedTitle'),
        description: t('notifications.markAllFailedDescription'),
        variant: 'destructive',
      });
    }
  };

  const { pullDistance, isRefreshing } = usePullToRefresh({
    enabled: Boolean(currentUserId),
    onRefresh: async () => {
      await loadNotifications();
      await loadPreferences();
    },
  });

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (dismissedIds.includes(notification.id)) return false;

      const matchesSearch =
        !deferredSearchTerm ||
        notification.title.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(deferredSearchTerm.toLowerCase());

      if (!matchesSearch) return false;

      switch (quickFilter) {
        case 'unread':
          return !notification.read;
        case 'urgent': {
          const priority = deriveNotificationPriority(notification);
          return priority === 'critical' || priority === 'needs_action';
        }
        case 'assigned':
          return typeof notification.metadata?.workOrderId === 'number' || typeof notification.metadata?.ticketId === 'number';
        case 'archived':
          return notification.read;
        default:
          return true;
      }
    });
  }, [deferredSearchTerm, dismissedIds, notifications, quickFilter]);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const urgentCount = notifications.filter((item) => {
    const priority = deriveNotificationPriority(item);
    return priority === 'critical' || priority === 'needs_action';
  }).length;

  const filterChips: Array<{ key: QuickFilter; labelKey: string }> = [
    { key: 'all', labelKey: 'notifications.filter.all' },
    { key: 'unread', labelKey: 'notifications.filter.unread' },
    { key: 'urgent', labelKey: 'notifications.filter.urgent' },
    { key: 'assigned', labelKey: 'notifications.filter.assignedToMe' },
    { key: 'archived', labelKey: 'notifications.filter.archived' },
  ];

  const channelPrefs: Array<{ key: keyof NotificationPreferences; label: string; description: string }> = [
    {
      key: 'email',
      // Keep labels aligned with Settings (canonical editor) to prevent translation drift.
      label: t('settings.preference.email'),
      description: t('settings.preference.emailDesc'),
    },
    {
      key: 'sms',
      label: t('settings.preference.sms'),
      description: t('settings.preference.smsDesc'),
    },
    {
      key: 'push',
      label: t('settings.preference.push'),
      description: t('settings.preference.pushDesc'),
    },
  ];

  const topicPrefs: Array<{ key: keyof NotificationPreferences; label: string; description: string }> = [
    {
      key: 'ticketUpdates',
      label: t('settings.preference.ticketUpdates'),
      description: t('settings.preference.ticketUpdatesDesc'),
    },
    {
      key: 'maintenanceReminders',
      label: t('settings.preference.maintenanceReminders'),
      description: t('settings.preference.maintenanceRemindersDesc'),
    },
    {
      key: 'paymentReminders',
      label: t('settings.preference.paymentReminders'),
      description: t('settings.preference.paymentRemindersDesc'),
    },
    {
      key: 'announcements',
      label: t('settings.preference.announcements'),
      description: t('settings.preference.announcementsDesc'),
    },
    {
      key: 'emergencyAlerts',
      label: t('settings.preference.emergencyAlerts'),
      description: t('settings.preference.emergencyAlertsDesc'),
    },
    {
      key: 'workOrderUpdates',
      label: t('settings.preference.workOrderUpdates'),
      description: t('settings.preference.workOrderUpdatesDesc'),
    },
  ];
  const enabledChannels = channelPrefs.filter((item) => preferences[item.key]).length;
  const enabledTopics = topicPrefs.filter((item) => preferences[item.key]).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} label={t('notifications.pullToRefresh')} />

      <PageHero
        compact
        kicker={t('notifications.title')}
        eyebrow={
          <>
            <StatusBadge label={liveConnected ? t('notifications.liveConnected') : t('notifications.liveDisconnected')} tone={liveConnected ? 'success' : 'warning'} />
            <Badge variant="outline" className="border-white/12 bg-white/8 text-white/82">
              {unreadCount} {t('notifications.unread')}
            </Badge>
          </>
        }
        title={t('notifications.title')}
        description={t('notifications.description')}
        actions={
          <>
            {unreadCount > 0 ? (
              <Button size="sm" variant="hero" onClick={markAllAsRead}>
                {t('common.markAllAsRead')}
              </Button>
            ) : null}
            <Button variant="outline" size="sm" className="border-white/12 bg-white/8 text-white hover:bg-white/12" onClick={() => loadNotifications()}>
              <RefreshCw className="me-1.5 h-3.5 w-3.5" />
              {t('notifications.refresh')}
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-3 gap-3">
        <NotificationMetricCard
          title={t('notifications.unread')}
          value={unreadCount}
          description={t('notifications.unreadHelp')}
          tone="primary"
        />
        <NotificationMetricCard
          title={t('notifications.total')}
          value={notifications.length}
          description={t('notifications.totalHelp')}
          tone="neutral"
        />
        <NotificationMetricCard
          title={t('notifications.live')}
          value={liveConnected ? t('notifications.liveConnected') : t('notifications.liveDisconnected')}
          description={t('notifications.liveHelp')}
          tone={liveConnected ? 'success' : 'warning'}
          icon={<Radio className={`h-3.5 w-3.5 ${liveConnected ? 'text-success' : 'text-warning'}`} />}
        />
      </section>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 rounded-[24px] border border-subtle-border bg-muted/24 p-1">
          <TabsTrigger value="notifications" className="gap-2 rounded-[18px]">
            <Bell className="h-4 w-4" />
            {t('notifications.tabList')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 rounded-[18px]">
            <Settings className="h-4 w-4" />
            {t('notifications.tabPreferences')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card variant="elevated">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <SectionHeader
                title={t('notifications.tabList')}
                subtitle={t('notifications.description')}
                meta={`${filteredNotifications.length} ${t('notifications.total')}`}
                actions={
                  <div className="inline-flex items-center gap-2 rounded-full border border-subtle-border bg-background px-3 py-1 text-xs text-muted-foreground">
                    <Radio className={`h-3.5 w-3.5 ${liveConnected ? 'text-success' : 'text-warning'}`} />
                    {liveConnected ? t('notifications.liveConnected') : t('notifications.liveDisconnected')}
                  </div>
                }
              />

              <div className="rounded-[24px] border border-subtle-border bg-background/88 p-3 sm:p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">
                  <Filter className="h-3.5 w-3.5" />
                  {t('notifications.filter.all')}
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {filterChips.map((chip) => {
                    const selected = quickFilter === chip.key;
                    const badgeCount =
                      chip.key === 'unread' ? unreadCount : chip.key === 'urgent' ? urgentCount : undefined;

                    return (
                      <Button
                        key={chip.key}
                        size="sm"
                        variant={selected ? 'default' : 'outline'}
                        className="h-9 shrink-0 rounded-full px-4 text-xs"
                        onClick={() => setQuickFilter(chip.key)}
                      >
                        {t(chip.labelKey)}
                        {badgeCount ? (
                          <span className={cnInlineBadge(selected)}>
                            {badgeCount}
                          </span>
                        ) : null}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t('notifications.searchPlaceholder')}
                />
                <Button variant="outline" className="justify-start lg:justify-center" onClick={() => router.push('/settings?tab=notifications')}>
                  <SlidersHorizontal className="me-2 h-4 w-4" />
                  {t('notifications.tabPreferences')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <NotificationCenter
            notifications={filteredNotifications}
            onMarkAsRead={markAsRead}
            onDismiss={(id) => setDismissedIds((current) => (current.includes(id) ? current : [...current, id]))}
            mode="triage"
            className={loading ? 'opacity-65' : ''}
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card variant="featured">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <SectionHeader
                title={t('notifications.tabPreferences')}
                subtitle={t('settings.section.preferencesSubtitle')}
                meta={preferencesLoading ? t('common.loading') : t('settings.meta.personalized')}
                actions={<StatusBadge label={`${enabledTopics}/${topicPrefs.length}`} tone="active" />}
              />
              {/* Migration note: Settings > Notifications is the single canonical editor.
                  Do not reintroduce writable preference forms on this page; keep this section read-only with deep-link navigation. */}
              <div className="rounded-[24px] border border-subtle-border bg-background/88 p-4 text-sm leading-6 text-muted-foreground">
                {t('settings.preference.explanation')}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>{t('notifications.preference.group.channels')}</CardTitle>
                    <CardDescription>{`${enabledChannels}/${channelPrefs.length}`}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {channelPrefs.map((item) => (
                      <PreferenceSummaryRow
                        key={item.key}
                        title={item.label}
                        description={item.description}
                      />
                    ))}
                  </CardContent>
                </Card>
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>{t('notifications.preference.group.topics')}</CardTitle>
                    <CardDescription>{`${enabledTopics}/${topicPrefs.length}`}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topicPrefs.map((item) => (
                      <PreferenceSummaryRow
                        key={item.key}
                        title={item.label}
                        description={item.description}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => router.push('/settings?tab=notifications')}>
                  <ExternalLink className="me-2 h-4 w-4" />
                  {t('notifications.tabPreferences')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationMetricCard({
  title,
  value,
  description,
  tone,
  icon,
}: {
  title: string;
  value: React.ReactNode;
  description: string;
  tone: 'primary' | 'success' | 'warning' | 'neutral';
  icon?: React.ReactNode;
}) {
  const toneClass: Record<typeof tone, string> = {
    primary: 'border-primary/16 bg-primary/8',
    success: 'border-success/18 bg-success/8',
    warning: 'border-warning/18 bg-warning/8',
    neutral: 'border-subtle-border bg-card',
  };

  return (
    <Card className={toneClass[tone]}>
      <CardHeader className="space-y-1 p-3 pb-2 sm:p-4">
        <CardDescription className="text-[11px] sm:text-xs">{title}</CardDescription>
        <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
          {icon}
          <span className="truncate">{value}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 text-[11px] leading-5 text-muted-foreground sm:p-4 sm:pt-0 sm:text-xs">
        {description}
      </CardContent>
    </Card>
  );
}

function PreferenceSummaryRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[18px] border border-subtle-border bg-background/88 p-3">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs leading-5 text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}

function cnInlineBadge(selected: boolean) {
  return selected
    ? 'ms-1 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-primary-foreground/16 px-1.5 py-0.5 text-[10px] font-bold'
    : 'ms-1 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary';
}
