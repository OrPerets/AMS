import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Building2, Flower2, ShieldCheck, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useDirection, useLocale } from '../lib/providers';

function buildLoginHref(query: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === 'string' && value.length > 0) {
      params.set(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => params.append(key, item));
    }
  });

  const search = params.toString();
  return search ? `/login?${search}` : '/login';
}

export default function LandingPage() {
  const router = useRouter();
  const { direction } = useDirection();
  const { t } = useLocale();
  const loginHref = buildLoginHref(router.query);

  const audienceCards = [
    {
      icon: Users,
      title: t('landing.audience.residentsTitle'),
      description: t('landing.audience.residentsDescription'),
    },
    {
      icon: Building2,
      title: t('landing.audience.managementTitle'),
      description: t('landing.audience.managementDescription'),
    },
    {
      icon: Flower2,
      title: t('landing.audience.gardensTitle'),
      description: t('landing.audience.gardensDescription'),
    },
  ];

  return (
    <main
      dir={direction}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(201,156,72,0.18),_transparent_30%),linear-gradient(180deg,_#faf7f0_0%,_#f3ecdf_52%,_#efe4d1_100%)] px-4 py-4 sm:px-6 sm:py-6"
    >
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col justify-center gap-6 sm:min-h-[calc(100vh-3rem)] sm:gap-8">
        <Card variant="featured" className="overflow-hidden border-primary/15 bg-background/95 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.35)]">
          <CardContent className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:p-10">
            <section className="space-y-5 sm:space-y-6">
              <div className="inline-flex w-fit items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:text-sm">
                {t('landing.eyebrow')}
              </div>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  {t('landing.title')}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
                  {t('landing.description')}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild size="xl" className="w-full sm:w-auto">
                  <Link href={loginHref}>
                    {t('landing.cta.enterSystem')}
                    <ArrowLeft className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="flex items-center text-sm text-muted-foreground">
                  <ShieldCheck className="me-2 h-4 w-4 text-primary" />
                  {t('landing.securityNote')}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {audienceCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm"
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-sm font-semibold text-foreground sm:text-base">{card.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="rounded-[28px] border border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,245,235,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-primary">{t('landing.quickStart.eyebrow')}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">{t('landing.quickStart.title')}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('landing.quickStart.description')}</p>
                </div>

                <ol className="space-y-3">
                  {[1, 2, 3].map((step) => (
                    <li key={step} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/80 p-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                        {step}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{t(`landing.quickStart.step${step}Title`)}</div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{t(`landing.quickStart.step${step}Description`)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
