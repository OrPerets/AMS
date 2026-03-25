import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarClock, CheckCircle2, ChevronLeft, CreditCard, Plus, ShieldCheck, Sparkles, Trash2, WalletCards } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { EmptyState } from '../ui/empty-state';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { AmsDrawer } from '../ui/ams-drawer';
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

const inputClassName =
  'h-12 rounded-[18px] border-white/10 bg-white/6 text-right text-inverse-text placeholder:text-white/38 focus-visible:ring-[rgba(224,182,89,0.35)] focus-visible:ring-offset-0';

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
      return;
    }
    setMarkAsDefault(paymentMethods.length === 0);
  }, [drawerOpen, paymentMethods.length]);

  function openAddFlow() {
    setDrawerOpen(true);
    setCardError(null);
  }

  function validateStepOne() {
    if (!holderName.trim()) {
      setCardError('יש למלא שם בעל הכרטיס.');
      return false;
    }
    if (sanitizedCardNumber.length < 12) {
      setCardError('מספר הכרטיס אינו מלא.');
      return false;
    }
    if (!expMonth || !expYear || Number(expMonth) < 1 || Number(expMonth) > 12 || expYear.length !== 2) {
      setCardError('יש להזין תוקף בפורמט MM/YY.');
      return false;
    }
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
          : 'border-white/12 bg-white/6 hover:border-[rgba(224,182,89,0.28)] hover:bg-white/8',
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-[16px]', embedded ? 'bg-primary/10 text-primary' : 'bg-[rgba(224,182,89,0.14)] text-[#f0d48b]')}>
          <Plus className="h-4 w-4" strokeWidth={2} />
        </div>
        <div>
          <div className={cn('text-sm font-semibold', embedded ? 'text-foreground' : 'text-inverse-text')}>הוסף כרטיס חדש</div>
          <div className={cn('mt-1 text-xs', embedded ? 'text-secondary-foreground' : 'text-white/60')}>מסלול קצר עם אישור לפני שמירת הכרטיס הראשי.</div>
        </div>
      </div>
      <ChevronLeft className={cn('h-4 w-4 transition group-hover:-translate-x-0.5', embedded ? 'text-secondary-foreground' : 'text-white/48')} strokeWidth={1.9} />
    </button>
  );

  return (
    <>
      <div className="space-y-3">
        {!embedded ? (
          <div className="md:hidden">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,20,0.98)_0%,rgba(34,24,11,0.98)_100%)] p-4 text-right text-inverse-text shadow-[0_22px_48px_rgba(16,12,7,0.26)]">
              <div className="absolute" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f0d48b]/78">Payment lane</div>
                  <div className="mt-2 text-xl font-black">
                    {defaultMethod ? `${translateResidentCardBrand(defaultMethod.brand || defaultMethod.provider)} •••• ${defaultMethod.last4 || '••••'}` : 'אין כרטיס ראשי'}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-white/66">
                    {defaultMethod
                      ? 'הכרטיס הראשי מוכן לחיוב הבא, ואפשר להחליף אותו או לשמור כרטיס נוסף בלי לצאת מהמובייל.'
                      : 'נפתח מסלול חדש להוספת כרטיס ישירות מהמובייל, בלי לעבור דרך תמיכה.'}
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
              : 'border-white/10 bg-[linear-gradient(180deg,rgba(24,24,28,0.98)_0%,rgba(42,29,14,0.98)_100%)] text-inverse-text',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={cn('flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]', embedded ? 'text-primary/72' : 'text-[#f0d48b]/72')}>
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.85} />
                מצב חיוב
              </div>
              <div className={cn('mt-2 text-base font-semibold', embedded ? 'text-foreground' : 'text-inverse-text')}>חיוב אוטומטי</div>
              <div className={cn('mt-1 text-sm leading-6', embedded ? 'text-secondary-foreground' : 'text-white/64')}>
                כשהאפשרות פעילה, החשבונית הבאה תמשוך את הכרטיס הראשי ותשמור את שאר הפעולות למסך התשלומים בלבד.
              </div>
            </div>
            <Switch checked={autopayEnabled} disabled={autopayPending} onCheckedChange={(checked) => void handleAutopayChange(checked)} aria-label="הפעלת חיוב אוטומטי" />
          </div>
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
                      ? 'border-[rgba(224,182,89,0.22)] bg-[linear-gradient(180deg,rgba(224,182,89,0.16)_0%,rgba(255,255,255,0.06)_100%)] text-inverse-text'
                      : 'border-white/10 bg-white/6 text-inverse-text',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-[11px] font-semibold uppercase tracking-[0.16em]', embedded ? 'text-primary/68' : 'text-[#f0d48b]/70')}>
                      {method.isDefault ? 'כרטיס ראשי' : 'כרטיס שמור'}
                    </div>
                    <div className={cn('mt-1 text-base font-semibold', embedded ? 'text-foreground' : 'text-inverse-text')}>
                      {translateResidentCardBrand(method.brand || method.provider)} •••• {method.last4 || '••••'}
                    </div>
                    <div className={cn('mt-1 text-sm', embedded ? 'text-secondary-foreground' : 'text-white/60')}>
                      תוקף {method.expMonth || '--'}/{method.expYear || '--'} {method.networkTokenized ? '· נשמר בצורה מאובטחת' : ''}
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
                  <Button size="sm" variant="ghost" className={cn('rounded-full', embedded ? '' : 'text-white/72 hover:bg-white/10 hover:text-white')} loading={removePendingId === method.id} onClick={() => void handleRemove(method.id)}>
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
              description="עכשיו אפשר להוסיף כרטיס חדש ישירות מהמובייל, לשמור אותו כברירת מחדל ולהפעיל אוטופיי בלי לעבור דרך התמיכה."
              action={{ label: 'הוסף כרטיס', onClick: openAddFlow, variant: 'outline' }}
            />
            <Button
              variant="ghost"
              className={cn('w-full rounded-full', embedded ? '' : 'text-white/78 hover:bg-white/10 hover:text-white')}
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
        description={step === 1 ? 'בחירת מסלול ותצוגה מוקדמת לפני שמירה.' : step === 2 ? 'בדיקה מהירה ואישור לכרטיס הראשי.' : 'הכרטיס נשמר בהצלחה.'}
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
                <div className="overflow-hidden rounded-[24px] border border-[rgba(224,182,89,0.2)] bg-[linear-gradient(180deg,rgba(224,182,89,0.14)_0%,rgba(255,255,255,0.04)_100%)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f0d48b]/72">נתיב תשלום</div>
                      <div className="mt-1 text-lg font-semibold text-inverse-text">כרטיס חדש למסלול התשלום</div>
                      <div className="mt-1 text-sm leading-6 text-white/64">הכרטיס יופיע במסך התשלום ויוכל להפוך לברירת המחדל מיד אחרי השמירה.</div>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[rgba(224,182,89,0.14)] text-[#f0d48b]">
                      <WalletCards className="h-5 w-5" strokeWidth={1.85} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MethodTile active title="כרטיס אשראי" subtitle={defaultMethod ? 'יופיע לצד הכרטיסים השמורים' : 'יהפוך לכרטיס הראשון בחשבון'} icon={<CreditCard className="h-5 w-5" strokeWidth={1.85} />} />
                  <MethodTile active={false} disabled title="Apple Pay" subtitle="בקרוב" icon={<Sparkles className="h-5 w-5" strokeWidth={1.85} />} />
                </div>

                <div className="grid gap-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-inverse-text">שם בעל הכרטיס</span>
                    <Input value={holderName} onChange={(event) => setHolderName(event.target.value)} placeholder="לדוגמה: Or Peretz" className={inputClassName} dir="ltr" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-inverse-text">מספר כרטיס</span>
                    <Input
                      value={cardNumber}
                      onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                      placeholder="4242 4242 4242 4242"
                      className={inputClassName}
                      dir="ltr"
                      inputMode="numeric"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-inverse-text">תוקף</span>
                    <Input
                      value={expiry}
                      onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                      placeholder="12/28"
                      className={inputClassName}
                      dir="ltr"
                      inputMode="numeric"
                    />
                  </label>
                </div>

                {cardError ? <div className="rounded-[18px] border border-destructive/30 bg-destructive/12 px-3.5 py-3 text-sm text-destructive-foreground">{cardError}</div> : null}

                <div className="flex items-start justify-between gap-4 rounded-[22px] border border-white/10 bg-white/6 p-3.5">
                  <div>
                    <div className="font-semibold text-inverse-text">שמור כברירת מחדל</div>
                    <div className="text-sm text-white/60">הכרטיס ישמש לחיוב הבא ולמסלול האוטומטי אם הוא פעיל.</div>
                  </div>
                  <Switch checked={markAsDefault} onCheckedChange={setMarkAsDefault} aria-label="שמירה כברירת מחדל" />
                </div>

                <Button size="lg" className="min-h-[52px] w-full" onClick={() => validateStepOne() && setStep(2)}>
                  המשך לאישור
                </Button>
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
                <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f0d48b]/72">אישור שמירה</div>
                      <div className="mt-2 text-lg font-semibold text-inverse-text">
                        {translateResidentCardBrand(inferredBrand)} •••• {last4 || '••••'}
                      </div>
                      <div className="mt-1 text-sm text-white/60">
                        {holderName || 'שם בעל הכרטיס'} · תוקף {expiry || '--/--'}
                      </div>
                    </div>
                    <Badge variant="warning">הוספה מאובטחת</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <DrawerMetric label="ברירת מחדל" value={markAsDefault ? 'כן' : 'לא'} />
                    <DrawerMetric label="ספק" value="Tranzila" />
                  </div>
                </div>

                <div className="rounded-[22px] border border-[rgba(224,182,89,0.22)] bg-[linear-gradient(180deg,rgba(224,182,89,0.16)_0%,rgba(255,255,255,0.04)_100%)] px-3.5 py-3 text-sm leading-6 text-white/76">
                  אחרי האישור, הכרטיס יתווסף לרשימת אמצעי התשלום במסך הזה ויהיה זמין לחיוב הבא במסלול התשלום.
                </div>

                <Button size="lg" className="min-h-[52px] w-full" loading={addPending} onClick={() => void handleSaveCard()}>
                  אישור ושמירת כרטיס
                </Button>
                <Button variant="outline" size="sm" className="w-full rounded-full border-white/12 bg-white/6 text-white/78 hover:bg-white/10 hover:text-white" onClick={() => setStep(1)}>
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
                  <div className="mt-4 text-lg font-semibold text-inverse-text">הכרטיס נשמר</div>
                  <div className="mt-2 max-w-[18rem] text-sm leading-6 text-white/64">הוא נוסף לאזור התשלומים, ויופיע מיידית במסלול החיוב של הדייר.</div>
                </div>
                <Button size="lg" className="min-h-[52px] w-full" onClick={() => setDrawerOpen(false)}>
                  חזרה לשיטות התשלום
                </Button>
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
          ? 'border-[rgba(224,182,89,0.22)] bg-[rgba(224,182,89,0.12)]'
          : 'border-white/10 bg-white/6',
      )}
    >
      <div className="text-[11px] font-semibold text-white/54">{label}</div>
      <div className="mt-1 text-lg font-black text-inverse-text">
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
          ? 'border-white/8 bg-white/4 text-white/36'
          : active
            ? 'border-[rgba(224,182,89,0.28)] bg-[rgba(224,182,89,0.14)] text-inverse-text'
            : 'border-white/10 bg-white/6 text-white/70',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs">{subtitle}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-black/10">{icon}</div>
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
              active || complete ? 'border-[rgba(224,182,89,0.28)] bg-[rgba(224,182,89,0.12)]' : 'border-white/10 bg-white/6',
            )}
          >
            <div className={cn('text-[10px] font-semibold uppercase tracking-[0.16em]', active || complete ? 'text-[#f0d48b]' : 'text-white/42')}>
              {complete ? 'בוצע' : `שלב ${item.step}`}
            </div>
            <div className="mt-1 text-sm font-semibold text-inverse-text">{item.title}</div>
          </div>
        );
      })}
    </div>
  );
}

function DrawerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/6 px-3 py-3 text-right">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">{label}</div>
      <div className="mt-1 text-sm font-semibold text-inverse-text">{value}</div>
    </div>
  );
}
