import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CalendarDays, FileText, Move, ParkingCircle, PhoneCall, Sparkles } from 'lucide-react';
import { authFetch } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import { FormField, FormErrorSummary } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { MobileContextBar } from '../../components/ui/mobile-context-bar';
import { MobileActionHub } from '../../components/ui/mobile-action-hub';
import { MobilePriorityInbox } from '../../components/ui/mobile-priority-inbox';
import { MobileCardSkeleton } from '../../components/ui/page-states';
import { PageHero } from '../../components/ui/page-hero';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { PrimaryActionCard } from '../../components/ui/primary-action-card';
import { PullToRefreshIndicator } from '../../components/ui/pull-to-refresh-indicator';
import { SectionHeader } from '../../components/ui/section-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { StatusBadge } from '../../components/ui/status-badge';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/use-toast';
import { usePullToRefresh } from '../../hooks/use-pull-to-refresh';
import { triggerHaptic } from '../../lib/mobile';
import {
  formatDate,
  getRequestTypeLabel,
  getResidentRequestStatusLabel,
  getResidentRequestStatusTone,
} from '../../lib/utils';
import { useLocale } from '../../lib/providers';

const requestTypes = [
  { value: 'MOVING', label: 'מעבר', icon: Move, description: 'תיאום מהיר' },
  { value: 'PARKING', label: 'חניה', icon: ParkingCircle, description: 'שינוי או תקלה' },
  { value: 'DOCUMENT', label: 'מסמך', icon: FileText, description: 'קבלה, פרוטוקול, אישור' },
  { value: 'CONTACT_UPDATE', label: 'עדכון קשר', icon: PhoneCall, description: 'טלפון או אימייל' },
  { value: 'GENERAL', label: 'כללי', icon: Sparkles, description: 'פנייה אחרת' },
] as const;

const movingDirectionOptions = [
  { value: 'MOVE_IN', label: 'כניסה', description: 'מעבר לנכס' },
  { value: 'MOVE_OUT', label: 'יציאה', description: 'פינוי מסודר' },
] as const;

const elevatorOptions = [
  { value: 'YES', label: 'כן', description: 'לשמור מעלית' },
  { value: 'NO', label: 'לא', description: 'אין צורך' },
] as const;

const parkingRequestOptions = [
  { value: 'CHANGE_ASSIGNMENT', label: 'שינוי הקצאה', description: 'מקום או עדכון' },
  { value: 'GUEST', label: 'אורח קבוע', description: 'הוספת גישה' },
  { value: 'ISSUE', label: 'בעיה קיימת', description: 'תקלה או חסימה' },
] as const;

const documentCategoryOptions = [
  { value: 'INVOICE', label: 'חשבונית / קבלה', description: 'מסמך תשלום' },
  { value: 'PROTOCOL', label: 'פרוטוקול', description: 'ישיבה או החלטה' },
  { value: 'REGULATION', label: 'תקנון', description: 'נהלים וחוקים' },
  { value: 'CERTIFICATE', label: 'אישור', description: 'אישור רשמי' },
] as const;

type RequestHistoryItem = {
  requestKey: string;
  subject: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  requestType: string;
  requestedDate?: string | null;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CLOSED';
  statusNotes?: string | null;
};

const emptyForm = {
  requestType: 'MOVING',
  subject: '',
  message: '',
  requestedDate: '',
  movingDirection: 'MOVE_IN',
  movingWindow: '',
  elevatorNeeded: 'YES',
  parkingRequestType: 'CHANGE_ASSIGNMENT',
  plateNumber: '',
  documentCategory: 'INVOICE',
  nextPhone: '',
  nextEmail: '',
  extraContact: '',
};

