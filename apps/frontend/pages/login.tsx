import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { AlertCircle, ArrowLeft, Building2, Globe, LogIn, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { StatusBadge } from '../components/ui/status-badge';
import { getDefaultRoute, getTokenPayload, login } from '../lib/auth';
import { useDirection, useLocale } from '../lib/providers';

export default function LoginPage() {
  const router = useRouter();
  const { direction, setDirection } = useDirection();
  const { locale, setLocale, t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const year = useMemo(() => new Date().getFullYear(), []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.length === 0) {
      setError(t('login.error.emailRequired'));
      return;
    }

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) === false) {
      setError(t('login.error.emailInvalid'));
      return;
    }

    if (password.length < 6) {
      setError(t('login.error.passwordShort'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(normalizedEmail, password);
      const payload = getTokenPayload();
      if (payload && payload.role === 'MASTER') {
        const next = typeof router.query.next === 'string' ? router.query.next : undefined;
        router.replace(`/role-selection${next ? `?next=${encodeURIComponent(next)}` : ''}`);
        return;
      }

      const next = typeof router.query.next === 'string' ? router.query.next : getDefaultRoute();
      router.replace(next);
    } catch (err: any) {
      setError(err?.message || t('login.error.generic'));
    } finally {
      setLoading(false);
    }
  }

  const toggleLocale = () => {
    setDirection(direction === 'rtl' ? 'ltr' : 'rtl');
    setLocale(locale === 'he' ? 'en' : 'he');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(201,156,72,0.14),_transparent_28%),linear-gradient(180deg,_rgba(250,247,240,0.96),_rgba(245,240,230,0.82))] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">

        <Card variant="featured" className="mx-auto w-full max-w-xl rounded-[32px] border-primary/20">
          <CardHeader className="space-y-4 pb-6 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-primary">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl">{t('login.formTitle')}</CardTitle>
              <CardDescription>{t('login.formDescription')}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t('login.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  error={typeof error === 'string'}
                  startIcon={<ArrowLeft className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('login.passwordLabel')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  autoComplete="current-password"
                  error={typeof error === 'string'}
                />
              </div>

              {error ? (
                <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                <LogIn className="me-2 h-4 w-4" />
                {loading ? t('login.submitting') : t('login.submit')}
              </Button>

              <div className="rounded-[24px] border border-subtle-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                {t('login.supportNote')}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        © {year} {t('app.shortName')}. {t('login.footer')}
      </div>
    </div>
  );
}
