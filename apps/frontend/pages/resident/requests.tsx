import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CalendarDays, CheckCircle2, FileText, Move, ParkingCircle, PhoneCall, Sparkles } from 'lucide-react';
import { authFetch, getCurrentUserId, getEffectiveRole } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import { FileUpload } from '../../components/ui/file-upload';
import { FormActionHint, FormField, FormErrorSummary } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { InlineErrorPanel } from '../../components/ui/inline-feedback';
import { MobileContextBar } from '../../components/ui/mobile-context-bar';
import { MobileRowActionsSheet, type MobileRowActionItem } from '../../components/ui/mobile-row-actions-sheet';
import { MobileCardSkeleton } from '../../components/ui/page-states';
import { CompactStatusStrip } from '../../components/ui/compact-status-strip';
import { GlassSurface } from '../../components/ui/glass-surface';
import { MobileSwipeActionCard } from '../../components/ui/mobile-swipe-action-card';
import { PrimaryActionCard } from '../../components/ui/primary-action-card';
import { PullToRefreshIndicator } from '../../components/ui/pull-to-refresh-indicator';
import { QuickActionTile } from '../../components/ui/quick-action-tile';
import { ResidentListCard } from '../../components/ui/resident-list-card';
import { SectionHeader } from '../../components/ui/section-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { StatusBadge } from '../../components/ui/status-badge';
import { AmsDrawer } from '../../components/ui/ams-drawer';
import { AmsSegmentedChoice } from '../../components/ui/ams-segmented-choice';
import { AmsTabs } from '../../components/ui/ams-tabs';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/use-toast';
import { usePullToRefresh } from '../../hooks/use-pull-to-refresh';
import { useLongPressActions } from '../../hooks/use-long-press-actions';
import { triggerHaptic } from '../../lib/mobile';
import { getRouteTransitionTokensByKey } from '../../lib/route-transition-contract';
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

function getRequestSignature(item: RequestHistoryItem) {
  return [
    item.requestKey,
    item.status,
    item.updatedAt,
    item.subject,
    item.message,
    item.requestType,
    item.statusNotes ?? '',
  ].join('|');
}

function countChangedRequests(previous: RequestHistoryItem[], next: RequestHistoryItem[]) {
  const previousMap = new Map(previous.map((item) => [item.requestKey, getRequestSignature(item)]));
  const nextMap = new Map(next.map((item) => [item.requestKey, getRequestSignature(item)]));
  let changed = 0;

  nextMap.forEach((signature, key) => {
    const previousSignature = previousMap.get(key);
    if (!previousSignature || previousSignature !== signature) {
      changed += 1;
    }
  });

  previousMap.forEach((_signature, key) => {
    if (!nextMap.has(key)) {
      changed += 1;
    }
  });

  return changed;
}

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

type RequestDraftPayload = {
  form: typeof emptyForm;
  formStep: 1 | 2 | 3;
};

