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
import { toast } from '../components/ui/use-toast';
import { emitNotificationsChanged } from '../lib/notification-events';

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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

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
        title: 'שגיאה בטעינת התראות',
        description: 'לא ניתן לטעון את רשימת ההתראות.',
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
        title: 'טעינת העדפות נכשלה',
        description: 'לא ניתן לטעון את העדפות ההתראה כרגע.',
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
        title: 'התקבלה התראה חדשה',
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
        title: 'ההעדפות נשמרו',
        description: 'ערוצי ההתראה והסיווגים עודכנו.',
      });
    } catch {
      toast({
        title: 'שמירת העדפות נכשלה',
        description: 'לא ניתן לעדכן כעת את ההעדפות.',
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
    } catch {
      toast({
        title: 'לא ניתן לסמן כנקרא',
        description: 'השרת לא אישר את עדכון ההתראה.',
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
      toast({ title: 'כל ההתראות סומנו כנקראו' });
    } catch {
      toast({
        title: 'עדכון קבוצתי נכשל',
        description: 'לא ניתן לסמן את כל ההתראות כנקראו.',
        variant: 'destructive',
      });
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
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
  }, [notifications, searchTerm, statusFilter, typeFilter]);

  const notificationTypes = useMemo(() => {
    return Array.from(new Set(notifications.map((notification) => notification.type).filter(Boolean))) as string[];
  }, [notifications]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">התראות</h1>
          <p className="text-muted-foreground">רשימת התראות אישיות, חיבור חי בזמן אמת והעדפות משלוח.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => loadNotifications()}>
            <RefreshCw className="me-2 h-4 w-4" />
            רענון
          </Button>
          {notifications.some((notification) => !notification.read) && (
            <Button onClick={markAllAsRead}>סמן הכל כנקרא</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>סה"כ התראות</CardDescription>
            <CardTitle>{notifications.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">התראות שנשמרו למשתמש המחובר</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>לא נקראו</CardDescription>
            <CardTitle>{notifications.filter((notification) => !notification.read).length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">זמינות לסימון כנקראו ממסך זה</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>חיבור חי</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <Radio className={`h-4 w-4 ${liveConnected ? 'text-emerald-500' : 'text-amber-500'}`} />
              {liveConnected ? 'מחובר' : 'לא מחובר'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">קבלת `new_notification` דרך WebSocket</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            התראות
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            העדפות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>חיפוש וסינון</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-3">
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="חיפוש בהתראות" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="כל הסוגים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסוגים</SelectItem>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'unread' | 'read') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="כל הסטטוסים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל ההתראות</SelectItem>
                  <SelectItem value="unread">לא נקראו</SelectItem>
                  <SelectItem value="read">נקראו</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <NotificationCenter notifications={filteredNotifications} onMarkAsRead={markAsRead} className={loading ? 'opacity-60' : ''} />
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>העדפות מסירה</CardTitle>
              <CardDescription>ערוצי שליחה והפעלה או השבתה של סוגי התראה.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">ערוצים</h3>
                {[
                  ['email', 'אימייל'],
                  ['sms', 'SMS'],
                  ['push', 'התראות דחיפה'],
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
                <h3 className="text-sm font-semibold">סוגי התראות</h3>
                {[
                  ['ticketUpdates', 'עדכוני קריאות'],
                  ['maintenanceReminders', 'תזכורות תחזוקה'],
                  ['paymentReminders', 'תזכורות תשלום'],
                  ['announcements', 'הכרזות'],
                  ['emergencyAlerts', 'התראות חירום'],
                  ['workOrderUpdates', 'עדכוני הזמנות עבודה'],
                  ['general', 'התראות כלליות'],
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
