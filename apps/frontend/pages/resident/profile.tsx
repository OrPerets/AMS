import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Avatar, Button, Card, CardBody, CardHeader, Chip, Divider, Input, Spinner } from '@heroui/react';
import {
  Bell,
  Building2,
  ChevronLeft,
  CreditCard,
  LogOut,
  Mail,
  MapPinned,
  Phone,
  Save,
  Settings2,
  Sparkles,
  Ticket,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { authFetch, logout } from '../../lib/auth';
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
  pageTitle: 'הפרופיל שלי',
  pageSubtitle: 'כל מה שחשוב לך במקום אחד, עם גישה מהירה לעדכונים, תשלומים ופרטי החשבון.',
  residentBadge: 'חשבון דייר',
  heroHint: 'מרכז השליטה האישי',
  quickActionsTitle: 'גישה מהירה',
  quickActionsSubtitle: 'הפעולות והמסכים שמשתמשים בהם הכי הרבה בפרופיל הדייר.',
  personalSectionTitle: 'פרטי קשר',
  personalSectionSubtitle: 'עדכון פרטים שמופיעים בהתראות, בקבלות ובתקשורת עם צוות הבניין.',
  accountSectionTitle: 'שיוך וסטטוס',
  accountSectionSubtitle: 'מידע זמין לקריאה בלבד על החשבון והבניין המשויך.',
  role: 'תפקיד',
  unit: 'דירה',
  building: 'בניין',
  address: 'כתובת',
  email: 'אימייל',
  phone: 'טלפון',
  pushToken: 'Push token',
  pushTokenHint: 'נשמר אוטומטית מהמכשיר הפעיל, אם קיים.',
  residentNameFallback: 'דייר',
  unreadUpdates: 'עדכונים שלא נקראו',
  openTickets: 'קריאות פתוחות',
  documents: 'מסמכים זמינים',
  save: 'שמירת פרטים',
  saveValidation: 'יש לתקן את שדות הפרופיל לפני השמירה.',
  saveSuccess: 'הפרופיל נשמר',
  saveFailedTitle: 'שמירת הפרופיל נכשלה',
  saveFailedDescription: 'לא ניתן לעדכן כרגע את פרטי המשתמש.',
  loadFailedTitle: 'הפרופיל לא נטען',
  loadFailedDescription: 'לא ניתן לטעון כעת את נתוני הפרופיל.',
  emailError: 'יש להזין כתובת אימייל תקינה.',
  phoneError: 'מספר הטלפון לא תקין.',
  statusCardTitle: 'היום שלך במבט אחד',
  statusCardSubtitle: 'שקט תפעולי מתחיל בפרופיל ברור, נקי וזמין.',
  logout: 'התנתקות',
};

type MenuItem = {
  id: string;
  label: string;
  description: string;
  href?: string;
  onPress?: () => void;
  icon: ReactNode;
  accent?: 'primary' | 'warning' | 'default';
};

