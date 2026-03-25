import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CalendarDays, FileText, Move, ParkingCircle, PhoneCall, Sparkles } from 'lucide-react';
import { authFetch, getCurrentUserId, getEffectiveRole } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import { FileUpload } from '../../components/ui/file-upload';
import { FormField, FormErrorSummary } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { MobileContextBar } from '../../components/ui/mobile-context-bar';
import { MobileCardSkeleton } from '../../components/ui/page-states';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { MobileInsightWidget } from '../../components/ui/mobile-insight-widget';
import { PrimaryActionCard } from '../../components/ui/primary-action-card';
import { PullToRefreshIndicator } from '../../components/ui/pull-to-refresh-indicator';
import { SectionHeader } from '../../components/ui/section-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { StatusBadge } from '../../components/ui/status-badge';
import { AmsDrawer } from '../../components/ui/ams-drawer';
import { AmsSegmentedChoice } from '../../components/ui/ams-segmented-choice';
import { AmsTabs } from '../../components/ui/ams-tabs';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/use-toast';
import { ResidentHero } from '../../components/resident/resident-hero';
import { usePullToRefresh } from '../../hooks/use-pull-to-refresh';
import { triggerHaptic } from '../../lib/mobile';
import { showRequestSubmitted } from '../../lib/success-feedback';
import {
  formatDate,
  getRequestTypeLabel,
  getResidentRequestStatusLabel,
  getResidentRequestStatusTone,
} from '../../lib/utils';
import { useLocale } from '../../lib/providers';
import { setResumeState } from '../../lib/engagement';

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
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftAttachment, setDraftAttachment] = useState<File | null>(null);
  const [submittedRequestKey, setSubmittedRequestKey] = useState<string | null>(null);
  const [submittedRequestType, setSubmittedRequestType] = useState<string | null>(null);
  const [view, setView] = useState<'new' | 'history'>('history');

  const activeType = requestTypes.find((item) => item.value === form.requestType)!;
  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: async () => {
      await loadHistory();
    },
  });

  useEffect(() => {
    setResumeState({ screen: 'resident', href: '/resident/requests', label: 'בקשות דייר', role: getEffectiveRole() || 'RESIDENT', userId: getCurrentUserId() });
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [historyFilter.status, historyFilter.requestType]);

  useEffect(() => {
    if (!router.isReady) return;
    const nextView = router.query.view === 'new' ? 'new' : 'history';
    setView(nextView);
    setComposerOpen(false);
    setFormStep(1);
  }, [router.isReady, router.query.view]);

  useEffect(() => {
    if (view !== 'new' || !composerOpen) return;
    setResumeState({
      screen: 'resident',
      href: '/resident/requests?view=new',
      label: `בקשה חדשה · שלב ${formStep}`,
      role: getEffectiveRole() || 'RESIDENT',
      userId: getCurrentUserId(),
      context: {
        requestStep: formStep,
        requestType: form.requestType,
      },
    });
  }, [composerOpen, form.requestType, formStep, view]);

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
          attachmentName: draftAttachment?.name || null,
        };
      case 'PARKING':
        return {
          parkingRequestType: form.parkingRequestType,
          plateNumber: form.plateNumber || null,
          attachmentName: draftAttachment?.name || null,
        };
      case 'DOCUMENT':
        return {
          documentCategory: form.documentCategory,
          attachmentName: draftAttachment?.name || null,
        };
      case 'CONTACT_UPDATE':
        return {
          nextPhone: form.nextPhone || null,
          nextEmail: form.nextEmail || null,
          extraContact: form.extraContact || null,
          attachmentName: draftAttachment?.name || null,
        };
      default:
        return {
          attachmentName: draftAttachment?.name || null,
        };
    }
  }, [draftAttachment?.name, form]);

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
      showRequestSubmitted(form.requestType);
      triggerHaptic('success');
      setSubmittedRequestKey(payload?.requestKey || `REQ-${new Date().getTime().toString().slice(-6)}`);
      setSubmittedRequestType(form.requestType);
      setForm(emptyForm);
      setDraftAttachment(null);
      setFormTouched({});
      setFormSubmitted(false);
      setSubmitError(null);
      setFormStep(1);
      setComposerOpen(false);
      setView('history');
      void router.replace('/resident/requests?view=history', undefined, { shallow: true });
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
  const selectedTypeDescription = getRequestExpectations(form.requestType);
  const submittedTypeDescription = getRequestExpectations(submittedRequestType || form.requestType);
  const stepSummaries = [
    { id: 1, label: 'סוג בקשה' },
    { id: 2, label: 'פרטים ואישור' },
  ] as const;
  const fieldLabels = {
    subject: 'נושא',
    message: 'פרטי הבקשה',
    requestedDate: 'תאריך מבוקש',
  };

  function openComposer(nextStep: 1 | 2 = 1) {
    setComposerOpen(true);
    setFormStep(nextStep);
    setSubmitError(null);
    setView('new');
    triggerHaptic('light');
  }

  function closeComposer() {
    setComposerOpen(false);
  }

  function advanceComposer(nextStep: 1 | 2) {
    triggerHaptic('light');
    setFormStep(nextStep);
  }

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

      <ResidentHero
        eyebrow="מסלול בקשות"
        title="בקשות דייר"
        subtitle="בחר מסלול קצר, הוסף רק את מה שצריך, וקבל צפי ברור כבר במסך הראשון."
        badge={<div className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white">שירות עצמי</div>}
        floatingCard={
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/72">
                  {openRequests[0] ? 'כרגע בטיפול' : 'המסלול הבא'}
                </div>
                <div className="mt-1 text-[26px] font-black leading-[1.04] text-foreground">
                  {openRequests[0] ? openRequests[0].subject.replace(/^[A-Z_]+:\s*/, '') : activeType.label}
                </div>
                <div className="mt-2 text-[14px] leading-6 text-secondary-foreground">
                  {openRequests[0]
                    ? openRequests[0].statusNotes || t('residentRequests.priority.waitingReason')
                    : `${selectedTypeDescription.responseWindow} · ${selectedTypeDescription.owner}`}
                </div>
              </div>
              <StatusBadge
                label={openRequests[0] ? getResidentRequestStatusLabel(openRequests[0].status) : 'פתיחה מהירה'}
                tone={openRequests[0] ? getResidentRequestStatusTone(openRequests[0].status) : 'finance'}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MobileInsightWidget
                title="מעקב חי"
                value={openRequests.length}
                hint={openRequests[0] ? openRequests[0].subject.replace(/^[A-Z_]+:\s*/, '') : 'אין בקשה פתוחה כרגע'}
                tone={openRequests.length ? 'warning' : 'success'}
                href="/resident/requests?view=history"
                sparkline={[openRequests.length, closedRequests.length, history.length]}
                pulse={openRequests.length > 0}
              />
              <MobileInsightWidget
                title="הבקשה הבאה"
                value={activeType.label}
                hint={`${selectedTypeDescription.responseWindow} · ${selectedTypeDescription.owner}`}
                tone="default"
                onClick={() => {
                  void router.replace('/resident/requests?view=new', undefined, { shallow: true });
                }}
                sparkline={[
                  form.requestType === 'MOVING' ? 82 : 24,
                  form.requestType === 'PARKING' ? 72 : 28,
                  form.requestType === 'DOCUMENT' ? 54 : 18,
                  form.requestType === 'CONTACT_UPDATE' ? 42 : 16,
                  form.requestType === 'GENERAL' ? 34 : 14,
                ]}
              />
            </div>
          </div>
        }
        bodyClassName="pt-0"
      >
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            size="lg"
            className="min-h-[54px] rounded-full"
            onClick={() => {
              void router.replace('/resident/requests?view=new', undefined, { shallow: true });
            }}
          >
            בקשה חדשה
          </Button>
          <Button asChild variant="outline" size="lg" className="min-h-[54px] rounded-full border-primary/14 bg-white/76 text-foreground hover:bg-white">
            <Link href="/create-call">קריאת תחזוקה</Link>
          </Button>
        </div>
      </ResidentHero>

      {view === 'history' && openRequests[0] ? (
        <PrimaryActionCard
          eyebrow="בטיפול עכשיו"
          title={openRequests[0].subject.replace(/^[A-Z_]+:\s*/, '')}
          description={openRequests[0].statusNotes || t('residentRequests.priority.waitingReason')}
          ctaLabel="פתח מעקב"
          onClick={() => {
            setView('history');
          }}
          tone={openRequests[0].status === 'SUBMITTED' ? 'warning' : 'default'}
          visualStyle="resident"
          secondaryAction={
            <div className="flex flex-wrap items-center gap-2 text-xs text-secondary-foreground">
              <span>{t('common.updatedAt', { value: formatDate(new Date(openRequests[0].updatedAt || openRequests[0].createdAt), locale) })}</span>
              <span>{getResidentRequestStatusLabel(openRequests[0].status)}</span>
            </div>
          }
        />
      ) : null}

      <AmsTabs
        ariaLabel="Resident requests"
        selectedKey={view}
        onSelectionChange={(key) => {
          const nextView = key as 'new' | 'history';
          setView(nextView);
          setComposerOpen(false);
          void router.replace(`/resident/requests?view=${nextView}`, undefined, { shallow: true });
        }}
        items={[
          { key: 'new', title: 'בקשה חדשה' },
          { key: 'history', title: 'מעקב', badge: openRequests.length || null },
        ]}
      />

      {submittedRequestKey ? (
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
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSubmittedRequestKey(null);
                  setSubmittedRequestType(null);
                  void router.replace('/resident/requests?view=new', undefined, { shallow: true });
                }}
              >
                בקשה נוספת
              </Button>
              <Button type="button" onClick={() => setView('history')}>
                פתח מעקב
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {view === 'new' ? (
        <>
          <Card variant="elevated">
            <CardContent className="space-y-4 p-4">
              <SectionHeader
                title="בקשה חדשה"
                subtitle="בחר מסלול והמשך לפרטים."
                meta={`${requestTypes.length} מסלולים`}
                actions={
                  <Button size="sm" className="rounded-full px-4" onClick={() => openComposer(1)}>
                    פתח פרטים
                  </Button>
                }
              />
              <div className="grid grid-cols-2 gap-3">
                {requestTypes.map((item) => {
                  const Icon = item.icon;
                  const selected = item.value === form.requestType;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setForm((current) => ({ ...current, requestType: item.value }));
                        openComposer(2);
                      }}
                      className={cn(
                        'rounded-[22px] border p-3.5 text-right shadow-[0_16px_34px_rgba(44,28,9,0.07)] transition hover:-translate-y-0.5 hover:border-primary/18',
                        selected
                          ? 'gold-sheen-surface border-primary/28'
                          : 'border-subtle-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(250,247,241,0.94)_100%)]',
                      )}
                      data-accent-sheen={selected ? 'true' : undefined}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-primary/12 bg-primary/8 text-primary">
                          <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                        </span>
                        <span className="rounded-full border border-primary/10 bg-primary/6 px-2.5 py-1 text-[11px] font-semibold text-primary">
                          {item.description}
                        </span>
                      </div>
                      <div className="mt-3 text-[14px] font-semibold text-foreground">{item.label}</div>
                      <div className="mt-1 text-[11px] leading-5 text-secondary-foreground">{item.description}</div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      <AmsDrawer
        isOpen={composerOpen}
        onOpenChange={(open) => {
          if (!open) closeComposer();
          else setComposerOpen(true);
        }}
        title="בקשה חדשה"
        description="פרטים קצרים ושליחה."
        tone="light"
        headerClassName="text-right"
        bodyClassName="text-right"
        footer={(onClose) => (
          <div className="w-full space-y-2">
            {formStep === 1 ? (
              <Button type="button" size="lg" className="w-full" onClick={() => advanceComposer(2)}>
                המשך לפרטים
              </Button>
            ) : null}
            {formStep === 2 ? (
              <>
                <Button type="button" size="lg" className="w-full" onClick={submitRequest} disabled={submitting}>
                  {submitting ? 'שולח...' : 'שלח בקשה'}
                </Button>
                <Button type="button" variant="outline" className="w-full rounded-full" onClick={() => advanceComposer(1)}>
                  חזרה לסוג הבקשה
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-full text-secondary-foreground hover:bg-muted/70"
              onClick={() => {
                onClose();
                closeComposer();
              }}
            >
              סגור
            </Button>
          </div>
        )}
      >
        <div className="space-y-4">
          <RequestFlowProgress currentStep={formStep} items={stepSummaries} />

          {formStep === 1 ? (
            <RequestTypePicker
              items={requestTypes}
              selectedValue={form.requestType}
              onSelect={(value) => {
                setForm((current) => ({ ...current, requestType: value }));
                setSubmittedRequestKey(null);
                advanceComposer(2);
              }}
            />
          ) : null}

          {formStep === 2 ? (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-subtle-border bg-background/90 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary-foreground">נבחר עכשיו</div>
                <div className="mt-1 text-lg font-semibold text-foreground">{activeType.label}</div>
                <div className="mt-1 text-sm leading-6 text-secondary-foreground">{selectedTypeDescription.description}</div>
              </div>

              <FormErrorSummary errors={visibleFormErrors} fieldLabels={fieldLabels} />

              {form.requestType === 'MOVING' ? (
                <div className="space-y-4">
                  <FormField label="סוג מעבר">
                    <AmsSegmentedChoice
                      value={form.movingDirection}
                      options={movingDirectionOptions}
                      onChange={(value) => setForm((current) => ({ ...current, movingDirection: value as typeof emptyForm.movingDirection }))}
                    />
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="תאריך מבוקש" error={shouldShowError('requestedDate') ? formErrors.requestedDate : ''}>
                      <Input
                        name="requestedDate"
                        aria-label="תאריך מבוקש"
                        type="date"
                        value={form.requestedDate}
                        onChange={(event) => setForm((current) => ({ ...current, requestedDate: event.target.value }))}
                        onBlur={() => setFormTouched((current) => ({ ...current, requestedDate: true }))}
                      />
                    </FormField>

                    <FormField label="חלון זמן מועדף">
                    <Input
                      name="movingWindow"
                      aria-label="חלון זמן מועדף"
                      placeholder="למשל 08:00-11:00"
                        value={form.movingWindow}
                        onChange={(event) => setForm((current) => ({ ...current, movingWindow: event.target.value }))}
                      />
                    </FormField>
                  </div>

                  <FormField label="שמירת מעלית">
                    <AmsSegmentedChoice
                      value={form.elevatorNeeded}
                      options={elevatorOptions}
                      onChange={(value) => setForm((current) => ({ ...current, elevatorNeeded: value as typeof emptyForm.elevatorNeeded }))}
                      columns={1}
                    />
                  </FormField>
                </div>
              ) : null}

              {form.requestType === 'PARKING' ? (
                <div className="space-y-4">
                  <FormField label="סוג בקשת חניה">
                    <AmsSegmentedChoice
                      value={form.parkingRequestType}
                      options={parkingRequestOptions}
                      onChange={(value) => setForm((current) => ({ ...current, parkingRequestType: value as typeof emptyForm.parkingRequestType }))}
                    />
                  </FormField>

                  <FormField label="מספר רכב">
                    <Input
                      name="plateNumber"
                      aria-label="מספר רכב"
                      placeholder="123-45-678"
                      value={form.plateNumber}
                      onChange={(event) => setForm((current) => ({ ...current, plateNumber: event.target.value }))}
                    />
                  </FormField>
                </div>
              ) : null}

              {form.requestType === 'DOCUMENT' ? (
                <FormField label="איזה מסמך צריך">
                  <AmsSegmentedChoice
                    value={form.documentCategory}
                    options={documentCategoryOptions}
                    onChange={(value) => setForm((current) => ({ ...current, documentCategory: value as typeof emptyForm.documentCategory }))}
                  />
                </FormField>
              ) : null}

              {form.requestType === 'CONTACT_UPDATE' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="טלפון חדש">
                    <Input
                      name="nextPhone"
                      aria-label="טלפון חדש"
                      placeholder="050-1234567"
                      value={form.nextPhone}
                      onChange={(event) => setForm((current) => ({ ...current, nextPhone: event.target.value }))}
                    />
                  </FormField>

                  <FormField label="אימייל חדש">
                    <Input
                      name="nextEmail"
                      aria-label="אימייל חדש"
                      type="email"
                      placeholder="name@example.com"
                      value={form.nextEmail}
                      onChange={(event) => setForm((current) => ({ ...current, nextEmail: event.target.value }))}
                    />
                  </FormField>

                  <FormField className="sm:col-span-2" label="איש קשר נוסף">
                    <Input
                      name="extraContact"
                      aria-label="איש קשר נוסף"
                      placeholder="שם ותפקיד, אם צריך"
                      value={form.extraContact}
                      onChange={(event) => setForm((current) => ({ ...current, extraContact: event.target.value }))}
                    />
                  </FormField>
                </div>
              ) : null}

              <div className="grid gap-4">
                <FormField label="נושא" required error={shouldShowError('subject') ? formErrors.subject : ''}>
                  <Input
                    name="subject"
                    aria-label="נושא"
                    placeholder={`למשל: ${activeType.label} לבניין`}
                    value={form.subject}
                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                    onBlur={() => setFormTouched((current) => ({ ...current, subject: true }))}
                  />
                </FormField>

                <FormField label="פרטי הבקשה" required error={shouldShowError('message') ? formErrors.message : ''}>
                  <Textarea
                    name="message"
                    aria-label="פרטי הבקשה"
                    rows={5}
                    placeholder="כתוב בקצרה מה צריך, מתי, ולמי חשוב לעדכן."
                    value={form.message}
                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    onBlur={() => setFormTouched((current) => ({ ...current, message: true }))}
                  />
                </FormField>
              </div>

              <FileUpload
                label="קובץ עזר (אופציונלי)"
                hint="אפשר לצרף צילום, מסמך או קובץ עזר שיסומן בבקשה לצוות."
                onFileSelect={setDraftAttachment}
              />

              <div className="space-y-3 rounded-[24px] border border-subtle-border bg-background/90 p-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary-foreground">לפני שליחה</div>
                  <div className="mt-1 text-lg font-semibold text-foreground">{selectedTypeDescription.nextStep}</div>
                  <div className="mt-1 text-sm leading-6 text-secondary-foreground">{selectedTypeDescription.afterSubmit}</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ReviewTile label="נושא" value={form.subject || 'לא הוזן'} />
                  <ReviewTile label="צפי טיפול" value={selectedTypeDescription.responseWindow} />
                  <ReviewTile label="מטפל" value={selectedTypeDescription.owner} />
                  <ReviewTile label="קובץ עזר" value={draftAttachment?.name || 'ללא קובץ'} />
                </div>

                <div className="rounded-[22px] border border-subtle-border bg-background px-4 py-3 text-sm leading-6 text-secondary-foreground">
                  {form.message || 'לא הוזנו פרטים.'}
                </div>
              </div>

              {submitError ? (
                <InlineErrorPanel
                  title="לא הצלחנו לשלוח את הבקשה"
                  description={submitError}
                  onRetry={submitRequest}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </AmsDrawer>

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

function RequestTypePicker({
  items,
  selectedValue,
  onSelect,
}: {
  items: typeof requestTypes;
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  const selectItem = (value: string) => {
    onSelect(value);
  };

  return (
    <section className="space-y-3" aria-label="בחר סוג בקשה">
      <div className="text-right">
        <h2 className="text-[15px] font-semibold text-foreground">בחר סוג בקשה</h2>
        <p className="mt-1 text-[12px] leading-5 text-secondary-foreground">לחיצה מעבירה מיד לפרטים</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = item.value === selectedValue;

          return (
            <button
              key={item.value}
              type="button"
              onMouseDown={() => selectItem(item.value)}
              onClick={() => selectItem(item.value)}
              aria-pressed={selected}
              className={cn(
                'touch-target group w-full rounded-[22px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(250,247,241,0.94)_100%)] p-3.5 text-right shadow-[0_16px_34px_rgba(44,28,9,0.07)] transition-[transform,border-color,box-shadow,background] duration-200 active:scale-[0.99]',
                selected
                  ? 'border-primary/28 shadow-[0_20px_38px_rgba(188,136,20,0.16)] ring-1 ring-primary/12'
                  : 'border-subtle-border hover:border-primary/18 hover:shadow-[0_18px_36px_rgba(44,28,9,0.1)]',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    'inline-flex min-h-[30px] items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                    selected
                      ? 'border-primary/18 bg-primary/10 text-primary'
                      : 'border-subtle-border bg-background/88 text-secondary-foreground',
                  )}
                >
                  {selected ? 'נבחר' : 'פתח'}
                </span>
                <span
                  className={cn(
                    'inline-flex h-11 w-11 items-center justify-center rounded-[16px] border',
                    selected
                      ? 'border-primary/14 bg-primary/10 text-primary'
                      : 'border-subtle-border bg-background/88 text-foreground/72',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
              </div>

                <div className="mt-4">
                  <div className={cn('text-[15px] font-bold leading-6', selected ? 'text-primary' : 'text-foreground')}>
                    {item.label}
                  </div>
                  <div className="mt-1 text-[12px] leading-5 text-secondary-foreground">{item.description}</div>
                </div>

              <div className="mt-3 text-[12px] font-semibold text-primary">המשך</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RequestFlowProgress({
  currentStep,
  items,
}: {
  currentStep: 1 | 2;
  items: ReadonlyArray<{ id: 1 | 2; label: string }>;
}) {
  return (
    <div className="rounded-[22px] border border-subtle-border bg-background/90 p-3">
      <div className="flex items-center justify-between gap-2">
        {items.map((item, index) => {
          const isActive = item.id === currentStep;
          const isComplete = item.id < currentStep;

          return (
            <div key={item.id} className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  isActive
                    ? 'gold-sheen-button border-primary/30 text-primary-foreground'
                    : isComplete
                      ? 'border-primary/16 bg-primary/10 text-primary'
                      : 'border-subtle-border bg-background text-muted-foreground',
                )}
              >
                {item.id}
              </div>
              <div className="min-w-0 flex-1">
                <div className={cn('truncate text-[12px] font-semibold', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                  {item.label}
                </div>
                {index < items.length - 1 ? (
                  <div className={cn('mt-1 h-px w-full', isComplete ? 'gold-divider-line' : 'bg-border')} />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-subtle-border bg-background px-3 py-3 text-right">
      <div className="text-xs text-secondary-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
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
