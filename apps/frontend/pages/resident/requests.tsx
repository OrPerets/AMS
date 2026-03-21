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
import { MobileCardSkeleton } from '../../components/ui/page-states';
import { PageHero } from '../../components/ui/page-hero';
import { PullToRefreshIndicator } from '../../components/ui/pull-to-refresh-indicator';
import { SectionHeader } from '../../components/ui/section-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { StatusBadge } from '../../components/ui/status-badge';
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
  { value: 'MOVING', label: 'הודעת מעבר', icon: Move, description: 'כניסה או יציאה, חלון זמן ותיאום מעלית שירות.' },
  { value: 'PARKING', label: 'בקשת חניה', icon: ParkingCircle, description: 'שינוי הקצאה, אורח קבוע או תקלה בחניה.' },
  { value: 'DOCUMENT', label: 'בקשת מסמך', icon: FileText, description: 'חשבונית, פרוטוקול, תקנון או אישור רשמי.' },
  { value: 'CONTACT_UPDATE', label: 'עדכון פרטי קשר', icon: PhoneCall, description: 'טלפון, אימייל או איש קשר נוסף לחשבון.' },
  { value: 'GENERAL', label: 'בקשה כללית', icon: Sparkles, description: 'פנייה תפעולית שאינה קריאת תחזוקה.' },
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
  const { locale } = useLocale();
  const [form, setForm] = useState(emptyForm);
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState({ status: 'ALL', requestType: 'ALL' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeType = requestTypes.find((item) => item.value === form.requestType)!;
  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: async () => {
      await loadHistory();
    },
  });

  useEffect(() => {
    void loadHistory();
  }, [historyFilter.status, historyFilter.requestType]);

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
      subject: form.subject.trim() ? '' : 'יש למלא נושא קצר וברור.',
      message: form.message.trim().length >= 10 ? '' : 'יש להוסיף לפחות 10 תווים כדי שהצוות יבין מה נדרש.',
      requestedDate: form.requestType === 'MOVING' && !form.requestedDate ? 'מומלץ לציין תאריך מעבר.' : '',
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
      toast({ title: 'הבקשה נשלחה לצוות הניהול', variant: 'success' });
      triggerHaptic('success');
      setForm(emptyForm);
      setFormTouched({});
      setFormSubmitted(false);
      setSubmitError(null);
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

  return (
    <div className="space-y-5 sm:space-y-8">
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} label="משוך כדי לרענן בקשות דייר" />

      <PageHero
        compact
        kicker="שירות עצמי לדייר"
        eyebrow={<StatusBadge label="שירות דיירים" tone="finance" />}
        title="בקשות דייר"
        actions={
          <Button asChild variant="hero" size="sm">
            <Link href="/create-call">פתח קריאת תחזוקה</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>בחר סוג בקשה</CardTitle>
            <CardDescription>לקריאת תחזוקה השתמשו במסלול הייעודי כדי לצרף תמונות ולקבל טיפול מהיר.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {requestTypes.map((type) => {
              const Icon = type.icon;
              const isActive = form.requestType === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  className={`w-full rounded-xl sm:rounded-[20px] border p-3 sm:p-4 text-start transition active:scale-[0.98] ${
                    isActive ? 'border-primary bg-primary/10 shadow-sm' : 'border-subtle-border bg-background hover:border-primary/40 hover:bg-muted/40'
                  }`}
                  onClick={() => setForm((current) => ({ ...current, requestType: type.value }))}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className={`rounded-xl sm:rounded-2xl p-2 ${isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="text-sm sm:text-base font-semibold text-foreground">{type.label}</div>
                      <div className="text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>{activeType.label}</CardTitle>
            <CardDescription>{activeType.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SectionHeader
              title="פרטי הפנייה"
              subtitle="שדות חובה ברורים יותר, עם הסבר קצר על כל אזור כדי לקצר ניסוח ולצמצם פניות חסרות."
              meta="טופס ממוקד"
            />

            {visibleFormErrors.length > 0 ? (
              <FormErrorSummary
                errors={visibleFormErrors}
                fieldLabels={{ subject: 'נושא', message: 'פירוט הבקשה', requestedDate: 'תאריך מבוקש' }}
                title={`${visibleFormErrors.length > 1 ? `${visibleFormErrors.length} שדות` : 'שדה'} דורשים תיקון`}
              />
            ) : null}

            {submitError ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
                {submitError}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="נושא"
                description="שורה אחת שמתארת את מה שנדרש מהצוות."
                error={shouldShowError('subject') ? formErrors.subject || undefined : undefined}
                required
              >
                <Input
                  id="subject"
                  name="subject"
                  placeholder="לדוגמה: תיאום מעבר דירה ב-15/04"
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  onBlur={() => setFormTouched((prev) => ({ ...prev, subject: true }))}
                />
              </FormField>

              <FormField
                label="תאריך מבוקש"
                description="אופציונלי ברוב הבקשות, מומלץ במיוחד במעבר או בבקשת מסמך דחופה."
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
                  <Select value={form.movingDirection} onValueChange={(value) => setForm((current) => ({ ...current, movingDirection: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MOVE_IN">כניסה</SelectItem>
                      <SelectItem value="MOVE_OUT">יציאה</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="חלון זמן משוער" description="לדוגמה: 08:00-11:00.">
                  <Input
                    placeholder="08:00-11:00"
                    value={form.movingWindow}
                    onChange={(event) => setForm((current) => ({ ...current, movingWindow: event.target.value }))}
                  />
                </FormField>

                <FormField label="מעלית שירות" description="כדי שניתן יהיה לחסום ולתאם מראש.">
                  <Select value={form.elevatorNeeded} onValueChange={(value) => setForm((current) => ({ ...current, elevatorNeeded: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YES">נדרשת מעלית</SelectItem>
                      <SelectItem value="NO">לא נדרשת מעלית</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            ) : null}

            {form.requestType === 'PARKING' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="סוג בקשת חניה" description="מה בדיוק נדרש לעדכן או לבדוק.">
                  <Select value={form.parkingRequestType} onValueChange={(value) => setForm((current) => ({ ...current, parkingRequestType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHANGE_ASSIGNMENT">שינוי הקצאה</SelectItem>
                      <SelectItem value="GUEST">אורח קבוע</SelectItem>
                      <SelectItem value="ISSUE">בעיה קיימת</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="מספר רכב" description="אופציונלי, אבל עוזר לזהות את החניה הרלוונטית.">
                  <Input
                    placeholder="12-345-67"
                    value={form.plateNumber}
                    onChange={(event) => setForm((current) => ({ ...current, plateNumber: event.target.value }))}
                  />
                </FormField>
              </div>
            ) : null}

            {form.requestType === 'DOCUMENT' ? (
              <FormField label="סוג המסמך" description="בחר את המשפחה הקרובה ביותר למסמך המבוקש.">
                <Select value={form.documentCategory} onValueChange={(value) => setForm((current) => ({ ...current, documentCategory: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INVOICE">חשבונית / קבלה</SelectItem>
                    <SelectItem value="PROTOCOL">פרוטוקול</SelectItem>
                    <SelectItem value="REGULATION">תקנון</SelectItem>
                    <SelectItem value="CERTIFICATE">אישור</SelectItem>
                  </SelectContent>
                </Select>
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
                <FormField label="איש קשר נוסף" description="אם חשוב שנוכל לפנות גם למישהו נוסף.">
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
              description="הסבר חופשי: מה קרה, מה נדרש, ועד מתי חשוב לטפל."
              error={shouldShowError('message') ? formErrors.message || undefined : undefined}
              required
            >
              <Textarea
                id="message"
                name="message"
                rows={5}
                placeholder="לדוגמה: אבקש לתאם את המעלית לשעתיים ביום המעבר, כולל חסימת לובי והודעה לדיירים."
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                onBlur={() => setFormTouched((prev) => ({ ...prev, message: true }))}
                className="sm:min-h-[10rem]"
              />
            </FormField>

            <div className="flex flex-col gap-3 rounded-xl sm:rounded-[20px] border border-subtle-border bg-muted/30 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4 sm:py-4">
              <div className="space-y-0.5 sm:space-y-1">
                <div className="text-xs sm:text-sm font-semibold text-foreground">בקשת {activeType.label}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">עקוב אחרי סטטוס וטיפול לאחר השליחה.</div>
              </div>
              <Button onClick={submitRequest} disabled={submitting || Boolean(formErrors.subject || formErrors.message)} className="w-full sm:w-auto">
                {submitting ? 'שולח...' : 'שלח בקשה'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardContent className="space-y-6 p-6">
          <SectionHeader
            title="סינון ומעקב"
            subtitle="ההיסטוריה מחולקת בין בקשות שעדיין בטיפול לבין בקשות שהושלמו, כדי שסטטוס יהיה קריא גם בלי לפתוח כל פריט."
            meta={`${history.length} פריטים`}
          />

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
                <SectionHeader title="בטיפול כעת" subtitle="בקשות פתוחות שמחכות להמשך טיפול או לאישור." meta={`${openRequests.length} פתוחות`} />
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
                <SectionHeader title="הושלמו ונסגרו" subtitle="ארכיון קצר של בקשות שנענו או נסגרו." meta={`${closedRequests.length} הושלמו`} />
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
