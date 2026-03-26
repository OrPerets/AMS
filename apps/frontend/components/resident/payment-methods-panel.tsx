import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarClock, CheckCircle2, ChevronLeft, CreditCard, Plus, ShieldCheck, Sparkles, Trash2, WalletCards } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { EmptyState } from '../ui/empty-state';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { AmsDrawer } from '../ui/ams-drawer';
import { ResidentPaymentTrustStrip } from './resident-payment-trust-strip';
import { cn } from '../../lib/utils';

export type ResidentPaymentMethod = {
  id: number;
  provider: string;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  isDefault: boolean;
  networkTokenized: boolean;
};

type NewPaymentMethodPayload = {
  provider: string;
  token: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  networkTokenized?: boolean;
  isDefault?: boolean;
};

type ResidentPaymentMethodsPanelProps = {
  paymentMethods: ResidentPaymentMethod[];
  autopayEnabled: boolean;
  primaryBuilding?: string;
  autoOpenAddFlow?: boolean;
  onAutoOpenHandled?: () => void;
  onToggleAutopay: (enabled: boolean) => Promise<void> | void;
  onAddPaymentMethod: (payload: NewPaymentMethodPayload) => Promise<void>;
  onSetDefault: (id: number) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
  supportHref?: string;
  embedded?: boolean;
};

type AddCardStep = 1 | 2 | 3;

function inputClassName(hasError = false) {
  return cn(
    'h-12 rounded-[18px] bg-white text-right text-foreground placeholder:text-muted-foreground focus-visible:ring-[rgba(224,182,89,0.28)] focus-visible:ring-offset-0',
    hasError ? 'border-destructive/32 focus-visible:ring-destructive/20' : 'border-subtle-border',
  );
}

function inferBrand(cardNumber: string) {
  const sanitized = cardNumber.replace(/\D/g, '');
  if (sanitized.startsWith('4')) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(sanitized)) return 'mastercard';
  if (/^3[47]/.test(sanitized)) return 'amex';
  if (/^(36|38|30[0-5])/.test(sanitized)) return 'diners';
  return 'credit-card';
}

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function translateResidentCardBrand(value?: string | null) {
  const labels: Record<string, string> = {
    visa: 'ויזה',
    mastercard: 'מאסטרקארד',
    isracard: 'ישראכרט',
    amex: 'אמריקן אקספרס',
    diners: 'דיינרס',
    tranzila: 'טרנזילה',
    stripe: 'סטרייפ',
    'credit-card': 'כרטיס אשראי',
  };
  if (!value) return 'כרטיס שמור';
  return labels[value.toLowerCase()] || value;
}

