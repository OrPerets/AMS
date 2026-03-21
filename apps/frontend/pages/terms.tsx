import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useLocale } from '../lib/providers';

export default function TermsPage() {
  const { t } = useLocale();
  const terms = [t('legal.terms.1'), t('legal.terms.2'), t('legal.terms.3'), t('legal.terms.4'), t('legal.terms.5')];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('legal.termsTitle')}</h1>
        <p className="text-muted-foreground">{t('legal.termsDescription')}</p>
      </div>
      {terms.map((term, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{t('legal.terms.section', { index: index + 1 })}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">{term}</CardContent>
        </Card>
      ))}
    </div>
  );
}
