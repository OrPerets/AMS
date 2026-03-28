import type { AppRole } from '@/shared/domain/roles';

export type FeatureFlag =
  | 'ux-v2-pm-home'
  | 'ux-v2-admin-home'
  | 'ux-v2-tech-home'
  | 'ux-v2-resident-home'
  | 'ux-v2-navigation'
  | 'ux-v2-tickets'
  | 'ux-v2-maintenance'
  | 'ux-v2-finance'
  | 'ux-v2-gardens'
  | 'mobile-interactions-card-morph'
  | 'mobile-interactions-peek-drawers'
  | 'mobile-interactions-swipe-undo'
  | 'mobile-interactions-elastic-refresh'
  | 'mobile-interactions-live-choreography'
  | 'perf-budgets-enforced'
  | 'a11y-gates-enforced';

export type RolloutStage = 'disabled' | 'internal' | 'canary' | 'percentage' | 'full';

export interface FlagConfig {
  flag: FeatureFlag;
  stage: RolloutStage;
  percentage: number;
  allowedRoles: AppRole[];
  description: string;
}

const FLAG_REGISTRY: FlagConfig[] = [
  {
    flag: 'ux-v2-pm-home',
    stage: 'full',
    percentage: 100,
    allowedRoles: ['PM', 'MASTER'],
    description: 'V2 PM home shell with action-first layout',
  },
  {
    flag: 'ux-v2-admin-home',
    stage: 'full',
    percentage: 100,
    allowedRoles: ['ADMIN', 'MASTER'],
    description: 'V2 Admin home shell with system health dashboard',
  },
  {
    flag: 'ux-v2-tech-home',
    stage: 'full',
    percentage: 100,
    allowedRoles: ['TECH'],
    description: 'V2 Tech home shell with assignment focus',
  },
  {
    flag: 'ux-v2-resident-home',
    stage: 'full',
    percentage: 100,
    allowedRoles: ['RESIDENT'],
    description: 'V2 Resident account with action cards',
  },
  {
    flag: 'ux-v2-navigation',
    stage: 'full',
    percentage: 100,
    allowedRoles: ['PM', 'ADMIN', 'TECH', 'RESIDENT', 'MASTER', 'ACCOUNTANT'],
    description: 'Unified mobile navigation with role-specific tabs',
  },
  {
    flag: 'ux-v2-tickets',
    stage: 'full',
    percentage: 100,
    allowedRoles: ['PM', 'ADMIN', 'TECH', 'MASTER'],
    description: 'V2 tickets queue with triage workflow',
  },
  {
    flag: 'ux-v2-maintenance',
    stage: 'full',
    percentage: 100,
    allowedRoles: ['PM', 'ADMIN', 'TECH', 'MASTER'],
    description: 'V2 maintenance dashboard with cost projections',
  },
  {
    flag: 'ux-v2-finance',
    stage: 'full',
    percentage: 100,
    allowedRoles: ['PM', 'ADMIN', 'ACCOUNTANT', 'MASTER'],
    description: 'V2 finance reports with collections summary',
  },
  {
    flag: 'ux-v2-gardens',
    stage: 'full',
    percentage: 100,
    allowedRoles: ['PM', 'ADMIN', 'TECH', 'MASTER'],
    description: 'V2 gardens module with worker dashboard',
  },
  {
    flag: 'mobile-interactions-card-morph',
    stage: 'internal',
    percentage: 100,
    allowedRoles: ['PM', 'ADMIN', 'TECH', 'RESIDENT', 'MASTER', 'ACCOUNTANT'],
    description: 'Card-to-screen morph transition family for mobile routes',
  },
  {
    flag: 'mobile-interactions-peek-drawers',
    stage: 'internal',
    percentage: 100,
    allowedRoles: ['PM', 'ADMIN', 'TECH', 'RESIDENT', 'MASTER', 'ACCOUNTANT'],
    description: 'Peek/snap motion behavior for mobile drawers and sheets',
  },
  {
    flag: 'mobile-interactions-swipe-undo',
    stage: 'internal',
    percentage: 100,
    allowedRoles: ['PM', 'ADMIN', 'TECH', 'RESIDENT', 'MASTER', 'ACCOUNTANT'],
    description: 'Swipe commit, collapse, and undo behavior family on mobile rows',
  },
  {
    flag: 'mobile-interactions-elastic-refresh',
    stage: 'internal',
    percentage: 100,
    allowedRoles: ['PM', 'ADMIN', 'TECH', 'RESIDENT', 'MASTER', 'ACCOUNTANT'],
    description: 'Elastic pull-to-refresh canopy interactions',
  },
  {
    flag: 'mobile-interactions-live-choreography',
    stage: 'internal',
    percentage: 100,
    allowedRoles: ['PM', 'ADMIN', 'TECH', 'RESIDENT', 'MASTER', 'ACCOUNTANT'],
    description: 'Coordinated live-update choreography across mobile surfaces',
  },
  {
    flag: 'perf-budgets-enforced',
    stage: 'full',
    percentage: 100,
    allowedRoles: ['PM', 'ADMIN', 'TECH', 'RESIDENT', 'MASTER', 'ACCOUNTANT'],
    description: 'Enforce performance budgets in CI',
  },
  {
    flag: 'a11y-gates-enforced',
    stage: 'full',
    percentage: 100,
    allowedRoles: ['PM', 'ADMIN', 'TECH', 'RESIDENT', 'MASTER', 'ACCOUNTANT'],
    description: 'Enforce accessibility gates in CI',
  },
];

function hashUserId(userId: number, flag: string): number {
  const combined = `${userId}-${flag}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 100;
}

export function getFlagConfig(flag: FeatureFlag): FlagConfig | undefined {
  return FLAG_REGISTRY.find((f) => f.flag === flag);
}

export function isFeatureEnabled(
  flag: FeatureFlag,
  context: { role?: AppRole | null; userId?: number | null },
): boolean {
  const config = getFlagConfig(flag);
  if (!config) return false;

  if (config.stage === 'disabled') return false;
  if (config.stage === 'full') return true;

  if (context.role && !config.allowedRoles.includes(context.role)) {
    return false;
  }

  if (config.stage === 'internal') {
    return context.userId != null && context.userId <= 10;
  }

  if (config.stage === 'canary') {
    return context.userId != null && context.userId <= 5;
  }

  if (config.stage === 'percentage' && context.userId != null) {
    return hashUserId(context.userId, flag) < config.percentage;
  }

  return false;
}

export function getAllFlags(): FlagConfig[] {
  return [...FLAG_REGISTRY];
}

export function getFlagsForRole(role: AppRole): FlagConfig[] {
  return FLAG_REGISTRY.filter((f) => f.allowedRoles.includes(role));
}

export function getRolloutSummary(): Record<RolloutStage, number> {
  const summary: Record<RolloutStage, number> = {
    disabled: 0,
    internal: 0,
    canary: 0,
    percentage: 0,
    full: 0,
  };
  for (const config of FLAG_REGISTRY) {
    summary[config.stage]++;
  }
  return summary;
}
