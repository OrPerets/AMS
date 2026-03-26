import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Plus } from 'lucide-react';
import { authFetch, getCurrentUserId, getEffectiveRole, hasRoleAccess } from '../../../lib/auth';
import { CompactStatusStrip } from '../../ui/compact-status-strip';
import { MobileContextBar } from '../../ui/mobile-context-bar';
import { Skeleton } from '../../ui/skeleton';
import { toast } from '../../ui/use-toast';
import { Button } from '../../ui/button';
import { PullToRefreshIndicator } from '../../ui/pull-to-refresh-indicator';
import { DispatchActionRail } from './DispatchActionRail';
import { DispatchDetailPanel } from './DispatchDetailPanel';
import { DispatchDialogs } from './DispatchDialogs';
import { DispatchQueueTabs } from './DispatchQueueTabs';
import { DispatchResultsList } from './DispatchResultsList';
import { DispatchSavedViews } from './DispatchSavedViews';
import { DispatchToolbar } from './DispatchToolbar';
import { BUILTIN_PRESETS, DEFAULT_FILTERS, loadCustomPresets, loadLastPresetId, loadStoredFilters, saveCustomPresets, saveLastPresetId, saveStoredFilters } from './storage';
import { escapeCsv } from './presentation';
import type {
  BuildingOption,
  DispatchFilters,
  DispatchPreset,
  DispatchResponse,
  DispatchTicket,
  SmartTriagePreview,
  TechnicianOption,
  UnitOption,
  VendorOption,
} from './types';
import { usePullToRefresh } from '../../../hooks/use-pull-to-refresh';
import { triggerHaptic } from '../../../lib/mobile';

const defaultCreateForm = {
  buildingId: '',
  unitId: '',
  category: 'כללי',
  severity: 'NORMAL',
  residentContact: '',
  description: '',
  photos: null as FileList | null,
};

