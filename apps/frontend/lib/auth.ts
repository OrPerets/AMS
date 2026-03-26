export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export type AuthSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
  payload: any | null;
  role: string | null;
  userId: number | null;
  isAuthenticated: boolean;
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

function getUnixTime() {
  return Math.floor(Date.now() / 1000);
}

function removeStoredToken(key: string) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
}

function readStoredToken(key: string): string | null {
  if (!isBrowser()) return null;
  const token = window.localStorage.getItem(key);
  if (!token) return null;
  if (isTokenExpired(token)) {
    removeStoredToken(key);
    return null;
  }
  return token;
}

function parseTokenPayload(token: string | null): any | null {
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

function parseUserId(payload: any | null): number | null {
  const userId = payload?.sub;
  if (typeof userId === 'number') return userId;
  if (typeof userId === 'string') {
    const parsed = Number(userId);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function getAccessToken(): string | null {
  return readStoredToken(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return readStoredToken(REFRESH_TOKEN_KEY);
}

export function getAuthSnapshot(): AuthSnapshot {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  const payload = parseTokenPayload(accessToken);

  if (accessToken && !payload) {
    removeStoredToken(ACCESS_TOKEN_KEY);
  }

  const safePayload = accessToken && payload ? payload : null;
  return {
    accessToken: accessToken && safePayload ? accessToken : null,
    refreshToken,
    payload: safePayload,
    role: normalizeRole(safePayload?.actAsRole || safePayload?.role || null),
    userId: parseUserId(safePayload),
    isAuthenticated: Boolean(accessToken && safePayload),
  };
}

export function setTokens(tokens: LoginResponse) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getTokenPayload(): any | null {
  return getAuthSnapshot().payload;
}

export function getCurrentUserId(): number | null {
  return getAuthSnapshot().userId;
}

export function normalizeRole(role?: string | null): string | null {
  if (!role) return null;

  const normalized = role.trim().toUpperCase();

  switch (normalized) {
    case 'ADMIN':
    case 'ADMINISTRATOR':
    case 'SYSTEM_ADMIN':
      return 'ADMIN';
    case 'PM':
    case 'MANAGER':
    case 'PROPERTY_MANAGER':
      return 'PM';
    case 'TECH':
    case 'TECHNICIAN':
    case 'WORKER':
      return 'TECH';
    case 'RESIDENT':
    case 'TENANT':
      return 'RESIDENT';
    case 'ACCOUNTANT':
    case 'ACCOUNTING':
      return 'ACCOUNTANT';
    case 'MASTER':
    case 'SUPER_ADMIN':
      return 'MASTER';
    default:
      return normalized;
  }
}

export function hasRoleAccess(allowedRoles: string[], role = getEffectiveRole()): boolean {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;
  if (normalizedRole === 'MASTER') return true;
  return allowedRoles.map((allowedRole) => normalizeRole(allowedRole)).includes(normalizedRole);
}

export function isMasterPendingRoleSelection(): boolean {
  const { payload } = getAuthSnapshot();
  return Boolean(payload?.role === 'MASTER' && !payload?.actAsRole);
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  try {
    let res = await fetch(input, { ...init, headers });
    if (res.status === 401 && isBrowser()) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        const newToken = getAccessToken();
        if (newToken) headers.set('Authorization', `Bearer ${newToken}`);
        res = await fetch(input, { ...init, headers });
      }
      if (res.status === 401) {
        clearTokens();
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?next=${next}`;
      }
    }
    return res;
  } catch (error) {
    // Handle network errors, connection timeouts, etc.
    console.error('Network error in authFetch:', error);
    
    // Create a mock response for connection errors
    const mockResponse = new Response(
      JSON.stringify({ error: 'Connection failed', message: 'Backend server is unavailable' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    return mockResponse;
  }
}

function getFilenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const quotedMatch = disposition.match(/filename=\"([^\"]+)\"/i);
  if (quotedMatch?.[1]) return quotedMatch[1];

  const plainMatch = disposition.match(/filename=([^;]+)/i);
  return plainMatch?.[1]?.trim() ?? null;
}

async function fetchAuthenticatedBlob(path: string, init: RequestInit = {}) {
  const response = await authFetch(path, init);
  if (!response.ok) {
    throw new Error(await response.text());
  }

  return {
    blob: await response.blob(),
    contentType: response.headers.get('Content-Type'),
    filename: getFilenameFromDisposition(response.headers.get('Content-Disposition')),
  };
}

export async function openAuthenticatedFile(path: string, init: RequestInit = {}) {
  if (!isBrowser()) return;

  const popup = window.open('', '_blank', 'noopener,noreferrer');
  try {
    const { blob, contentType } = await fetchAuthenticatedBlob(path, init);
    const objectUrl = URL.createObjectURL(blob);

    if (popup) {
      popup.location.href = objectUrl;
    } else {
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
    }

    const revokeDelay = contentType?.includes('pdf') ? 60_000 : 10_000;
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), revokeDelay);
  } catch (error) {
    popup?.close();
    throw error;
  }
}

export async function downloadAuthenticatedFile(path: string, fallbackFilename: string, init: RequestInit = {}) {
  if (!isBrowser()) return;

  const { blob, filename } = await fetchAuthenticatedBlob(path, init);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename || fallbackFilename;
  anchor.rel = 'noopener noreferrer';
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

export async function refreshTokens(): Promise<boolean> {
  const token = getRefreshToken();
  if (!token) return false;
  let res: Response;
  try {
    res = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    clearTokens();
    return false;
  }
  if (!res.ok) {
    clearTokens();
    return false;
  }
  const data: LoginResponse = await res.json();
  setTokens(data);
  return true;
}

export async function startImpersonation(role: string, tenantId: number, reason?: string) {
  const res = await authFetch('/api/admin/impersonate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, tenantId, reason }),
  });
  if (!res.ok) {
    throw new Error('Impersonation failed');
  }
  const data: LoginResponse = await res.json();
  setTokens(data);
  return data;
}

export async function stopImpersonation() {
  const res = await authFetch('/api/admin/impersonate/stop', { method: 'POST' });
  if (!res.ok) {
    throw new Error('Stop impersonation failed');
  }
  const data: LoginResponse = await res.json();
  setTokens(data);
  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Login failed (${res.status})`);
  }
  const data: LoginResponse = await res.json();
  setTokens(data);
  return data;
}

export function logout() {
  clearTokens();
  if (isBrowser()) {
    window.location.href = '/login';
  }
}

// Role helpers and routing
export const ROLE_SELECTION_ROUTE = '/role-selection';
export const EXTERNAL_SUPERVISION_REPORT_URL = 'https://amit-form.vercel.app';
const LAST_WORKSPACE_CHOICE_KEY = 'ams:last-workspace-choice';

export type WorkspaceChoice = 'ams' | 'supervision' | 'gardens';

type StoredWorkspaceChoice = {
  choice: WorkspaceChoice;
  remember: boolean;
  role: string;
  userId: number | null;
  savedAt: string;
};

export function getEffectiveRole(): string | null {
  return getAuthSnapshot().role;
}

export function isAuthenticated(): boolean {
  return getAuthSnapshot().isAuthenticated;
}

export function getAmsRouteForRole(role?: string | null): string | null {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return null;
  return normalizedRole === 'RESIDENT' ? '/resident/account' : '/home';
}

export function isResidentRole(role?: string | null): boolean {
  return normalizeRole(role) === 'RESIDENT';
}

export function requiresRoleSelection(role?: string | null): boolean {
  const normalizedRole = normalizeRole(role);
  return Boolean(normalizedRole && normalizedRole !== 'RESIDENT');
}

export function getDefaultRoute(role?: string | null): string {
  const effectiveRole = normalizeRole(role) || getEffectiveRole();
  if (isResidentRole(effectiveRole)) return '/resident/account';
  return ROLE_SELECTION_ROUTE;
}

export function getPortalEntryRoute(
  portal: 'resident' | 'worker',
  role?: string | null,
): string {
  const effectiveRole = normalizeRole(role) || getEffectiveRole();

  if (portal === 'resident' && (effectiveRole === 'RESIDENT' || isMasterPendingRoleSelection())) {
    return '/resident/account';
  }

  return getDefaultRoute(effectiveRole);
}

export function getWorkspaceChoiceRoute(choice: WorkspaceChoice, role?: string | null): string | null {
  switch (choice) {
    case 'ams':
      return getAmsRouteForRole(role);
    case 'gardens':
      return '/gardens';
    case 'supervision':
      return EXTERNAL_SUPERVISION_REPORT_URL;
    default:
      return null;
  }
}

function getWorkspaceStorageScope(role?: string | null, userId?: number | null): string {
  const normalizedRole = normalizeRole(role) || 'UNKNOWN';
  const normalizedUserId = typeof userId === 'number' ? userId : 'guest';
  return `${normalizedUserId}:${normalizedRole}`;
}

export function getStoredWorkspaceChoice(role?: string | null, userId?: number | null): StoredWorkspaceChoice | null {
  if (!isBrowser()) return null;

  const rawValue = window.localStorage.getItem(`${LAST_WORKSPACE_CHOICE_KEY}:${getWorkspaceStorageScope(role, userId)}`);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as StoredWorkspaceChoice;
    if (!parsed?.choice || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredWorkspaceChoice(
  choice: WorkspaceChoice,
  options: { role?: string | null; userId?: number | null; remember?: boolean } = {},
) {
  if (!isBrowser()) return;

  const normalizedRole = normalizeRole(options.role) || getEffectiveRole() || 'UNKNOWN';
  const storedValue: StoredWorkspaceChoice = {
    choice,
    remember: Boolean(options.remember),
    role: normalizedRole,
    userId: typeof options.userId === 'number' ? options.userId : getCurrentUserId(),
    savedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    `${LAST_WORKSPACE_CHOICE_KEY}:${getWorkspaceStorageScope(normalizedRole, storedValue.userId)}`,
    JSON.stringify(storedValue),
  );
}

function isTokenExpired(token: string) {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(decodeBase64Url(payload));
    const expiresAt = typeof decoded?.exp === 'number' ? decoded.exp : null;
    return expiresAt !== null && expiresAt <= getUnixTime() + 5;
  } catch {
    return true;
  }
}
