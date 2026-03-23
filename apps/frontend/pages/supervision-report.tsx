import { useEffect } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { EXTERNAL_SUPERVISION_REPORT_URL } from '../lib/auth';
import { useDirection, useLocale } from '../lib/providers';

export default function SupervisionReportRedirectPage() {
  const { direction } = useDirection();
  const { t } = useLocale();

  useEffect(() => {
    window.location.replace(EXTERNAL_SUPERVISION_REPORT_URL);
  }, []);

  return (
    <main
      dir={direction}
      className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(201,156,72,0.16),_transparent_28%),linear-gradient(180deg,_rgba(250,247,240,0.98),_rgba(245,240,230,0.9))] px-4 py-10"
    >
      <Card variant="featured" className="w-full max-w-xl border-primary/20 text-center shadow-[0_35px_100px_-60px_rgba(0,0,0,0.45)]">
        <CardHeader className="space-y-4">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">{t('roleSelection.redirectTitle')}</CardTitle>
            <CardDescription className="text-sm leading-7 sm:text-base">
              {t('roleSelection.redirectDescription')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a href={EXTERNAL_SUPERVISION_REPORT_URL} target="_blank" rel="noreferrer noopener">
              <ExternalLink className="me-2 h-4 w-4" />
              {t('roleSelection.redirectCta')}
            </a>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
