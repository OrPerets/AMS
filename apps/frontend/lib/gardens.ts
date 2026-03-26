import { authFetch } from './auth';

export type GardensStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'NEEDS_CHANGES';

export type GardensBuildingOption = {
  id: number;
  name: string;
  address?: string | null;
};

export type GardensMonthSummary = {
  id: number;
  plan: string;
  year: number;
  month: number;
  title?: string | null;
  submissionDeadline?: string | null;
  isLocked: boolean;
  createdAt: string;
  stats: {
    workers: number;
    submitted: number;
    approved: number;
    needsChanges: number;
    assignments: number;
    coverageDays: number;
  };
};

export type GardensWorkerDashboard = {
  worker: {
    workerProfileId: number;
    userId: number;
    displayName: string;
    teamName?: string | null;
    email: string;
    phone?: string | null;
  };
  month: {
    id: number;
    plan: string;
    title?: string | null;
    submissionDeadline?: string | null;
    isLocked: boolean;
    status: GardensStatus;
    submittedAt?: string | null;
    reviewedAt?: string | null;
    reviewNote?: string | null;
  } | null;
  assignments: {
    id: number;
    date: string;
    location: string;
    notes: string;
  }[];
  summary: {
    assignmentCount: number;
    filledDays: number;
  };
  months: {
    id: number;
    plan: string;
    title?: string | null;
    isLocked: boolean;
    status: GardensStatus;
    assignmentCount: number;
    submittedAt?: string | null;
  }[];
};

export type GardensWorkerMonth = Omit<GardensWorkerDashboard, 'months'>;

export type GardensManagerDashboard = {
  month: {
    id: number;
    plan: string;
    title?: string | null;
    submissionDeadline?: string | null;
    isLocked: boolean;
    createdAt: string;
  };
  stats: {
    workers: number;
    submitted: number;
    approved: number;
    needsChanges: number;
    assignments: number;
    coverageDays: number;
  };
  workers: {
    workerProfileId: number;
    userId: number;
    displayName: string;
    teamName?: string | null;
    email: string;
    phone?: string | null;
    status: GardensStatus;
    assignmentCount: number;
    submittedAt?: string | null;
    reviewedAt?: string | null;
    reviewedBy?: string | null;
    reviewNote?: string | null;
    lastReminderAt?: string | null;
  }[];
  assignments: {
    id: number;
    date: string;
    location: string;
    notes: string;
    workerProfileId: number;
    workerName: string;
  }[];
};

export type GardensWorkerPlanDetail = {
  month: {
    id: number;
    plan: string;
    title?: string | null;
    submissionDeadline?: string | null;
    isLocked: boolean;
  };
  worker: {
    workerProfileId: number;
    userId: number;
    displayName: string;
    teamName?: string | null;
    email: string;
    phone?: string | null;
  };
  planState: {
    status: GardensStatus;
    submittedAt?: string | null;
    reviewedAt?: string | null;
    reviewedBy?: string | null;
    reviewNote?: string | null;
    lastReminderAt?: string | null;
  };
  assignments: {
    id: number;
    date: string;
    location: string;
    notes: string;
  }[];
};

type StoredGardensResume = {
  href: string;
  label: string;
  role: string;
  userId: number | null;
  savedAt: string;
};

const LAST_GARDENS_ROUTE_KEY = 'ams:gardens:last-route';

function isBrowser() {
  return typeof window !== 'undefined';
}

async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(path, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export function formatPlanLabel(plan: string) {
  const [year, month] = plan.split('-').map(Number);
  return new Intl.DateTimeFormat('he-IL', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatDateLabel(date?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!date) {
    return 'לא הוגדר';
  }

  return new Intl.DateTimeFormat('he-IL', options ?? { dateStyle: 'medium' }).format(
    new Date(date),
  );
}

export function formatStatusLabel(status: GardensStatus) {
  switch (status) {
    case 'SUBMITTED':
      return 'הוגש לאישור';
    case 'APPROVED':
      return 'אושר';
    case 'NEEDS_CHANGES':
      return 'נדרש עדכון';
    case 'DRAFT':
    default:
      return 'טיוטה';
  }
}

export async function listGardensMonths() {
  return readJson<GardensMonthSummary[]>('/api/v1/gardens/months');
}

export async function createGardensMonth(payload: {
  plan: string;
  title?: string;
  submissionDeadline?: string;
}) {
  return readJson('/api/v1/gardens/months', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getGardensManagerDashboard(plan: string) {
  return readJson<GardensManagerDashboard>(`/api/v1/gardens/months/${plan}/dashboard`);
}

export async function getGardensWorkerPlanDetail(plan: string, workerProfileId: number) {
  return readJson<GardensWorkerPlanDetail>(
    `/api/v1/gardens/months/${plan}/workers/${workerProfileId}`,
  );
}

export async function reviewGardensWorkerPlan(
  plan: string,
  workerProfileId: number,
  payload: { status: 'APPROVED' | 'NEEDS_CHANGES'; reviewNote?: string },
) {
  return readJson(`/api/v1/gardens/months/${plan}/workers/${workerProfileId}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function sendGardensReminders(
  plan: string,
  payload: { workerProfileIds?: number[]; onlyPending?: boolean } = {},
) {
  return readJson<{ ok: true; sent: number }>(`/api/v1/gardens/months/${plan}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getGardensWorkerDashboard() {
  return readJson<GardensWorkerDashboard>('/api/v1/gardens/me/dashboard');
}

export async function listGardensBuildings() {
  return readJson<GardensBuildingOption[]>('/api/v1/buildings');
}

export async function getGardensWorkerMonth(plan: string) {
  return readJson<GardensWorkerMonth>(`/api/v1/gardens/me/months/${plan}`);
}

export async function saveGardensWorkerMonth(
  plan: string,
  assignments: { date: string; location: string; notes?: string }[],
) {
  return readJson<{ ok: true; assignmentCount: number }>(`/api/v1/gardens/me/months/${plan}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignments }),
  });
}

export async function submitGardensWorkerMonth(plan: string) {
  return readJson<{ ok: true; status: GardensStatus; submittedAt?: string | null }>(
    `/api/v1/gardens/me/months/${plan}/submit`,
    {
      method: 'POST',
    },
  );
}

function getGardensResumeScope(role?: string | null, userId?: number | null) {
  return `${role || 'UNKNOWN'}:${typeof userId === 'number' ? userId : 'guest'}`;
}

export function getLatestGardensPlan(months: Array<{ plan: string }> = []) {
  return [...months]
    .map((month) => month.plan)
    .sort((left, right) => right.localeCompare(left))[0] ?? null;
}

export function getStoredGardensResume(role?: string | null, userId?: number | null) {
  if (!isBrowser()) return null;

  const rawValue = window.localStorage.getItem(
    `${LAST_GARDENS_ROUTE_KEY}:${getGardensResumeScope(role, userId)}`,
  );
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as StoredGardensResume;
    if (!parsed?.href || !parsed?.label) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredGardensResume(
  href: string,
  options: { role?: string | null; userId?: number | null; label: string },
) {
  if (!isBrowser()) return;

  const storedValue: StoredGardensResume = {
    href,
    label: options.label,
    role: options.role || 'UNKNOWN',
    userId: typeof options.userId === 'number' ? options.userId : null,
    savedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    `${LAST_GARDENS_ROUTE_KEY}:${getGardensResumeScope(options.role, storedValue.userId)}`,
    JSON.stringify(storedValue),
  );
}
