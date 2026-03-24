const RECENT_ACTIONS_KEY = 'ams:recent-actions';
const LAST_MODULE_KEY = 'ams:last-module';
const PREFERRED_DESTINATION_KEY = 'ams:preferred-destination';
const RESUME_STATE_KEY = 'ams:resume-state';
const MAX_RECENT_ACTIONS = 8;

function isBrowser() {
  return typeof window !== 'undefined';
}

export type RecentAction = {
  id: string;
  label: string;
  href: string;
  screen: string;
  role: string;
  timestamp: number;
};

export type ResumeState = {
  screen: string;
  href: string;
  label: string;
  role: string;
  userId: number | null;
  timestamp: number;
  context?: Record<string, string | number | boolean>;
};

function storageKey(base: string, userId?: number | null, role?: string | null): string {
  const uid = typeof userId === 'number' ? userId : 'guest';
  const r = role || 'unknown';
  return `${base}:${uid}:${r}`;
}

export function getRecentActions(userId?: number | null, role?: string | null): RecentAction[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(storageKey(RECENT_ACTIONS_KEY, userId, role));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentAction(action: Omit<RecentAction, 'timestamp'>, userId?: number | null) {
  if (!isBrowser()) return;
  const existing = getRecentActions(userId, action.role);
  const filtered = existing.filter((a) => a.id !== action.id);
  const entry: RecentAction = { ...action, timestamp: Date.now() };
  const updated = [entry, ...filtered].slice(0, MAX_RECENT_ACTIONS);
  try {
    window.localStorage.setItem(storageKey(RECENT_ACTIONS_KEY, userId, action.role), JSON.stringify(updated));
  } catch { /* quota exceeded */ }
}

export function getLastModule(userId?: number | null, role?: string | null): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(storageKey(LAST_MODULE_KEY, userId, role));
  } catch {
    return null;
  }
}

export function setLastModule(module: string, userId?: number | null, role?: string | null) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(storageKey(LAST_MODULE_KEY, userId, role), module);
  } catch { /* quota exceeded */ }
}

export function getPreferredDestination(userId?: number | null, role?: string | null): string | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(PREFERRED_DESTINATION_KEY, userId, role));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { destination: string; count: number };
    if (parsed.count >= 3) return parsed.destination;
    return null;
  } catch {
    return null;
  }
}

export function trackDestinationUsage(destination: string, userId?: number | null, role?: string | null) {
  if (!isBrowser()) return;
  try {
    const key = storageKey(PREFERRED_DESTINATION_KEY, userId, role);
    const raw = window.localStorage.getItem(key);
    let parsed = { destination: '', count: 0 };
    if (raw) {
      try { parsed = JSON.parse(raw); } catch { /* ignore */ }
    }
    if (parsed.destination === destination) {
      parsed.count += 1;
    } else {
      parsed = { destination, count: 1 };
    }
    window.localStorage.setItem(key, JSON.stringify(parsed));
  } catch { /* quota exceeded */ }
}

export function getResumeState(screen: string, userId?: number | null, role?: string | null): ResumeState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(`${RESUME_STATE_KEY}:${screen}`, userId, role));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResumeState;
    if (!parsed?.href || !parsed?.screen) return null;
    const ageMs = Date.now() - (parsed.timestamp || 0);
    if (ageMs > 7 * 24 * 60 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setResumeState(state: Omit<ResumeState, 'timestamp'>) {
  if (!isBrowser()) return;
  try {
    const entry: ResumeState = { ...state, timestamp: Date.now() };
    const key = storageKey(`${RESUME_STATE_KEY}:${state.screen}`, state.userId, state.role);
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch { /* quota exceeded */ }
}

export function clearResumeState(screen: string, userId?: number | null, role?: string | null) {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(storageKey(`${RESUME_STATE_KEY}:${screen}`, userId, role));
  } catch { /* ignore */ }
}
