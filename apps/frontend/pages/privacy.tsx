import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useLocale } from '../lib/providers';

export default function PrivacyPage() {
  const { t } = useLocale();
  const sections = [
    { title: t('legal.privacy.collectionTitle'), body: t('legal.privacy.collectionBody') },
    { title: t('legal.privacy.usageTitle'), body: t('legal.privacy.usageBody') },
    { title: t('legal.privacy.accessTitle'), body: t('legal.privacy.accessBody') },
    { title: t('legal.privacy.securityTitle'), body: t('legal.privacy.securityBody') },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('legal.privacyTitle')}</h1>
        <p className="text-muted-foreground">{t('legal.privacyDescription')}</p>
      </div>
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">{section.body}</CardContent>
        </Card>
      ))}
    </div>
  );
}
