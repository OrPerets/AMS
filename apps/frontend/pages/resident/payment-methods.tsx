import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CreditCard } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { DetailPanelSkeleton } from '../../components/ui/page-states';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { PrimaryActionCard } from '../../components/ui/primary-action-card';
import { toast } from '../../components/ui/use-toast';
import { triggerHaptic } from '../../lib/mobile';
import { ResidentPaymentMethodsPanel, translateResidentCardBrand, type ResidentPaymentMethod } from '../../components/resident/payment-methods-panel';

type AccountContext = {
  units: Array<{ id: number; number: string; building: { name: string } }>;
};

export default function ResidentPaymentMethodsPage() {
  const router = useRouter();
  const [context, setContext] = useState<AccountContext | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<ResidentPaymentMethod[]>([]);
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoOpenAddFlow, setAutoOpenAddFlow] = useState(false);

  useEffect(() => {
    void loadPage();
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.addCard === '1') {
      setAutoOpenAddFlow(true);
      void router.replace('/resident/payment-methods', undefined, { shallow: true });
    }
  }, [router.isReady, router.query.addCard]);

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

  async function addPaymentMethod(payload: {
    provider: string;
    token: string;
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    networkTokenized?: boolean;
    isDefault?: boolean;
  }) {
    const response = await authFetch('/api/v1/payments/methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      toast({ title: 'שמירת כרטיס נכשלה', variant: 'destructive' });
      throw new Error(await response.text());
    }
    await loadPage();
    triggerHaptic('success');
    toast({
      title: 'הכרטיס נשמר',
      description: 'אמצעי התשלום החדש נוסף לחשבון הדייר.',
    });
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
    toast({ title: 'הכרטיס הראשי עודכן' });
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
    toast({ title: 'הכרטיס הוסר' });
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
      description: enabled ? 'החיובים הבאים יעברו דרך הכרטיס הראשי.' : 'התשלומים נשארים ידניים.',
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
          title={defaultMethod ? `${translateResidentCardBrand(defaultMethod.brand || defaultMethod.provider)} •••• ${defaultMethod.last4 || '••••'}` : 'הוסף כרטיס ראשון'}
          description={defaultMethod ? 'עדכון כרטיסים וחיוב אוטומטי' : 'הוספת כרטיס מהמובייל'}
          ctaLabel={defaultMethod ? 'עבור לתשלומים' : 'הוסף כרטיס'}
          href={defaultMethod ? '/payments/resident' : '/resident/payment-methods?addCard=1'}
          tone="default"
        />
      </div>

      <div className="hidden md:block">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>שיטות תשלום</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>חיוב אוטומטי ואמצעי תשלום</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ResidentPaymentMethodsPanel
              paymentMethods={paymentMethods}
              autopayEnabled={autopayEnabled}
              primaryBuilding={primaryBuilding}
              autoOpenAddFlow={autoOpenAddFlow}
              onAutoOpenHandled={() => setAutoOpenAddFlow(false)}
              onToggleAutopay={toggleAutopay}
              onAddPaymentMethod={addPaymentMethod}
              onSetDefault={setDefaultCard}
              onRemove={removeCard}
              embedded
            />
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              קישורים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
