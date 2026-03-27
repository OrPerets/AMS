import Link from 'next/link';
import { FormEvent, useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { AlertCircle, ArrowLeft, Lock, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { FormActionHint, FormErrorSummary, FormField } from '../components/ui/form-field';
import { Input } from '../components/ui/input';
import { PasswordInput } from '../components/ui/password-input';
import { GlassSurface } from '../components/ui/glass-surface';
import { useFormValidation } from '../hooks/use-form-validation';
import { getTokenPayload, login } from '../lib/auth';
import { resolvePostLoginRoute } from '../lib/route-resolver';
import { useDirection, useLocale } from '../lib/providers';
import { trackLoginSuccess, trackLoginFailed } from '../lib/analytics';
import { showLoginSuccess } from '../lib/success-feedback';

export default function LoginPage() {
  const router = useRouter();
  const { direction } = useDirection();
  const { t } = useLocale();
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
      const portal = router.query.portal === 'resident' || router.query.portal === 'worker'
        ? router.query.portal
        : undefined;
      const role = payload?.actAsRole || payload?.role;
      const resolution = resolvePostLoginRoute({
        isAuthenticated: true,
        role,
        next: next ?? null,
        portal,
      });
      const destination = resolution.destination;

      trackLoginSuccess(role);
      // showLoginSuccess(role);
      router.replace(destination);
    } catch (err: any) {
      const msg = err?.message || t('login.error.generic');
      trackLoginFailed(msg);
      setServerError(msg);
      emailRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }, [form, router, t]);

  const trustPoints = [
    t('login.trustPointOne'),
    t('login.trustPointTwo'),
    t('login.trustPointThree'),
  ];
  const submitBlocked = form.hasErrors;

  return (
    <main dir={direction} className="mobile-entry-shell">
      <div className="mobile-entry-grid">
        <div className="grid w-full items-center gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
          <section className="order-2 hidden space-y-3 sm:block lg:order-1 lg:space-y-5">
            <div className="inline-flex w-fit items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:text-sm">
              {t('login.eyebrow')}
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t('login.title')}
              </h1>
              <p className="max-w-xl text-[13px] leading-6 text-muted-foreground sm:text-base sm:leading-8">
                {t('login.description')}
              </p>
            </div>

            <div className="grid gap-2.5 md:grid-cols-3 lg:grid-cols-1 lg:gap-3">
              {trustPoints.map((point, index) => (
                <GlassSurface key={point} className="rounded-[26px] p-3 sm:p-4">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary sm:mb-3 sm:h-10 sm:w-10 sm:rounded-2xl">
                    {index === 0 ? <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" /> : index === 1 ? <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" /> : <Lock className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </div>
                  <p className="text-[13px] leading-5 text-foreground sm:text-sm sm:leading-6">{point}</p>
                </GlassSurface>
              ))}
            </div>
          </section>

          <Card variant="featured" className="mobile-entry-card order-1 mx-auto w-full max-w-xl border-primary/20 lg:order-2">
            <CardHeader className="space-y-3 pb-3 text-center sm:space-y-5 sm:pb-6">
              <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-primary sm:h-14 sm:w-14">
                <LogIn className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-xl sm:text-[2rem]">{t('login.formTitle')}</CardTitle>
                <CardDescription className="mx-auto max-w-md text-sm leading-7 text-muted-foreground">
                  {t('login.formDescription')}
                </CardDescription>
              </div>
             
            </CardHeader>

            <CardContent>
              <form onSubmit={onSubmit} className="space-y-5" noValidate>
                <FormErrorSummary
                  errors={form.visibleErrorList}
                  fieldLabels={{
                    email: t('login.emailLabel'),
                    password: t('login.passwordLabel'),
                  }}
                  sticky
                />
                <FormField
                  label={t('login.emailLabel')}
                  fieldKey="email"
                  error={form.getFieldError('email')}
                  required
                >
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
                    className="h-12 rounded-2xl text-base"
                  />
                </FormField>

                <FormField
                  label={t('login.passwordLabel')}
                  fieldKey="password"
                  error={form.getFieldError('password')}
                  required
                >
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
                    className="h-12 rounded-2xl text-base"
                  />
                </FormField>

                {serverError ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="space-y-1">
                      <span>{serverError}</span>
                      <p className="text-destructive/75">{t('login.recoveryHint')}</p>
                    </div>
                  </div>
                ) : null}

                <Button type="submit" loading={loading} disabled={submitBlocked} size="xl" className="w-full text-base">
                  <LogIn className="me-2 h-4 w-4" />
                  {loading ? t('login.submitting') : t('login.submit')}
                </Button>
                {!loading && submitBlocked ? (
                  <FormActionHint className="text-center">
                    מלא אימייל תקין וסיסמה באורך מינימלי כדי להתחבר.
                  </FormActionHint>
                ) : null}


                <div className="text-center text-sm text-muted-foreground">
                  <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
                    {t('login.backToLanding')}
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4 text-center text-[11px] text-muted-foreground sm:text-xs">
        © {year} {t('app.shortName')}. {t('login.footer')}
      </div>
    </main>
  );
}
