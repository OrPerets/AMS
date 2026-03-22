import type { NextApiRequest } from 'next';

const GARDENS_ALLOWED_ROLES = ['ADMIN', 'MASTER', 'PM', 'TECH'] as const;

type AllowedRole = (typeof GARDENS_ALLOWED_ROLES)[number];

type TokenPayload = {
  exp?: number;
  role?: string;
  actAsRole?: string;
  email?: string;
  sub?: string | number;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function getTokenPayload(token: string): TokenPayload | null {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

export function getBearerToken(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export function readGardensUser(req: NextApiRequest): { role: AllowedRole; email?: string } | null {
  const token = getBearerToken(req);
  if (!token) return null;
  const payload = getTokenPayload(token);
  if (!payload) return null;
  if (typeof payload.exp === 'number' && payload.exp <= Math.floor(Date.now() / 1000) + 5) {
    return null;
  }

  const effectiveRole = payload.actAsRole || payload.role;
  if (!effectiveRole || !GARDENS_ALLOWED_ROLES.includes(effectiveRole as AllowedRole)) {
    return null;
  }

  return {
    role: effectiveRole as AllowedRole,
    email: payload.email,
  };
}

export function canAccessGardens(role?: string | null): boolean {
  return Boolean(role && GARDENS_ALLOWED_ROLES.includes(role as AllowedRole));
}

export function getGardensAllowedRoles(): readonly AllowedRole[] {
  return GARDENS_ALLOWED_ROLES;
}