export default function ResidentRequestsPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [form, setForm] = useState(emptyForm);
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState({ status: 'ALL', requestType: 'ALL' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [submittedRequestKey, setSubmittedRequestKey] = useState<string | null>(null);
  const [submittedRequestType, setSubmittedRequestType] = useState<string | null>(null);
  const [view, setView] = useState<'new' | 'history'>('new');

  const activeType = requestTypes.find((item) => item.value === form.requestType)!;
  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: async () => {
      await loadHistory();
    },
  });

  useEffect(() => {
    void loadHistory();
  }, [historyFilter.status, historyFilter.requestType]);

  useEffect(() => {
    if (!router.isReady) return;
    const nextView = router.query.view === 'history' ? 'history' : 'new';
    setView(nextView);
  }, [router.isReady, router.query.view]);

  async function loadHistory() {
    try {
      setLoading(true);
      setHistoryError(null);
      const params = new URLSearchParams();
      if (historyFilter.status !== 'ALL') params.set('status', historyFilter.status);
      if (historyFilter.requestType !== 'ALL') params.set('requestType', historyFilter.requestType);
      const response = await authFetch(`/api/v1/communications/resident-requests${params.toString() ? `?${params.toString()}` : ''}`);
      if (!response.ok) throw new Error(await response.text());
      const payload = await response.json();
      setHistory(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error(error);
      setHistoryError('לא ניתן לטעון כרגע את היסטוריית הבקשות.');
      toast({ title: 'טעינת היסטוריית הבקשות נכשלה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const metadata = useMemo(() => {
    switch (form.requestType) {
      case 'MOVING':
        return {
          movingDirection: form.movingDirection,
          movingWindow: form.movingWindow || null,
          elevatorNeeded: form.elevatorNeeded === 'YES',
        };
      case 'PARKING':
        return {
          parkingRequestType: form.parkingRequestType,
          plateNumber: form.plateNumber || null,
        };
      case 'DOCUMENT':
        return {
          documentCategory: form.documentCategory,
        };
      case 'CONTACT_UPDATE':
        return {
          nextPhone: form.nextPhone || null,
          nextEmail: form.nextEmail || null,
          extraContact: form.extraContact || null,
        };
      default:
        return {};
    }
  }, [form]);

  const formErrors = useMemo(() => {
    return {
      subject: form.subject.trim() ? '' : 'כתוב נושא קצר.',
      message: form.message.trim().length >= 10 ? '' : 'כתוב כמה מילים על הבקשה.',
      requestedDate: form.requestType === 'MOVING' && !form.requestedDate ? 'כדאי לבחור תאריך.' : '',
    };
  }, [form.message, form.requestType, form.requestedDate, form.subject]);

  const shouldShowError = (field: string) => formSubmitted || formTouched[field];

  const visibleFormErrors = useMemo(() => {
    return (Object.keys(formErrors) as Array<keyof typeof formErrors>)
      .filter((key) => formErrors[key] && shouldShowError(key))
      .map((key) => ({ field: key, message: formErrors[key] }));
  }, [formErrors, formSubmitted, formTouched]);

  async function submitRequest() {
    setFormSubmitted(true);
    setSubmitError(null);

    if (formErrors.subject || formErrors.message) {
      toast({ title: 'יש להשלים את שדות החובה לפני השליחה', variant: 'destructive' });
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus({ preventScroll: true });
        }
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await authFetch('/api/v1/communications/resident-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: form.requestType,
          subject: form.subject,
          message: form.message,
          requestedDate: form.requestedDate || undefined,
          metadata,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const payload = await response.json().catch(() => ({}));
      toast({ title: 'הבקשה נשלחה לצוות הניהול', variant: 'success' });
      triggerHaptic('success');
      setSubmittedRequestKey(payload?.requestKey || `REQ-${new Date().getTime().toString().slice(-6)}`);
      setSubmittedRequestType(form.requestType);
      setForm(emptyForm);
      setFormTouched({});
      setFormSubmitted(false);
      setSubmitError(null);
      setFormStep(1);
      await loadHistory();
    } catch (error) {
      console.error(error);
      setSubmitError('שליחת הבקשה נכשלה. אפשר לנסות שוב או לפנות לצוות הניהול.');
      toast({ title: 'שליחת הבקשה נכשלה', description: 'נסה שנית בעוד מספר שניות.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  const openRequests = history.filter((item) => item.status === 'SUBMITTED' || item.status === 'IN_REVIEW');
  const closedRequests = history.filter((item) => item.status === 'COMPLETED' || item.status === 'CLOSED');
  const filtersApplied = historyFilter.status !== 'ALL' || historyFilter.requestType !== 'ALL';
  const priorityItems = [
    openRequests[0]
      ? {
          id: 'open-request',
          status: openRequests[0].status === 'SUBMITTED' ? t('status.waiting') : t('status.inProgress'),
          tone: openRequests[0].status === 'SUBMITTED' ? 'warning' as const : 'active' as const,
          title: openRequests[0].subject.replace(/^[A-Z_]+:\s*/, ''),
          reason: openRequests[0].statusNotes || t('residentRequests.priority.waitingReason'),
          meta: t('common.updatedAt', { value: formatDate(new Date(openRequests[0].updatedAt || openRequests[0].createdAt), locale) }),
        }
      : {
          id: 'no-open-request',
          status: t('status.completed'),
          tone: 'success' as const,
          title: t('residentRequests.priority.noneTitle'),
          reason: t('residentRequests.priority.noneReason'),
        },
  ];
  const selectedTypeDescription = getRequestExpectations(form.requestType);
  const submittedTypeDescription = getRequestExpectations(submittedRequestType || form.requestType);

  return (
    <div className="space-y-5 pb-4 sm:space-y-8">
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} label="משוך כדי לרענן בקשות דייר" />

      <div className="space-y-3 md:hidden">
        <CompactStatusStrip
          roleLabel={t('residentRequests.mobile.roleLabel')}
          metrics={[
            { id: 'open', label: 'פתוחות', value: openRequests.length, tone: openRequests.length ? 'warning' : 'success' },
            { id: 'closed', label: 'נסגרו', value: closedRequests.length, tone: 'default' },
          ]}
        />
        <PrimaryActionCard
          mobileHomeEffect
          eyebrow="שירות עצמי"
          title={view === 'history' ? 'מעקב בקשות' : 'בקשה חדשה'}
          description={view === 'history' ? 'כל העדכונים במקום אחד.' : 'בחר סוג, מלא קצר, שלח.'}
          ctaLabel={view === 'history' ? 'פתח מעקב' : 'פתח בקשה'}
          onClick={() => setView('new')}
          tone={openRequests.length ? 'warning' : 'default'}
          secondaryAction={
            <Button asChild variant="outline" size="sm">
              <Link href="/create-call">קריאת תחזוקה</Link>
            </Button>
          }
        />
      </div>

      <div className="hidden md:block">
        <MobileContextBar
          roleLabel={t('residentRequests.mobile.roleLabel')}
          contextLabel={t('residentRequests.mobile.contextLabel')}
          syncLabel={t('residentRequests.mobile.syncedLabel')}
          lastUpdated={formatDate(new Date(), locale)}
          chips={[
            t('residentRequests.mobile.openRequests', { count: openRequests.length }),
            t('residentRequests.mobile.closedRequests', { count: closedRequests.length }),
          ]}
        />
      </div>

      <div className="hidden md:block">
        <PageHero
          compact
          variant="operational"
          kicker="שירות עצמי לדייר"
          eyebrow={<StatusBadge label="שירות דיירים" tone="finance" />}
          title="בקשות דייר"
          description="בחר את סוג הבקשה, מלא רק את מה שנדרש, ועקוב אחרי ההתקדמות מאותו מסך."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setView('new')}>
                בקשה חדשה
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/create-call">קריאת תחזוקה</Link>
              </Button>
            </div>
          }
        />
      </div>

      <MobilePriorityInbox
        title="מה בטיפול"
        subtitle="עד שני פריטים שחשוב לפתוח עכשיו"
        items={priorityItems}
      />

      <Tabs value={view} onValueChange={(value) => setView(value as 'new' | 'history')}>
        <TabsList className="grid grid-cols-2 rounded-[22px] border border-subtle-border bg-background/92 p-1">
          <TabsTrigger value="new" className="min-h-[48px] rounded-[18px] text-[15px] font-semibold">בקשה חדשה</TabsTrigger>
          <TabsTrigger value="history" className="min-h-[48px] rounded-[18px] text-[15px] font-semibold">מעקב</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === 'new' && submittedRequestKey ? (
        <Card variant="featured">
          <CardContent className="space-y-3 p-4 sm:p-5">
            <SectionHeader
              title="הבקשה התקבלה"
              subtitle="השלב הבא ברור כבר עכשיו."
              meta={submittedRequestKey}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-subtle-border bg-background/88 p-3">
                <div className="text-xs text-tertiary">זמן תגובה משוער</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{submittedTypeDescription.responseWindow}</div>
              </div>
              <div className="rounded-[20px] border border-subtle-border bg-background/88 p-3">
                <div className="text-xs text-tertiary">מי מקבל את הבקשה</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{submittedTypeDescription.owner}</div>
              </div>
              <div className="rounded-[20px] border border-subtle-border bg-background/88 p-3">
                <div className="text-xs text-tertiary">מה אפשר לעשות עכשיו</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{submittedTypeDescription.nextStep}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {view === 'new' ? (
      <>
      <MobileActionHub
        mobileHomeEffect
        title="בחר סוג בקשה"
        subtitle="בחירה אחת וממשיכים"
        gridClassName="grid-cols-1 min-[390px]:grid-cols-2 lg:grid-cols-3"
        items={requestTypes.map((type) => ({
          id: type.value,
          label: type.label,
          description: type.description,
          icon: type.icon,
          accent: form.requestType === type.value ? 'primary' : 'neutral',
          emphasize: form.requestType === type.value,
          selected: form.requestType === type.value,
          onClick: () => {
            setForm((current) => ({ ...current, requestType: type.value }));
            setFormStep(2);
            setSubmittedRequestKey(null);
          },
        }))}
      />

      <div className="grid gap-4 sm:gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>{formStep === 1 ? 'ממלאים קצר' : activeType.label}</CardTitle>
            <CardDescription>{selectedTypeDescription.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className={`rounded-[18px] border px-3 py-2.5 text-sm ${formStep >= 1 ? 'border-primary/25 bg-primary/8 text-foreground' : 'border-subtle-border bg-muted/15 text-muted-foreground'}`}>
                1. בחרת
              </div>
              <div className={`rounded-[18px] border px-3 py-2.5 text-sm ${formStep >= 2 ? 'border-primary/25 bg-primary/8 text-foreground' : 'border-subtle-border bg-muted/15 text-muted-foreground'}`}>
                2. ממלאים
              </div>
              <div className="rounded-[18px] border border-subtle-border bg-muted/15 px-3 py-2.5 text-sm text-muted-foreground">
                3. עוקבים
              </div>
            </div>

            <SectionHeader
              title="פרטי הפנייה"
              subtitle="רק מה שצריך עכשיו"
              meta={formStep === 1 ? 'בחר סוג בקשה כדי להמשיך' : 'טופס ממוקד'}
            />

            <div className="rounded-xl sm:rounded-[20px] border border-subtle-border bg-muted/25 p-3 sm:p-4 text-sm">
              <div className="font-semibold text-foreground">אחרי השליחה</div>
              <div className="mt-1 text-muted-foreground">{selectedTypeDescription.afterSubmit}</div>
            </div>

            {formStep === 1 ? (
              <EmptyState
                type="action"
                size="sm"
                title="בחר סוג בקשה כדי להמשיך"
                description="אחר כך נציג רק את השדות הרלוונטיים."
              />
            ) : null}

            {formStep === 2 && visibleFormErrors.length > 0 ? (
              <FormErrorSummary
                errors={visibleFormErrors}
                fieldLabels={{ subject: 'נושא', message: 'פירוט הבקשה', requestedDate: 'תאריך מבוקש' }}
                title={`${visibleFormErrors.length > 1 ? `${visibleFormErrors.length} שדות` : 'שדה'} דורשים תיקון`}
              />
            ) : null}

            {formStep === 2 && submitError ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
                {submitError}
              </div>
            ) : null}

            {formStep === 2 ? (
              <>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="נושא"
                description="שורה קצרה"
                error={shouldShowError('subject') ? formErrors.subject || undefined : undefined}
                required
              >
                <Input
                  id="subject"
                  name="subject"
                  placeholder="למשל: תיאום מעבר"
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  onBlur={() => setFormTouched((prev) => ({ ...prev, subject: true }))}
                />
              </FormField>

              <FormField
                label="תאריך מבוקש"
                description="אם יש תאריך יעד"
                error={shouldShowError('requestedDate') ? formErrors.requestedDate || undefined : undefined}
              >
                <Input
                  id="requestedDate"
                  name="requestedDate"
                  type="date"
                  value={form.requestedDate}
                  onChange={(event) => setForm((current) => ({ ...current, requestedDate: event.target.value }))}
                  onBlur={() => setFormTouched((prev) => ({ ...prev, requestedDate: true }))}
                />
              </FormField>
            </div>

            {form.requestType === 'MOVING' ? (
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="סוג מעבר" description="כניסה או יציאה מהנכס.">
                  <SegmentedChoices
                    value={form.movingDirection}
                    options={movingDirectionOptions}
                    onChange={(value) => setForm((current) => ({ ...current, movingDirection: value }))}
                  />
                </FormField>

                <FormField label="שעה" description="למשל 08:00-11:00">
                  <Input
                    placeholder="08:00-11:00"
                    value={form.movingWindow}
                    onChange={(event) => setForm((current) => ({ ...current, movingWindow: event.target.value }))}
                  />
                </FormField>

                <FormField label="מעלית שירות" description="כן או לא">
                  <SegmentedChoices
                    value={form.elevatorNeeded}
                    options={elevatorOptions}
                    onChange={(value) => setForm((current) => ({ ...current, elevatorNeeded: value }))}
                  />
                </FormField>
              </div>
            ) : null}

            {form.requestType === 'PARKING' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="סוג בקשה" description="מה צריך?">
                  <SegmentedChoices
                    value={form.parkingRequestType}
                    options={parkingRequestOptions}
                    onChange={(value) => setForm((current) => ({ ...current, parkingRequestType: value }))}
                    columns={1}
                  />
                </FormField>

                <FormField label="מספר רכב" description="אם רלוונטי">
                  <Input
                    placeholder="12-345-67"
                    value={form.plateNumber}
                    onChange={(event) => setForm((current) => ({ ...current, plateNumber: event.target.value }))}
                  />
                </FormField>
              </div>
            ) : null}

            {form.requestType === 'DOCUMENT' ? (
              <FormField label="סוג מסמך" description="בחר סוג אחד">
                <SegmentedChoices
                  value={form.documentCategory}
                  options={documentCategoryOptions}
                  onChange={(value) => setForm((current) => ({ ...current, documentCategory: value }))}
                />
              </FormField>
            ) : null}

            {form.requestType === 'CONTACT_UPDATE' ? (
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="טלפון חדש">
                  <Input
                    type="tel"
                    inputMode="tel"
                    placeholder="05X-XXXXXXX"
                    value={form.nextPhone}
                    onChange={(event) => setForm((current) => ({ ...current, nextPhone: event.target.value }))}
                  />
                </FormField>
                <FormField label="אימייל חדש">
                  <Input
                    type="email"
                    inputMode="email"
                    placeholder="name@example.com"
                    value={form.nextEmail}
                    onChange={(event) => setForm((current) => ({ ...current, nextEmail: event.target.value }))}
                  />
                </FormField>
                <FormField label="איש קשר נוסף" description="אם צריך">
                  <Input
                    placeholder="שם וטלפון"
                    value={form.extraContact}
                    onChange={(event) => setForm((current) => ({ ...current, extraContact: event.target.value }))}
                  />
                </FormField>
              </div>
            ) : null}

              <FormField
                label="פירוט הבקשה"
                description="מה צריך שנעשה?"
                error={shouldShowError('message') ? formErrors.message || undefined : undefined}
                required
              >
              <Textarea
                id="message"
                name="message"
                rows={5}
                placeholder="למשל: צריך לתאם מעלית שירות ליום המעבר."
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                onBlur={() => setFormTouched((prev) => ({ ...prev, message: true }))}
                className="sm:min-h-[10rem]"
              />
            </FormField>

            <div className="flex flex-col gap-3 rounded-xl sm:rounded-[20px] border border-subtle-border bg-muted/30 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4 sm:py-4">
              <div className="space-y-0.5 sm:space-y-1">
                <div className="text-xs sm:text-sm font-semibold text-foreground">בקשת {activeType.label}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{selectedTypeDescription.nextStep}</div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button variant="outline" onClick={() => setFormStep(1)} className="w-full sm:w-auto">
                  חזרה לבחירה
                </Button>
                <Button onClick={submitRequest} disabled={submitting || Boolean(formErrors.subject || formErrors.message)} className="w-full sm:w-auto">
                  {submitting ? 'שולח...' : 'שלח בקשה'}
                </Button>
              </div>
            </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
      </>
      ) : null}

      {view === 'history' ? (
      <Card variant="elevated">
        <CardContent className="space-y-6 p-6">
          <SectionHeader title="מעקב" subtitle="סטטוס קצר וברור" meta={`${history.length} פריטים`} />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="סטטוס">
              <Select value={historyFilter.status} onValueChange={(value) => setHistoryFilter((current) => ({ ...current, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">כל הסטטוסים</SelectItem>
                  <SelectItem value="SUBMITTED">התקבלה</SelectItem>
                  <SelectItem value="IN_REVIEW">בטיפול</SelectItem>
                  <SelectItem value="COMPLETED">הושלמה</SelectItem>
                  <SelectItem value="CLOSED">נסגרה</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="סוג בקשה">
              <Select value={historyFilter.requestType} onValueChange={(value) => setHistoryFilter((current) => ({ ...current, requestType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">כל סוגי הבקשות</SelectItem>
                  {requestTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {historyError ? <InlineErrorPanel title="היסטוריית הבקשות לא נטענה" description={historyError} onRetry={loadHistory} /> : null}

          {loading ? (
            <MobileCardSkeleton cards={2} />
          ) : !history.length && !historyError ? (
            <EmptyState
              type={filtersApplied ? 'search' : 'action'}
              title={filtersApplied ? 'אין תוצאות למסנן הנוכחי' : 'עדיין אין בקשות להצגה'}
              description={
                filtersApplied
                  ? 'נסה לנקות את המסננים או לבחור סוג בקשה אחר.'
                  : 'כשתשלח בקשה חדשה לצוות הניהול, היא תופיע כאן עם סטטוס ברור, הערות טיפול ותאריך עדכון.'
              }
              action={
                filtersApplied
                  ? {
                      label: 'נקה מסננים',
                      onClick: () => setHistoryFilter({ status: 'ALL', requestType: 'ALL' }),
                      variant: 'outline',
                    }
                  : {
                      label: 'פתח קריאת תחזוקה',
                      onClick: () => router.push('/create-call'),
                      variant: 'outline',
                    }
              }
            />
          ) : (
            <div className="space-y-8">
              <section className="space-y-4">
                <SectionHeader title="בטיפול" subtitle="הבקשות שעדיין פתוחות" meta={`${openRequests.length} פתוחות`} />
                {openRequests.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-10">
                      <EmptyState
                        type="empty"
                        title="אין כרגע בקשות פתוחות"
                        description="כל הבקשות האחרונות הושלמו או נסגרו. בקשה חדשה תופיע כאן עד לסיום הטיפול."
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <RequestHistoryList items={openRequests} locale={locale} />
                )}
              </section>

              <section className="space-y-4">
                <SectionHeader title="הושלמו" subtitle="בקשות שנסגרו" meta={`${closedRequests.length} הושלמו`} />
                {closedRequests.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-10">
                      <EmptyState
                        type="empty"
                        title="אין עדיין בקשות שהושלמו"
                        description="בקשות שיסיימו טיפול יופיעו כאן עם תאריך העדכון האחרון."
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <RequestHistoryList items={closedRequests} locale={locale} />
                )}
              </section>
            </div>
          )}
        </CardContent>
      </Card>
      ) : null}
    </div>
  );
}

function RequestHistoryList({ items, locale }: { items: RequestHistoryItem[]; locale: string }) {
  return (
    <div className="space-y-2.5 sm:space-y-3">
      {items.map((item) => (
        <div key={item.requestKey} className="rounded-xl sm:rounded-[20px] border border-subtle-border bg-background p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <StatusBadge label={getResidentRequestStatusLabel(item.status)} tone={getResidentRequestStatusTone(item.status)} />
                <StatusBadge label={getRequestTypeLabel(item.requestType)} tone="neutral" />
                {item.requestedDate ? (
                  <StatusBadge
                    label={`יעד: ${formatDate(item.requestedDate, locale)}`}
                    tone="warning"
                    className="gap-1.5"
                  />
                ) : null}
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                <div className="text-sm sm:text-base font-semibold text-foreground">{item.subject.replace(/^[A-Z_]+:\s*/, '')}</div>
                <div className="text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground line-clamp-2 sm:line-clamp-none">{item.message}</div>
              </div>

              {item.statusNotes ? (
                <div className="rounded-xl sm:rounded-2xl border border-subtle-border bg-muted/40 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">הערת טיפול:</span> {item.statusNotes}
                </div>
              ) : null}
            </div>

            <div className="shrink-0 rounded-xl sm:rounded-2xl border border-subtle-border bg-muted/40 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                עודכן
              </div>
              <div className="mt-1 sm:mt-2 font-medium text-foreground">{formatDate(new Date(item.updatedAt || item.createdAt), locale)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SegmentedChoices({
  value,
  options,
  onChange,
  columns = 2,
}: {
  value: string;
  options: ReadonlyArray<{ value: string; label: string; description?: string }>;
  onChange: (value: string) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={`grid gap-2 ${columns === 1 ? 'grid-cols-1' : 'grid-cols-1 min-[390px]:grid-cols-2'}`}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={`touch-target rounded-[18px] border px-4 py-3 text-start transition ${
              selected
                ? 'border-primary/35 bg-primary/10 text-foreground shadow-[0_10px_28px_rgba(59,130,246,0.12)]'
                : 'border-subtle-border bg-background text-foreground/80 hover:border-primary/20 hover:bg-muted/40'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`text-sm font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>{option.label}</span>
              {selected ? <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-semibold text-primary">נבחר</span> : null}
            </div>
            {option.description ? <div className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</div> : null}
          </button>
        );
      })}
    </div>
  );
}

function getRequestExpectations(requestType: string) {
  switch (requestType) {
    case 'MOVING':
      return {
        description: 'מעבר עם תיאום קצר וברור.',
        responseWindow: 'עד יום עסקים אחד',
        owner: 'צוות ניהול הבניין',
        nextStep: 'נשלח לך אישור ותיאום.',
        afterSubmit: 'הצוות יבדוק זמינות ויעדכן אותך.',
      };
    case 'PARKING':
      return {
        description: 'חניה, הקצאה או תקלה.',
        responseWindow: 'עד 2 ימי עסקים',
        owner: 'צוות ניהול וחניה',
        nextStep: 'נעדכן כאן את הסטטוס.',
        afterSubmit: 'הצוות יבדוק ויחזור אליך.',
      };
    case 'DOCUMENT':
      return {
        description: 'בקשת מסמך בכמה שניות.',
        responseWindow: 'עד יום עסקים אחד',
        owner: 'צוות הנהלה או גבייה',
        nextStep: 'המסמך יישלח או יעלה לחשבון.',
        afterSubmit: 'הצוות יאתר את המסמך ויעדכן אותך.',
      };
    case 'CONTACT_UPDATE':
      return {
        description: 'עדכון פרטי קשר במהירות.',
        responseWindow: 'עד יום עסקים אחד',
        owner: 'צוות שירות דיירים',
        nextStep: 'נעדכן כשהשינוי נקלט.',
        afterSubmit: 'הצוות יעדכן את החשבון במידת הצורך.',
      };
    default:
      return {
        description: 'פנייה קצרה לכל נושא אחר.',
        responseWindow: 'עד 2 ימי עסקים',
        owner: 'צוות שירות וניהול',
        nextStep: 'נעדכן כאן את הסטטוס.',
        afterSubmit: 'הבקשה תועבר לצוות המתאים.',
      };
  }
}
