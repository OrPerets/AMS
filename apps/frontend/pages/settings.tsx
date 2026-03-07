import { useEffect, useState } from 'react';
import { Bell, KeyRound, Save, UserRound } from 'lucide-react';
import { authFetch } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { toast } from '../components/ui/use-toast';

type NotificationPreferences = Record<string, boolean>;

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

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    email: '',
    phone: '',
    pushToken: '',
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const profileResponse = await authFetch('/api/v1/users/profile');
      if (!profileResponse.ok) {
        throw new Error(await profileResponse.text());
      }
      const profileData = await profileResponse.json();
      setProfile({
        email: profileData.email || '',
        phone: profileData.phone || '',
        pushToken: profileData.pushToken || '',
      });
      setPreferences({
        ...defaultPreferences,
        ...(profileData.notificationPreferences || {}),
      });
    } catch {
      toast({
        title: 'טעינת הגדרות נכשלה',
        description: 'לא ניתן לטעון את פרטי המשתמש כרגע.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    try {
      setSavingProfile(true);
      const response = await authFetch('/api/v1/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      toast({ title: 'הפרופיל נשמר' });
    } catch {
      toast({
        title: 'שמירת פרופיל נכשלה',
        description: 'לא ניתן לעדכן את פרטי המשתמש.',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    try {
      setSavingPassword(true);
      const response = await authFetch('/api/v1/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwords),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setPasswords({ currentPassword: '', newPassword: '' });
      toast({ title: 'הסיסמה עודכנה' });
    } catch {
      toast({
        title: 'עדכון סיסמה נכשל',
        description: 'בדוק את הסיסמה הנוכחית ואת אורך הסיסמה החדשה.',
        variant: 'destructive',
      });
    } finally {
      setSavingPassword(false);
    }
  }

  async function savePreferences() {
    try {
      setSavingPreferences(true);
      const response = await authFetch('/api/v1/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPreferences: preferences }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      toast({ title: 'העדפות ההתראה נשמרו' });
    } catch {
      toast({
        title: 'שמירת העדפות נכשלה',
        description: 'לא ניתן לשמור את ערוצי ההתראה כרגע.',
        variant: 'destructive',
      });
    } finally {
      setSavingPreferences(false);
    }
  }

  const preferenceLabels: Array<{ key: string; label: string }> = [
    { key: 'email', label: 'שליחת אימייל' },
    { key: 'sms', label: 'שליחת SMS' },
    { key: 'push', label: 'פוש בזמן אמת' },
    { key: 'ticketUpdates', label: 'עדכוני קריאות' },
    { key: 'maintenanceReminders', label: 'תזכורות תחזוקה' },
    { key: 'paymentReminders', label: 'תזכורות תשלום' },
    { key: 'announcements', label: 'הודעות מערכת' },
    { key: 'emergencyAlerts', label: 'התראות חירום' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">הגדרות משתמש</h1>
        <p className="text-muted-foreground">ניהול פרופיל, סיסמה והעדפות התראה מחשבון אחד.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              פרופיל
            </CardTitle>
            <CardDescription>עדכון פרטי החשבון שמופיעים במערכת ובהודעות.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                value={profile.email}
                disabled={loading}
                onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={profile.phone}
                disabled={loading}
                onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pushToken">Push Token</Label>
              <Input
                id="pushToken"
                value={profile.pushToken}
                disabled={loading}
                onChange={(event) => setProfile((current) => ({ ...current, pushToken: event.target.value }))}
              />
            </div>
            <Button onClick={saveProfile} disabled={loading || savingProfile}>
              <Save className="me-2 h-4 w-4" />
              שמור פרופיל
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              שינוי סיסמה
            </CardTitle>
            <CardDescription>מומלץ לעדכן סיסמה לאחר מסירת גישה או עבודה ממכשיר משותף.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">סיסמה נוכחית</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwords.currentPassword}
                onChange={(event) =>
                  setPasswords((current) => ({ ...current, currentPassword: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">סיסמה חדשה</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwords.newPassword}
                onChange={(event) =>
                  setPasswords((current) => ({ ...current, newPassword: event.target.value }))
                }
              />
            </div>
            <Button onClick={savePassword} disabled={savingPassword}>
              <KeyRound className="me-2 h-4 w-4" />
              עדכן סיסמה
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            העדפות התראה
          </CardTitle>
          <CardDescription>בקרה על ערוצי המשלוח והנושאים החשובים לכל משתמש.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {preferenceLabels.map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
              <span>{item.label}</span>
              <Switch
                checked={preferences[item.key]}
                onCheckedChange={(checked) =>
                  setPreferences((current) => ({ ...current, [item.key]: checked }))
                }
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <Button onClick={savePreferences} disabled={savingPreferences}>
              <Save className="me-2 h-4 w-4" />
              שמור העדפות
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
