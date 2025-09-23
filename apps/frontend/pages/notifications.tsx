import React, { useEffect, useState } from 'react';
import { Bell, Settings, Search, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { authFetch } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { NotificationCenter, NotificationItem } from '../components/ui/notification-center';
import { useLocale } from '../lib/providers';
import { toast } from '../components/ui/use-toast';

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
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
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const { t } = useLocale();

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/v1/notifications/user/1'); // TODO: Get actual user ID
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          createdAt: n.createdAt,
          read: n.read,
          metadata: n.metadata,
        })));
      }
    } catch (error) {
      toast({
        title: "שגיאה בטעינת התראות",
        description: "לא ניתן לטעון את ההתראות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load notification preferences
  const loadPreferences = async () => {
    try {
      setPreferencesLoading(true);
      const response = await authFetch('/api/v1/notifications/user/1/preferences'); // TODO: Get actual user ID
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Update notification preferences
  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      setPreferencesLoading(true);
      const response = await authFetch('/api/v1/notifications/user/1/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
      });
      if (response.ok) {
        setPreferences(newPreferences);
        toast({
          title: "העדפות עודכנו",
          description: "העדפות ההתראות נשמרו בהצלחה",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה בשמירת העדפות",
        description: "לא ניתן לשמור את העדפות ההתראות",
        variant: "destructive",
      });
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: number | string) => {
    try {
      await authFetch(`/api/v1/notifications/${id}/read`, {
        method: 'POST',
      });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לסמן את ההתראה כנקראה",
        variant: "destructive",
      });
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => 
          authFetch(`/api/v1/notifications/${n.id}/read`, { method: 'POST' })
        )
      );
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      toast({
        title: "התראות סומנו כנקראות",
        description: "כל ההתראות סומנו כנקראות",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לסמן את כל ההתראות כנקראות",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'read' && notification.read) ||
      (statusFilter === 'unread' && !notification.read);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const notificationTypes = Array.from(new Set(notifications.map(n => n.type).filter(Boolean)));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">התראות</h1>
          <p className="text-muted-foreground mt-2">
            ניהול התראות והעדפות תקשורת
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={loadNotifications} className="w-full sm:w-auto">
            רענן
          </Button>
          {notifications.some(n => !n.read) && (
            <Button onClick={markAllAsRead} className="w-full sm:w-auto">
              סמן הכל כנקרא
            </Button>
          )}
        </div>
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
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">סינון התראות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="חפש בהתראות..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="סוג התראה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הסוגים</SelectItem>
                    {notificationTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל ההתראות</SelectItem>
                    <SelectItem value="unread">לא נקראו</SelectItem>
                    <SelectItem value="read">נקראו</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <NotificationCenter
            notifications={filteredNotifications}
            onMarkAsRead={markAsRead}
            className="min-h-[400px]"
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">העדפות התראות</CardTitle>
              <CardDescription>
                בחר איך תרצה לקבל התראות
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Communication Channels */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold">ערוצי תקשורת</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email">אימייל</Label>
                    <Switch
                      id="email"
                      checked={preferences.email}
                      onCheckedChange={(checked) => 
                        updatePreferences({ ...preferences, email: checked })
                      }
                      disabled={preferencesLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms">SMS</Label>
                    <Switch
                      id="sms"
                      checked={preferences.sms}
                      onCheckedChange={(checked) => 
                        updatePreferences({ ...preferences, sms: checked })
                      }
                      disabled={preferencesLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push">התראות דחיפה</Label>
                    <Switch
                      id="push"
                      checked={preferences.push}
                      onCheckedChange={(checked) => 
                        updatePreferences({ ...preferences, push: checked })
                      }
                      disabled={preferencesLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold">סוגי התראות</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ticketUpdates">עדכוני כרטיסים</Label>
                    <Switch
                      id="ticketUpdates"
                      checked={preferences.ticketUpdates}
                      onCheckedChange={(checked) => 
                        updatePreferences({ ...preferences, ticketUpdates: checked })
                      }
                      disabled={preferencesLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenanceReminders">תזכורות תחזוקה</Label>
                    <Switch
                      id="maintenanceReminders"
                      checked={preferences.maintenanceReminders}
                      onCheckedChange={(checked) => 
                        updatePreferences({ ...preferences, maintenanceReminders: checked })
                      }
                      disabled={preferencesLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="paymentReminders">תזכורות תשלום</Label>
                    <Switch
                      id="paymentReminders"
                      checked={preferences.paymentReminders}
                      onCheckedChange={(checked) => 
                        updatePreferences({ ...preferences, paymentReminders: checked })
                      }
                      disabled={preferencesLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="announcements">הכרזות</Label>
                    <Switch
                      id="announcements"
                      checked={preferences.announcements}
                      onCheckedChange={(checked) => 
                        updatePreferences({ ...preferences, announcements: checked })
                      }
                      disabled={preferencesLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emergencyAlerts">התראות חירום</Label>
                    <Switch
                      id="emergencyAlerts"
                      checked={preferences.emergencyAlerts}
                      onCheckedChange={(checked) => 
                        updatePreferences({ ...preferences, emergencyAlerts: checked })
                      }
                      disabled={preferencesLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="workOrderUpdates">עדכוני הזמנות עבודה</Label>
                    <Switch
                      id="workOrderUpdates"
                      checked={preferences.workOrderUpdates}
                      onCheckedChange={(checked) => 
                        updatePreferences({ ...preferences, workOrderUpdates: checked })
                      }
                      disabled={preferencesLoading}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