export function DispatchWorkspace() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const technicianTriggerRef = useRef<HTMLButtonElement>(null);
  const statusTriggerRef = useRef<HTMLButtonElement>(null);
  const severityTriggerRef = useRef<HTMLButtonElement>(null);

  const [dispatchData, setDispatchData] = useState<DispatchResponse | null>(null);
  const [filters, setFilters] = useState<DispatchFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<DispatchPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState(BUILTIN_PRESETS[0].id);
  const [presetName, setPresetName] = useState('');
  const [commandQuery, setCommandQuery] = useState('');
  const [dialogs, setDialogs] = useState({
    create: false,
    help: false,
    command: false,
    savePreset: false,
  });
  const [assignmentTarget, setAssignmentTarget] = useState('UNASSIGNED');
  const [supplierTarget, setSupplierTarget] = useState('NONE');
  const [statusTarget, setStatusTarget] = useState<DispatchTicket['status']>('OPEN');
  const [severityTarget, setSeverityTarget] = useState<DispatchTicket['severity']>('NORMAL');
  const [costEstimate, setCostEstimate] = useState('');
  const [newNote, setNewNote] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createBuildings, setCreateBuildings] = useState<BuildingOption[]>([]);
  const [createUnits, setCreateUnits] = useState<UnitOption[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [assigning, setAssigning] = useState(false);
  const [assigningSupplier, setAssigningSupplier] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingSeverity, setUpdatingSeverity] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [triagePreview, setTriagePreview] = useState<SmartTriagePreview | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);

  const allPresets = useMemo(() => [...BUILTIN_PRESETS, ...customPresets], [customPresets]);
  const selectedTicket = useMemo(
    () => dispatchData?.items.find((ticket) => ticket.id === selectedTicketId) ?? dispatchData?.items[0] ?? null,
    [dispatchData, selectedTicketId],
  );
  const canDispatch = currentRole === 'ADMIN' || currentRole === 'PM' || currentRole === 'MASTER';

  const workloadByTechnicianId = useMemo(() => {
    return new Map(dispatchData?.workload.map((item) => [item.technicianId, item]) ?? []);
  }, [dispatchData?.workload]);

  const technicianInsights = useMemo(() => {
    const scored = technicians.map((technician) => {
      const workload = workloadByTechnicianId.get(technician.id);
      const activeCount = workload?.activeCount ?? 0;
      const riskCount = workload?.riskCount ?? 0;
      const breachedCount = workload?.breachedCount ?? 0;
      const urgentCount = workload?.urgentCount ?? 0;
      const loadLabel =
        breachedCount > 0 ? 'עומס חריג' : activeCount >= 6 ? 'עומס גבוה' : activeCount >= 3 ? 'מאוזן' : 'פנוי';

      return {
        ...technician,
        activeCount,
        riskCount,
        breachedCount,
        urgentCount,
        loadLabel,
        recommended: false,
      };
    });

    const recommendation = [...scored].sort((a, b) => {
      return (
        a.breachedCount - b.breachedCount ||
        a.riskCount - b.riskCount ||
        a.activeCount - b.activeCount ||
        a.email.localeCompare(b.email)
      );
    })[0];

    return scored.map((technician) => ({
      ...technician,
      recommended: Boolean(recommendation && technician.id === recommendation.id),
    }));
  }, [technicians, workloadByTechnicianId]);

  useEffect(() => {
    const role = getEffectiveRole();
    setCurrentRole(role);
    const storedFilters = loadStoredFilters();
    setFilters(storedFilters);
    setSearchInput(storedFilters.search);
    setCustomPresets(loadCustomPresets());
    setSelectedPresetId(loadLastPresetId());
    void loadCreateBuildings();
    if (hasRoleAccess(['ADMIN', 'PM', 'TECH', 'MASTER'], role)) {
      void loadTechnicians();
    } else {
      setTechnicians([]);
    }
    if (hasRoleAccess(['ADMIN', 'PM', 'ACCOUNTANT', 'MASTER'], role)) {
      void loadVendors();
    } else {
      setVendors([]);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFilters((current) => ({ ...current, search: searchInput.trim() }));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    saveStoredFilters(filters);
    void loadDispatch();
  }, [filters]);

  useEffect(() => {
    if (selectedTicket) {
      setAssignmentTarget(selectedTicket.assignedTo ? String(selectedTicket.assignedTo.id) : 'UNASSIGNED');
      setSupplierTarget('NONE');
      setStatusTarget(selectedTicket.status);
      setSeverityTarget(selectedTicket.severity);
      setCostEstimate('');
    }
    setTriagePreview(null);
  }, [selectedTicket]);

  useEffect(() => {
    if (!createForm.buildingId) {
      setCreateUnits([]);
      setCreateForm((current) => ({ ...current, unitId: '' }));
      return;
    }
    void loadUnits(createForm.buildingId);
  }, [createForm.buildingId]);

  useEffect(() => {
    if (router.isReady && router.query.openCreate === '1') {
      setDialogs((current) => ({ ...current, create: true }));
    }
  }, [router.isReady, router.query.openCreate]);

  useEffect(() => {
    const applyPresetFromEvent = (event: Event) => {
      const presetId = (event as CustomEvent<string>).detail;
      applyPresetById(presetId);
    };

    window.addEventListener('dispatch:apply-preset', applyPresetFromEvent as EventListener);
    return () => window.removeEventListener('dispatch:apply-preset', applyPresetFromEvent as EventListener);
  }, [allPresets, currentRole]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKeyboardShortcut(event)) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setDialogs((current) => ({ ...current, command: true }));
        return;
      }

      if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (event.key === '?') {
        event.preventDefault();
        setDialogs((current) => ({ ...current, help: true }));
        return;
      }

      if (event.key.toLowerCase() === 'j') {
        event.preventDefault();
        moveSelection(1);
        return;
      }

      if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        moveSelection(-1);
        return;
      }

      if (event.key.toLowerCase() === 'a' && canDispatch) {
        event.preventDefault();
        technicianTriggerRef.current?.focus();
        return;
      }

      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        statusTriggerRef.current?.focus();
        return;
      }

      if (event.key.toLowerCase() === 'p' && canDispatch) {
        event.preventDefault();
        severityTriggerRef.current?.focus();
        return;
      }

      if (event.key === 'Enter' && selectedTicket) {
        event.preventDefault();
        void router.push(`/tickets/${selectedTicket.id}`);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canDispatch, selectedTicket, dispatchData?.items]);

  const { pullDistance, isRefreshing } = usePullToRefresh({
    enabled: Boolean(dispatchData),
    onRefresh: async () => {
      await loadDispatch(selectedTicket?.id);
    },
  });

  async function loadDispatch(preferredTicketId?: number) {
    try {
      setLoading((current) => current && !dispatchData);
      setRefreshing(true);
      const query = new URLSearchParams({
        view: 'dispatch',
        queue: filters.queue,
        sort: filters.sort,
        limit: '100',
      });

      if (filters.search) query.set('search', filters.search);
      if (filters.buildingFilter !== 'ALL') query.set('buildingId', filters.buildingFilter);
      if (filters.assigneeFilter !== 'ALL') query.set('assigneeId', filters.assigneeFilter);
      if (filters.statusFilter !== 'ALL') query.set('status', filters.statusFilter);
      if (filters.severityFilter !== 'ALL') query.set('severity', filters.severityFilter);
      if (filters.slaFilter !== 'ALL') query.set('slaState', filters.slaFilter);
      if (filters.categoryFilter !== 'ALL') query.set('category', filters.categoryFilter);

      const response = await authFetch(`/api/v1/tickets?${query.toString()}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as DispatchResponse;
      setDispatchData(payload);
      const nextId =
        preferredTicketId && payload.items.some((ticket) => ticket.id === preferredTicketId)
          ? preferredTicketId
          : selectedTicketId && payload.items.some((ticket) => ticket.id === selectedTicketId)
            ? selectedTicketId
            : payload.items[0]?.id ?? null;
      setSelectedTicketId(nextId);
      setSelectedIds((current) => current.filter((id) => payload.items.some((ticket) => ticket.id === id)));
    } catch {
      toast({
        title: 'טעינת הקריאות נכשלה',
        description: 'לא ניתן לטעון את לוח הקריאות כרגע.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadCreateBuildings() {
    try {
      const response = await authFetch('/api/v1/buildings');
      if (!response.ok) return;
      setCreateBuildings((await response.json()) as BuildingOption[]);
    } catch {
      setCreateBuildings([]);
    }
  }

  async function loadTechnicians() {
    try {
      const response = await authFetch('/api/v1/users/technicians');
      if (!response.ok) return;
      setTechnicians((await response.json()) as TechnicianOption[]);
    } catch {
      setTechnicians([]);
    }
  }

  async function loadVendors() {
    try {
      const response = await authFetch('/api/v1/vendors');
      if (!response.ok) return;
      setVendors((await response.json()) as VendorOption[]);
    } catch {
      setVendors([]);
    }
  }

  async function loadUnits(buildingId: string) {
    try {
      setUnitsLoading(true);
      const response = await authFetch(`/api/v1/buildings/${buildingId}/units`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setCreateUnits((await response.json()) as UnitOption[]);
    } catch {
      setCreateUnits([]);
      toast({
        title: 'טעינת יחידות נכשלה',
        description: 'לא ניתן לטעון יחידות לבניין שנבחר.',
        variant: 'destructive',
      });
    } finally {
      setUnitsLoading(false);
    }
  }

  function updateFilter<K extends keyof DispatchFilters>(key: K, value: DispatchFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSearchInput('');
    setSelectedPresetId(BUILTIN_PRESETS[0].id);
    saveLastPresetId(BUILTIN_PRESETS[0].id);
  }

  function applyPresetById(presetId: string) {
    const preset = allPresets.find((item) => item.id === presetId);
    if (!preset) return;
    const currentUserId = getCurrentUserId();
    const normalizedFilters =
      preset.id === 'builtin:my-assignments'
        ? { ...preset.filters, assigneeFilter: currentUserId ? String(currentUserId) : 'ALL' }
        : preset.filters;
    setFilters(normalizedFilters);
    setSearchInput(normalizedFilters.search);
    setSelectedPresetId(presetId);
    saveLastPresetId(presetId);
  }

  function saveCurrentPreset() {
    const preset: DispatchPreset = {
      id: `custom:${Date.now()}`,
      name: presetName.trim(),
      filters: { ...filters },
    };
    const next = [preset, ...customPresets].slice(0, 8);
    setCustomPresets(next);
    saveCustomPresets(next);
    setSelectedPresetId(preset.id);
    saveLastPresetId(preset.id);
    setDialogs((current) => ({ ...current, savePreset: false }));
    setPresetName('');
      toast({ title: 'התצוגה נשמרה' });
      triggerHaptic('success');
  }

  async function handleCreateTicket() {
    if (!createForm.unitId || !createForm.description.trim()) {
      toast({
        title: 'חסרים פרטים',
        description: 'יש לבחור יחידה ולהזין תיאור תקלה.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreateSubmitting(true);
      const formData = new FormData();
      formData.append('unitId', createForm.unitId);
      formData.append('severity', createForm.severity);
      const structuredDescription = [
        `קטגוריה: ${createForm.category}`,
        createForm.residentContact.trim() ? `איש קשר: ${createForm.residentContact.trim()}` : '',
        createForm.description.trim(),
      ]
        .filter(Boolean)
        .join('\n');
      formData.append('description', structuredDescription);
      Array.from(createForm.photos ?? []).forEach((file) => formData.append('photos', file));

      const response = await authFetch('/api/v1/tickets', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({ title: 'קריאה נפתחה בהצלחה' });
      triggerHaptic('success');
      setDialogs((current) => ({ ...current, create: false }));
      setCreateForm(defaultCreateForm);
      await loadDispatch();
    } catch {
      toast({
        title: 'יצירת הקריאה נכשלה',
        description: 'בדוק את הפרטים ונסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleAssignTechnician(ticketIds: number[]) {
    if (!assignmentTarget || assignmentTarget === 'UNASSIGNED' || !ticketIds.length) {
      return;
    }

    try {
      setAssigning(true);
      await Promise.all(
        ticketIds.map(async (ticketId) => {
          const response = await authFetch(`/api/v1/tickets/${ticketId}/assign`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assigneeId: Number(assignmentTarget) }),
          });
          if (!response.ok) {
            throw new Error(await response.text());
          }
        }),
      );
      toast({ title: ticketIds.length === 1 ? 'הקריאה הוקצתה' : 'הקריאות הוקצו' });
      triggerHaptic('success');
      await loadDispatch(selectedTicket?.id);
    } catch {
      toast({
        title: 'הקצאת הקריאה נכשלה',
        description: 'לא ניתן לשייך כרגע את הקריאה לטכנאי.',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  }

  async function handleAssignSupplier() {
    if (!selectedTicket || !supplierTarget || supplierTarget === 'NONE') {
      return;
    }

    try {
      setAssigningSupplier(true);
      const response = await authFetch(`/api/v1/tickets/${selectedTicket.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: Number(supplierTarget),
          costEstimate: costEstimate ? Number(costEstimate) : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      toast({ title: 'הוזמן ספק ונפתחה הזמנת עבודה' });
      triggerHaptic('success');
      await loadDispatch(selectedTicket.id);
    } catch {
      toast({
        title: 'יצירת הזמנת העבודה נכשלה',
        description: 'לא ניתן לשייך כרגע את הקריאה לספק.',
        variant: 'destructive',
      });
    } finally {
      setAssigningSupplier(false);
    }
  }

  async function handleUpdateStatus(ticketIds: number[]) {
    if (!ticketIds.length) return;
    try {
      setUpdatingStatus(true);
      await Promise.all(
        ticketIds.map(async (ticketId) => {
          const response = await authFetch(`/api/v1/tickets/${ticketId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: statusTarget }),
          });
          if (!response.ok) {
            throw new Error(await response.text());
          }
        }),
      );
      toast({ title: ticketIds.length === 1 ? 'סטטוס הקריאה עודכן' : 'סטטוס הקריאות עודכן' });
      triggerHaptic('success');
      await loadDispatch(selectedTicket?.id);
    } catch {
      toast({
        title: 'עדכון הסטטוס נכשל',
        description: 'לא ניתן לעדכן כרגע את סטטוס הקריאה.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleUpdateSeverity(ticketIds: number[]) {
    if (!ticketIds.length) return;
    try {
      setUpdatingSeverity(true);
      await Promise.all(
        ticketIds.map(async (ticketId) => {
          const response = await authFetch(`/api/v1/tickets/${ticketId}/severity`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ severity: severityTarget }),
          });
          if (!response.ok) {
            throw new Error(await response.text());
          }
        }),
      );
      toast({ title: ticketIds.length === 1 ? 'עדיפות הקריאה עודכנה' : 'עדיפות הקריאות עודכנה' });
      triggerHaptic('success');
      await loadDispatch(selectedTicket?.id);
    } catch {
      toast({
        title: 'עדכון העדיפות נכשל',
        description: 'לא ניתן לעדכן כרגע את עדיפות הקריאה.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingSeverity(false);
    }
  }

  async function handleAddNote() {
    const currentUserId = getCurrentUserId();
    if (!selectedTicket || !newNote.trim() || !currentUserId) return;

    try {
      setAddingNote(true);
      const response = await authFetch(`/api/v1/tickets/${selectedTicket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      });
      if (!response.ok) throw new Error(await response.text());
      toast({ title: 'ההערה נשמרה' });
      triggerHaptic('success');
      setNewNote('');
      await loadDispatch(selectedTicket.id);
    } catch {
      toast({
        title: 'שמירת ההערה נכשלה',
        description: 'לא ניתן להוסיף כרגע עדכון לקריאה.',
        variant: 'destructive',
      });
    } finally {
      setAddingNote(false);
    }
  }

  async function handleEscalateTicket() {
    if (!selectedTicket) return;

    try {
      setEscalating(true);
      const severityResponse = await authFetch(`/api/v1/tickets/${selectedTicket.id}/severity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity: 'URGENT' }),
      });
      if (!severityResponse.ok) {
        throw new Error(await severityResponse.text());
      }

      const commentResponse = await authFetch(`/api/v1/tickets/${selectedTicket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'הסלמה ניהולית אוטומטית עקב סיכון/חריגת SLA. נדרש מעקב הדוק ועדכון תיאום.' }),
      });
      if (!commentResponse.ok) {
        throw new Error(await commentResponse.text());
      }

      toast({ title: 'הקריאה הוסלמה' });
      triggerHaptic('success');
      setSeverityTarget('URGENT');
      await loadDispatch(selectedTicket.id);
    } catch {
      toast({
        title: 'ההסלמה נכשלה',
        description: 'לא ניתן להסלים כרגע את הקריאה.',
        variant: 'destructive',
      });
    } finally {
      setEscalating(false);
    }
  }

  async function handleRunTriage() {
    if (!selectedTicket) return;

    try {
      setTriageLoading(true);
      const response = await authFetch('/api/v1/tickets/triage-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          description: selectedTicket.description,
          buildingId: selectedTicket.building.id,
          currentAssigneeId: selectedTicket.assignedTo?.id,
          currentCategory: selectedTicket.category,
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      setTriagePreview((await response.json()) as SmartTriagePreview);
      toast({ title: 'הקריאה נותחה בהצלחה', description: 'המלצת המיון מוכנה ליישום בפאנל הפעולות.' });
    } catch {
      toast({
        title: 'הניתוח החכם נכשל',
        description: 'לא ניתן לייצר כרגע המלצת triage לקריאה הזו.',
        variant: 'destructive',
      });
    } finally {
      setTriageLoading(false);
    }
  }

  function applyTriageSuggestion() {
    if (!triagePreview) {
      return;
    }

    setSeverityTarget(triagePreview.severity);
    if (triagePreview.suggestedAssignee) {
      setAssignmentTarget(String(triagePreview.suggestedAssignee.id));
    }
    toast({ title: 'המלצות המיון הוחלו', description: 'אפשר להמשיך לעדכן סטטוס, שיוך ותגובה בלי להזין שוב את הפרטים.' });
    triggerHaptic('success');
  }

  function useDraftResponse() {
    if (!triagePreview?.draftResponse) {
      return;
    }

    setNewNote((current) => (current.trim() ? `${current.trim()}\n\n${triagePreview.draftResponse}` : triagePreview.draftResponse));
    toast({ title: 'טיוטת התגובה נוספה', description: 'אפשר לערוך לפני שמירה ליומן או שליחה לדייר.' });
  }

  function moveSelection(direction: 1 | -1) {
    if (!dispatchData?.items.length) {
      return;
    }

    const currentIndex = selectedTicket ? dispatchData.items.findIndex((ticket) => ticket.id === selectedTicket.id) : 0;
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + direction + dispatchData.items.length) % dispatchData.items.length;
    setSelectedTicketId(dispatchData.items[nextIndex].id);
  }

  function navigateTicketSelection(direction: 1 | -1) {
    moveSelection(direction);
  }

  function toggleTicketSelection(ticketId: number) {
    setSelectedIds((current) => (current.includes(ticketId) ? current.filter((id) => id !== ticketId) : [...current, ticketId]));
  }

  function toggleAllVisible() {
    const visibleIds = dispatchData?.items.map((ticket) => ticket.id) ?? [];
    if (!visibleIds.length) return;
    const everyVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds(everyVisibleSelected ? selectedIds.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...selectedIds, ...visibleIds])));
  }

  function exportCurrentView() {
    if (!dispatchData) return;
    const rows = [
      ['ticket_id', 'title', 'building', 'unit', 'severity', 'status', 'sla_state', 'assignee', 'created_at'].join(','),
      ...dispatchData.items.map((ticket) =>
        [
          ticket.id,
          escapeCsv(ticket.title),
          escapeCsv(ticket.building.name),
          escapeCsv(ticket.unit.number),
          ticket.severity,
          ticket.status,
          ticket.slaState,
          escapeCsv(ticket.assignedTo?.email || ''),
          ticket.createdAt,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  }

  const commandQueryNormalized = commandQuery.trim().toLowerCase();
  const commandTickets = useMemo(() => {
    if (!dispatchData?.items.length) return [];
    if (!commandQueryNormalized) return dispatchData.items;
    return dispatchData.items.filter((ticket) => {
      return (
        String(ticket.id).includes(commandQueryNormalized) ||
        ticket.title.toLowerCase().includes(commandQueryNormalized) ||
        ticket.building.name.toLowerCase().includes(commandQueryNormalized)
      );
    });
  }, [commandQueryNormalized, dispatchData?.items]);

  const commandBuildings = useMemo(() => {
    const buildings = dispatchData?.filterOptions.buildings ?? [];
    if (!commandQueryNormalized) return buildings;
    return buildings.filter((building) => building.name.toLowerCase().includes(commandQueryNormalized));
  }, [commandQueryNormalized, dispatchData?.filterOptions.buildings]);

  const commandPresets = useMemo(() => {
    if (!commandQueryNormalized) return allPresets;
    return allPresets.filter((preset) => preset.name.toLowerCase().includes(commandQueryNormalized));
  }, [allPresets, commandQueryNormalized]);

  if (loading && !dispatchData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 rounded-[28px]" />
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-3xl" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1fr_0.78fr]">
          <Skeleton className="h-[780px] rounded-[28px]" />
          <Skeleton className="h-[780px] rounded-[28px]" />
          <Skeleton className="h-[780px] rounded-[28px]" />
        </div>
      </div>
    );
  }

  const selectedPresetName = allPresets.find((preset) => preset.id === selectedPresetId)?.name ?? 'תצוגה מותאמת';
  const roleLabel = currentRole === 'PM' ? 'מנהל נכס' : currentRole === 'MASTER' ? 'מנהל ראשי' : 'מנהל מערכת';

  return (
    <div className="space-y-5 pb-4 sm:space-y-6">
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} label="משוך כדי לרענן את לוח הקריאות" />

      <div className="space-y-3 md:hidden">
        <CompactStatusStrip
          roleLabel={roleLabel}
          tone="admin"
          metrics={[
            { id: 'open', label: 'פתוחות', value: dispatchData?.summary.open ?? 0, tone: (dispatchData?.summary.open ?? 0) > 0 ? 'warning' : 'success' },
            { id: 'sla', label: 'SLA', value: dispatchData?.summary.breached ?? 0, tone: (dispatchData?.summary.breached ?? 0) > 0 ? 'danger' : 'default' },
          ]}
        />
      </div>

      <div className="hidden md:block">
        <MobileContextBar
          roleLabel={roleLabel}
          contextLabel={selectedPresetName}
          syncLabel={refreshing ? 'מרענן עכשיו' : 'סנכרון חי'}
          chips={[
            `${dispatchData?.summary.open ?? 0} פתוחות`,
            `${dispatchData?.summary.unassigned ?? 0} ללא שיוך`,
            `${dispatchData?.summary.breached ?? 0} חריגות SLA`,
          ]}
        />
      </div>

      <DispatchToolbar
        dispatchData={dispatchData}
        technicians={technicians}
        roleLabel={roleLabel}
        searchInput={searchInput}
        buildingFilter={filters.buildingFilter}
        assigneeFilter={filters.assigneeFilter}
        sort={filters.sort}
        refreshing={refreshing}
        searchRef={searchRef}
        onSearchInputChange={setSearchInput}
        onBuildingChange={(value) => updateFilter('buildingFilter', value)}
        onAssigneeChange={(value) => updateFilter('assigneeFilter', value)}
        onSortChange={(value) => updateFilter('sort', value)}
        onOpenCreate={() => setDialogs((current) => ({ ...current, create: true }))}
        onExport={exportCurrentView}
        onRefresh={() => void loadDispatch(selectedTicket?.id)}
        onOpenCommandPalette={() => setDialogs((current) => ({ ...current, command: true }))}
        onOpenHelp={() => setDialogs((current) => ({ ...current, help: true }))}
      />

      <DispatchSavedViews
        presets={allPresets}
        selectedPresetId={selectedPresetId}
        onSelectPreset={applyPresetById}
        onOpenSaveDialog={() => setDialogs((current) => ({ ...current, savePreset: true }))}
        onResetFilters={resetFilters}
      />

      <DispatchQueueTabs queue={filters.queue} queueCounts={dispatchData?.queueCounts ?? { TRIAGE: 0, UNASSIGNED: 0, SLA_RISK: 0, ACTIVE: 0, RESOLVED_RECENT: 0 }} onQueueChange={(value) => updateFilter('queue', value)} />

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1fr_0.78fr]">
        <DispatchResultsList
          dispatchData={dispatchData}
          selectedTicketId={selectedTicket?.id ?? null}
          selectedIds={selectedIds}
          statusFilter={filters.statusFilter}
          severityFilter={filters.severityFilter}
          slaFilter={filters.slaFilter}
          categoryFilter={filters.categoryFilter}
          onStatusFilterChange={(value) => updateFilter('statusFilter', value)}
          onSeverityFilterChange={(value) => updateFilter('severityFilter', value)}
          onSlaFilterChange={(value) => updateFilter('slaFilter', value)}
          onCategoryFilterChange={(value) => updateFilter('categoryFilter', value)}
          onResetFilters={resetFilters}
          onSelectTicket={setSelectedTicketId}
          onToggleTicket={toggleTicketSelection}
          onToggleAllVisible={toggleAllVisible}
        />

        <DispatchDetailPanel
          ticket={selectedTicket}
          canNavigatePrevious={Boolean(dispatchData?.items.length && selectedTicket && dispatchData.items.findIndex((ticket) => ticket.id === selectedTicket.id) > 0)}
          canNavigateNext={Boolean(
            dispatchData?.items.length &&
              selectedTicket &&
              dispatchData.items.findIndex((ticket) => ticket.id === selectedTicket.id) < dispatchData.items.length - 1,
          )}
          onNavigatePrevious={() => navigateTicketSelection(-1)}
          onNavigateNext={() => navigateTicketSelection(1)}
        />

        <DispatchActionRail
          ticket={selectedTicket}
          dispatchData={dispatchData}
          technicians={technicianInsights}
          vendors={vendors}
          canDispatch={canDispatch}
          assignmentTarget={assignmentTarget}
          supplierTarget={supplierTarget}
          statusTarget={statusTarget}
          severityTarget={severityTarget}
          costEstimate={costEstimate}
          newNote={newNote}
          bulkSelectionCount={selectedIds.length}
          technicianTriggerRef={technicianTriggerRef}
          statusTriggerRef={statusTriggerRef}
          severityTriggerRef={severityTriggerRef}
          onAssignmentTargetChange={setAssignmentTarget}
          onSupplierTargetChange={setSupplierTarget}
          onStatusTargetChange={setStatusTarget}
          onSeverityTargetChange={setSeverityTarget}
          onCostEstimateChange={setCostEstimate}
          onNewNoteChange={setNewNote}
          onAssignTechnician={() => void handleAssignTechnician(selectedTicket ? [selectedTicket.id] : [])}
          onAssignSupplier={() => void handleAssignSupplier()}
          onUpdateStatus={() => void handleUpdateStatus(selectedTicket ? [selectedTicket.id] : [])}
          onUpdateSeverity={() => void handleUpdateSeverity(selectedTicket ? [selectedTicket.id] : [])}
          onAddNote={() => void handleAddNote()}
          onBulkAssignTechnician={() => void handleAssignTechnician(selectedIds)}
          onBulkUpdateStatus={() => void handleUpdateStatus(selectedIds)}
          onBulkUpdateSeverity={() => void handleUpdateSeverity(selectedIds)}
          assigning={assigning}
          assigningSupplier={assigningSupplier}
          updatingStatus={updatingStatus}
          updatingSeverity={updatingSeverity}
          addingNote={addingNote}
          escalating={escalating}
          onEscalateTicket={() => void handleEscalateTicket()}
          triagePreview={triagePreview}
          triageLoading={triageLoading}
          onRunTriage={() => void handleRunTriage()}
          onApplyTriage={applyTriageSuggestion}
          onUseDraftResponse={useDraftResponse}
        />
      </section>

      <DispatchDialogs
        helpOpen={dialogs.help}
        commandOpen={dialogs.command}
        savePresetOpen={dialogs.savePreset}
        createOpen={dialogs.create}
        commandQuery={commandQuery}
        presetName={presetName}
        createBuildings={createBuildings}
        createUnits={createUnits}
        unitsLoading={unitsLoading}
        createSubmitting={createSubmitting}
        selectedPresetName={selectedPresetName}
        searchTickets={commandTickets}
        searchBuildings={commandBuildings}
        searchPresets={commandPresets}
        createForm={createForm}
        onHelpOpenChange={(open) => setDialogs((current) => ({ ...current, help: open }))}
        onCommandOpenChange={(open) => setDialogs((current) => ({ ...current, command: open }))}
        onSavePresetOpenChange={(open) => setDialogs((current) => ({ ...current, savePreset: open }))}
        onCreateOpenChange={(open) => setDialogs((current) => ({ ...current, create: open }))}
        onCommandQueryChange={setCommandQuery}
        onPresetNameChange={setPresetName}
        onSavePreset={saveCurrentPreset}
        onCreateFormChange={(next) => setCreateForm((current) => ({ ...current, ...next }))}
        onCreateTicket={() => void handleCreateTicket()}
      />

      {canDispatch ? (
        <Button
          size="icon-lg"
          className="fixed bottom-6 end-4 z-30 rounded-full shadow-modal lg:hidden"
          onClick={() => setDialogs((current) => ({ ...current, create: true }))}
          aria-label="פתח קריאה חדשה"
        >
          <Plus className="h-5 w-5" />
        </Button>
      ) : null}
    </div>
  );
}

function shouldIgnoreKeyboardShortcut(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
}