export function ResidentPaymentMethodsPanel({
  paymentMethods,
  autopayEnabled,
  primaryBuilding,
  autoOpenAddFlow = false,
  onAutoOpenHandled,
  onToggleAutopay,
  onAddPaymentMethod,
  onSetDefault,
  onRemove,
  supportHref = '/support',
  embedded = false,
}: ResidentPaymentMethodsPanelProps) {
  const reducedMotion = useReducedMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [step, setStep] = useState<AddCardStep>(1);
  const [holderName, setHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ holderName?: string; cardNumber?: string; expiry?: string }>({});
  const [markAsDefault, setMarkAsDefault] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);
  const [autopayPending, setAutopayPending] = useState(false);
  const [addPending, setAddPending] = useState(false);
  const [defaultPendingId, setDefaultPendingId] = useState<number | null>(null);
  const [removePendingId, setRemovePendingId] = useState<number | null>(null);

  const defaultMethod = paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0] ?? null;
  const sanitizedCardNumber = useMemo(() => cardNumber.replace(/\D/g, ''), [cardNumber]);
  const inferredBrand = useMemo(() => inferBrand(sanitizedCardNumber), [sanitizedCardNumber]);
  const last4 = sanitizedCardNumber.slice(-4);
  const [expMonth, expYear] = expiry.split('/');

  useEffect(() => {
    if (!autoOpenAddFlow) return;
    setDrawerOpen(true);
    onAutoOpenHandled?.();
  }, [autoOpenAddFlow, onAutoOpenHandled]);

  useEffect(() => {
    if (!drawerOpen) {
      setStep(1);
      setCardError(null);
      setFieldErrors({});
      return;
    }
    setMarkAsDefault(paymentMethods.length === 0);
  }, [drawerOpen, paymentMethods.length]);

  function openAddFlow() {
    setDrawerOpen(true);
    setCardError(null);
    setFieldErrors({});
  }

  function validateStepOne() {
    const nextErrors: { holderName?: string; cardNumber?: string; expiry?: string } = {};

    if (!holderName.trim()) {
      nextErrors.holderName = 'יש למלא שם בעל הכרטיס.';
    }
    if (sanitizedCardNumber.length < 12) {
      nextErrors.cardNumber = 'מספר הכרטיס אינו מלא.';
    }
    if (!expMonth || !expYear || Number(expMonth) < 1 || Number(expMonth) > 12 || expYear.length !== 2) {
      nextErrors.expiry = 'יש להזין תוקף בפורמט MM/YY.';
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setCardError('יש להשלים את השדות המסומנים לפני המעבר לאישור.');
      return false;
    }

    setFieldErrors({});
    setCardError(null);
    return true;
  }

  async function handleAutopayChange(enabled: boolean) {
    try {
      setAutopayPending(true);
      await onToggleAutopay(enabled);
    } finally {
      setAutopayPending(false);
    }
  }

  async function handleSaveCard() {
    if (!validateStepOne()) return;
    try {
      setAddPending(true);
      const nextExpYear = 2000 + Number(expYear);
      await onAddPaymentMethod({
        provider: 'tranzila',
        token: `pm_${Date.now()}_${last4}`,
        brand: inferredBrand,
        last4,
        expMonth: Number(expMonth),
        expYear: nextExpYear,
        networkTokenized: true,
        isDefault: markAsDefault || paymentMethods.length === 0,
      });
      setStep(3);
      setHolderName('');
      setCardNumber('');
      setExpiry('');
      setFieldErrors({});
    } finally {
      setAddPending(false);
    }
  }

  async function handleSetDefault(id: number) {
    try {
      setDefaultPendingId(id);
      await onSetDefault(id);
    } finally {
      setDefaultPendingId(null);
    }
  }

  async function handleRemove(id: number) {
    try {
      setRemovePendingId(id);
      await onRemove(id);
    } finally {
      setRemovePendingId(null);
    }
  }

  const addCardTrigger = (
    <button
      type="button"
      onClick={openAddFlow}
      className={cn(
        'group flex w-full items-center justify-between rounded-[24px] border border-dashed px-4 py-4 text-right transition',
        embedded
          ? 'border-primary/18 bg-[linear-gradient(180deg,rgba(255,251,240,0.92)_0%,rgba(255,255,255,0.92)_100%)] hover:-translate-y-0.5 hover:border-primary/28'
          : 'border-primary/14 bg-[linear-gradient(180deg,rgba(255,250,242,0.96)_0%,rgba(255,255,255,0.94)_100%)] hover:-translate-y-0.5 hover:border-primary/28 hover:bg-white',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
          <Plus className="h-4 w-4" strokeWidth={2} />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">הוסף כרטיס חדש</div>
          <div className="mt-1 text-xs text-secondary-foreground">הוספה מאובטחת</div>
        </div>
      </div>
      <ChevronLeft className="icon-directional h-4 w-4 text-secondary-foreground transition group-hover:-translate-x-0.5" strokeWidth={1.9} />
    </button>
  );

  return (
    <>
      <div className="space-y-3">
        {!embedded ? (
          <div className="md:hidden">
            <div className="overflow-hidden rounded-[28px] border border-primary/14 bg-[linear-gradient(180deg,rgba(255,250,242,0.98)_0%,rgba(255,255,255,0.94)_58%,rgba(248,243,232,0.92)_100%)] p-4 text-right shadow-[0_22px_48px_rgba(84,58,15,0.12)]">
              <div className="absolute" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.12em] text-primary/72">כרטיס ראשי</div>
                  <div className="mt-2 text-xl font-black text-foreground">
                    {defaultMethod ? `${translateResidentCardBrand(defaultMethod.brand || defaultMethod.provider)} •••• ${defaultMethod.last4 || '••••'}` : 'אין כרטיס ראשי'}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-secondary-foreground">
                    {defaultMethod
                      ? 'מוכן לחיוב הבא.'
                      : 'הוסף כרטיס כדי להתחיל לשלם.'}
                  </div>
                </div>
                <Badge variant={defaultMethod ? 'success' : 'outline'}>{primaryBuilding ? `דייר · ${primaryBuilding}` : 'חשבון דייר'}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <MethodMetric label="כרטיסים" value={paymentMethods.length} tone={paymentMethods.length ? 'default' : 'warning'} />
                <MethodMetric label="אוטומטי" value={autopayEnabled ? 'פעיל' : 'ידני'} tone={autopayEnabled ? 'default' : 'warning'} />
              </div>
              <div className="mt-3">{addCardTrigger}</div>
            </div>
          </div>
        ) : null}

        <div className={cn('space-y-3', embedded ? '' : 'hidden md:block')}>
          {!embedded ? addCardTrigger : null}
        </div>

        <div
          className={cn(
            'overflow-hidden rounded-[28px] border p-4 shadow-[0_18px_36px_rgba(44,28,9,0.06)]',
            embedded
              ? 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)]'
              : 'border-primary/14 bg-[linear-gradient(180deg,rgba(255,250,242,0.98)_0%,rgba(255,255,255,0.94)_58%,rgba(248,243,232,0.92)_100%)]',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-primary/72">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.85} />
                מצב חיוב
              </div>
              <div className="mt-2 text-base font-semibold text-foreground">חיוב אוטומטי</div>
              <div className="mt-1 text-sm leading-6 text-secondary-foreground">
                החיוב הבא יעבור דרך הכרטיס הראשי.
              </div>
            </div>
            <Switch checked={autopayEnabled} disabled={autopayPending} onCheckedChange={(checked) => void handleAutopayChange(checked)} aria-label="הפעלת חיוב אוטומטי" />
          </div>

          <ResidentPaymentTrustStrip
            className="mt-3"
            surface="light"
            eyebrow="מצב בטוח"
            title="חיוב ברור"
            items={[
              {
                id: 'methods-primary',
                label: 'ראשי לתשלום',
                value: defaultMethod ? `•••• ${defaultMethod.last4 || '••••'}` : 'טרם הוגדר',
                tone: defaultMethod ? 'success' : 'warning',
              },
              {
                id: 'methods-autopay',
                label: 'חיוב אוטומטי',
                value: autopayEnabled ? 'פעיל' : 'ידני',
                tone: autopayEnabled ? 'success' : 'warning',
              },
              {
                id: 'methods-secure',
                label: 'אבטחה',
                value: paymentMethods.some((method) => method.networkTokenized) ? 'מוגן' : 'מאובטח',
                tone: 'success',
              },
            ]}
            compact
          />
        </div>

        {paymentMethods.length ? (
          <div className="space-y-3">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: reducedMotion ? 0 : index * 0.04, ease: 'easeOut' }}
                className={cn(
                  'overflow-hidden rounded-[26px] border p-4 text-right shadow-[0_14px_28px_rgba(44,28,9,0.05)] transition',
                  embedded
                    ? method.isDefault
                      ? 'border-primary/20 bg-[linear-gradient(180deg,rgba(255,251,240,0.98)_0%,rgba(255,255,255,0.94)_100%)]'
                      : 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)]'
                    : method.isDefault
                      ? 'border-primary/20 bg-[linear-gradient(180deg,rgba(255,251,240,0.98)_0%,rgba(255,255,255,0.94)_100%)]'
                      : 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold tracking-[0.12em] text-primary/68">
                      {method.isDefault ? 'כרטיס ראשי' : 'כרטיס שמור'}
                    </div>
                    <div className="mt-1 text-base font-semibold text-foreground">
                      {translateResidentCardBrand(method.brand || method.provider)} •••• {method.last4 || '••••'}
                    </div>
                    <div className="mt-1 text-sm text-secondary-foreground">
                      תוקף {method.expMonth || '--'}/{method.expYear || '--'} {method.networkTokenized ? '· מאובטח' : ''}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {method.isDefault ? <Badge variant="success">פעיל לתשלום</Badge> : <Badge variant="outline">ידני</Badge>}
                    {autopayEnabled && method.isDefault ? <Badge variant="warning">אוטומטי</Badge> : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {method.isDefault ? (
                    <Button size="sm" variant="outline" className="rounded-full" disabled>
                      כרטיס פעיל
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="rounded-full" loading={defaultPendingId === method.id} onClick={() => void handleSetDefault(method.id)}>
                      קבע כברירת מחדל
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="rounded-full text-secondary-foreground hover:bg-muted/70 hover:text-foreground" loading={removePendingId === method.id} onClick={() => void handleRemove(method.id)}>
                    <Trash2 className="ms-1 h-3.5 w-3.5" strokeWidth={1.85} />
                    הסר
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <EmptyState
              type="action"
              size="sm"
              title="עדיין אין כרטיס שמור"
              description="הוסף כרטיס כדי לשלם מהמובייל."
              action={{ label: 'הוסף כרטיס', onClick: openAddFlow, variant: 'outline' }}
            />
            <Button
              variant="ghost"
              className="w-full rounded-full text-secondary-foreground hover:bg-muted/70 hover:text-foreground"
              onClick={() => window.location.assign(supportHref)}
            >
              פנה לתמיכה
            </Button>
          </div>
        )}
      </div>

      <AmsDrawer
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="הוספת כרטיס חדש"
        description={step === 1 ? 'פרטים' : step === 2 ? 'אישור' : 'נשמר'}
        tone="light"
      >
        <div dir="rtl" className="space-y-4 text-right">
          <PaymentFlowRail currentStep={step} />

          <AnimatePresence initial={false} mode="wait">
            {step === 1 ? (
              <motion.div
                key="add-card-overview"
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-4"
              >
                <div className="overflow-hidden rounded-[24px] border border-primary/16 bg-[linear-gradient(180deg,rgba(255,249,240,0.98)_0%,rgba(255,255,255,0.96)_100%)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.12em] text-primary/72">כרטיס חדש</div>
                      <div className="mt-1 text-lg font-semibold text-foreground">כרטיס חדש למסלול התשלום</div>
                      <div className="mt-1 text-sm leading-6 text-secondary-foreground">זמין מיד.</div>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
                      <WalletCards className="h-5 w-5" strokeWidth={1.85} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MethodTile active title="כרטיס אשראי" subtitle={defaultMethod ? 'נשמר לחשבון' : 'הכרטיס הראשון בחשבון'} icon={<CreditCard className="h-5 w-5" strokeWidth={1.85} />} />
                  <MethodTile
                    active={!fieldErrors.cardNumber}
                    title={translateResidentCardBrand(inferredBrand)}
                    subtitle={last4 ? `תצוגה · •••• ${last4}` : 'המותג יופיע בזמן ההקלדה'}
                    icon={<Sparkles className="h-5 w-5" strokeWidth={1.85} />}
                  />
                </div>

                <div className="grid gap-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">שם בעל הכרטיס</span>
                    <Input
                      value={holderName}
                      onChange={(event) => {
                        setHolderName(event.target.value);
                        setFieldErrors((current) => ({ ...current, holderName: undefined }));
                      }}
                      placeholder="לדוגמה: Or Peretz"
                      className={inputClassName(Boolean(fieldErrors.holderName))}
                      dir="ltr"
                    />
                    {fieldErrors.holderName ? <div className="text-xs text-destructive">{fieldErrors.holderName}</div> : null}
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">מספר כרטיס</span>
                    <Input
                      value={cardNumber}
                      onChange={(event) => {
                        setCardNumber(formatCardNumber(event.target.value));
                        setFieldErrors((current) => ({ ...current, cardNumber: undefined }));
                      }}
                      placeholder="4242 4242 4242 4242"
                      className={inputClassName(Boolean(fieldErrors.cardNumber))}
                      dir="ltr"
                      inputMode="numeric"
                    />
                    {fieldErrors.cardNumber ? <div className="text-xs text-destructive">{fieldErrors.cardNumber}</div> : null}
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">תוקף</span>
                    <Input
                      value={expiry}
                      onChange={(event) => {
                        setExpiry(formatExpiry(event.target.value));
                        setFieldErrors((current) => ({ ...current, expiry: undefined }));
                      }}
                      placeholder="12/28"
                      className={inputClassName(Boolean(fieldErrors.expiry))}
                      dir="ltr"
                      inputMode="numeric"
                    />
                    {fieldErrors.expiry ? <div className="text-xs text-destructive">{fieldErrors.expiry}</div> : null}
                  </label>
                </div>

                {cardError ? <div className="rounded-[18px] border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">{cardError}</div> : null}

                <div className="flex items-start justify-between gap-4 rounded-[22px] border border-subtle-border bg-background/90 p-3.5">
                    <div>
                      <div className="font-semibold text-foreground">שמור כברירת מחדל</div>
                      <div className="text-sm text-secondary-foreground">ישמש לחיוב הבא</div>
                    </div>
                  <Switch checked={markAsDefault} onCheckedChange={setMarkAsDefault} aria-label="שמירה כברירת מחדל" />
                </div>

                <button type="button" className="gold-sheen-button flex min-h-[52px] w-full items-center justify-center rounded-full px-4 text-base font-semibold" data-accent-sheen="true" onClick={() => validateStepOne() && setStep(2)}>
                  המשך לאישור
                </button>
              </motion.div>
            ) : null}

            {step === 2 ? (
              <motion.div
                key="add-card-confirm"
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-4"
              >
                <div className="overflow-hidden rounded-[24px] border border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,244,236,0.92)_100%)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.12em] text-primary/72">אישור</div>
                      <div className="mt-2 text-lg font-semibold text-foreground">
                        {translateResidentCardBrand(inferredBrand)} •••• {last4 || '••••'}
                      </div>
                      <div className="mt-1 text-sm text-secondary-foreground">
                        {holderName || 'שם בעל הכרטיס'} · תוקף <bdi>{expiry || '--/--'}</bdi>
                      </div>
                    </div>
                    <Badge variant="warning">הוספה מאובטחת</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <DrawerMetric label="ברירת מחדל" value={markAsDefault ? 'כן' : 'לא'} />
                    <DrawerMetric label="ספק" value="Tranzila" />
                  </div>
                </div>

                <div className="rounded-[22px] border border-primary/16 bg-primary/6 px-3.5 py-3 text-sm leading-6 text-secondary-foreground">
                  הכרטיס יופיע מיד אחרי האישור.
                </div>

                <button type="button" className="gold-sheen-button flex min-h-[52px] w-full items-center justify-center rounded-full px-4 text-base font-semibold" data-accent-sheen="true" disabled={addPending} onClick={() => void handleSaveCard()}>
                  {addPending ? 'שומר...' : 'אישור ושמירת כרטיס'}
                </button>
                <Button variant="outline" size="sm" className="w-full rounded-full min-h-[52px]" onClick={() => setStep(1)}>
                  חזרה לעריכה
                </Button>
              </motion.div>
            ) : null}

            {step === 3 ? (
              <motion.div
                key="add-card-success"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
                exit={reducedMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-4"
              >
                <div className="flex flex-col items-center justify-center rounded-[26px] border border-success/24 bg-success/10 px-5 py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/18 text-success">
                    <CheckCircle2 className="h-8 w-8" strokeWidth={1.9} />
                  </div>
                  <div className="mt-4 text-lg font-semibold text-foreground">הכרטיס נשמר</div>
                  <div className="mt-2 max-w-[18rem] text-sm leading-6 text-secondary-foreground">זמין עכשיו במסך התשלומים.</div>
                </div>
                <button type="button" className="gold-sheen-button flex min-h-[52px] w-full items-center justify-center rounded-full px-4 text-base font-semibold" data-accent-sheen="true" onClick={() => setDrawerOpen(false)}>
                  חזרה לשיטות התשלום
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </AmsDrawer>
    </>
  );
}

function MethodMetric({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'warning' }) {
  return (
    <div
      className={cn(
        'rounded-[20px] border px-3 py-3 text-right',
        tone === 'warning'
          ? 'border-warning/18 bg-[linear-gradient(180deg,rgba(255,248,236,0.98)_0%,rgba(255,255,255,0.94)_100%)]'
          : 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,238,0.94)_100%)]',
      )}
    >
      <div className="text-[11px] font-semibold text-secondary-foreground">{label}</div>
      <div className="mt-1 text-lg font-black text-foreground">
        <bdi>{value}</bdi>
      </div>
    </div>
  );
}

function MethodTile({
  active,
  disabled = false,
  title,
  subtitle,
  icon,
}: {
  active: boolean;
  disabled?: boolean;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-[22px] border p-4 transition',
        disabled
          ? 'border-subtle-border bg-background/50 text-muted-foreground'
          : active
            ? 'gold-sheen-surface border-primary/28 ring-1 ring-primary/10'
            : 'border-subtle-border bg-background/80 text-secondary-foreground hover:border-primary/18',
      )}
      data-accent-sheen={active ? 'true' : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className={cn('text-sm font-semibold', active ? 'text-primary' : 'text-foreground')}>{title}</div>
          <div className={cn('mt-1 text-xs', active ? 'text-primary/80' : 'text-muted-foreground')}>{subtitle}</div>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-[14px]', active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>{icon}</div>
      </div>
    </div>
  );
}

function PaymentFlowRail({ currentStep }: { currentStep: AddCardStep }) {
  const items = [
    { step: 1, title: 'פרטים' },
    { step: 2, title: 'אישור' },
    { step: 3, title: 'מוכן' },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const active = currentStep === item.step;
        const complete = currentStep > item.step;
        return (
          <div
            key={item.step}
            className={cn(
              'rounded-[18px] border px-3 py-2.5',
              active || complete ? 'border-primary/18 bg-primary/8' : 'border-subtle-border bg-background/90',
            )}
          >
            <div className={cn('text-[10px] font-semibold', active || complete ? 'text-primary' : 'text-muted-foreground')}>
              {complete ? 'בוצע' : `שלב ${item.step}`}
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">{item.title}</div>
          </div>
        );
      })}
    </div>
  );
}

function DrawerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-subtle-border bg-background/90 px-3 py-3 text-right">
      <div className="text-[10px] font-semibold text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
