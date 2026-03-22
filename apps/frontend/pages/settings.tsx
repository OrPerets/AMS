import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, Globe, KeyRound, Save, ShieldCheck, Smartphone, UserRound } from 'lucide-react';
import { authFetch } from '../lib/auth';
import { type RegionalFormat, formatCurrency, formatDate, formatNumber, formatTime, regionalFormats } from '../lib/i18n';
import { isValidEmail } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { FormField } from '../components/ui/form-field';
import { InlineErrorPanel } from '../components/ui/inline-feedback';
import { Input } from '../components/ui/input';
import { PageHero } from '../components/ui/page-hero';
import { PasswordInput } from '../components/ui/password-input';
import { SectionHeader } from '../components/ui/section-header';
import { StatusBadge } from '../components/ui/status-badge';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { TableListSkeleton } from '../components/ui/page-states';
import { toast } from '../components/ui/use-toast';
import { useDirection, useLocale } from '../lib/providers';

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

type ChannelPref = { key: string; label: string; description: string };
type TopicPref = { key: string; label: string; description: string };

export default function SettingsPage() {
  const { t, locale, setLocale, regionalFormat, setRegionalFormat } = useLocale();
  const { direction, setDirection } = useDirection();

  const [profile, setProfile] = useState({ email: '', phone: '', pushToken: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [profileTouched, setProfileTouched] = useState<Record<string, boolean>>({});
  const [passwordTouched, setPasswordTouched] = useState<Record<string, boolean>>({});
  const [profileSubmitted, setProfileSubmitted] = useState(false);
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);

  const [pendingLocale, setPendingLocale] = useState(locale);
  const [pendingDirection, setPendingDirection] = useState(direction);
  const [pendingRegional, setPendingRegional] = useState(regionalFormat);

  useEffect(() => {
    setPendingLocale(locale);
    setPendingDirection(direction);
    setPendingRegional(regionalFormat);
  }, [locale, direction, regionalFormat]);

  const languageDirty = pendingLocale !== locale || pendingDirection !== direction || pendingRegional !== regionalFormat;

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
    setProfileSubmitted(true);
    if (profileErrors.email || profileErrors.phone) {
      toast({ title: t('settings.profileSaveValidation'), variant: 'destructive' });
      scrollToFirstError();
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
    setPasswordSubmitted(true);
    if (passwordErrors.currentPassword || passwordErrors.newPassword) {
      toast({ title: t('settings.passwordValidation'), variant: 'destructive' });
      scrollToFirstError();
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
      setPasswordTouched({});
      setPasswordSubmitted(false);
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

  function saveLanguagePreferences() {
    setSavingLanguage(true);
    setLocale(pendingLocale);
    setDirection(pendingDirection);
    setRegionalFormat(pendingRegional);
    toast({ title: t('settings.languageSavedToast') });
    setSavingLanguage(false);
  }

  function scrollToFirstError() {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }
    });
  }

  const shouldShowProfileError = (field: string) => profileSubmitted || profileTouched[field];
  const shouldShowPasswordError = (field: string) => passwordSubmitted || passwordTouched[field];

  const profileErrors = useMemo(() => {
    return {
      email: profile.email && isValidEmail(profile.email) ? '' : t('settings.validation.email'),
      phone: !profile.phone || /^[0-9+\-\s()]{7,}$/.test(profile.phone) ? '' : t('settings.validation.phone'),
    };
  }, [profile.email, profile.phone, t]);

  const passwordErrors = useMemo(() => {
    return {
      currentPassword: passwords.currentPassword ? '' : t('settings.validation.currentPassword'),
      newPassword: passwords.newPassword.length >= 6 ? '' : t('settings.validation.newPassword'),
    };
  }, [passwords.currentPassword, passwords.newPassword, t]);

  const channelPrefs: ChannelPref[] = [
    { key: 'email', label: t('settings.preference.email'), description: t('settings.preference.emailDesc') },
    { key: 'sms', label: t('settings.preference.sms'), description: t('settings.preference.smsDesc') },
    { key: 'push', label: t('settings.preference.push'), description: t('settings.preference.pushDesc') },
  ];

  const topicPrefs: TopicPref[] = [
    { key: 'ticketUpdates', label: t('settings.preference.ticketUpdates'), description: t('settings.preference.ticketUpdatesDesc') },
    { key: 'maintenanceReminders', label: t('settings.preference.maintenanceReminders'), description: t('settings.preference.maintenanceRemindersDesc') },
    { key: 'paymentReminders', label: t('settings.preference.paymentReminders'), description: t('settings.preference.paymentRemindersDesc') },
    { key: 'announcements', label: t('settings.preference.announcements'), description: t('settings.preference.announcementsDesc') },
    { key: 'emergencyAlerts', label: t('settings.preference.emergencyAlerts'), description: t('settings.preference.emergencyAlertsDesc') },
    { key: 'workOrderUpdates', label: t('settings.preference.workOrderUpdates'), description: t('settings.preference.workOrderUpdatesDesc') },
  ];

  const enabledTopics = topicPrefs.filter((item) => preferences[item.key]).length;
  const now = new Date();

  if (loading) {
    return <TableListSkeleton rows={4} columns={3} />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHero
        compact
        kicker={t('settings.heroKicker')}
        eyebrow={
          <>
            <StatusBadge label={t('settings.heroBadge')} tone="finance" />
            <StatusBadge label={direction === 'rtl' ? t('settings.direction.rtl') : t('settings.direction.ltr')} tone="info" />
          </>
        }
        title={t('settings.heroTitle')}
        description={t('settings.section.profileSubtitle')}
        actions={
          <Button variant="outline" size="sm" className="border-white/12 bg-white/8 text-white hover:bg-white/12" onClick={() => void loadSettings()}>
            {t('notifications.refresh')}
          </Button>
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

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SettingsSummaryCard
          icon={<UserRound className="h-4 w-4 text-primary" />}
          label={t('settings.section.profileTitle')}
          value={profile.email || t('settings.section.profileTitle')}
          description={profile.phone || t('settings.field.phoneHint')}
        />
        <SettingsSummaryCard
          icon={<Bell className="h-4 w-4 text-primary" />}
          label={t('settings.section.preferencesTitle')}
          value={`${enabledTopics}/${topicPrefs.length}`}
          description={t('settings.preference.explanation')}
        />
        <SettingsSummaryCard
          icon={<Globe className="h-4 w-4 text-primary" />}
          label={t('settings.section.languageTitle')}
          value={pendingLocale === 'he' ? t('settings.language.he') : t('settings.language.en')}
          description={regionalFormats[pendingRegional].label}
        />
        <SettingsSummaryCard
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
          label={t('settings.section.passwordTitle')}
          value={passwords.newPassword ? t('settings.unsavedChanges') : t('settings.meta.secured')}
          description={languageDirty ? t('settings.unsavedChanges') : t('common.saved')}
        />
      </section>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-1 rounded-[24px] border border-subtle-border bg-muted/24 p-1 md:grid-cols-4">
          <TabsTrigger value="profile" className="gap-1.5 rounded-[18px]">
            <UserRound className="h-3.5 w-3.5" />
            {t('settings.section.profileTitle')}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 rounded-[18px]">
            <KeyRound className="h-3.5 w-3.5" />
            {t('settings.section.passwordTitle')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 rounded-[18px]">
            <Bell className="h-3.5 w-3.5" />
            {t('settings.section.preferencesTitle')}
          </TabsTrigger>
          <TabsTrigger value="language" className="gap-1.5 rounded-[18px]">
            <Globe className="h-3.5 w-3.5" />
            {t('settings.section.languageTitle')}
            {languageDirty ? <span className="h-1.5 w-1.5 rounded-full bg-warning" /> : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card variant="featured">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <SectionHeader
                title={t('settings.section.profileTitle')}
                subtitle={t('settings.section.profileSubtitle')}
                meta={savingProfile ? t('common.saving') : t('common.readyToSave')}
                actions={<StatusBadge label={profile.email ? t('common.saved') : t('settings.unsavedChanges')} tone="finance" />}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <ProfileInfoCard title={t('settings.field.email')} value={profile.email || '...'} />
                <ProfileInfoCard title={t('settings.field.phone')} value={profile.phone || t('settings.field.phoneHint')} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card variant="elevated">
              <CardContent className="space-y-5 p-4 sm:p-5">
                <SectionHeader
                  title={t('settings.section.profileTitle')}
                  subtitle={t('settings.section.profileSubtitle')}
                  eyebrow={t('settings.section.profileTitle')}
                />

                <FormField
                  label={t('settings.field.email')}
                  error={shouldShowProfileError('email') ? profileErrors.email || undefined : undefined}
                  required
                >
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    value={profile.email}
                    disabled={savingProfile}
                    onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
                    onBlur={() => setProfileTouched((prev) => ({ ...prev, email: true }))}
                  />
                </FormField>

                <FormField
                  label={t('settings.field.phone')}
                  description={t('settings.field.phoneHint')}
                  error={shouldShowProfileError('phone') ? profileErrors.phone || undefined : undefined}
                >
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    value={profile.phone}
                    disabled={savingProfile}
                    onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
                    onBlur={() => setProfileTouched((prev) => ({ ...prev, phone: true }))}
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
              <CardContent className="space-y-5 p-4 sm:p-5">
                <SectionHeader
                  title={t('settings.field.pushToken')}
                  subtitle={t('settings.field.pushTokenHint')}
                  eyebrow={t('settings.section.preferencesTitle')}
                  actions={<Smartphone className="h-4 w-4 text-primary" />}
                />

                <div className="rounded-[22px] border border-subtle-border bg-muted/24 p-4 text-sm leading-6 text-muted-foreground">
                  מזהה המכשיר נשמר כדי להפעיל התראות דחיפה מדויקות, בלי להציף אותך בעדכונים כפולים.
                </div>

                <FormField label={t('settings.field.pushToken')} description={t('settings.field.pushTokenHint')}>
                  <Input
                    id="pushToken"
                    value={profile.pushToken}
                    disabled={savingProfile}
                    onChange={(event) => setProfile((current) => ({ ...current, pushToken: event.target.value }))}
                  />
                </FormField>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card variant="featured">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <SectionHeader
                title={t('settings.section.passwordTitle')}
                subtitle={t('settings.section.passwordSubtitle')}
                meta={savingPassword ? t('common.saving') : t('settings.meta.secured')}
                actions={<StatusBadge label={t('settings.meta.secured')} tone="success" />}
              />
              <div className="rounded-[24px] border border-subtle-border bg-background/86 p-4 text-sm leading-6 text-muted-foreground">
                החלפת הסיסמה נשמרת כמשימה קצרה וברורה. אין כאן שדות מיותרים, ורק שתי פעולות נדרשות כדי לסיים.
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="space-y-5 p-4 sm:p-5">
              <FormField
                label={t('settings.field.currentPassword')}
                error={shouldShowPasswordError('currentPassword') ? passwordErrors.currentPassword || undefined : undefined}
                required
              >
                <PasswordInput
                  id="currentPassword"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
                  onBlur={() => setPasswordTouched((prev) => ({ ...prev, currentPassword: true }))}
                  autoComplete="current-password"
                />
              </FormField>

              <FormField
                label={t('settings.field.newPassword')}
                description={t('settings.validation.newPassword')}
                error={shouldShowPasswordError('newPassword') ? passwordErrors.newPassword || undefined : undefined}
                required
              >
                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
                  onBlur={() => setPasswordTouched((prev) => ({ ...prev, newPassword: true }))}
                  autoComplete="new-password"
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
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card variant="featured">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <SectionHeader
                title={t('settings.section.preferencesTitle')}
                subtitle={t('settings.section.preferencesSubtitle')}
                meta={savingPreferences ? t('common.saving') : t('settings.meta.personalized')}
                actions={<StatusBadge label={`${enabledTopics}/${topicPrefs.length}`} tone="info" />}
              />
              <div className="rounded-[24px] border border-subtle-border bg-background/86 p-4 text-sm leading-6 text-muted-foreground">
                {t('settings.preference.explanation')}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>{t('notifications.preference.group.channels')}</CardTitle>
                <CardDescription>{t('notifications.preference.group.channelsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {channelPrefs.map((item) => (
                  <PreferenceRow
                    key={item.key}
                    title={item.label}
                    description={item.description}
                    checked={preferences[item.key]}
                    onCheckedChange={(checked) => setPreferences((current) => ({ ...current, [item.key]: checked }))}
                  />
                ))}
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>{t('notifications.preference.group.topics')}</CardTitle>
                <CardDescription>{t('notifications.preference.group.topicsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topicPrefs.map((item) => (
                  <PreferenceRow
                    key={item.key}
                    title={item.label}
                    description={item.description}
                    checked={preferences[item.key]}
                    onCheckedChange={(checked) => setPreferences((current) => ({ ...current, [item.key]: checked }))}
                  />
                ))}
                <div className="flex justify-end pt-2">
                  <Button onClick={savePreferences} disabled={savingPreferences}>
                    <Save className="me-2 h-4 w-4" />
                    {savingPreferences ? t('common.saving') : t('settings.action.savePreferences')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="language" className="space-y-4">
          <Card variant="featured">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <SectionHeader
                title={t('settings.section.languageTitle')}
                subtitle={t('settings.section.languageSubtitle')}
                meta={languageDirty ? t('settings.unsavedChanges') : t('common.saved')}
                actions={<StatusBadge label={languageDirty ? t('settings.unsavedChanges') : t('common.saved')} tone={languageDirty ? 'warning' : 'success'} />}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Card variant="elevated">
              <CardContent className="space-y-5 p-4 sm:p-5">
                <FormField label={t('settings.field.language')} description={t('settings.field.languageHint')}>
                  <div className="flex gap-2">
                    <Button
                      variant={pendingLocale === 'he' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setPendingLocale('he');
                        setPendingDirection('rtl');
                      }}
                    >
                      {t('settings.language.he')}
                    </Button>
                    <Button
                      variant={pendingLocale === 'en' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setPendingLocale('en');
                        setPendingDirection('ltr');
                      }}
                    >
                      {t('settings.language.en')}
                    </Button>
                  </div>
                </FormField>

                <FormField label={t('settings.field.direction')} description={t('settings.field.directionHint')}>
                  <div className="flex gap-2">
                    <Button variant={pendingDirection === 'rtl' ? 'default' : 'outline'} size="sm" onClick={() => setPendingDirection('rtl')}>
                      {t('settings.direction.rtl')}
                    </Button>
                    <Button variant={pendingDirection === 'ltr' ? 'default' : 'outline'} size="sm" onClick={() => setPendingDirection('ltr')}>
                      {t('settings.direction.ltr')}
                    </Button>
                  </div>
                </FormField>

                <FormField label={t('settings.field.regionalFormat')} description={t('settings.field.regionalFormatHint')}>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(regionalFormats) as [RegionalFormat, { label: string }][]).map(([key, meta]) => (
                      <Button key={key} variant={pendingRegional === key ? 'default' : 'outline'} size="sm" onClick={() => setPendingRegional(key)}>
                        {meta.label}
                      </Button>
                    ))}
                  </div>
                </FormField>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="space-y-5 p-4 sm:p-5">
                <SectionHeader
                  title={t('settings.formatPreview')}
                  subtitle={t('settings.field.regionalFormatHint')}
                  eyebrow={t('settings.section.languageTitle')}
                />

                <div className="rounded-[24px] border border-subtle-border bg-muted/24 p-4">
                  <div className="grid gap-3 text-sm text-muted-foreground">
                    <div>{t('settings.formatPreviewDate', { value: formatDate(now, pendingRegional) })}</div>
                    <div>{t('settings.formatPreviewTime', { value: formatTime(now, pendingRegional) })}</div>
                    <div>{t('settings.formatPreviewNumber', { value: formatNumber(12345.67, pendingRegional) })}</div>
                    <div>{t('settings.formatPreviewCurrency', { value: formatCurrency(12345.67, 'ILS', pendingRegional) })}</div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  {languageDirty ? <span className="text-xs text-warning">{t('settings.unsavedChanges')}</span> : null}
                  <Button onClick={saveLanguagePreferences} disabled={savingLanguage || !languageDirty}>
                    <Save className="me-2 h-4 w-4" />
                    {savingLanguage ? t('common.saving') : t('settings.action.saveLanguage')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingsSummaryCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card variant="elevated">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">
          {icon}
          {label}
        </div>
        <div className="text-sm font-semibold text-foreground">{value}</div>
        <div className="text-xs leading-5 text-muted-foreground">{description}</div>
      </CardContent>
    </Card>
  );
}

function ProfileInfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-subtle-border bg-background/88 p-4 shadow-card">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">{title}</div>
      <div className="mt-2 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[22px] border border-subtle-border bg-background/88 p-4 shadow-card">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-sm leading-6 text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
