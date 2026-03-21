import type { ComponentType } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ShieldAlert,
  UserRound,
  Wrench,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import type { DispatchTicket, QueueKey } from './types';

export const queueLabels: Record<QueueKey, string> = {
  TRIAGE: 'דורש מיון',
  UNASSIGNED: 'לא הוקצה',
  SLA_RISK: 'בסיכון SLA',
  ACTIVE: 'בטיפול',
  RESOLVED_RECENT: 'הושלם לאחרונה',
};

export const queueTones: Record<QueueKey, string> = {
  TRIAGE: 'bg-slate-950 text-white',
  UNASSIGNED: 'bg-amber-600 text-white',
  SLA_RISK: 'bg-rose-600 text-white',
  ACTIVE: 'bg-blue-600 text-white',
  RESOLVED_RECENT: 'bg-emerald-600 text-white',
};

export const statusLabels: Record<DispatchTicket['status'], string> = {
  OPEN: 'פתוח',
  ASSIGNED: 'הוקצה',
  IN_PROGRESS: 'בטיפול',
  RESOLVED: 'נפתר',
};

export const severityLabels: Record<DispatchTicket['severity'], string> = {
  NORMAL: 'רגילה',
  HIGH: 'דחופה',
  URGENT: 'בהולה',
};

export const slaLabels: Record<DispatchTicket['slaState'], string> = {
  NONE: 'ללא SLA',
  ON_TRACK: 'במסלול',
  AT_RISK: 'בסיכון',
  DUE_TODAY: 'יעד היום',
  BREACHED: 'חורג SLA',
};

export const severityBorderColors: Record<DispatchTicket['severity'], string> = {
  URGENT: 'border-s-rose-500',
  HIGH: 'border-s-amber-500',
  NORMAL: 'border-s-slate-300',
};

export function SummaryCard({
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

export function TicketSeverityBadge({ severity }: { severity: DispatchTicket['severity'] }) {
  if (severity === 'URGENT') {
    return <Badge variant="destructive">{severityLabels[severity]}</Badge>;
  }
  if (severity === 'HIGH') {
    return <Badge variant="warning">{severityLabels[severity]}</Badge>;
  }
  return <Badge variant="secondary">{severityLabels[severity]}</Badge>;
}

export function TicketStatusBadge({ status }: { status: DispatchTicket['status'] }) {
  if (status === 'OPEN') return <Badge className="border-transparent bg-blue-100 text-blue-800">{statusLabels[status]}</Badge>;
  if (status === 'ASSIGNED') return <Badge className="border-transparent bg-amber-100 text-amber-800">{statusLabels[status]}</Badge>;
  if (status === 'IN_PROGRESS') return <Badge className="border-transparent bg-violet-100 text-violet-800">{statusLabels[status]}</Badge>;
  return <Badge className="border-transparent bg-emerald-100 text-emerald-800">{statusLabels[status]}</Badge>;
}

export function SlaBadge({ state }: { state: DispatchTicket['slaState'] }) {
  if (state === 'BREACHED') return <Badge variant="destructive">{slaLabels[state]}</Badge>;
  if (state === 'DUE_TODAY' || state === 'AT_RISK') return <Badge variant="warning">{slaLabels[state]}</Badge>;
  if (state === 'ON_TRACK') return <Badge variant="success">{slaLabels[state]}</Badge>;
  return <Badge variant="outline">{slaLabels[state]}</Badge>;
}

export function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

export function formatRelative(dateString: string) {
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

export function escapeCsv(value: string) {
  if (!value) return '';
  return `"${value.replace(/"/g, '""')}"`;
}

export const summaryCards = [
  { title: 'פתוחות', key: 'open', icon: ShieldAlert, tone: 'default' as const },
  { title: 'לא הוקצו', key: 'unassigned', icon: UserRound, tone: 'warning' as const },
  { title: 'בטיפול', key: 'inProgress', icon: Wrench, tone: 'default' as const },
  { title: 'יעד היום', key: 'dueToday', icon: CalendarClock, tone: 'warning' as const },
  { title: 'חריגות SLA', key: 'breached', icon: AlertTriangle, tone: 'danger' as const },
  { title: 'נפתרו היום', key: 'resolvedToday', icon: CheckCircle2, tone: 'success' as const },
];
