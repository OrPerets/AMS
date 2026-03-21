import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, Filter, Radio, RefreshCw, Settings } from 'lucide-react';
import { authFetch, getAccessToken, getCurrentUserId } from '../lib/auth';
import { websocketService } from '../lib/websocket';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  NotificationCenter,
  NotificationItem,
  deriveNotificationPriority,
} from '../components/ui/notification-center';
import { PullToRefreshIndicator } from '../components/ui/pull-to-refresh-indicator';
import { toast } from '../components/ui/use-toast';
import { usePullToRefresh } from '../hooks/use-pull-to-refresh';
import { triggerHaptic } from '../lib/mobile';
import { emitNotificationsChanged } from '../lib/notification-events';
import { useLocale } from '../lib/providers';

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
    [currentUserId, t]
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
    [currentUserId, t]
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
      setNotifications((current) => {
        const next = [
          normalizeNotifications([notification])[0],
          ...current.filter((item) => item.id !== notification.id),
        ];
        return next;
      });
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

  const updatePreferences = async (nextPreferences: NotificationPreferences) => {
    if (!currentUserId) return;
    try {
      setPreferencesLoading(true);
      const response = await authFetch(`/api/v1/notifications/user/${currentUserId}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextPreferences),
      });
      if (!response.ok) throw new Error(await response.text());
      setPreferences(nextPreferences);
      toast({
        title: t('notifications.preferencesSavedTitle'),
        description: t('notifications.preferencesSavedDescription'),
      });
      triggerHaptic('success');
    } catch {
      toast({
        title: t('notifications.preferencesSaveFailedTitle'),
        description: t('notifications.preferencesSaveFailedDescription'),
        variant: 'destructive',
      });
    } finally {
      setPreferencesLoading(false);
    }
  };

  const markAsRead = async (id: number | string) => {
    try {
      const response = await authFetch(`/api/v1/notifications/${id}/read`, { method: 'POST' });
      if (!response.ok) throw new Error(await response.text());
      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
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
      await Promise.all(
        unreadIds.map((id) =>
          authFetch(`/api/v1/notifications/${id}/read`, { method: 'POST' })
        )
      );
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
        !searchTerm ||
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      switch (quickFilter) {
        case 'unread':
          return !notification.read;
        case 'urgent': {
          const priority = deriveNotificationPriority(notification);
          return priority === 'critical' || priority === 'needs_action';
        }
        case 'assigned':
          return (
            typeof notification.metadata?.workOrderId === 'number' ||
            typeof notification.metadata?.ticketId === 'number'
          );
        case 'archived':
          return notification.read;
        default:
          return true;
      }
    });
  }, [dismissedIds, notifications, searchTerm, quickFilter]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const urgentCount = notifications.filter((n) => {
    const p = deriveNotificationPriority(n);
    return p === 'critical';
  }).length;

  const filterChips: Array<{ key: QuickFilter; labelKey: string }> = [
    { key: 'all', labelKey: 'notifications.filter.all' },
    { key: 'unread', labelKey: 'notifications.filter.unread' },
    { key: 'urgent', labelKey: 'notifications.filter.urgent' },
    { key: 'assigned', labelKey: 'notifications.filter.assignedToMe' },
    { key: 'archived', labelKey: 'notifications.filter.archived' },
  ];

  const channelPrefs: Array<{ key: string; label: string; desc: string; consequence: string }> = [
    {
      key: 'email',
      label: t('notifications.channel.email'),
      desc: t('settings.preference.emailDesc'),
      consequence: t('notifications.preference.consequence.email'),
    },
    {
      key: 'sms',
      label: t('notifications.channel.sms'),
      desc: t('settings.preference.smsDesc'),
      consequence: t('notifications.preference.consequence.sms'),
    },
    {
      key: 'push',
      label: t('notifications.channel.push'),
      desc: t('settings.preference.pushDesc'),
      consequence: t('notifications.preference.consequence.push'),
    },
  ];

  const topicPrefs: Array<{ key: string; label: string; desc: string; consequence: string }> = [
    {
      key: 'ticketUpdates',
      label: t('notifications.topic.ticketUpdates'),
      desc: t('settings.preference.ticketUpdatesDesc'),
      consequence: t('notifications.preference.consequence.ticketUpdates'),
    },
    {
      key: 'maintenanceReminders',
      label: t('notifications.topic.maintenanceReminders'),
      desc: t('settings.preference.maintenanceRemindersDesc'),
      consequence: t('notifications.preference.consequence.maintenanceReminders'),
    },
    {
      key: 'paymentReminders',
      label: t('notifications.topic.paymentReminders'),
      desc: t('settings.preference.paymentRemindersDesc'),
      consequence: t('notifications.preference.consequence.paymentReminders'),
    },
    {
      key: 'announcements',
      label: t('notifications.topic.announcements'),
      desc: t('settings.preference.announcementsDesc'),
      consequence: t('notifications.preference.consequence.announcements'),
    },
    {
      key: 'emergencyAlerts',
      label: t('notifications.topic.emergencyAlerts'),
      desc: t('settings.preference.emergencyAlertsDesc'),
      consequence: t('notifications.preference.consequence.emergencyAlerts'),
    },
    {
      key: 'workOrderUpdates',
      label: t('notifications.topic.workOrderUpdates'),
      desc: t('settings.preference.workOrderUpdatesDesc'),
      consequence: t('notifications.preference.consequence.workOrderUpdates'),
    },
  ];

  return (
    <div className="space-y-6">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        label={t('notifications.pullToRefresh')}
      />

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            {t('notifications.title')}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t('notifications.description')}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button size="sm" onClick={markAllAsRead}>
              {t('common.markAllAsRead')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => loadNotifications()}>
            <RefreshCw className="me-1.5 h-3.5 w-3.5" />
            {t('notifications.refresh')}
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 grid-cols-3 sm:gap-4">
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-3">
            <CardDescription className="text-[11px] sm:text-sm">
              {t('notifications.unread')}
            </CardDescription>
            <CardTitle className="text-lg sm:text-2xl">{unreadCount}</CardTitle>
          </CardHeader>
          <CardContent className="hidden p-3 pt-0 text-sm text-muted-foreground sm:block sm:p-6 sm:pt-0">
            {t('notifications.unreadHelp')}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-3">
            <CardDescription className="text-[11px] sm:text-sm">
              {t('notifications.total')}
            </CardDescription>
            <CardTitle className="text-lg sm:text-2xl">{notifications.length}</CardTitle>
          </CardHeader>
          <CardContent className="hidden p-3 pt-0 text-sm text-muted-foreground sm:block sm:p-6 sm:pt-0">
            {t('notifications.totalHelp')}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-3">
            <CardDescription className="text-[11px] sm:text-sm">
              {t('notifications.live')}
            </CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-lg sm:gap-2 sm:text-2xl">
              <Radio
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${liveConnected ? 'text-emerald-500' : 'text-amber-500'}`}
              />
              <span className="text-xs sm:text-base">
                {liveConnected
                  ? t('notifications.liveConnected')
                  : t('notifications.liveDisconnected')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="hidden p-3 pt-0 text-sm text-muted-foreground sm:block sm:p-6 sm:pt-0">
            {t('notifications.liveHelp')}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('notifications.tabList')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('notifications.tabPreferences')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {filterChips.map((chip) => (
              <Button
                key={chip.key}
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                variant={quickFilter === chip.key ? 'default' : 'outline'}
                onClick={() => setQuickFilter(chip.key)}
              >
                {t(chip.labelKey)}
                {chip.key === 'unread' && unreadCount > 0 && (
                  <span className="ms-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary-foreground/20 px-1 text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
                {chip.key === 'urgent' && urgentCount > 0 && (
                  <span className="ms-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive/20 px-1 text-[10px] font-bold text-destructive">
                    {urgentCount}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Search */}
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('notifications.searchPlaceholder')}
            className="max-w-md"
          />

          {/* Triage notification center */}
          <NotificationCenter
            notifications={filteredNotifications}
            onMarkAsRead={markAsRead}
            onDismiss={(id) =>
              setDismissedIds((current) =>
                current.includes(id) ? current : [...current, id]
              )
            }
            mode="triage"
            className={loading ? 'opacity-60' : ''}
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          {/* Channel preferences */}
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications.preference.group.channels')}</CardTitle>
              <CardDescription>
                {t('notifications.preference.group.channelsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {channelPrefs.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-4 rounded-xl border border-subtle-border bg-background p-4"
                >
                  <div className="space-y-1">
                    <Label htmlFor={`channel-${item.key}`} className="font-medium">
                      {item.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                    <p className="text-xs text-muted-foreground/70 italic">{item.consequence}</p>
                  </div>
                  <Switch
                    id={`channel-${item.key}`}
                    checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                    onCheckedChange={(checked) =>
                      updatePreferences({ ...preferences, [item.key]: checked })
                    }
                    disabled={preferencesLoading}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Topic preferences */}
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications.preference.group.topics')}</CardTitle>
              <CardDescription>{t('notifications.preference.group.topicsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('notifications.preferencePermissionHint')}
              </p>
              {topicPrefs.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-4 rounded-xl border border-subtle-border bg-background p-4"
                >
                  <div className="space-y-1">
                    <Label htmlFor={`topic-${item.key}`} className="font-medium">
                      {item.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                    {!preferences[item.key as keyof NotificationPreferences] && (
                      <p className="text-xs text-warning italic">{item.consequence}</p>
                    )}
                  </div>
                  <Switch
                    id={`topic-${item.key}`}
                    checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                    onCheckedChange={(checked) =>
                      updatePreferences({ ...preferences, [item.key]: checked })
                    }
                    disabled={preferencesLoading}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
