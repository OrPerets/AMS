import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, KeyRound, Save, UserRound } from 'lucide-react';
import { authFetch } from '../lib/auth';
import { isValidEmail } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { EmptyState } from '../components/ui/empty-state';
import { FormField } from '../components/ui/form-field';
import { InlineErrorPanel } from '../components/ui/inline-feedback';
import { Input } from '../components/ui/input';
import { PageHero } from '../components/ui/page-hero';
import { SectionHeader } from '../components/ui/section-header';
import { StatusBadge } from '../components/ui/status-badge';
import { Switch } from '../components/ui/switch';
import { TableListSkeleton } from '../components/ui/page-states';
import { toast } from '../components/ui/use-toast';
import { useLocale } from '../lib/providers';

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
  const { t } = useLocale();
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setLoadError(null);
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
      setLoadError(t('settings.loadErrorDescription'));
      toast({
        title: t('settings.loadToastTitle'),
        description: t('settings.loadToastDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (profileErrors.email || profileErrors.phone) {
      toast({ title: t('settings.profileSaveValidation'), variant: 'destructive' });
      return;
    }

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
      setSaveMessage(t('settings.profileSavedMessage'));
      toast({ title: t('settings.profileSavedToast') });
    } catch {
      toast({
        title: t('settings.profileSaveFailedTitle'),
        description: t('settings.profileSaveFailedDescription'),
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    if (passwordErrors.currentPassword || passwordErrors.newPassword) {
      toast({ title: t('settings.passwordValidation'), variant: 'destructive' });
      return;
    }

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
      setSaveMessage(t('settings.passwordSavedMessage'));
      toast({ title: t('settings.passwordSavedToast') });
    } catch {
      toast({
        title: t('settings.passwordSaveFailedTitle'),
        description: t('settings.passwordSaveFailedDescription'),
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
      setSaveMessage(t('settings.preferencesSavedMessage'));
      toast({ title: t('settings.preferencesSavedToast') });
    } catch {
      toast({
        title: t('settings.preferencesSaveFailedTitle'),
        description: t('settings.preferencesSaveFailedDescription'),
        variant: 'destructive',
      });
    } finally {
      setSavingPreferences(false);
    }
  }

  const profileErrors = useMemo(() => {
    return {
      email: profile.email && isValidEmail(profile.email) ? '' : t('settings.validation.email'),
      phone:
        !profile.phone || /^[0-9+\-\s()]{7,}$/.test(profile.phone)
          ? ''
          : t('settings.validation.phone'),
    };
  }, [profile.email, profile.phone, t]);

  const passwordErrors = useMemo(() => {
    return {
      currentPassword: passwords.currentPassword ? '' : t('settings.validation.currentPassword'),
      newPassword:
        passwords.newPassword.length >= 6 ? '' : t('settings.validation.newPassword'),
    };
  }, [passwords.currentPassword, passwords.newPassword, t]);

  const preferenceLabels: Array<{ key: string; label: string; description: string }> = [
    { key: 'email', label: t('settings.preference.email'), description: t('settings.preference.emailDesc') },
    { key: 'sms', label: t('settings.preference.sms'), description: t('settings.preference.smsDesc') },
    { key: 'push', label: t('settings.preference.push'), description: t('settings.preference.pushDesc') },
    { key: 'ticketUpdates', label: t('settings.preference.ticketUpdates'), description: t('settings.preference.ticketUpdatesDesc') },
    { key: 'maintenanceReminders', label: t('settings.preference.maintenanceReminders'), description: t('settings.preference.maintenanceRemindersDesc') },
    { key: 'paymentReminders', label: t('settings.preference.paymentReminders'), description: t('settings.preference.paymentRemindersDesc') },
    { key: 'announcements', label: t('settings.preference.announcements'), description: t('settings.preference.announcementsDesc') },
    { key: 'emergencyAlerts', label: t('settings.preference.emergencyAlerts'), description: t('settings.preference.emergencyAlertsDesc') },
    { key: 'workOrderUpdates', label: t('settings.preference.workOrderUpdates'), description: t('settings.preference.workOrderUpdatesDesc') },
  ];

  if (loading) {
    return <TableListSkeleton rows={4} columns={3} />;
  }

  return (
    <div className="space-y-8">
      <PageHero
        kicker={t('settings.heroKicker')}
        eyebrow={<StatusBadge label={t('settings.heroBadge')} tone="finance" />}
        title={t('settings.heroTitle')}
        description={t('settings.heroDescription')}
        aside={
          <div className="space-y-3 text-white">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55">{t('settings.saveState')}</div>
              <div className="mt-2 text-base font-semibold">{saveMessage ?? t('settings.noRecentSave')}</div>
            </div>
          </div>
        }
      />

      {loadError ? <InlineErrorPanel title={t('settings.loadErrorTitle')} description={loadError} onRetry={loadSettings} /> : null}

      {saveMessage ? (
        <Card variant="elevated">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            {saveMessage}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="elevated">
          <CardContent className="space-y-6 p-6">
            <SectionHeader
              title={t('settings.section.profileTitle')}
              subtitle={t('settings.section.profileSubtitle')}
              meta={savingProfile ? t('common.saving') : t('common.readyToSave')}
              actions={<UserRound className="h-5 w-5 text-primary" />}
            />

            <FormField label={t('settings.field.email')} error={profileErrors.email || undefined} required>
              <Input
                id="email"
                value={profile.email}
                disabled={savingProfile}
                onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
              />
            </FormField>

            <FormField label={t('settings.field.phone')} description={t('settings.field.phoneHint')} error={profileErrors.phone || undefined}>
              <Input
                id="phone"
                value={profile.phone}
                disabled={savingProfile}
                onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
              />
            </FormField>

            <FormField label={t('settings.field.pushToken')} description={t('settings.field.pushTokenHint')}>
              <Input
                id="pushToken"
                value={profile.pushToken}
                disabled={savingProfile}
                onChange={(event) => setProfile((current) => ({ ...current, pushToken: event.target.value }))}
              />
            </FormField>

            <div className="flex justify-end">
              <Button onClick={saveProfile} disabled={savingProfile || Boolean(profileErrors.email || profileErrors.phone)}>
                <Save className="me-2 h-4 w-4" />
                {savingProfile ? t('common.saving') : t('settings.action.saveProfile')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="space-y-6 p-6">
            <SectionHeader
              title={t('settings.section.passwordTitle')}
              subtitle={t('settings.section.passwordSubtitle')}
              meta={savingPassword ? t('common.saving') : t('settings.meta.secured')}
              actions={<KeyRound className="h-5 w-5 text-primary" />}
            />

            <FormField label={t('settings.field.currentPassword')} error={passwordErrors.currentPassword || undefined} required>
              <Input
                id="currentPassword"
                type="password"
                value={passwords.currentPassword}
                onChange={(event) =>
                  setPasswords((current) => ({ ...current, currentPassword: event.target.value }))
                }
              />
            </FormField>

            <FormField
              label={t('settings.field.newPassword')}
              description={t('settings.validation.newPassword')}
              error={passwordErrors.newPassword || undefined}
              required
            >
              <Input
                id="newPassword"
                type="password"
                value={passwords.newPassword}
                onChange={(event) =>
                  setPasswords((current) => ({ ...current, newPassword: event.target.value }))
                }
              />
            </FormField>

            <div className="flex justify-end">
              <Button onClick={savePassword} disabled={savingPassword || Boolean(passwordErrors.currentPassword || passwordErrors.newPassword)}>
                <KeyRound className="me-2 h-4 w-4" />
                {savingPassword ? t('common.saving') : t('settings.action.updatePassword')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardContent className="space-y-6 p-6">
          <SectionHeader
            title={t('settings.section.preferencesTitle')}
            subtitle={t('settings.section.preferencesSubtitle')}
            meta={savingPreferences ? t('common.saving') : t('settings.meta.personalized')}
            actions={<Bell className="h-5 w-5 text-primary" />}
          />

          <p className="rounded-[22px] border border-subtle-border bg-muted/40 p-4 text-sm text-muted-foreground">
            {t('settings.preference.explanation')}
          </p>

          {preferenceLabels.length === 0 ? (
            <EmptyState
              type="empty"
              title={t('settings.section.preferencesTitle')}
              description={t('settings.preference.explanation')}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {preferenceLabels.map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4 rounded-[22px] border border-subtle-border bg-background p-4">
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{item.label}</div>
                    <div className="text-sm leading-6 text-muted-foreground">{item.description}</div>
                  </div>
                  <Switch
                    checked={preferences[item.key]}
                    onCheckedChange={(checked) =>
                      setPreferences((current) => ({ ...current, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={savePreferences} disabled={savingPreferences}>
              <Save className="me-2 h-4 w-4" />
              {savingPreferences ? t('common.saving') : t('settings.action.savePreferences')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
