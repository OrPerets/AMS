import { authFetch } from '@/lib/auth';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(path, init);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      message = payload?.message || payload?.error?.message || message;
    } catch {
      // Ignore parse failure and keep the generic message.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export type GardensDashboard = {
  summary: {
    totalMonths: number;
    activeWorkers: number;
    pendingApprovals: number;
    requiresAttention: number;
  };
  activeMonth: {
    month: string;
    isLocked: boolean;
    submitted: number;
    needsChanges: number;
  } | null;
};

export type GardensMonthListItem = {
  id: number;
  month: string;
  title?: string | null;
  isLocked: boolean;
  submissionDeadline?: string | null;
  workers: number;
  assignments: number;
  submitted: number;
  approved: number;
  needsChanges: number;
  updatedAt: string;
};

export type GardensMonthOverview = {
  month: {
    month: string;
    title?: string | null;
    isLocked: boolean;
    submissionDeadline?: string | null;
  };
  stats: {
    workers: number;
    assignments: number;
    coverageDays: number;
    submitted: number;
    approved: number;
    needsChanges: number;
  };
  workers: Array<{
    workerId: number;
    workerProfileId: number;
    workerName: string;
    teamName?: string | null;
    email: string;
    phone?: string | null;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'NEEDS_CHANGES';
    assignmentCount: number;
    submittedAt?: string | null;
    reviewedAt?: string | null;
    reviewedBy?: string | null;
    reviewNote?: string | null;
    lastReminderAt?: string | null;
  }>;
};

export type GardensWorkerPlanDetail = {
  month: string;
  monthLocked: boolean;
  worker: {
    id: number;
    name: string;
    teamName?: string | null;
    email: string;
    phone?: string | null;
  };
  plan: {
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'NEEDS_CHANGES';
    submittedAt?: string | null;
    reviewedAt?: string | null;
    reviewedBy?: string | null;
    reviewNote?: string | null;
  };
  assignments: Array<{
    id: number;
    workDate: string;
    location: string;
    notes?: string | null;
  }>;
};

export type MyGardensPlan = GardensWorkerPlanDetail & {
  canEdit: boolean;
};

export function getGardensDashboard() {
  return request<GardensDashboard>('/api/v1/gardens/dashboard');
}

export function listGardensMonths() {
  return request<any[]>('/api/v1/gardens/months').then((months) =>
    months.map((month) => ({
      id: month.id,
      month: month.plan,
      title: month.title,
      isLocked: month.isLocked,
      submissionDeadline: month.submissionDeadline,
      workers: month.stats.workers,
      assignments: month.stats.assignments,
      submitted: month.stats.submitted,
      approved: month.stats.approved,
      needsChanges: month.stats.needsChanges,
      updatedAt: month.createdAt,
    })),
  );
}

export function createGardensMonth(month: string) {
  return request<{ id: number; plan: string; isLocked: boolean }>('/api/v1/gardens/months', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: month }),
  }).then((result) => ({
    id: result.id,
    month: result.plan,
    isLocked: result.isLocked,
  }));
}

export function getGardensMonthOverview(month: string) {
  return request<any>(`/api/v1/gardens/months/${month}/overview`).then((data) => ({
    month: {
      month: data.month.plan,
      title: data.month.title,
      isLocked: data.month.isLocked,
      submissionDeadline: data.month.submissionDeadline,
    },
    stats: data.stats,
    workers: data.workers.map((worker: any) => ({
      workerId: worker.workerProfileId,
      workerProfileId: worker.workerProfileId,
      workerName: worker.displayName,
      teamName: worker.teamName,
      email: worker.email,
      phone: worker.phone,
      status: worker.status,
      assignmentCount: worker.assignmentCount,
      submittedAt: worker.submittedAt,
      reviewedAt: worker.reviewedAt,
      reviewedBy: worker.reviewedBy,
      reviewNote: worker.reviewNote,
      lastReminderAt: worker.lastReminderAt,
    })),
  }));
}

export function getGardensWorkerPlan(month: string, workerProfileId: number) {
  return request<any>(`/api/v1/gardens/months/${month}/workers/${workerProfileId}`).then((data) => ({
    month: data.month.plan,
    monthLocked: data.month.isLocked,
    worker: {
      id: data.worker.workerProfileId,
      name: data.worker.displayName,
      teamName: data.worker.teamName,
      email: data.worker.email,
      phone: data.worker.phone,
    },
    plan: {
      status: data.planState.status,
      submittedAt: data.planState.submittedAt,
      reviewedAt: data.planState.reviewedAt,
      reviewedBy: data.planState.reviewedBy,
      reviewNote: data.planState.reviewNote,
    },
    assignments: data.assignments.map((assignment: any) => ({
      id: assignment.id,
      workDate: assignment.date,
      location: assignment.location,
      notes: assignment.notes,
    })),
  }));
}

export function reviewGardensWorkerPlan(
  month: string,
  workerProfileId: number,
  body: { status: 'APPROVED' | 'NEEDS_CHANGES'; reviewNote?: string },
) {
  return request(`/api/v1/gardens/months/${month}/workers/${workerProfileId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function sendGardensReminders(month: string) {
  return request<{ ok: boolean; sent: number }>(`/api/v1/gardens/months/${month}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ onlyPending: true }),
  }).then((result) => ({ reminded: result.sent, recipients: [] }));
}

export function getMyCurrentGardensMonth() {
  return request<{ month: string | null; status?: string | null }>('/api/v1/gardens/me/current');
}

export function getMyGardensPlan(month: string) {
  return request<any>(`/api/v1/gardens/me/months/${month}`).then((data) => ({
    month: data.month.plan,
    monthLocked: data.month.isLocked,
    worker: {
      id: data.worker.workerProfileId,
      name: data.worker.displayName,
      teamName: data.worker.teamName,
      email: data.worker.email,
      phone: data.worker.phone,
    },
    plan: {
      status: data.month.status,
      submittedAt: data.month.submittedAt,
      reviewedAt: data.month.reviewedAt,
      reviewedBy: null,
      reviewNote: data.month.reviewNote,
    },
    assignments: data.assignments.map((assignment: any) => ({
      id: assignment.id,
      workDate: assignment.date,
      location: assignment.location,
      notes: assignment.notes,
    })),
    canEdit: !data.month.isLocked && ['DRAFT', 'NEEDS_CHANGES'].includes(data.month.status),
  }));
}

export function saveMyGardensAssignments(
  month: string,
  assignments: Array<{ workDate: string; location: string; notes?: string }>,
) {
  return request<{ ok: boolean; assignmentCount: number }>(`/api/v1/gardens/me/months/${month}/assignments`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assignments: assignments.map((assignment) => ({
        date: assignment.workDate.slice(0, 10),
        location: assignment.location,
        notes: assignment.notes,
      })),
    }),
  }).then((result) => ({ ok: result.ok, assignments: result.assignmentCount }));
}

export function submitMyGardensPlan(month: string) {
  return request(`/api/v1/gardens/me/months/${month}/submit`, {
    method: 'POST',
  });
}