export default function ResidentProfilePage() {
  const reducedMotion = useReducedMotion();
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

  const errors = useMemo(
    () => ({
      email: profile.email && isValidEmail(profile.email) ? '' : labels.emailError,
      phone: !profile.phone || /^[0-9+\-\s()]{7,}$/.test(profile.phone) ? '' : labels.phoneError,
    }),
    [profile.email, profile.phone],
  );

  const hasErrors = Boolean(errors.email || errors.phone);
  const primaryUnit = account?.units[0] ?? null;
  const primaryBuilding = primaryUnit?.building ?? null;
  const displayName = account?.user.email?.split('@')[0] || labels.residentNameFallback;
  const unreadNotifications = account?.notifications.filter((item) => !item.read).length ?? 0;
  const openTickets = account?.tickets.filter((item) => item.status !== 'RESOLVED').length ?? 0;
  const documentCount = account?.documents.length ?? 0;

  const menuItems: MenuItem[] = [
    {
      id: 'details',
      label: 'הפרטים שלי',
      description: 'עריכת האימייל, הטלפון ופרטי ההתקשרות.',
      onPress: () => {
        if (typeof document === 'undefined') return;
        document.getElementById('profile-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      icon: <UserRound className="h-5 w-5" strokeWidth={1.85} />,
      accent: 'primary',
    },
    {
      id: 'payments',
      label: 'תשלומים ושיטות חיוב',
      description: 'יתרות, חשבוניות ותשלום מהיר.',
      href: '/payments/resident',
      icon: <WalletCards className="h-5 w-5" strokeWidth={1.85} />,
      accent: unreadNotifications > 0 ? 'warning' : 'default',
    },
    {
      id: 'building',
      label: 'הבניין שלי',
      description: 'אנשי קשר, כתובת והנחיות לבניין.',
      href: '/resident/building',
      icon: <Building2 className="h-5 w-5" strokeWidth={1.85} />,
    },
    {
      id: 'requests',
      label: 'בקשות ועדכוני שירות',
      description: 'מעקב אחר קריאות פתוחות ובקשות קודמות.',
      href: '/resident/requests?view=history',
      icon: <Ticket className="h-5 w-5" strokeWidth={1.85} />,
      accent: openTickets > 0 ? 'warning' : 'default',
    },
    {
      id: 'settings',
      label: 'הגדרות והעדפות',
      description: 'שפה, התראות והגדרות מערכת.',
      href: '/settings',
      icon: <Settings2 className="h-5 w-5" strokeWidth={1.85} />,
    },
  ];

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
    <div dir="rtl" className="mx-auto w-full max-w-md space-y-4 pb-24 text-right sm:max-w-3xl sm:space-y-5">
      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: 'easeOut' }}
      >
        <Card className="overflow-hidden border border-white/60 bg-[linear-gradient(180deg,rgba(255,251,245,0.98)_0%,rgba(255,255,255,0.96)_45%,rgba(250,245,237,0.98)_100%)] shadow-[0_28px_70px_rgba(44,28,9,0.12)]">
          <CardBody className="p-0">
            <div className="relative overflow-hidden rounded-b-[40px] bg-[radial-gradient(circle_at_top_right,rgba(243,185,91,0.35),transparent_28%),linear-gradient(135deg,rgba(32,24,16,0.98)_0%,rgba(76,52,19,0.94)_48%,rgba(207,146,50,0.94)_100%)] px-5 pb-14 pt-5 text-white">
              <HeroPattern />
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-white/82">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={1.9} />
                    {labels.heroHint}
                  </div>
                  <h1 className="mt-3 text-[30px] font-black leading-none text-white">{labels.pageTitle}</h1>
                  <p className="mt-2 max-w-[18rem] text-sm leading-6 text-white/76">{labels.pageSubtitle}</p>
                </div>
                <Chip radius="full" variant="flat" className="border border-white/14 bg-white/12 px-3 text-white">
                  {labels.residentBadge}
                </Chip>
              </div>
            </div>

            <div className="relative px-5 pb-5">
              <div className="-mt-11 rounded-[30px] border border-primary/14 bg-white/94 p-4 shadow-[0_22px_48px_rgba(44,28,9,0.12)] backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={displayName}
                    className="h-24 w-24 shrink-0 border-4 border-white bg-[radial-gradient(circle_at_30%_30%,rgba(255,227,179,0.9),rgba(217,154,47,0.9)_42%,rgba(76,52,19,1)_100%)] text-white shadow-[0_18px_34px_rgba(207,146,50,0.34)]"
                    icon={<UserRound className="h-10 w-10" />}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/72">
                      {primaryBuilding?.name || 'AMS Resident'}
                    </div>
                    <div className="mt-1 text-2xl font-black leading-tight text-foreground">{displayName}</div>
                    <div className="mt-1 text-sm text-default-500">
                      {primaryUnit ? `דירה ${primaryUnit.number}` : 'חשבון משויך'}
                      {primaryBuilding?.address ? ` · ${primaryBuilding.address}` : ''}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <MiniPill icon={<Bell className="h-3.5 w-3.5" strokeWidth={1.8} />} text={`${unreadNotifications} התראות`} />
                      <MiniPill icon={<Ticket className="h-3.5 w-3.5" strokeWidth={1.8} />} text={`${openTickets} קריאות פתוחות`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.section>

      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.05, ease: 'easeOut' }}
      >
        <Card className="border border-divider/60 bg-white/92 shadow-[0_18px_42px_rgba(44,28,9,0.08)]">
          <CardHeader className="flex flex-col items-start gap-1 px-4 pt-4 sm:px-5">
            <h2 className="text-base font-semibold text-foreground">{labels.statusCardTitle}</h2>
            <p className="text-sm text-default-500">{labels.statusCardSubtitle}</p>
          </CardHeader>
          <CardBody className="grid grid-cols-3 gap-3 px-4 pb-4 pt-2 sm:px-5">
            <MetricTile icon={<Bell className="h-4 w-4" />} label={labels.unreadUpdates} value={String(unreadNotifications)} />
            <MetricTile icon={<Ticket className="h-4 w-4" />} label={labels.openTickets} value={String(openTickets)} />
            <MetricTile icon={<WalletCards className="h-4 w-4" />} label={labels.documents} value={String(documentCount)} />
          </CardBody>
        </Card>
      </motion.section>

      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.1, ease: 'easeOut' }}
      >
        <Card className="border border-divider/60 bg-white/94 shadow-[0_18px_42px_rgba(44,28,9,0.08)]">
          <CardHeader className="flex flex-col items-start gap-1 px-4 pt-4 sm:px-5">
            <h2 className="text-base font-semibold text-foreground">{labels.quickActionsTitle}</h2>
            <p className="text-sm text-default-500">{labels.quickActionsSubtitle}</p>
          </CardHeader>
          <CardBody className="gap-2 px-3 pb-3 pt-2 sm:px-4">
            {menuItems.map((item) => (
              <MenuRow key={item.id} item={item} />
            ))}
          </CardBody>
        </Card>
      </motion.section>

      <motion.section
        id="profile-form"
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.15, ease: 'easeOut' }}
      >
        <Card className="border border-divider/60 bg-white/94 shadow-[0_18px_42px_rgba(44,28,9,0.08)]">
          <CardHeader className="flex flex-col items-start gap-1 px-4 pt-4 sm:px-5">
            <h2 className="text-base font-semibold text-foreground">{labels.personalSectionTitle}</h2>
            <p className="text-sm text-default-500">{labels.personalSectionSubtitle}</p>
          </CardHeader>
          <CardBody className="gap-4 px-4 pb-4 pt-2 sm:px-5">
            <ProfileField
              label={labels.email}
              errorMessage={(submitted || touched.email) && errors.email ? errors.email : undefined}
              isRequired
            >
              <div dir="ltr">
                <Input
                  type="email"
                  aria-label={labels.email}
                  placeholder="name@example.com"
                  value={profile.email}
                  startContent={<Mail className="h-4 w-4 text-default-400" />}
                  isRequired
                  isInvalid={Boolean((submitted || touched.email) && errors.email)}
                  onValueChange={(value) => setProfile((current) => ({ ...current, email: value }))}
                  onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                  classNames={profileInputClassNames}
                />
              </div>
            </ProfileField>

            <ProfileField
              label={labels.phone}
              errorMessage={(submitted || touched.phone) && errors.phone ? errors.phone : undefined}
            >
              <div dir="ltr">
                <Input
                  type="tel"
                  aria-label={labels.phone}
                  placeholder="050-000-0000"
                  value={profile.phone}
                  startContent={<Phone className="h-4 w-4 text-default-400" />}
                  isInvalid={Boolean((submitted || touched.phone) && errors.phone)}
                  onValueChange={(value) => setProfile((current) => ({ ...current, phone: value }))}
                  onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
                  classNames={profileInputClassNames}
                />
              </div>
            </ProfileField>

            <ProfileField label={labels.pushToken} hint={labels.pushTokenHint}>
              <div dir="ltr">
                <Input
                  aria-label={labels.pushToken}
                  value={profile.pushToken || 'לא נשמר'}
                  isReadOnly
                  classNames={profileInputClassNames}
                />
              </div>
            </ProfileField>

            <div className="flex justify-start">
              <Button
                color="primary"
                radius="full"
                isLoading={saving}
                isDisabled={saving || hasErrors}
                startContent={!saving ? <Save className="h-4 w-4" /> : undefined}
                className="h-12 min-w-[156px] bg-[linear-gradient(135deg,rgba(32,24,16,1)_0%,rgba(207,146,50,1)_100%)] px-6 font-semibold text-white shadow-[0_16px_34px_rgba(207,146,50,0.24)]"
                onPress={saveProfile}
              >
                {labels.save}
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.section>

      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
      >
        <Card className="border border-divider/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.95)_100%)] shadow-[0_18px_42px_rgba(44,28,9,0.08)]">
          <CardHeader className="flex flex-col items-start gap-1 px-4 pt-4 sm:px-5">
            <h2 className="text-base font-semibold text-foreground">{labels.accountSectionTitle}</h2>
            <p className="text-sm text-default-500">{labels.accountSectionSubtitle}</p>
          </CardHeader>
          <CardBody className="grid gap-3 px-4 pb-4 pt-2 sm:grid-cols-2 sm:px-5">
            <InfoRow icon={<UserRound className="h-4 w-4 text-default-400" />} label={labels.role} value="Resident" />
            <InfoRow icon={<CreditCard className="h-4 w-4 text-default-400" />} label={labels.unit} value={primaryUnit ? `דירה ${primaryUnit.number}` : 'לא שויך'} />
            <InfoRow icon={<Building2 className="h-4 w-4 text-default-400" />} label={labels.building} value={primaryBuilding?.name || 'לא שויך'} />
            <InfoRow icon={<MapPinned className="h-4 w-4 text-default-400" />} label={labels.address} value={primaryBuilding?.address || 'אין כתובת זמינה'} />
          </CardBody>
        </Card>
      </motion.section>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.24, ease: 'easeOut' }}
      >
        <Button
          color="danger"
          variant="light"
          radius="full"
          startContent={<LogOut className="h-4 w-4" />}
          className="h-12 w-full justify-center border border-danger/15 bg-danger/6 font-semibold text-danger"
          onPress={logout}
        >
          {labels.logout}
        </Button>
      </motion.div>
    </div>
  );
}

