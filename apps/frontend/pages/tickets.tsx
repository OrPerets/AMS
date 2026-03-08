import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  Wrench,
} from 'lucide-react';
import { authFetch, getCurrentUserId, getEffectiveRole } from '../lib/auth';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../components/ui/use-toast';
import { formatDate } from '../lib/utils';

type QueueKey = 'TRIAGE' | 'UNASSIGNED' | 'SLA_RISK' | 'ACTIVE' | 'RESOLVED_RECENT';

interface DispatchTicket {
  id: number;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  severity: 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: string;
  latestActivityAt: string;
  title: string;
  description: string;
  category: string;
  residentContact: string | null;
  residentName: string;
  building: {
    id: number;
    name: string;
  };
  unit: {
    id: number;
    number: string;
  };
  assignedTo: {
    id: number;
    email: string;
  } | null;
  commentCount: number;
  photoCount: number;
  hasPhotos: boolean;
  photos: string[];
  slaDue: string | null;
  slaState: 'NONE' | 'ON_TRACK' | 'AT_RISK' | 'DUE_TODAY' | 'BREACHED';
  workOrders: Array<{
    id: number;
    status: string;
    supplierName: string;
  }>;
  comments: Array<{
    id: number;
    content: string;
    createdAt: string;
    author: string;
    role: string | null;
  }>;
}

interface DispatchResponse {
  items: DispatchTicket[];
  queueCounts: Record<QueueKey, number>;
  summary: {
    open: number;
    unassigned: number;
    inProgress: number;
    dueToday: number;
    breached: number;
    resolvedToday: number;
  };
  filterOptions: {
    buildings: Array<{ id: number; name: string }>;
    assignees: Array<{ id: number; email: string }>;
    categories: string[];
  };
  meta: {
    total: number;
  };
}

interface BuildingOption {
  id: number;
  name: string;
}

interface UnitOption {
  id: number;
  number: string;
  floor: number | null;
}

interface TechnicianOption {
  id: number;
  email: string;
  phone: string | null;
}

const queueLabels: Record<QueueKey, string> = {
  TRIAGE: 'דורש מיון',
  UNASSIGNED: 'לא הוקצה',
  SLA_RISK: 'בסיכון SLA',
  ACTIVE: 'בטיפול',
  RESOLVED_RECENT: 'הושלם לאחרונה',
};

const queueTones: Record<QueueKey, string> = {
  TRIAGE: 'bg-slate-950 text-white',
  UNASSIGNED: 'bg-amber-600 text-white',
  SLA_RISK: 'bg-rose-600 text-white',
  ACTIVE: 'bg-blue-600 text-white',
  RESOLVED_RECENT: 'bg-emerald-600 text-white',
};

const statusLabels: Record<DispatchTicket['status'], string> = {
  OPEN: 'פתוח',
  ASSIGNED: 'הוקצה',
  IN_PROGRESS: 'בטיפול',
  RESOLVED: 'נפתר',
};

const severityLabels: Record<DispatchTicket['severity'], string> = {
  NORMAL: 'רגילה',
  HIGH: 'דחופה',
  URGENT: 'בהולה',
};

const slaLabels: Record<DispatchTicket['slaState'], string> = {
  NONE: 'ללא SLA',
  ON_TRACK: 'במסלול',
  AT_RISK: 'בסיכון',
  DUE_TODAY: 'יעד היום',
  BREACHED: 'חורג SLA',
};

const severityBorderColors: Record<DispatchTicket['severity'], string> = {
  URGENT: 'border-s-rose-500',
  HIGH: 'border-s-amber-500',
  NORMAL: 'border-s-slate-300',
};

