import type { AppRole } from '@/shared/domain/roles';
import { getAuthSnapshot, type AuthSnapshot } from './auth';
import { isFeatureEnabled, type FeatureFlag } from './feature-flags';

function normalizeRole(role?: string | null): AppRole | null {
  if (!role) return null;
  const upper = role.toUpperCase();
  if (upper === 'PM' || upper === 'ADMIN' || upper === 'TECH' || upper === 'RESIDENT' || upper === 'MASTER' || upper === 'ACCOUNTANT') {
    return upper;
  }
  return null;
}

export function isMobileInteractionFeatureEnabled(flag: FeatureFlag, snapshot?: AuthSnapshot | null): boolean {
  const authSnapshot = snapshot ?? getAuthSnapshot();
  if (!authSnapshot?.isAuthenticated) return false;
  return isFeatureEnabled(flag, {
    role: normalizeRole(authSnapshot.role),
    userId: authSnapshot.userId,
  });
}

