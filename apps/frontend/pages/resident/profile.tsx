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
import { ResidentHero } from '../../components/resident/resident-hero';
import { residentScreenMotion } from '../../components/resident/motion';
import { ResidentListCard } from '../../components/ui/resident-list-card';
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
  pageSubtitle: '',
  residentBadge: 'חשבון דייר',
  heroHint: 'מרכז השליטה האישי',
  quickActionsTitle: 'גישה מהירה',
  quickActionsSubtitle: '',
  personalSectionTitle: 'פרטי קשר',
  personalSectionSubtitle: '',
  accountSectionTitle: 'שיוך וסטטוס',
  accountSectionSubtitle: '',
  role: 'תפקיד',
  unit: 'דירה',
  building: 'בניין',
  address: 'כתובת',
  email: 'אימייל',
  phone: 'טלפון',
  pushToken: 'מזהה מכשיר',
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
  statusCardSubtitle: '',
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
      description: 'אימייל וטלפון',
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
      description: 'חיובים וכרטיסים',
      href: '/payments/resident',
      icon: <WalletCards className="h-5 w-5" strokeWidth={1.85} />,
      accent: unreadNotifications > 0 ? 'warning' : 'default',
    },
    {
      id: 'building',
      label: 'הבניין שלי',
      description: 'אנשי קשר וכתובת',
      href: '/resident/building',
      icon: <Building2 className="h-5 w-5" strokeWidth={1.85} />,
    },
    {
      id: 'requests',
      label: 'בקשות ועדכוני שירות',
      description: 'מעקב ובקשות',
      href: '/resident/requests?view=history',
      icon: <Ticket className="h-5 w-5" strokeWidth={1.85} />,
      accent: openTickets > 0 ? 'warning' : 'default',
    },
    {
      id: 'settings',
      label: 'הגדרות והעדפות',
      description: 'שפה והתראות',
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
        {...residentScreenMotion(Boolean(reducedMotion))}
      >
        <ResidentHero
          eyebrow={labels.heroHint}
          title={labels.pageTitle}
          subtitle={labels.pageSubtitle || undefined}
          badge={
            <Chip radius="full" variant="flat" className="border border-white/14 bg-white/12 px-3 text-white">
              {labels.residentBadge}
            </Chip>
          }
          floatingCard={
            <div className="flex items-center gap-4">
              <Avatar
                name={displayName}
                className="h-24 w-24 shrink-0 border-4 border-white bg-[radial-gradient(circle_at_30%_30%,rgba(255,227,179,0.9),rgba(217,154,47,0.9)_42%,rgba(76,52,19,1)_100%)] text-white shadow-[0_18px_34px_rgba(207,146,50,0.34)]"
                icon={<UserRound className="h-10 w-10" />}
              />
              <div className="min-w-0 flex-1 text-right">
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
          }
        />
      </motion.section>

      <motion.section
        {...residentScreenMotion(Boolean(reducedMotion), 0.05)}
      >
        <Card className="glass-surface-strong rounded-[30px]">
          <CardHeader className="flex w-full flex-col items-end gap-1 px-4 pt-4 text-right sm:px-5">
            <h2 className="w-full text-right text-base font-semibold text-foreground">{labels.statusCardTitle}</h2>
            {labels.statusCardSubtitle ? <p className="w-full text-right text-sm text-default-500">{labels.statusCardSubtitle}</p> : null}
          </CardHeader>
          <CardBody className="grid grid-cols-3 gap-3 px-4 pb-4 pt-2 text-right sm:px-5">
            <MetricTile icon={<Bell className="h-4 w-4" />} label={labels.unreadUpdates} value={String(unreadNotifications)} />
            <MetricTile icon={<Ticket className="h-4 w-4" />} label={labels.openTickets} value={String(openTickets)} />
            <MetricTile icon={<WalletCards className="h-4 w-4" />} label={labels.documents} value={String(documentCount)} />
          </CardBody>
        </Card>
      </motion.section>

      <motion.section
        {...residentScreenMotion(Boolean(reducedMotion), 0.1)}
      >
        <Card className="glass-surface-strong rounded-[30px]">
          <CardHeader className="flex w-full flex-col items-end gap-1 px-4 pt-4 text-right sm:px-5">
            <h2 className="w-full text-right text-base font-semibold text-foreground">{labels.quickActionsTitle}</h2>
            {labels.quickActionsSubtitle ? <p className="w-full text-right text-sm text-default-500">{labels.quickActionsSubtitle}</p> : null}
          </CardHeader>
          <CardBody className="gap-2 px-3 pb-3 pt-2 text-right sm:px-4">
            {menuItems.map((item) => (
              <MenuRow key={item.id} item={item} />
            ))}
          </CardBody>
        </Card>
      </motion.section>

      <motion.section
        id="profile-form"
        {...residentScreenMotion(Boolean(reducedMotion), 0.15)}
      >
        <Card className="glass-surface-strong rounded-[30px]">
          <CardHeader className="flex w-full flex-col items-end gap-1 px-4 pt-4 text-right sm:px-5">
            <h2 className="w-full text-right text-base font-semibold text-foreground">{labels.personalSectionTitle}</h2>
            {labels.personalSectionSubtitle ? <p className="w-full text-right text-sm text-default-500">{labels.personalSectionSubtitle}</p> : null}
          </CardHeader>
          <CardBody className="gap-4 px-4 pb-4 pt-2 text-right sm:px-5">
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

            <ProfileField label={labels.pushToken}>
              <div dir="ltr">
                <Input
                  aria-label={labels.pushToken}
                  value={profile.pushToken || 'לא נשמר'}
                  isReadOnly
                  classNames={profileInputClassNames}
                />
              </div>
            </ProfileField>

            <div className="flex justify-end">
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
        {...residentScreenMotion(Boolean(reducedMotion), 0.2)}
      >
        <Card className="glass-surface-strong rounded-[30px]">
          <CardHeader className="flex w-full flex-col items-end gap-1 px-4 pt-4 text-right sm:px-5">
            <h2 className="w-full text-right text-base font-semibold text-foreground">{labels.accountSectionTitle}</h2>
            {labels.accountSectionSubtitle ? <p className="w-full text-right text-sm text-default-500">{labels.accountSectionSubtitle}</p> : null}
          </CardHeader>
          <CardBody className="grid gap-3 px-4 pb-4 pt-2 text-right sm:grid-cols-2 sm:px-5">
            <InfoRow icon={<UserRound className="h-4 w-4 text-default-400" />} label={labels.role} value="Resident" />
            <InfoRow icon={<CreditCard className="h-4 w-4 text-default-400" />} label={labels.unit} value={primaryUnit ? `דירה ${primaryUnit.number}` : 'לא שויך'} />
            <InfoRow icon={<Building2 className="h-4 w-4 text-default-400" />} label={labels.building} value={primaryBuilding?.name || 'לא שויך'} />
            <InfoRow icon={<MapPinned className="h-4 w-4 text-default-400" />} label={labels.address} value={primaryBuilding?.address || 'אין כתובת זמינה'} />
          </CardBody>
        </Card>
      </motion.section>

      <motion.div
        {...residentScreenMotion(Boolean(reducedMotion), 0.24)}
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

function MiniPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-divider/70 bg-muted/55 px-3 py-1.5 text-right text-xs font-medium text-foreground">
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
    <div className="space-y-2 text-right">
      <div className="flex items-center justify-end gap-1 text-sm font-medium text-foreground">
        <span>{label}</span>
        {isRequired ? <span className="text-danger">*</span> : null}
      </div>
      {children}
      {errorMessage ? <p className="text-right text-xs text-danger">{errorMessage}</p> : null}
      {!errorMessage && hint ? <p className="text-right text-xs text-default-500">{hint}</p> : null}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-divider/65 bg-white/80 p-3.5 text-right shadow-[0_12px_26px_rgba(44,28,9,0.05)]">
      <div className="mb-2 flex items-center justify-end gap-2 text-xs font-medium text-default-500">
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
    <div className="rounded-[22px] border border-divider/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)] p-3 text-right shadow-[0_12px_24px_rgba(44,28,9,0.05)]">
      <div className="mb-2 flex justify-end">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/14 bg-primary/8 text-primary">
          {icon}
        </span>
      </div>
      <div className="text-lg font-black text-foreground">
        <bdi>{value}</bdi>
      </div>
      <div className="mt-1 text-[11px] leading-4 text-default-500">{label}</div>
    </div>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  if (item.href) {
    return (
      <ResidentListCard
        href={item.href}
        title={item.label}
        subtitle={item.description}
        icon={resolveMenuIcon(item.id)}
        accent={item.accent === 'warning' ? 'warning' : item.accent === 'primary' ? 'default' : 'info'}
        endSlot={<ChevronLeft className="h-4 w-4 shrink-0 text-default-400" strokeWidth={1.85} />}
      />
    );
  }

  return (
    <ResidentListCard
      onClick={item.onPress}
      title={item.label}
      subtitle={item.description}
      icon={resolveMenuIcon(item.id)}
      accent={item.accent === 'warning' ? 'warning' : item.accent === 'primary' ? 'default' : 'info'}
      endSlot={<ChevronLeft className="h-4 w-4 shrink-0 text-default-400" strokeWidth={1.85} />}
    />
  );
}

function resolveMenuIcon(id: string) {
  switch (id) {
    case 'details':
      return UserRound;
    case 'payments':
      return WalletCards;
    case 'building':
      return Building2;
    case 'requests':
      return Ticket;
    default:
      return Settings2;
  }
}