export default function ResidentRequestsPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const transitionTokens = getRouteTransitionTokensByKey('requests');
  const iconLayoutId = prefersReducedMotion ? undefined : transitionTokens.icon;
  const badgeLayoutId = prefersReducedMotion ? undefined : transitionTokens.badge;
  const titleLayoutId = prefersReducedMotion ? undefined : transitionTokens.title;
  const [form, setForm] = useState(emptyForm);
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState({ status: 'ALL', requestType: 'ALL' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftAttachment, setDraftAttachment] = useState<File | null>(null);
  const [submittedRequestKey, setSubmittedRequestKey] = useState<string | null>(null);
  const [submittedRequestType, setSubmittedRequestType] = useState<string | null>(null);
  const [view, setView] = useState<'new' | 'history'>('history');
  const [draftRestored, setDraftRestored] = useState(false);
  const draftHydratedRef = React.useRef(false);
  const historyRef = React.useRef<RequestHistoryItem[]>([]);
  const deltaTimeoutRef = React.useRef<number | null>(null);
  const [refreshDeltaCount, setRefreshDeltaCount] = useState<number | null>(null);
  const currentUserId = getCurrentUserId() || 'anonymous';
  const currentRole = getEffectiveRole() || 'RESIDENT';
  const draftStorageKey = useMemo(
    () => `resident-requests-draft:${currentUserId}:${currentRole}`,
    [currentRole, currentUserId],
  );

  historyRef.current = history;

  const activeType = requestTypes.find((item) => item.value === form.requestType)!;
  const { pullDistance, isRefreshing, threshold } = usePullToRefresh({
    preset: 'detail',
    onThresholdReached: () => triggerHaptic('light'),
    onRefresh: async () => {
      const previousHistory = historyRef.current;
      const nextHistory = await loadHistory();
      const deltaCount = countChangedRequests(previousHistory, nextHistory);
      setRefreshDeltaCount(deltaCount);
      if (deltaTimeoutRef.current) {
        window.clearTimeout(deltaTimeoutRef.current);
      }
      deltaTimeoutRef.current = window.setTimeout(() => setRefreshDeltaCount(null), 1800);
    },
  });

  useEffect(() => {
    setResumeState({ screen: 'resident', href: '/resident/requests', label: 'בקשות דייר', role: getEffectiveRole() || 'RESIDENT', userId: getCurrentUserId() });
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [historyFilter.status, historyFilter.requestType]);

  useEffect(() => {
    return () => {
      if (deltaTimeoutRef.current) {
        window.clearTimeout(deltaTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const nextView = router.query.view === 'new' ? 'new' : 'history';
    setView(nextView);
    setComposerOpen(nextView === 'new');
    setFormStep(1);
  }, [router.isReady, router.query.view]);

  useEffect(() => {
    draftHydratedRef.current = false;
    setDraftRestored(false);
  }, [draftStorageKey]);

  useEffect(() => {
    if (!composerOpen || draftHydratedRef.current) return;
    draftHydratedRef.current = true;
    if (typeof window === 'undefined') return;

    const serializedDraft = window.localStorage.getItem(draftStorageKey);
    if (!serializedDraft) return;

    try {
      const parsedDraft = JSON.parse(serializedDraft) as Partial<RequestDraftPayload>;
      if (parsedDraft.form && typeof parsedDraft.form === 'object') {
        setForm((current) => ({ ...current, ...parsedDraft.form }));
      }
      if (parsedDraft.formStep && [1, 2, 3].includes(parsedDraft.formStep)) {
        setFormStep(parsedDraft.formStep);
      }
      setDraftRestored(true);
    } catch (error) {
      console.error(error);
      window.localStorage.removeItem(draftStorageKey);
    }
  }, [composerOpen, draftStorageKey]);

  useEffect(() => {
    if (!composerOpen || typeof window === 'undefined') return;
    const timeoutId = window.setTimeout(() => {
      const draftPayload: RequestDraftPayload = {
        form,
        formStep,
      };
      window.localStorage.setItem(draftStorageKey, JSON.stringify(draftPayload));
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [composerOpen, draftStorageKey, form, formStep]);

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
      const nextHistory = Array.isArray(payload) ? payload : [];
      setHistory(nextHistory);
      return nextHistory as RequestHistoryItem[];
    } catch (error) {
      console.error(error);
      setHistoryError('לא ניתן לטעון כרגע את היסטוריית הבקשות.');
      toast({ title: 'טעינת היסטוריית הבקשות נכשלה', variant: 'destructive' });
      return historyRef.current;
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
  const hasRequiredErrors = Boolean(formErrors.subject || formErrors.message || formErrors.requestedDate);

  async function submitRequest() {
    setFormSubmitted(true);
    setSubmitError(null);

    if (hasRequiredErrors) {
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
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(draftStorageKey);
      }
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
    { id: 1, label: 'סוג' },
    { id: 2, label: 'פרטים' },
    { id: 3, label: 'אישור' },
  ] as const;
  const fieldLabels = {
    subject: 'נושא',
    message: 'פרטי הבקשה',
    requestedDate: 'תאריך מבוקש',
  };

  function openComposer(nextStep: 1 | 2 | 3 = 1) {
    setComposerOpen(true);
    setFormStep(nextStep);
    setSubmitError(null);
    setDraftRestored(false);
    setView('new');
    triggerHaptic('light');
  }

  function closeComposer() {
    setComposerOpen(false);
  }

  function clearDraft() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(draftStorageKey);
    }
    setForm(emptyForm);
    setFormTouched({});
    setFormSubmitted(false);
    setSubmitError(null);
    setFormStep(1);
    setDraftAttachment(null);
    setDraftRestored(false);
  }

  function advanceComposer(nextStep: 1 | 2 | 3) {
    triggerHaptic('light');
    setFormStep(nextStep);
  }

  function advanceToReview() {
    setFormSubmitted(true);
    if (hasRequiredErrors) {
      toast({ title: 'יש להשלים את השדות הנדרשים לפני האישור', variant: 'destructive' });
      return;
    }
    advanceComposer(3);
  }

  return (
    <div className="space-y-5 pb-4 sm:space-y-8">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        deltaChipCount={refreshDeltaCount}
        threshold={threshold}
        label="משוך כדי לרענן בקשות דייר"
      />

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

      <GlassSurface strength="strong" className="rounded-[28px] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 md:hidden">
              <motion.span
                layoutId={iconLayoutId}
                initial={prefersReducedMotion ? { opacity: 0.94 } : false}
                animate={prefersReducedMotion ? { opacity: 1 } : undefined}
                transition={prefersReducedMotion ? { duration: 0.2, ease: 'easeOut' } : undefined}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-primary/16 bg-primary/10 text-primary"
              >
                <FileText className="h-4 w-4" strokeWidth={1.85} />
              </motion.span>
              <motion.span
                layoutId={badgeLayoutId}
                initial={prefersReducedMotion ? { opacity: 0.92 } : false}
                animate={prefersReducedMotion ? { opacity: 1 } : undefined}
                transition={prefersReducedMotion ? { duration: 0.2, ease: 'easeOut' } : undefined}
                className="rounded-full border border-primary/16 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
              >
                {openRequests.length ? `${openRequests.length} פתוחות` : 'מסלולי שירות'}
              </motion.span>
            </div>
            <div className="text-[11px] font-semibold tracking-[0.12em] text-primary/72">בקשות</div>
            <motion.div
              layoutId={titleLayoutId}
              initial={prefersReducedMotion ? { opacity: 0.94 } : false}
              animate={prefersReducedMotion ? { opacity: 1 } : undefined}
              transition={prefersReducedMotion ? { duration: 0.2, ease: 'easeOut' } : undefined}
              className="mt-1 text-[25px] font-black leading-[1.04] text-foreground"
            >
              בקשות דייר
            </motion.div>
            <div className="mt-1.5 text-[13px] leading-5 text-secondary-foreground">
              {openRequests[0]
                ? openRequests[0].statusNotes || t('residentRequests.priority.waitingReason')
                : 'בחר מסלול אחד והמשך.'}
            </div>
          </div>
          <StatusBadge
            label={openRequests[0] ? getResidentRequestStatusLabel(openRequests[0].status) : 'פתיחה מהירה'}
            tone={openRequests[0] ? getResidentRequestStatusTone(openRequests[0].status) : 'finance'}
          />
        </div>

        <div className="mt-4 rounded-[22px] border border-subtle-border bg-background/88 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold tracking-[0.12em] text-primary/72">
                {openRequests[0] ? 'בטיפול' : 'השלב הבא'}
              </div>
              <div className="mt-1 text-[20px] font-black leading-[1.08] text-foreground">
                {openRequests[0] ? openRequests[0].subject.replace(/^[A-Z_]+:\s*/, '') : activeType.label}
              </div>
              <div className="mt-1.5 text-[12px] leading-5 text-secondary-foreground">
                {openRequests[0] ? 'אפשר לעבור למעקב או לפתוח בקשה חדשה.' : selectedTypeDescription.responseWindow}
              </div>
            </div>
            <div className="text-[10px] font-semibold tracking-[0.12em] text-secondary-foreground">
              {openRequests.length ? `${openRequests.length} פתוחות` : `${requestTypes.length} מסלולים`}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              className="gold-sheen-button flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold"
              data-accent-sheen="true"
              onClick={() => {
                void router.replace('/resident/requests?view=new', undefined, { shallow: true });
              }}
            >
              בקשה חדשה
            </button>
            <Button asChild variant="outline" size="lg" className="min-h-[52px] rounded-full border-primary/14 bg-white/76 text-foreground hover:bg-white">
              <Link href={openRequests.length ? '/resident/requests?view=history' : '/create-call'}>
                {openRequests.length ? 'פתח מעקב' : 'תחזוקה'}
              </Link>
            </Button>
          </div>
        </div>
      </GlassSurface>

      <AmsTabs
        ariaLabel="בקשות דייר"
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

      {submittedRequestKey ? (
        <Card variant="featured">
          <CardContent className="space-y-3 p-4 sm:p-5">
            <SectionHeader
              title="הבקשה התקבלה"
              subtitle={undefined}
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
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <div className="text-sm font-semibold text-foreground">בחר מסלול</div>
              <div className="mt-0.5 text-[11px] text-secondary-foreground">מסלול נכון יקצר טיפול.</div>
            </div>
            <Button size="sm" className="rounded-full px-4" onClick={() => openComposer(1)}>
              פתח מסלול
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {requestTypes.map((item) => {
              const selected = item.value === form.requestType;
              return (
                <div
                  key={item.value}
                >
                  <QuickActionTile
                    title={item.label}
                    subtitle={item.description}
                    icon={item.icon}
                    onClick={() => {
                      setForm((current) => ({ ...current, requestType: item.value }));
                      openComposer(2);
                    }}
                    stateLabel={selected ? 'נבחר' : undefined}
                    tone={selected ? 'default' : 'info'}
                    className="min-h-[128px]"
                  />
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <AmsDrawer
        isOpen={composerOpen}
        onOpenChange={(open) => {
          if (!open) closeComposer();
          else setComposerOpen(true);
        }}
        title="בקשה חדשה"
        description={formStep === 1 ? 'סוג' : formStep === 2 ? 'פרטים' : 'אישור'}
        tone="light"
        size="full"
        className="max-h-[100dvh] rounded-none md:max-h-[88dvh] md:rounded-t-[30px]"
        headerClassName="text-right"
        bodyClassName="text-right"
        footer={(onClose) => (
          <div className="w-full space-y-2">
            {formStep === 1 ? (
              <button type="button" className="gold-sheen-button flex min-h-[52px] w-full items-center justify-center rounded-full px-4 text-base font-semibold" data-accent-sheen="true" onClick={() => advanceComposer(2)}>
                המשך לפרטים
              </button>
            ) : null}
            {formStep === 2 ? (
              <>
                <button type="button" className="gold-sheen-button flex min-h-[52px] w-full items-center justify-center rounded-full px-4 text-base font-semibold" data-accent-sheen="true" onClick={advanceToReview}>
                  המשך לאישור
                </button>
                <Button type="button" variant="outline" className="w-full rounded-full min-h-[52px]" onClick={() => advanceComposer(1)}>
                  חזרה לסוג הבקשה
                </Button>
              </>
            ) : null}
            {formStep === 3 ? (
              <>
                <button type="button" className="gold-sheen-button flex min-h-[52px] w-full items-center justify-center rounded-full px-4 text-base font-semibold" data-accent-sheen="true" onClick={submitRequest} disabled={submitting || hasRequiredErrors}>
                  {submitting ? 'שולח...' : 'שלח בקשה'}
                </button>
                {hasRequiredErrors ? (
                  <FormActionHint>
                    יש להשלים את שדות החובה המסומנים כדי לשלוח את הבקשה.
                  </FormActionHint>
                ) : null}
                <Button type="button" variant="outline" className="w-full rounded-full min-h-[52px]" onClick={() => advanceComposer(2)}>
                  חזרה לפרטים
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
          {draftRestored ? (
            <div className="flex items-center justify-between gap-3 rounded-[16px] border border-subtle-border bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium text-foreground">טיוטה שוחזרה</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto rounded-full px-3 py-1 text-secondary-foreground"
                onClick={clearDraft}
              >
                נקה טיוטה
              </Button>
            </div>
          ) : null}
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
                <div className="text-xs font-semibold tracking-[0.12em] text-secondary-foreground">נבחר עכשיו</div>
                <div className="mt-1 text-lg font-semibold text-foreground">{activeType.label}</div>
                <div className="mt-1 text-sm leading-6 text-secondary-foreground">{selectedTypeDescription.responseWindow}</div>
              </div>

              <FormErrorSummary errors={visibleFormErrors} fieldLabels={fieldLabels} sticky />

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
                    <FormField label="תאריך מבוקש" fieldKey="requestedDate" error={shouldShowError('requestedDate') ? formErrors.requestedDate : ''}>
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
                <FormField label="נושא" fieldKey="subject" required error={shouldShowError('subject') ? formErrors.subject : ''}>
                  <Input
                    name="subject"
                    aria-label="נושא"
                    placeholder={`למשל: ${activeType.label} לבניין`}
                    value={form.subject}
                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                    onBlur={() => setFormTouched((current) => ({ ...current, subject: true }))}
                  />
                </FormField>

                <FormField label="פרטי הבקשה" fieldKey="message" required error={shouldShowError('message') ? formErrors.message : ''}>
                  <Textarea
                    name="message"
                    aria-label="פרטי הבקשה"
                    rows={5}
                    placeholder="כתוב בקצרה מה צריך"
                    value={form.message}
                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    onBlur={() => setFormTouched((current) => ({ ...current, message: true }))}
                  />
                </FormField>
              </div>

              <FileUpload
                label="קובץ עזר (אופציונלי)"
                hint="צילום או מסמך"
                onFileSelect={setDraftAttachment}
              />

              <div className="space-y-3 rounded-[24px] border border-subtle-border bg-background/90 p-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary-foreground">לפני שליחה</div>
                  <div className="mt-1 text-sm leading-6 text-secondary-foreground">{selectedTypeDescription.nextStep}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ReviewTile label="נושא" value={form.subject || 'לא הוזן'} />
                  <ReviewTile label="צפי טיפול" value={selectedTypeDescription.responseWindow} />
                </div>
              </div>
            </div>
          ) : null}

          {formStep === 3 ? (
            <div className="space-y-4">
              <div className="space-y-3 rounded-[24px] border border-subtle-border bg-background/90 p-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary-foreground">לפני שליחה</div>
                  <div className="mt-1 text-lg font-semibold text-foreground">{selectedTypeDescription.nextStep}</div>
                  <div className="mt-1 text-sm leading-6 text-secondary-foreground">{selectedTypeDescription.responseWindow}</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ReviewTile label="סוג" value={activeType.label} />
                  <ReviewTile label="נושא" value={form.subject || 'לא הוזן'} />
                  <ReviewTile label="צפי טיפול" value={selectedTypeDescription.responseWindow} />
                  <ReviewTile label="מטפל" value={selectedTypeDescription.owner} />
                  <ReviewTile label="קובץ עזר" value={draftAttachment?.name || 'ללא קובץ'} />
                  {form.requestedDate ? <ReviewTile label="תאריך" value={form.requestedDate} /> : null}
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
      <GlassSurface strength="strong" className="space-y-6 rounded-[30px] p-4 sm:p-6">
          <SectionHeader title="מעקב" subtitle={undefined} meta={`${history.length} פריטים`} />

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

          {historyError ? (
            <InlineErrorPanel title="היסטוריית הבקשות לא נטענה" description={historyError} onRetry={() => void loadHistory()} />
          ) : null}

          {loading ? (
            <MobileCardSkeleton cards={2} />
          ) : !history.length && !historyError ? (
            <EmptyState
              type={filtersApplied ? 'search' : 'action'}
              title={filtersApplied ? 'אין תוצאות למסנן הנוכחי' : 'עדיין אין בקשות להצגה'}
              description={
                filtersApplied
                  ? 'נסה לנקות את המסננים או לבחור סוג בקשה אחר.'
                  : 'בקשה חדשה תופיע כאן'
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
                <SectionHeader title="בטיפול" subtitle={undefined} meta={`${openRequests.length} פתוחות`} />
                {openRequests.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-10">
                      <EmptyState
                        type="empty"
                        title="אין כרגע בקשות פתוחות"
                        description="בקשה חדשה תופיע כאן"
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <RequestHistoryList items={openRequests} locale={locale} />
                )}
              </section>

              <section className="space-y-4">
                <SectionHeader title="הושלמו" subtitle={undefined} meta={`${closedRequests.length} הושלמו`} />
                {closedRequests.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-10">
                      <EmptyState
                        type="empty"
                        title="אין עדיין בקשות שהושלמו"
                        description="בקשות סגורות יופיעו כאן"
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <RequestHistoryList items={closedRequests} locale={locale} />
                )}
              </section>
            </div>
          )}
      </GlassSurface>
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
    <section className="space-y-4" aria-label="בחר סוג בקשה">
      <div className="text-right">
        <h2 className="text-[16px] font-bold text-foreground">איך אפשר לעזור?</h2>
        <p className="mt-1 text-[12px] text-secondary-foreground">בחר מסלול.</p>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = item.value === selectedValue;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => selectItem(item.value)}
              aria-pressed={selected}
              className={cn(
                'group flex w-full items-center justify-between rounded-[24px] border p-4 text-right transition-all duration-200 active:scale-[0.985]',
                selected
                  ? 'gold-sheen-surface border-primary/25 shadow-md ring-1 ring-primary/10'
                  : 'border-subtle-border bg-white/80 hover:border-primary/15 hover:bg-white',
              )}
              data-accent-sheen={selected ? 'true' : undefined}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border transition-colors',
                    selected
                      ? 'border-primary/20 bg-primary/10 text-primary'
                      : 'border-subtle-border bg-muted/30 text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <div className="text-[15px] font-bold leading-tight text-foreground">{item.label}</div>
                  <div className="mt-1 text-[12px] leading-tight text-secondary-foreground">{item.description}</div>
                </div>
              </div>
              <ArrowUpRight className={cn('icon-directional h-4.5 w-4.5 transition-transform', selected ? 'text-primary' : 'text-muted-foreground/50')} strokeWidth={2} />
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
  currentStep: 1 | 2 | 3;
  items: ReadonlyArray<{ id: 1 | 2 | 3; label: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-1 px-1">
      {items.map((item, index) => {
        const isActive = item.id === currentStep;
        const isComplete = item.id < currentStep;

        return (
          <React.Fragment key={item.id}>
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold transition-all',
                  isActive
                    ? 'gold-sheen-button border-primary/30 text-primary-foreground shadow-sm'
                    : isComplete
                      ? 'border-primary/15 bg-primary/10 text-primary'
                      : 'border-subtle-border bg-muted/20 text-muted-foreground',
                )}
              >
                {isComplete ? <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} /> : item.id}
              </div>
              <span className={cn('text-[10px] font-bold tracking-[0.12em] truncate', isActive ? 'text-primary' : 'text-muted-foreground/60')}>
                {item.label}
              </span>
            </div>
            {index < items.length - 1 ? (
              <div className={cn('mt-[-18px] h-[2px] flex-1 rounded-full', isComplete ? 'gold-divider-line' : 'bg-subtle-border/40')} />
            ) : null}
          </React.Fragment>
        );
      })}
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
  const router = useRouter();

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <RequestHistoryCard key={item.requestKey} item={item} index={index} locale={locale} onNavigate={() => router.push(`/resident/requests?view=history&requestKey=${encodeURIComponent(item.requestKey)}`)} />
      ))}
    </div>
  );
}

function RequestHistoryCard({
  item,
  index,
  locale,
  onNavigate,
}: {
  item: RequestHistoryItem;
  index: number;
  locale: string;
  onNavigate: () => void;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const actions: MobileRowActionItem[] = [
    {
      id: 'open-request',
      label: 'פתח מעקב בקשה',
      description: 'מעבר למסך המעקב של הבקשה.',
      tone: 'primary',
      onSelect: onNavigate,
    },
  ];
  const { longPressProps } = useLongPressActions({
    onLongPress: () => setActionsOpen(true),
  });

  return (
    <div className="space-y-2">
      <MobileSwipeActionCard
        actions={[
          {
            id: `open-request-${item.requestKey}`,
            label: 'פתח מעקב',
            tone: 'primary',
            side: 'start',
            onCommit: onNavigate,
          },
          {
            id: `request-status-${item.requestKey}`,
            label: item.status === 'COMPLETED' || item.status === 'CLOSED' ? 'הצג סיכום' : 'בדוק סטטוס',
            tone: item.status === 'COMPLETED' || item.status === 'CLOSED' ? 'success' : 'warning',
            side: 'end',
            onCommit: onNavigate,
          },
        ]}
        className="rounded-[24px]"
      >
        <div className="touch-pan-y" {...longPressProps}>
            <ResidentListCard
              title={item.subject.replace(/^[A-Z_]+:\s*/, '')}
              subtitle={item.message}
              icon={item.requestType === 'MOVING' ? Move : item.requestType === 'PARKING' ? ParkingCircle : item.requestType === 'DOCUMENT' ? FileText : item.requestType === 'CONTACT_UPDATE' ? PhoneCall : Sparkles}
              accent={item.status === 'SUBMITTED' || item.status === 'IN_REVIEW' ? 'warning' : 'success'}
              delay={index * 0.04}
              onClick={onNavigate}
              meta={<StatusBadge label={getResidentRequestStatusLabel(item.status)} tone={getResidentRequestStatusTone(item.status)} className="px-1.5 py-0 h-4 text-[9px]" />}
              endSlot={
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="text-[10px] font-bold text-muted-foreground/60"><bdi>{formatDate(new Date(item.updatedAt || item.createdAt), locale)}</bdi></div>
                  <StatusBadge label={getRequestTypeLabel(item.requestType)} tone="neutral" className="px-1.5 py-0 h-4 text-[9px]" />
                </div>
              }
            />
        </div>
      </MobileSwipeActionCard>

      {item.statusNotes ? (
        <GlassSurface className="rounded-[20px] px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            עדכון
          </div>
          <div className="text-[12px] leading-5 text-secondary-foreground">{item.statusNotes}</div>
        </GlassSurface>
      ) : null}

      {item.requestedDate ? (
        <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-warning">
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>יעד: <bdi>{formatDate(item.requestedDate, locale)}</bdi></span>
        </div>
      ) : null}

      <MobileRowActionsSheet
        title={item.subject.replace(/^[A-Z_]+:\s*/, '')}
        description={item.message}
        actions={actions}
        open={actionsOpen}
        onOpenChange={setActionsOpen}
        hideTrigger
      />
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
