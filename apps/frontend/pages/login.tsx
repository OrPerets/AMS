import { FormEvent, useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { AlertCircle, ArrowLeft, Lock, LogIn, ShieldCheck, BarChart3, ClipboardList } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PasswordInput } from '../components/ui/password-input';
import { useFormValidation } from '../hooks/use-form-validation';
import { getDefaultRoute, getTokenPayload, login, shouldRouteToWorkerHub } from '../lib/auth';
import { useDirection, useLocale } from '../lib/providers';

export default function LoginPage() {
  const router = useRouter();
  const { direction, setDirection } = useDirection();
  const { locale, setLocale, t } = useLocale();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const year = useMemo(() => new Date().getFullYear(), []);
  const emailRef = useRef<HTMLInputElement>(null);

  const validators = useMemo(() => ({
    email: (value: string) => {
      const v = value.trim();
      if (!v) return t('login.error.emailRequired');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return t('login.error.emailInvalid');
      return '';
    },
    password: (value: string) => {
      if (value.length < 6) return t('login.error.passwordShort');
      return '';
    },
  }), [t]);

  const form = useFormValidation({
    initialValues: { email: '', password: '' },
    validators,
    validateOn: 'blur',
  });

  const onSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!form.validate()) return;

    const normalizedEmail = form.values.email.trim().toLowerCase();
    setLoading(true);

    try {
      await login(normalizedEmail, form.values.password);
      const payload = getTokenPayload();
      const next = typeof router.query.next === 'string' ? router.query.next : undefined;
      const role = payload?.actAsRole || payload?.role;
      const defaultRoute = shouldRouteToWorkerHub(role) ? '/worker-hub' : getDefaultRoute(role);
      const destination = next || defaultRoute;

      router.replace(destination);
    } catch (err: any) {
      const msg = err?.message || t('login.error.generic');
      setServerError(msg);
      emailRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }, [form, router, t]);

  const toggleLocale = () => {
    setDirection(direction === 'rtl' ? 'ltr' : 'rtl');
    setLocale(locale === 'he' ? 'en' : 'he');
  };

  const trustCards = [
    {
      icon: ShieldCheck,
      title: t('login.enterprise.secureAccess'),
      description: t('login.enterprise.secureAccessDesc'),
    },
    {
      icon: BarChart3,
      title: t('login.enterprise.operationalControl'),
      description: t('login.enterprise.operationalControlDesc'),
    },
    {
      icon: ClipboardList,
      title: t('login.enterprise.auditTrail'),
      description: t('login.enterprise.auditTrailDesc'),
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(201,156,72,0.12),_transparent_30%),linear-gradient(180deg,_rgba(250,247,240,0.96),_rgba(245,240,230,0.82))] px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] sm:min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-6 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr]">

        {/* Trust panel — visible on large screens beside the form, stacked above on mobile */}
        <div className="hidden lg:flex flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {t('login.title')}
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base leading-relaxed">
              {t('login.description')}
            </p>
          </div>

          <div className="grid gap-4">
            {trustCards.map((card, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-2xl border border-primary/10 bg-background/80 p-5 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <card.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">{card.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login form card */}
        <Card variant="featured" className="mx-auto w-full max-w-xl rounded-2xl sm:rounded-[28px] border-primary/20">
          <CardHeader className="space-y-3 sm:space-y-4 pb-4 sm:pb-6 text-center">
            <div className="mx-auto inline-flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/12 text-primary">
              <ShieldCheck className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <CardTitle className="text-xl sm:text-2xl">{t('login.formTitle')}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t('login.formDescription')}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5" noValidate>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">{t('login.emailLabel')}</Label>
                <Input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  value={form.values.email}
                  onChange={(e) => form.setFieldValue('email', e.target.value)}
                  onBlur={() => form.handleBlur('email')}
                  placeholder="name@company.com"
                  autoComplete="email"
                  error={!!form.getFieldError('email')}
                  startIcon={<ArrowLeft className="h-4 w-4" />}
                  aria-invalid={!!form.getFieldError('email') || undefined}
                />
                {form.getFieldError('email') ? (
                  <p className="text-xs text-destructive" role="alert">{form.getFieldError('email')}</p>
                ) : null}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm">{t('login.passwordLabel')}</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={form.values.password}
                  onChange={(e) => form.setFieldValue('password', e.target.value)}
                  onBlur={() => form.handleBlur('password')}
                  placeholder={t('login.passwordPlaceholder')}
                  autoComplete="current-password"
                  error={!!form.getFieldError('password')}
                  showLabel={t('login.showPassword')}
                  hideLabel={t('login.hidePassword')}
                  aria-invalid={!!form.getFieldError('password') || undefined}
                />
                {form.getFieldError('password') ? (
                  <p className="text-xs text-destructive" role="alert">{form.getFieldError('password')}</p>
                ) : null}
              </div>

              {serverError ? (
                <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-destructive/20 bg-destructive/10 p-3 sm:p-4 text-xs sm:text-sm text-destructive" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="space-y-1">
                    <span>{serverError}</span>
                    <p className="text-destructive/75">{t('login.recoveryHint')}</p>
                  </div>
                </div>
              ) : null}

              <Button type="submit" loading={loading} className="w-full">
                <LogIn className="me-2 h-4 w-4" />
                {loading ? t('login.submitting') : t('login.submit')}
              </Button>

              {/* Enterprise SSO placeholder */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-subtle-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-[11px] text-muted-foreground">
                    {t('login.enterprise.ssoPlaceholder')}
                  </span>
                </div>
              </div>

              {/* Support/trust note */}
              <div className="flex items-start gap-3 rounded-xl sm:rounded-[22px] border border-subtle-border bg-muted/50 p-3 sm:p-4">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('login.supportNote')}
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Mobile trust cards — below form on small screens */}
        <div className="flex flex-col gap-3 lg:hidden">
          {trustCards.map((card, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-xl border border-primary/10 bg-background/80 p-4 shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <card.icon className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground">{card.title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 sm:mt-6 text-center text-[11px] sm:text-xs text-muted-foreground">
        © {year} {t('app.shortName')}. {t('login.footer')}
      </div>
    </div>
  );
}