export default function TicketsPage() {
  const router = useRouter();
  const [dispatchData, setDispatchData] = useState<DispatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [queue, setQueue] = useState<QueueKey>('TRIAGE');
  const [buildingFilter, setBuildingFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sort, setSort] = useState('priority');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [createBuildings, setCreateBuildings] = useState<BuildingOption[]>([]);
  const [createUnits, setCreateUnits] = useState<UnitOption[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [savedView, setSavedView] = useState('ALL_OPEN');
  const [assignmentTarget, setAssignmentTarget] = useState('UNASSIGNED');
  const [statusTarget, setStatusTarget] = useState<DispatchTicket['status']>('OPEN');
  const [newNote, setNewNote] = useState('');
  const [createForm, setCreateForm] = useState({
    buildingId: '',
    unitId: '',
    category: 'כללי',
    severity: 'NORMAL',
    residentContact: '',
    description: '',
    photos: null as FileList | null,
  });

  const selectedTicket = useMemo(
    () => dispatchData?.items.find((ticket) => ticket.id === selectedTicketId) ?? dispatchData?.items[0] ?? null,
    [dispatchData, selectedTicketId],
  );

  const canDispatch = currentRole === 'ADMIN' || currentRole === 'PM' || currentRole === 'MASTER';

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setCurrentRole(getEffectiveRole());
    loadCreateBuildings();
    loadTechnicians();
  }, []);

  useEffect(() => {
    if (router.isReady && router.query.openCreate === '1') {
      setCreateOpen(true);
    }
  }, [router.isReady, router.query.openCreate]);

  useEffect(() => {
    loadDispatch();
  }, [queue, search, buildingFilter, assigneeFilter, statusFilter, severityFilter, slaFilter, categoryFilter, sort]);

  useEffect(() => {
    if (selectedTicket) {
      setAssignmentTarget(selectedTicket.assignedTo ? String(selectedTicket.assignedTo.id) : 'UNASSIGNED');
      setStatusTarget(selectedTicket.status);
    }
  }, [selectedTicketId, dispatchData]);

  useEffect(() => {
    if (!createForm.buildingId) {
      setCreateUnits([]);
      setCreateForm((current) => ({ ...current, unitId: '' }));
      return;
    }
    loadUnits(createForm.buildingId);
  }, [createForm.buildingId]);

  async function loadDispatch(preferredTicketId?: number) {
    try {
      setLoading((current) => current && !dispatchData);
      setRefreshing(true);
      const query = new URLSearchParams({
        view: 'dispatch',
        queue,
        sort,
        limit: '100',
      });
      if (search) query.set('search', search);
      if (buildingFilter !== 'ALL') query.set('buildingId', buildingFilter);
      if (assigneeFilter !== 'ALL') query.set('assigneeId', assigneeFilter);
      if (statusFilter !== 'ALL') query.set('status', statusFilter);
      if (severityFilter !== 'ALL') query.set('severity', severityFilter);
      if (slaFilter !== 'ALL') query.set('slaState', slaFilter);
      if (categoryFilter !== 'ALL') query.set('category', categoryFilter);

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
      const payload = (await response.json()) as BuildingOption[];
      setCreateBuildings(payload);
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
      setCreateOpen(false);
      setCreateForm({
        buildingId: '',
        unitId: '',
        category: 'כללי',
        severity: 'NORMAL',
        residentContact: '',
        description: '',
        photos: null,
      });
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

  async function handleAssignTicket() {
    if (!selectedTicket || !canDispatch || assignmentTarget === 'UNASSIGNED') {
      return;
    }

    try {
      setAssigning(true);
      const response = await authFetch(`/api/v1/tickets/${selectedTicket.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: Number(assignmentTarget) }),
      });
      if (!response.ok) throw new Error(await response.text());
      toast({ title: 'הקריאה הוקצתה' });
      await loadDispatch(selectedTicket.id);
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

  async function handleUpdateStatus() {
    if (!selectedTicket) return;

    try {
      setUpdatingStatus(true);
      const response = await authFetch(`/api/v1/tickets/${selectedTicket.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusTarget }),
      });
      if (!response.ok) throw new Error(await response.text());
      toast({ title: 'סטטוס הקריאה עודכן' });
      await loadDispatch(selectedTicket.id);
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

  function handleSavedView(nextView: string) {
    setSavedView(nextView);
    if (nextView === 'ALL_OPEN') {
      setQueue('TRIAGE');
      setStatusFilter('ALL');
      setSeverityFilter('ALL');
      setSlaFilter('ALL');
      return;
    }
    if (nextView === 'MY_ASSIGNMENTS') {
      const currentUserId = getCurrentUserId();
      setQueue('ACTIVE');
      setAssigneeFilter(currentUserId ? String(currentUserId) : 'ALL');
      return;
    }
    if (nextView === 'URGENT_ONLY') {
      setQueue('SLA_RISK');
      setSeverityFilter('URGENT');
      return;
    }
    if (nextView === 'OVERDUE') {
      setQueue('SLA_RISK');
      setSlaFilter('BREACHED');
      return;
    }
    if (nextView === 'RESET') {
      setQueue('TRIAGE');
      setBuildingFilter('ALL');
      setAssigneeFilter('ALL');
      setStatusFilter('ALL');
      setSeverityFilter('ALL');
      setSlaFilter('ALL');
      setCategoryFilter('ALL');
      setSearch('');
      setSearchInput('');
      setSort('priority');
      setSavedView('ALL_OPEN');
    }
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

  if (loading && !dispatchData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 rounded-[28px]" />
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-3xl" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Skeleton className="h-[780px] rounded-[28px]" />
          <Skeleton className="h-[780px] rounded-[28px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_24%),linear-gradient(135deg,_#234178,_#3a5c99_50%,_#5a7db5)] text-white shadow-[0_30px_80px_-42px_rgba(35,65,120,0.35)]">
        <div className="space-y-6 p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                  מרכז שליטה לקריאות שירות
                </Badge>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  {dispatchData?.meta.total ?? 0} קריאות
                </span>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight">קריאות שירות</h1>
                <p className="max-w-3xl text-base leading-7 text-slate-200">
                  מסך עבודה למיון, שיוך, מעקב SLA ועדכון מהיר של קריאות פתוחות בלי לקפוץ בין כמה מסכים.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="bg-white text-slate-950 hover:bg-slate-100" onClick={() => setCreateOpen(true)}>
                <Plus className="me-2 h-4 w-4" />
                קריאה חדשה
              </Button>
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={exportCurrentView}>
                ייצוא
              </Button>
              <Button
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                onClick={() => loadDispatch(selectedTicket?.id)}
              >
                <RefreshCw className={`me-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                רענון
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4 rounded-[26px] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="relative">
                <Search className="absolute inset-y-0 start-4 my-auto h-4 w-4 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="חיפוש לפי מספר קריאה, תיאור, בניין, יחידה או מטפל"
                  className="h-12 border-white/10 bg-slate-950/30 ps-11 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Select value={savedView} onValueChange={handleSavedView}>
                  <SelectTrigger className="border-white/10 bg-slate-950/30 text-white">
                    <SelectValue placeholder="תצוגות שמורות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_OPEN">כל הקריאות הפתוחות</SelectItem>
                    <SelectItem value="MY_ASSIGNMENTS">הקריאות שלי</SelectItem>
                    <SelectItem value="URGENT_ONLY">דחופות בלבד</SelectItem>
                    <SelectItem value="OVERDUE">חריגות SLA</SelectItem>
                    <SelectItem value="RESET">איפוס תצוגה</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                  <SelectTrigger className="border-white/10 bg-slate-950/30 text-white">
                    <SelectValue placeholder="בניין" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">כל הבניינים</SelectItem>
                    {dispatchData?.filterOptions.buildings.map((building) => (
                      <SelectItem key={building.id} value={String(building.id)}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="border-white/10 bg-slate-950/30 text-white">
                    <SelectValue placeholder="מטפל" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">כל המטפלים</SelectItem>
                    {technicians.map((technician) => (
                      <SelectItem key={technician.id} value={String(technician.id)}>
                        {technician.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="border-white/10 bg-slate-950/30 text-white">
                    <SelectValue placeholder="מיון" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">עדיפות וסיכון</SelectItem>
                    <SelectItem value="oldest">הוותיקות ביותר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <SummaryCard title="פתוחות" value={dispatchData?.summary.open ?? 0} icon={ShieldAlert} tone="default" />
              <SummaryCard title="לא הוקצו" value={dispatchData?.summary.unassigned ?? 0} icon={UserRound} tone="warning" />
              <SummaryCard title="בטיפול" value={dispatchData?.summary.inProgress ?? 0} icon={Wrench} tone="default" />
              <SummaryCard title="יעד היום" value={dispatchData?.summary.dueToday ?? 0} icon={CalendarClock} tone="warning" />
              <SummaryCard title="חריגות SLA" value={dispatchData?.summary.breached ?? 0} icon={AlertTriangle} tone="danger" />
              <SummaryCard title="נפתרו היום" value={dispatchData?.summary.resolvedToday ?? 0} icon={CheckCircle2} tone="success" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Queue Tabs ── */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.3)]">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(queueLabels) as QueueKey[]).map((key) => {
            const count = dispatchData?.queueCounts[key] ?? 0;
            const isActive = queue === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setQueue(key)}
                className={`inline-flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? `${queueTones[key]} shadow-lg`
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {queueLabels[key]}
                <span
                  className={`inline-flex min-w-[24px] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : count > 0 && (key === 'SLA_RISK' || key === 'UNASSIGNED')
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Main Split: Work Queue + Detail ── */}
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        {/* ── Work Queue ── */}
        <Card className="rounded-[28px] border-slate-200">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>תור עבודה</CardTitle>
                <CardDescription>
                  {dispatchData?.meta.total ?? 0} קריאות בתצוגה הנוכחית, מסודרות לפי דחיפות וסיכון.
                </CardDescription>
              </div>
              <Badge variant="outline">
                <Filter className="me-1 h-3.5 w-3.5" />
                מיון פעיל
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">כל הסטטוסים</SelectItem>
                  <SelectItem value="OPEN">פתוח</SelectItem>
                  <SelectItem value="ASSIGNED">הוקצה</SelectItem>
                  <SelectItem value="IN_PROGRESS">בטיפול</SelectItem>
                  <SelectItem value="RESOLVED">נפתר</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="חומרה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">כל החומרות</SelectItem>
                  <SelectItem value="NORMAL">רגילה</SelectItem>
                  <SelectItem value="HIGH">דחופה</SelectItem>
                  <SelectItem value="URGENT">בהולה</SelectItem>
                </SelectContent>
              </Select>

              <Select value={slaFilter} onValueChange={setSlaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="SLA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">כל מצבי ה-SLA</SelectItem>
                  <SelectItem value="BREACHED">חורג SLA</SelectItem>
                  <SelectItem value="DUE_TODAY">יעד היום</SelectItem>
                  <SelectItem value="AT_RISK">בסיכון</SelectItem>
                  <SelectItem value="ON_TRACK">במסלול</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">כל הקטגוריות</SelectItem>
                  {dispatchData?.filterOptions.categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setBuildingFilter('ALL');
                  setAssigneeFilter('ALL');
                  setStatusFilter('ALL');
                  setSeverityFilter('ALL');
                  setSlaFilter('ALL');
                  setCategoryFilter('ALL');
                  setSort('priority');
                }}
              >
                איפוס מסננים
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {dispatchData?.items.length ? (
              dispatchData.items.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                const isUrgent = ticket.slaState === 'BREACHED' || ticket.severity === 'URGENT';
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`w-full rounded-[22px] border border-s-[4px] p-4 text-right transition-all ${
                      isSelected
                        ? 'border-primary border-s-primary bg-primary text-primary-foreground shadow-[0_20px_50px_-28px_rgba(37,99,235,0.55)]'
                        : `border-slate-200 ${severityBorderColors[ticket.severity]} bg-slate-50/70 hover:border-slate-300 hover:bg-white hover:shadow-sm`
                    } ${isUrgent && !isSelected ? 'ring-1 ring-rose-200' : ''}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={isSelected ? 'secondary' : 'outline'} className="text-[11px]">#{ticket.id}</Badge>
                          <TicketSeverityBadge severity={ticket.severity} />
                          <TicketStatusBadge status={ticket.status} />
                          <SlaBadge state={ticket.slaState} />
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`break-words text-[15px] font-bold leading-snug ${isSelected ? 'text-white' : 'text-slate-950'}`}
                          >
                            {ticket.title}
                          </p>
                          <p
                            className={`mt-1 line-clamp-2 break-words text-sm leading-6 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}
                          >
                            {ticket.description}
                          </p>
                        </div>

                        <div
                          className={`flex flex-wrap gap-x-3 gap-y-1.5 text-[13px] ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}
                        >
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {ticket.building.name} • {ticket.unit.number}
                            </span>
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <UserRound className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{ticket.residentName}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5 shrink-0" />
                            {formatRelative(ticket.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`grid shrink-0 gap-2 sm:grid-cols-2 lg:w-[200px] lg:grid-cols-1 ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}
                      >
                        <div className="rounded-xl border border-current/10 px-3 py-2 text-sm">
                          <p className="text-[11px] opacity-60">מטפל</p>
                          <p className="mt-0.5 truncate font-semibold">{ticket.assignedTo?.email || 'לא הוקצה'}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="inline-flex items-center gap-1 rounded-xl border border-current/10 px-2.5 py-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {ticket.commentCount}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-xl border border-current/10 px-2.5 py-1.5">
                            <Camera className="h-3.5 w-3.5" />
                            {ticket.photoCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Search className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-lg font-bold text-slate-950">אין קריאות בתצוגה הזו</p>
                <p className="mt-2 text-sm text-slate-500">נסה לשנות תור, מסננים או חיפוש כדי להרחיב את הרשימה.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Detail Panel ── */}
        <Card className="rounded-[28px] border-slate-200">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>פרטי קריאה</CardTitle>
                <CardDescription>שינוי סטטוס, שיוך, עדכונים וצפייה בהיסטוריה מאותו מסך.</CardDescription>
              </div>
              {selectedTicket && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/tickets/${selectedTicket.id}`}>
                    <Eye className="me-2 h-4 w-4" />
                    עמוד מלא
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {selectedTicket ? (
              <div className="space-y-6">
                {/* ── Ticket Header ── */}
                <section className="rounded-[26px] border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/60 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">#{selectedTicket.id}</span>
                        <TicketSeverityBadge severity={selectedTicket.severity} />
                        <TicketStatusBadge status={selectedTicket.status} />
                        <SlaBadge state={selectedTicket.slaState} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black leading-tight text-slate-950">{selectedTicket.title}</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{selectedTicket.description}</p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <DetailMetric label="בניין" value={selectedTicket.building.name} />
                      <DetailMetric label="יחידה" value={selectedTicket.unit.number} />
                      <DetailMetric label="קטגוריה" value={selectedTicket.category} />
                      <DetailMetric label="מטפל" value={selectedTicket.assignedTo?.email || 'לא הוקצה'} />
                      <DetailMetric label="נפתח" value={formatDate(selectedTicket.createdAt)} />
                      <DetailMetric label="SLA" value={selectedTicket.slaDue ? formatDate(selectedTicket.slaDue) : 'לא הוגדר'} />
                    </div>
                  </div>
                </section>

                {/* ── Quick Actions + Notes ── */}
                <section className="grid gap-4 xl:grid-cols-2">
                  <Card className="rounded-[24px] border-slate-200 bg-slate-50/60">
                    <CardHeader>
                      <CardTitle className="text-lg">פעולות מהירות</CardTitle>
                      <CardDescription>שיוך מטפל ועדכון סטטוס בלי לעזוב את המסך.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700">שיוך טכנאי</p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Select value={assignmentTarget} onValueChange={setAssignmentTarget} disabled={!canDispatch}>
                            <SelectTrigger className="sm:flex-1">
                              <SelectValue placeholder="בחר מטפל" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UNASSIGNED">ללא שיוך</SelectItem>
                              {technicians.map((technician) => (
                                <SelectItem key={technician.id} value={String(technician.id)}>
                                  {technician.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={handleAssignTicket} disabled={!canDispatch || assigning || assignmentTarget === 'UNASSIGNED'}>
                            {assigning ? 'שומר...' : 'שייך'}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700">עדכון סטטוס</p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Select value={statusTarget} onValueChange={(value) => setStatusTarget(value as DispatchTicket['status'])}>
                            <SelectTrigger className="sm:flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OPEN">פתוח</SelectItem>
                              <SelectItem value="ASSIGNED">הוקצה</SelectItem>
                              <SelectItem value="IN_PROGRESS">בטיפול</SelectItem>
                              <SelectItem value="RESOLVED">נפתר</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" onClick={handleUpdateStatus} disabled={updatingStatus}>
                            {updatingStatus ? 'מעדכן...' : 'עדכן'}
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        <DetailMetric label="איש קשר" value={selectedTicket.residentContact || 'לא הוזן'} />
                        <DetailMetric label="עדכון אחרון" value={formatRelative(selectedTicket.latestActivityAt)} />
                      </div>

                      {selectedTicket.workOrders.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-700">הזמנות עבודה קשורות</p>
                          <div className="space-y-2">
                            {selectedTicket.workOrders.map((workOrder) => (
                              <Link
                                key={workOrder.id}
                                href={`/work-orders/${workOrder.id}`}
                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                              >
                                <span>{workOrder.supplierName}</span>
                                <span className="font-semibold">#{workOrder.id} • {workOrder.status}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-[24px] border-slate-200 bg-slate-50/60">
                    <CardHeader>
                      <CardTitle className="text-lg">עדכון מהיר לדייר / ליומן</CardTitle>
                      <CardDescription>הוסף הערה, הנחיה פנימית או עדכון ביצוע שייכנס לציר הזמן.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={newNote}
                        onChange={(event) => setNewNote(event.target.value)}
                        rows={5}
                        placeholder="כתוב עדכון, תיאום הגעה, סיכום טיפול או הערה תפעולית"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-500">העדכון יישמר כהערה בציר הזמן של הקריאה.</p>
                        <Button onClick={handleAddNote} disabled={addingNote || !newNote.trim()}>
                          {addingNote ? 'שומר...' : 'הוסף עדכון'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* ── Photos + Timeline ── */}
                <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                  <Card className="rounded-[24px] border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg">תמונות וראיות</CardTitle>
                      <CardDescription>גישה מהירה לקבצים שצורפו לקריאה.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedTicket.photos.length ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {selectedTicket.photos.map((photo, index) => (
                            <a
                              key={`${photo}-${index}`}
                              href={photo}
                              target="_blank"
                              rel="noreferrer"
                              className="group relative block overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo} alt={`Ticket photo ${index + 1}`} className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                                <Eye className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-[18px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                          <Camera className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                          <p className="text-sm text-slate-500">אין תמונות מצורפות לקריאה זו.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-[24px] border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg">ציר זמן ועדכונים</CardTitle>
                      <CardDescription>תיעוד מלא של התקדמות הקריאה, הערות ותקשורת.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative space-y-0">
                        {selectedTicket.comments.length > 1 && (
                          <div className="absolute bottom-4 start-5 top-4 w-px bg-slate-200" />
                        )}
                        {selectedTicket.comments.map((comment, idx) => (
                          <div key={comment.id} className="relative pb-4 ps-12 last:pb-0">
                            <div className="absolute start-3 top-4 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-300">
                              <span className="h-2 w-2 rounded-full bg-slate-500" />
                            </div>
                            <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[11px]">{comment.role || 'USER'}</Badge>
                                  <span className="text-sm font-medium text-slate-800">{comment.author}</span>
                                </div>
                                <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString('he-IL')}</span>
                              </div>
                              <p className="mt-2.5 whitespace-pre-wrap text-sm leading-7 text-slate-600">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        {selectedTicket.comments.length === 0 && (
                          <div className="rounded-[18px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                            <p className="text-sm text-slate-500">אין עדכונים עדיין. הוסף את הראשון למעלה.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </div>
            ) : (
              <div className="rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Eye className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-lg font-bold text-slate-950">בחר קריאה מהרשימה</p>
                <p className="mt-2 text-sm text-slate-500">כאן יוצגו פרטים, פעולות ועדכונים בזמן אמת על הקריאה שבחרת.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>פתיחת קריאה חדשה</DialogTitle>
            <DialogDescription>טופס יצירה מודרך שמרכז את כל פרטי הפנייה לפני שליחה למוקד.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">בניין</label>
              <Select value={createForm.buildingId} onValueChange={(value) => setCreateForm((current) => ({ ...current, buildingId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר בניין" />
                </SelectTrigger>
                <SelectContent>
                  {createBuildings.map((building) => (
                    <SelectItem key={building.id} value={String(building.id)}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">יחידה</label>
              <Select value={createForm.unitId} onValueChange={(value) => setCreateForm((current) => ({ ...current, unitId: value }))}>
                <SelectTrigger disabled={!createForm.buildingId || unitsLoading}>
                  <SelectValue placeholder={unitsLoading ? 'טוען יחידות...' : 'בחר יחידה'} />
                </SelectTrigger>
                <SelectContent>
                  {createUnits.map((unit) => (
                    <SelectItem key={unit.id} value={String(unit.id)}>
                      {unit.number}{unit.floor ? ` • קומה ${unit.floor}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">קטגוריה</label>
              <Select value={createForm.category} onValueChange={(value) => setCreateForm((current) => ({ ...current, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="כללי">כללי</SelectItem>
                  <SelectItem value="חשמל">חשמל</SelectItem>
                  <SelectItem value="אינסטלציה">אינסטלציה</SelectItem>
                  <SelectItem value="מעליות">מעליות</SelectItem>
                  <SelectItem value="גישה וביטחון">גישה וביטחון</SelectItem>
                  <SelectItem value="ניקיון">ניקיון</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">רמת חומרה</label>
              <Select value={createForm.severity} onValueChange={(value) => setCreateForm((current) => ({ ...current, severity: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">רגילה</SelectItem>
                  <SelectItem value="HIGH">דחופה</SelectItem>
                  <SelectItem value="URGENT">בהולה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">איש קשר</label>
              <Input
                value={createForm.residentContact}
                onChange={(event) => setCreateForm((current) => ({ ...current, residentContact: event.target.value }))}
                placeholder="טלפון, שם או הערת תיאום רלוונטית"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">תיאור התקלה</label>
              <Textarea
                rows={6}
                value={createForm.description}
                onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="תאר בקצרה מה קרה, מה ההשפעה, והאם נדרשת גישה מיוחדת או טיפול מיידי"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">צירוף תמונות</label>
              <Input type="file" multiple accept="image/*" onChange={(event) => setCreateForm((current) => ({ ...current, photos: event.target.files }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreateTicket} disabled={createSubmitting}>
              {createSubmitting ? 'יוצר...' : 'פתח קריאה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  tone: 'default' | 'warning' | 'danger' | 'success';
}) {
  const toneClasses = {
    default: 'border-white/10 bg-white/5 text-white',
    warning: 'border-amber-400/20 bg-amber-500/10 text-white',
    danger: 'border-rose-400/20 bg-rose-500/10 text-white',
    success: 'border-emerald-400/20 bg-emerald-500/10 text-white',
  } as const;

  const iconBg = {
    default: 'bg-white/10',
    warning: 'bg-amber-500/20',
    danger: 'bg-rose-500/20',
    success: 'bg-emerald-500/20',
  } as const;

  return (
    <div className={`rounded-[22px] border p-4 backdrop-blur ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium opacity-70">{title}</p>
          <p className="mt-1.5 text-2xl font-black">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${iconBg[tone]}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </div>
  );
}

function TicketSeverityBadge({ severity }: { severity: DispatchTicket['severity'] }) {
  if (severity === 'URGENT') {
    return <Badge variant="destructive">{severityLabels[severity]}</Badge>;
  }
  if (severity === 'HIGH') {
    return <Badge variant="warning">{severityLabels[severity]}</Badge>;
  }
  return <Badge variant="secondary">{severityLabels[severity]}</Badge>;
}

function TicketStatusBadge({ status }: { status: DispatchTicket['status'] }) {
  if (status === 'OPEN') return <Badge variant="open">{statusLabels[status]}</Badge>;
  if (status === 'ASSIGNED') return <Badge variant="assigned">{statusLabels[status]}</Badge>;
  if (status === 'IN_PROGRESS') return <Badge variant="in-progress">{statusLabels[status]}</Badge>;
  return <Badge variant="resolved">{statusLabels[status]}</Badge>;
}

function SlaBadge({ state }: { state: DispatchTicket['slaState'] }) {
  if (state === 'BREACHED') return <Badge variant="destructive">{slaLabels[state]}</Badge>;
  if (state === 'DUE_TODAY' || state === 'AT_RISK') return <Badge variant="warning">{slaLabels[state]}</Badge>;
  if (state === 'ON_TRACK') return <Badge variant="success">{slaLabels[state]}</Badge>;
  return <Badge variant="outline">{slaLabels[state]}</Badge>;
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function formatRelative(dateString: string) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `לפני ${minutes} דקות`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}

function escapeCsv(value: string) {
  if (!value) return '';
  return `"${value.replace(/"/g, '""')}"`;
}
