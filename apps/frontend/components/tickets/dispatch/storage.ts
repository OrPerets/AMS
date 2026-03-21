import type { DispatchFilters, DispatchPreset } from './types';

export const DEFAULT_FILTERS: DispatchFilters = {
  queue: 'TRIAGE',
  search: '',
  buildingFilter: 'ALL',
  assigneeFilter: 'ALL',
  statusFilter: 'ALL',
  severityFilter: 'ALL',
  slaFilter: 'ALL',
  categoryFilter: 'ALL',
  sort: 'priority',
};

export const BUILTIN_PRESETS: DispatchPreset[] = [
  {
    id: 'builtin:all-open',
    name: 'כל הקריאות הפתוחות',
    builtin: true,
    filters: { ...DEFAULT_FILTERS, queue: 'TRIAGE' },
  },
  {
    id: 'builtin:my-assignments',
    name: 'הקריאות שלי',
    builtin: true,
    filters: { ...DEFAULT_FILTERS, queue: 'ACTIVE' },
  },
  {
    id: 'builtin:urgent-only',
    name: 'דחופות בלבד',
    builtin: true,
    filters: { ...DEFAULT_FILTERS, queue: 'SLA_RISK', severityFilter: 'URGENT' },
  },
  {
    id: 'builtin:overdue',
    name: 'חריגות SLA',
    builtin: true,
    filters: { ...DEFAULT_FILTERS, queue: 'SLA_RISK', slaFilter: 'BREACHED' },
  },
];

const CUSTOM_PRESETS_KEY = 'ams.dispatch.custom-presets.v1';
const FILTERS_KEY = 'ams.dispatch.filters.v1';
const LAST_PRESET_KEY = 'ams.dispatch.last-preset.v1';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function loadStoredFilters(): DispatchFilters {
  if (!isBrowser()) {
    return DEFAULT_FILTERS;
  }

  try {
    const raw = window.localStorage.getItem(FILTERS_KEY);
    if (!raw) return DEFAULT_FILTERS;
    return { ...DEFAULT_FILTERS, ...(JSON.parse(raw) as Partial<DispatchFilters>) };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function saveStoredFilters(filters: DispatchFilters) {
  if (!isBrowser()) return;
  window.localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
}

export function loadCustomPresets(): DispatchPreset[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DispatchPreset[];
    return Array.isArray(parsed)
      ? parsed.filter((preset) => preset && typeof preset.id === 'string' && typeof preset.name === 'string')
      : [];
  } catch {
    return [];
  }
}

export function saveCustomPresets(presets: DispatchPreset[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
}

export function loadLastPresetId() {
  if (!isBrowser()) return BUILTIN_PRESETS[0].id;
  return window.localStorage.getItem(LAST_PRESET_KEY) || BUILTIN_PRESETS[0].id;
}

export function saveLastPresetId(presetId: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(LAST_PRESET_KEY, presetId);
}
