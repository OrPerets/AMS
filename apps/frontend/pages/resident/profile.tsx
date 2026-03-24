import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, CardBody, CardHeader, Chip, Divider, Input, Spinner } from '@heroui/react';
import { Bell, Building2, Mail, Phone, Save, Ticket, UserRound } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { isValidEmail } from '../../lib/utils';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { toast } from '../../components/ui/use-toast';

type AccountContext = {
  user: { id: number; email: string; role: string };
  units: Array<{
    id: number;
    number: string;
    building: {
      id: number;
      name: string;
      address: string;
    };
  }>;
  notifications: Array<{ id: number; read: boolean }>;
  documents: Array<{ id: number }>;
  tickets: Array<{ id: number; status: string }>;
};

type ProfileState = {
  email: string;
  phone: string;
  pushToken: string;
};

const labels = {
  pageTitle: 'פרופיל',
  pageSubtitle: 'עמוד פרופיל פשוט לעריכת פרטי המשתמש בלבד.',
  residentBadge: 'חשבון דייר',
  profileCardTitle: 'פרטים אישיים',
  profileCardSubtitle: 'עדכון פרטי קשר שמופיעים בחשבון ובהודעות יוצאות.',
  infoCardTitle: 'שיוך לחשבון',
  infoCardSubtitle: 'מידע בסיסי לקריאה בלבד.',
  activityCardTitle: 'סטטוס חשבון',
  activityCardSubtitle: 'תקציר קצר ללא ניווטים נוספים.',
  email: 'אימייל',
  phone: 'טלפון',
  pushToken: 'Push token',
  pushTokenHint: 'נשמר אוטומטית מהמכשיר הפעיל, אם קיים.',
  residentNameFallback: 'דייר',
  role: 'תפקיד',
  unit: 'דירה',
  building: 'בניין',
  address: 'כתובת',
  unreadUpdates: 'עדכונים שלא נקראו',
  openTickets: 'קריאות פתוחות',
  documents: 'מסמכים זמינים',
  save: 'שמור פרופיל',
  saveValidation: 'יש לתקן את שדות הפרופיל לפני השמירה.',
  saveSuccess: 'הפרופיל נשמר',
  saveFailedTitle: 'שמירת הפרופיל נכשלה',
  saveFailedDescription: 'לא ניתן לעדכן כרגע את פרטי המשתמש.',
  loadFailedTitle: 'הפרופיל לא נטען',
  loadFailedDescription: 'לא ניתן לטעון כעת את נתוני הפרופיל.',
  emailError: 'יש להזין כתובת אימייל תקינה.',
  phoneError: 'מספר הטלפון לא תקין.',
};

