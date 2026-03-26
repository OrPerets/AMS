import { normalizeRole } from './auth';

export const SUPPORTED_ROLES = ['RESIDENT', 'PM', 'ADMIN', 'TECH', 'ACCOUNTANT', 'MASTER'] as const;
export type SupportedRole = (typeof SUPPORTED_ROLES)[number];

export type RoleCapabilities = {
  role: SupportedRole;
  canAccessAms: boolean;
  canAccessGardens: boolean;
  needsRoleSelection: boolean;
  defaultRoute: string;
};

const ROLE_CAPABILITIES_MAP: Record<SupportedRole, RoleCapabilities> = {
  RESIDENT: {
    role: 'RESIDENT',
    canAccessAms: false,
    canAccessGardens: false,
    needsRoleSelection: false,
    defaultRoute: '/resident/account',
  },
  PM: {
    role: 'PM',
    canAccessAms: true,
    canAccessGardens: true,
    needsRoleSelection: true,
    defaultRoute: '/role-selection',
  },
  ADMIN: {
    role: 'ADMIN',
    canAccessAms: true,
    canAccessGardens: true,
    needsRoleSelection: true,
    defaultRoute: '/role-selection',
  },
  TECH: {
    role: 'TECH',
    canAccessAms: true,
    canAccessGardens: true,
    needsRoleSelection: true,
    defaultRoute: '/role-selection',
  },
  ACCOUNTANT: {
    role: 'ACCOUNTANT',
    canAccessAms: true,
    canAccessGardens: false,
    needsRoleSelection: true,
    defaultRoute: '/role-selection',
  },
  MASTER: {
    role: 'MASTER',
    canAccessAms: true,
    canAccessGardens: true,
    needsRoleSelection: true,
    defaultRoute: '/role-selection',
  },
};

export function getRoleCapabilities(role?: string | null): RoleCapabilities | null {
  const normalizedRole = normalizeRole(role) as SupportedRole | null;
  if (!normalizedRole || !(normalizedRole in ROLE_CAPABILITIES_MAP)) {
    return null;
  }

  return ROLE_CAPABILITIES_MAP[normalizedRole];
}

export function isSupportedRole(role?: string | null): role is SupportedRole {
  return Boolean(getRoleCapabilities(role));
}
