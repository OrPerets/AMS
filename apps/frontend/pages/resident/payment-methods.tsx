import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { PrimaryActionCard } from '../../components/ui/primary-action-card';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../components/ui/use-toast';
import { triggerHaptic } from '../../lib/mobile';

type AccountContext = {
  units: Array<{ id: number; number: string; building: { name: string } }>;
};

type PaymentMethod = {
  id: number;
  provider: string;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  isDefault: boolean;
  networkTokenized: boolean;
};

function translateCardBrand(value?: string | null) {
  const labels: Record<string, string> = {
    visa: 'ויזה',
    mastercard: 'מאסטרקארד',
    ישראכרט: 'ישראכרט',
    isracard: 'ישראכרט',
    amex: 'אמריקן אקספרס',
    diners: 'דיינרס',
    tranzila: 'טרנזילה',
    stripe: 'סטרייפ',
  };
  if (!value) return 'כרטיס שמור';
  return labels[value.toLowerCase()] || value;
}

export default function ResidentPaymentMethodsPage() {
  const [context, setContext] = useState<AccountContext | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);
      const [contextRes, methodsRes, autopayRes] = await Promise.all([
        authFetch('/api/v1/users/account'),
        authFetch('/api/v1/payments/methods'),
        authFetch('/api/v1/payments/autopay'),
      ]);

      if (!contextRes.ok) {
        throw new Error(await contextRes.text());
      }

      setContext(await contextRes.json());
      setPaymentMethods(methodsRes.ok ? await methodsRes.json() : []);

      if (autopayRes.ok) {
        const prefs = await autopayRes.json();
        setAutopayEnabled(Boolean(prefs.autopayEnabled));
      }
    } catch (nextError) {
      console.error(nextError);
      setError('לא ניתן לטעון כרגע את אמצעי התשלום. נסו שוב בעוד רגע.');
    } finally {
      setLoading(false);
    }
  }

  async function setDefaultCard(id: number) {
    const response = await authFetch(`/api/v1/payments/methods/${id}/default`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      toast({ title: 'עדכון ברירת מחדל נכשל', variant: 'destructive' });
      return;
    }
    await loadPage();
  }

  async function removeCard(id: number) {
    const response = await authFetch(`/api/v1/payments/methods/${id}/remove`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      toast({ title: 'מחיקת כרטיס נכשלה', variant: 'destructive' });
      return;
    }
    await loadPage();
  }

  async function toggleAutopay(enabled: boolean) {
    const response = await authFetch('/api/v1/payments/autopay', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (!response.ok) {
      toast({ title: 'עדכון חיוב אוטומטי נכשל', variant: 'destructive' });
      return;
    }
    setAutopayEnabled(enabled);
    triggerHaptic('success');
    toast({
      title: enabled ? 'חיוב אוטומטי הופעל' : 'חיוב אוטומטי הושהה',
      description: enabled ? 'חשבוניות עתידיות יחויבו דרך הכרטיס הראשי השמור שלך.' : 'תשלומים יישארו ידניים עד להפעלה מחדש.',
    });
  }

  const primaryBuilding = useMemo(() => context?.units[0]?.building?.name, [context]);
  const defaultMethod = useMemo(() => paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0] ?? null, [paymentMethods]);

  if (loading) return <DetailPanelSkeleton />;
  if (error || !context) {
    return <InlineErrorPanel title="שיטות התשלום לא נטענו" description={error || 'לא נמצאו נתונים'} onRetry={() => void loadPage()} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 md:hidden">
        <CompactStatusStrip
          roleLabel={primaryBuilding ? `דייר · ${primaryBuilding}` : 'דייר'}
          icon={<CreditCard className="h-4 w-4" strokeWidth={1.75} />}
          metrics={[
            { id: 'cards', label: 'כרטיסים', value: paymentMethods.length, tone: paymentMethods.length ? 'success' : 'warning' },
            { id: 'autopay', label: 'אוטומטי', value: autopayEnabled ? 'פעיל' : 'ידני', tone: autopayEnabled ? 'success' : 'default' },
          ]}
        />

        <PrimaryActionCard
          eyebrow="כרטיס ראשי"
          title={defaultMethod ? `${translateCardBrand(defaultMethod.brand || defaultMethod.provider)} •••• ${defaultMethod.last4 || '••••'}` : 'אין עדיין כרטיס שמור'}
          description={defaultMethod ? 'אפשר לעדכן ברירת מחדל, להסיר כרטיסים או להפעיל חיוב אוטומטי במסך הזה.' : 'כדי להוסיף כרטיס חדש אפשר ליצור קשר עם צוות הגבייה.'}
          ctaLabel={defaultMethod ? 'עבור לתשלומים' : 'פנה לתמיכה'}
          href={defaultMethod ? '/payments/resident' : '/support'}
          tone={defaultMethod ? 'default' : 'warning'}
        />
      </div>

      <div className="hidden md:block">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>שיטות תשלום</CardTitle>
            <CardDescription>מסך ממוקד לכרטיסים שמורים, ברירת מחדל וחיוב אוטומטי.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              חיוב אוטומטי ואמצעי תשלום
            </CardTitle>
            <CardDescription>איך הכרטיס נשמר ומתי המערכת תחייב אוטומטית.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[22px] border border-subtle-border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">חיוב אוטומטי</div>
                  <div className="text-sm leading-6 text-muted-foreground">
                    כשהאפשרות פעילה, חשבוניות עתידיות יחויבו דרך הכרטיס הראשי שנשמר אצל ספק הסליקה.
                  </div>
                  <div className="text-xs text-tertiary">אפשר להשהות בכל רגע. פרטי הכרטיס המלאים אינם נשמרים במסך הזה.</div>
                </div>
                <Switch checked={autopayEnabled} onCheckedChange={(checked) => void toggleAutopay(checked)} aria-label="הפעלת חיוב אוטומטי" />
              </div>
            </div>

            {paymentMethods.length ? (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="rounded-[22px] border border-subtle-border bg-background p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground">
                          {translateCardBrand(method.brand || method.provider)} •••• {method.last4 || '••••'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          תוקף {method.expMonth || '--'}/{method.expYear || '--'}{method.networkTokenized ? ' · נשמר בצורה מאובטחת' : ''}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {method.isDefault ? (
                          <Badge variant="success">כרטיס ראשי</Badge>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => void setDefaultCard(method.id)}>
                            קבע כברירת מחדל
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => void removeCard(method.id)}>
                          הסר
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                type="action"
                size="sm"
                title="עדיין אין כרטיס שמור"
                description="כדי להפעיל חיוב אוטומטי בצורה מאובטחת נדרש קודם להוסיף אמצעי תשלום דרך הטופס המאובטח של צוות הגבייה."
                action={{ label: 'פתח פנייה לצוות', onClick: () => window.location.assign('/support'), variant: 'outline' }}
              />
            )}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              מה אפשר לעשות מכאן
            </CardTitle>
            <CardDescription>המשך ישיר למסכים שקשורים לאמצעי התשלום שלך.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-[22px] border border-subtle-border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
              הכרטיס הראשי משמש לחיוב אוטומטי של חשבוניות עתידיות. אם אין כרטיס שמור, התשלומים יישארו ידניים ותוכל להשלים אותם ממסך התשלומים.
            </div>
            <Button asChild>
              <Link href="/payments/resident">למסך התשלומים</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/resident/building">לפרטי הבניין</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/support">צור קשר עם תמיכה</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
