export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
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
  const token = getAccessToken();
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && isBrowser()) {
    clearTokens();
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
  }
  return res;
}

export async function startImpersonation(role: string, tenantId: number, reason?: string) {
  const res = await authFetch('/admin/impersonate', {
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
  const res = await authFetch('/admin/impersonate/stop', { method: 'POST' });
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