const profileInputClassNames = {
  base: 'w-full',
  inputWrapper:
    'min-h-14 rounded-[20px] border border-divider/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] shadow-none',
  input: 'text-left',
  innerWrapper: 'gap-3',
} as const;

function HeroPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-6 top-4 h-24 w-24 rounded-[2rem] bg-white/10" />
      <div className="absolute right-20 top-0 h-20 w-20 rounded-b-full rounded-t-[1.5rem] bg-primary/80" />
      <div className="absolute left-8 top-6 h-16 w-16 rounded-full border-[14px] border-white/18 border-b-transparent border-l-transparent" />
      <div className="absolute left-20 top-16 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute bottom-6 left-0 h-16 w-32 rounded-r-full bg-white/10" />
      <div className="absolute bottom-0 right-14 h-20 w-20 rounded-t-full bg-white/14" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.08))]" />
    </div>
  );
}

function MiniPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-divider/70 bg-muted/55 px-3 py-1.5 text-xs font-medium text-foreground">
      <span className="text-primary">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function ProfileField({
  label,
  hint,
  errorMessage,
  isRequired,
  children,
}: {
  label: string;
  hint?: string;
  errorMessage?: string;
  isRequired?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-sm font-medium text-foreground">
        <span>{label}</span>
        {isRequired ? <span className="text-danger">*</span> : null}
      </div>
      {children}
      {errorMessage ? <p className="text-xs text-danger">{errorMessage}</p> : null}
      {!errorMessage && hint ? <p className="text-xs text-default-500">{hint}</p> : null}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-divider/65 bg-white/80 p-3.5 shadow-[0_12px_26px_rgba(44,28,9,0.05)]">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-default-500">
        {icon}
        <span>{label}</span>
      </div>
      <Divider className="mb-2 opacity-70" />
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function MetricTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-divider/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] p-3 text-center shadow-[0_12px_24px_rgba(44,28,9,0.05)]">
      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/14 bg-primary/8 text-primary">
        {icon}
      </div>
      <div className="text-lg font-black text-foreground">
        <bdi>{value}</bdi>
      </div>
      <div className="mt-1 text-[11px] leading-4 text-default-500">{label}</div>
    </div>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  const toneClass =
    item.accent === 'warning'
      ? 'border-warning/16 bg-warning/8 text-warning'
      : item.accent === 'primary'
        ? 'border-primary/16 bg-primary/10 text-primary'
        : 'border-divider/70 bg-muted/55 text-foreground';

  const content = (
    <div className="group flex min-h-[76px] items-center gap-3 rounded-[24px] border border-divider/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] px-4 py-3 shadow-[0_14px_28px_rgba(44,28,9,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/20">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border ${toneClass}`}>
        {item.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">{item.label}</div>
        <div className="mt-1 text-xs leading-5 text-default-500">{item.description}</div>
      </div>
      <ChevronLeft className="h-4 w-4 shrink-0 text-default-400 transition group-hover:-translate-x-0.5 group-hover:text-primary" strokeWidth={1.85} />
    </div>
  );

  if (item.href) {
    return <Link href={item.href}>{content}</Link>;
  }

  return (
    <button type="button" onClick={item.onPress} className="w-full text-right">
      {content}
    </button>
  );
}
