import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Radio, RefreshCw, Settings } from 'lucide-react';
import { authFetch, getAccessToken, getCurrentUserId } from '../lib/auth';
import { websocketService } from '../lib/websocket';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { NotificationCenter, NotificationItem } from '../components/ui/notification-center';
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

export default function NotificationsPage() {
  const { t } = useLocale();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Array<number | string>>([]);

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

  const loadNotifications = async (userId = currentUserId) => {
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
  };

  const loadPreferences = async (userId = currentUserId) => {
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
  };

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
        const next = [normalizeNotifications([notification])[0], ...current.filter((item) => item.id !== notification.id)];
        return next;
      });
      emitNotificationsChanged();
      toast({
        title: t('notifications.newToastTitle'),
        description: notification.title,
      });
    };

    websocketService.on('new_notification', handleNewNotification);

    const refreshStatus = window.setInterval(() => {
      setLiveConnected(websocketService.isConnected());
    }, 5000);

    return () => {
      websocketService.off('new_notification', handleNewNotification);
      window.clearInterval(refreshStatus);
    };
  }, [currentUserId]);

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
      if (dismissedIds.includes(notification.id)) {
        return false;
      }
      const matchesSearch =
        !searchTerm ||
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || notification.type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'read' && notification.read) ||
        (statusFilter === 'unread' && !notification.read);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [dismissedIds, notifications, searchTerm, statusFilter, typeFilter]);

  const notificationTypes = useMemo(() => {
    return Array.from(new Set(notifications.map((notification) => notification.type).filter(Boolean))) as string[];
  }, [notifications]);

  return (
    <div className="space-y-6">
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} label={t('notifications.pullToRefresh')} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">{t('notifications.title')}</h1>
          <p className="text-sm text-muted-foreground sm:text-base">{t('notifications.description')}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {notifications.some((notification) => !notification.read) && (
            <Button size="sm" onClick={markAllAsRead}>{t('common.markAllAsRead')}</Button>
          )}
          <Button variant="outline" size="sm" onClick={() => loadNotifications()}>
            <RefreshCw className="me-1.5 h-3.5 w-3.5" />
            {t('notifications.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-3 sm:gap-4">
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-3">
            <CardDescription className="text-[11px] sm:text-sm">{t('notifications.unread')}</CardDescription>
            <CardTitle className="text-lg sm:text-2xl">{notifications.filter((notification) => !notification.read).length}</CardTitle>
          </CardHeader>
          <CardContent className="hidden p-3 pt-0 text-sm text-muted-foreground sm:block sm:p-6 sm:pt-0">{t('notifications.unreadHelp')}</CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-3">
            <CardDescription className="text-[11px] sm:text-sm">{t('notifications.total')}</CardDescription>
            <CardTitle className="text-lg sm:text-2xl">{notifications.length}</CardTitle>
          </CardHeader>
          <CardContent className="hidden p-3 pt-0 text-sm text-muted-foreground sm:block sm:p-6 sm:pt-0">{t('notifications.totalHelp')}</CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-3">
            <CardDescription className="text-[11px] sm:text-sm">{t('notifications.live')}</CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-lg sm:gap-2 sm:text-2xl">
              <Radio className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${liveConnected ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span className="text-xs sm:text-base">{liveConnected ? t('notifications.liveConnected') : t('notifications.liveDisconnected')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="hidden p-3 pt-0 text-sm text-muted-foreground sm:block sm:p-6 sm:pt-0">{t('notifications.liveHelp')}</CardContent>
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
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications.searchAndFilter')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-3">
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={t('notifications.searchPlaceholder')} />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('notifications.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('notifications.allTypes')}</SelectItem>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'unread' | 'read') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="unread">{t('common.unread')}</SelectItem>
                  <SelectItem value="read">{t('common.read')}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <NotificationCenter
            notifications={filteredNotifications}
            onMarkAsRead={markAsRead}
            onDismiss={(id) => setDismissedIds((current) => (current.includes(id) ? current : [...current, id]))}
            className={loading ? 'opacity-60' : ''}
          />
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications.preferenceCardTitle')}</CardTitle>
              <CardDescription>{t('notifications.preferenceCardDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">{t('notifications.preferenceCardTitle')}</h3>
                {[
                  ['email', t('notifications.channel.email')],
                  ['sms', t('notifications.channel.sms')],
                  ['push', t('notifications.channel.push')],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key}>{label}</Label>
                    <Switch
                      id={key}
                      checked={preferences[key as keyof NotificationPreferences] as boolean}
                      onCheckedChange={(checked) => updatePreferences({ ...preferences, [key]: checked })}
                      disabled={preferencesLoading}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">{t('notifications.tabPreferences')}</h3>
                <p className="text-sm text-muted-foreground">{t('notifications.preferencePermissionHint')}</p>
                {[
                  ['ticketUpdates', t('notifications.topic.ticketUpdates')],
                  ['maintenanceReminders', t('notifications.topic.maintenanceReminders')],
                  ['paymentReminders', t('notifications.topic.paymentReminders')],
                  ['announcements', t('notifications.topic.announcements')],
                  ['emergencyAlerts', t('notifications.topic.emergencyAlerts')],
                  ['workOrderUpdates', t('notifications.topic.workOrderUpdates')],
                  ['general', t('notifications.topic.general')],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key}>{label}</Label>
                    <Switch
                      id={key}
                      checked={preferences[key as keyof NotificationPreferences] as boolean}
                      onCheckedChange={(checked) => updatePreferences({ ...preferences, [key]: checked })}
                      disabled={preferencesLoading}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
