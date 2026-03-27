import { EXTERNAL_SUPERVISION_REPORT_URL, ROLE_SELECTION_ROUTE, type WorkspaceChoice, normalizeRole } from './auth';
import { getRoleCapabilities, type SupportedRole } from './role-capabilities';

export type DestinationReason =
  | 'unauthenticated'
  | 'resident_default'
  | 'role_selection'
  | 'portal_resident'
  | 'portal_worker'
  | 'workspace_ams'
  | 'workspace_gardens'
  | 'workspace_supervision'
  | 'unsupported_role';

export type RouteResolution = {
  destination: string;
  reason: DestinationReason;
  normalizedRole: SupportedRole | null;
  unsupportedRole: boolean;
};

type ResolverInput = {
  isAuthenticated: boolean;
  role?: string | null;
  next?: string | null;
  portal?: 'resident' | 'worker';
};

export function resolvePostLoginRoute(input: ResolverInput): RouteResolution {
  const normalizedRole = normalizeRole(input.role);
  const capabilities = getRoleCapabilities(normalizedRole);

  if (!input.isAuthenticated) {
    return {
      destination: '/login',
      reason: 'unauthenticated',
      normalizedRole: null,
      unsupportedRole: false,
    };
  }

  if (input.next) {
    return {
      destination: input.next,
      reason: 'portal_worker',
      normalizedRole: (capabilities?.role ?? null),
      unsupportedRole: false,
    };
  }

  if (input.portal === 'resident' && (capabilities?.role === 'RESIDENT' || capabilities?.role === 'MASTER')) {
    return {
      destination: '/resident/account',
      reason: 'portal_resident',
      normalizedRole: capabilities.role,
      unsupportedRole: false,
    };
  }

  if (capabilities?.role === 'RESIDENT') {
    return {
      destination: '/resident/account',
      reason: 'resident_default',
      normalizedRole: capabilities.role,
      unsupportedRole: false,
    };
  }

  if (capabilities) {
    return {
      destination: capabilities.defaultRoute,
      reason: 'role_selection',
      normalizedRole: capabilities.role,
      unsupportedRole: false,
    };
  }

  return {
    destination: ROLE_SELECTION_ROUTE,
    reason: 'unsupported_role',
    normalizedRole: null,
    unsupportedRole: true,
  };
}

export function resolveWorkspaceRoute(choice: WorkspaceChoice, role?: string | null): RouteResolution | null {
  const capabilities = getRoleCapabilities(role);

  if (!capabilities) {
    return null;
  }

  if (choice === 'ams') {
    if (!capabilities.canAccessAms) return null;
    return {
      destination: capabilities.role === 'RESIDENT' ? '/resident/account' : '/home',
      reason: 'workspace_ams',
      normalizedRole: capabilities.role,
      unsupportedRole: false,
    };
  }

  if (choice === 'gardens') {
    if (!capabilities.canAccessGardens) return null;
    return {
      destination: '/gardens',
      reason: 'workspace_gardens',
      normalizedRole: capabilities.role,
      unsupportedRole: false,
    };
  }

  return {
    destination: EXTERNAL_SUPERVISION_REPORT_URL,
    reason: 'workspace_supervision',
    normalizedRole: capabilities.role,
    unsupportedRole: false,
  };
}
