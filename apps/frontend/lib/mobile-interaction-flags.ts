import type { AppRole } from '@/shared/domain/roles';
import { getAuthSnapshot, type AuthSnapshot } from './auth';
import { isFeatureEnabled, type FeatureFlag } from './feature-flags';

export type MobileSurfaceClass = 'resident' | 'ops-shell' | 'field';

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

export function getMobileSurfaceInteractionState(surface: MobileSurfaceClass, snapshot?: AuthSnapshot | null) {
  const authSnapshot = snapshot ?? getAuthSnapshot();
  const canMorph = isMobileInteractionFeatureEnabled('mobile-interactions-card-morph', authSnapshot);
  const canPeekDrawers = isMobileInteractionFeatureEnabled('mobile-interactions-peek-drawers', authSnapshot);
  const canSwipeUndo = isMobileInteractionFeatureEnabled('mobile-interactions-swipe-undo', authSnapshot);
  const canElasticRefresh = isMobileInteractionFeatureEnabled('mobile-interactions-elastic-refresh', authSnapshot);
  const canLiveChoreograph = isMobileInteractionFeatureEnabled('mobile-interactions-live-choreography', authSnapshot);

  if (surface === 'field') {
    return {
      morph: canMorph,
      drawers: canPeekDrawers,
      swipeUndo: canSwipeUndo,
      elasticRefresh: false,
      liveChoreography: canLiveChoreograph,
    };
  }

  return {
    morph: canMorph,
    drawers: canPeekDrawers,
    swipeUndo: canSwipeUndo,
    elasticRefresh: canElasticRefresh,
    liveChoreography: canLiveChoreograph,
  };
}