export default function ResidentProfilePage() {
  const [account, setAccount] = useState<AccountContext | null>(null);
  const [profile, setProfile] = useState<ProfileState>({ email: '', phone: '', pushToken: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadProfilePage();
  }, []);

  async function loadProfilePage() {
    try {
      setLoading(true);
      setError(null);

      const [accountRes, profileRes] = await Promise.all([
        authFetch('/api/v1/users/account'),
        authFetch('/api/v1/users/profile'),
      ]);

      if (!accountRes.ok) throw new Error(await accountRes.text());
      if (!profileRes.ok) throw new Error(await profileRes.text());

      const nextAccount = (await accountRes.json()) as AccountContext;
      const nextProfile = (await profileRes.json()) as Partial<ProfileState>;

      setAccount(nextAccount);
      setProfile({
        email: nextProfile.email || '',
        phone: nextProfile.phone || '',
        pushToken: nextProfile.pushToken || '',
      });
    } catch (nextError) {
      console.error(nextError);
      setError(labels.loadFailedDescription);
    } finally {
      setLoading(false);
    }
  }

  const errors = useMemo(() => ({
    email: profile.email && isValidEmail(profile.email) ? '' : labels.emailError,
    phone: !profile.phone || /^[0-9+\-\s()]{7,}$/.test(profile.phone) ? '' : labels.phoneError,
  }), [profile.email, profile.phone]);

  const hasErrors = Boolean(errors.email || errors.phone);
  const primaryUnit = account?.units[0] ?? null;
  const primaryBuilding = primaryUnit?.building ?? null;
  const displayName = account?.user.email?.split('@')[0] || labels.residentNameFallback;
  const unreadNotifications = account?.notifications.filter((item) => !item.read).length ?? 0;
  const openTickets = account?.tickets.filter((item) => item.status !== 'RESOLVED').length ?? 0;
  const documentCount = account?.documents.length ?? 0;

  async function saveProfile() {
    setSubmitted(true);
    if (hasErrors) {
      toast({ title: labels.saveValidation, variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const response = await authFetch('/api/v1/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!response.ok) throw new Error(await response.text());
      toast({ title: labels.saveSuccess });
    } catch (nextError) {
      console.error(nextError);
      toast({
        title: labels.saveFailedTitle,
        description: labels.saveFailedDescription,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label={labels.pageTitle} />
      </div>
    );
  }

  if (error || !account) {
    return (
      <InlineErrorPanel
        title={labels.loadFailedTitle}
        description={error || labels.loadFailedDescription}
        onRetry={() => void loadProfilePage()}
      />
    );
  }

  return (
    <div dir="rtl" className="mx-auto w-full max-w-3xl space-y-4 pb-4 text-right sm:space-y-5">
      <Card className="border border-divider/60 bg-content1/95 shadow-sm">
        <CardBody className="gap-4 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <Avatar
              name={displayName}
              className="h-14 w-14 shrink-0 bg-primary/10 text-primary"
              icon={<UserRound className="h-6 w-6" />}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">{displayName}</h1>
                <Chip color="primary" variant="flat" radius="sm" size="sm">
                  {labels.residentBadge}
                </Chip>
              </div>
              <p className="mt-1 text-sm leading-6 text-default-500">{labels.pageSubtitle}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-divider/60 bg-content1/95 shadow-sm">
        <CardHeader className="flex flex-col items-start gap-1 px-4 pt-4 sm:px-6">
          <h2 className="text-base font-semibold text-foreground">{labels.profileCardTitle}</h2>
          <p className="text-sm text-default-500">{labels.profileCardSubtitle}</p>
        </CardHeader>
        <CardBody className="gap-4 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
          <Input
            type="email"
            label={labels.email}
            labelPlacement="outside"
            placeholder="name@example.com"
            value={profile.email}
            startContent={<Mail className="h-4 w-4 text-default-400" />}
            isRequired
            isInvalid={Boolean((submitted || touched.email) && errors.email)}
            errorMessage={(submitted || touched.email) && errors.email ? errors.email : undefined}
            onValueChange={(value) => setProfile((current) => ({ ...current, email: value }))}
            onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            classNames={{ inputWrapper: 'min-h-14' }}
          />

          <Input
            type="tel"
            label={labels.phone}
            labelPlacement="outside"
            placeholder="050-000-0000"
            value={profile.phone}
            startContent={<Phone className="h-4 w-4 text-default-400" />}
            isInvalid={Boolean((submitted || touched.phone) && errors.phone)}
            errorMessage={(submitted || touched.phone) && errors.phone ? errors.phone : undefined}
            onValueChange={(value) => setProfile((current) => ({ ...current, phone: value }))}
            onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
            classNames={{ inputWrapper: 'min-h-14' }}
          />

          <Input
            label={labels.pushToken}
            labelPlacement="outside"
            value={profile.pushToken || 'לא נשמר'}
            isReadOnly
            description={labels.pushTokenHint}
            classNames={{ inputWrapper: 'min-h-14' }}
          />

          <div className="flex justify-start">
            <Button
              color="primary"
              radius="md"
              isLoading={saving}
              isDisabled={saving || hasErrors}
              startContent={!saving ? <Save className="h-4 w-4" /> : undefined}
              onPress={saveProfile}
            >
              {labels.save}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-divider/60 bg-content1/95 shadow-sm">
        <CardHeader className="flex flex-col items-start gap-1 px-4 pt-4 sm:px-6">
          <h2 className="text-base font-semibold text-foreground">{labels.infoCardTitle}</h2>
          <p className="text-sm text-default-500">{labels.infoCardSubtitle}</p>
        </CardHeader>
        <CardBody className="px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow icon={<UserRound className="h-4 w-4 text-default-400" />} label={labels.role} value="Resident" />
            <InfoRow icon={<Building2 className="h-4 w-4 text-default-400" />} label={labels.unit} value={primaryUnit ? `דירה ${primaryUnit.number}` : 'לא שויך'} />
            <InfoRow icon={<Building2 className="h-4 w-4 text-default-400" />} label={labels.building} value={primaryBuilding?.name || 'לא שויך'} />
            <InfoRow icon={<Building2 className="h-4 w-4 text-default-400" />} label={labels.address} value={primaryBuilding?.address || 'אין כתובת זמינה'} />
          </div>
        </CardBody>
      </Card>

      <Card className="border border-divider/60 bg-content1/95 shadow-sm">
        <CardHeader className="flex flex-col items-start gap-1 px-4 pt-4 sm:px-6">
          <h2 className="text-base font-semibold text-foreground">{labels.activityCardTitle}</h2>
          <p className="text-sm text-default-500">{labels.activityCardSubtitle}</p>
        </CardHeader>
        <CardBody className="px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricTile icon={<Bell className="h-4 w-4" />} label={labels.unreadUpdates} value={String(unreadNotifications)} />
            <MetricTile icon={<Ticket className="h-4 w-4" />} label={labels.openTickets} value={String(openTickets)} />
            <MetricTile icon={<Building2 className="h-4 w-4" />} label={labels.documents} value={String(documentCount)} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-divider/60 bg-default-50/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-default-500">
        {icon}
        <span>{label}</span>
      </div>
      <Divider className="mb-2" />
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function MetricTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-divider/60 bg-default-50/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-default-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
