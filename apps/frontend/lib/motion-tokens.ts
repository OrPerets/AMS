export const MOTION_EASE = {
  emphasized: [0.16, 1, 0.3, 1] as const,
  emphasizedExit: [0.7, 0, 0.84, 0] as const,
  standardOut: 'easeOut' as const,
  standardInOut: 'easeInOut' as const,
} as const;

export const MOTION_DURATION = {
  instant: 0.18,
  fast: 0.22,
  moderate: 0.28,
  standard: 0.34,
  deliberate: 0.38,
  pulse: 0.9,
  accentPulse: 1.2,
} as const;

export const MOTION_DISTANCE = {
  xxs: 3,
  xs: 14,
  sm: 16,
  md: 18,
  drawerHiddenY: '100%' as const,
  routeIndicatorStartScaleX: 0.08,
  routeIndicatorMidScaleX: 0.92,
  drawerEnterScale: 1,
  drawerExitScale: 0.985,
  drawerInitialScale: 0.97,
} as const;

export const MOTION_STAGGER = {
  quick: 0.04,
  standard: 0.06,
} as const;

export const MOTION_SPRING = {
  card: { type: 'spring' as const, stiffness: 320, damping: 26 },
  cardTight: { type: 'spring' as const, stiffness: 320, damping: 24 },
  layout: { type: 'spring' as const, stiffness: 320, damping: 30 },
} as const;


export const INTERACTION_THRESHOLDS = {
  swipeReveal: 34,
  swipeCommit: 88,
  swipeMaxDistance: 124,
  swipeCollapseDuration: 0.22,
  swipeFlashDuration: 0.18,
  undoWindowMs: 8000,
} as const;

export const MOBILE_MOTION_PRESET = {
  routeEnter: {
    initial: { opacity: 0, y: MOTION_DISTANCE.sm, scale: 0.992 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: MOTION_DURATION.standard, ease: MOTION_EASE.emphasized },
  },
  sectionEnter: {
    initial: { opacity: 0, y: MOTION_DISTANCE.xs },
    animate: { opacity: 1, y: 0 },
    transition: { duration: MOTION_DURATION.moderate, ease: MOTION_EASE.emphasized },
  },
  stepAdvance: {
    initial: { opacity: 0, x: MOTION_DISTANCE.md, y: MOTION_DISTANCE.xxs },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: -MOTION_DISTANCE.xs, y: -MOTION_DISTANCE.xxs },
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.emphasized },
  },
  successReveal: {
    initial: { opacity: 0, scale: 0.982, y: MOTION_DISTANCE.sm },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: MOTION_DURATION.moderate, ease: MOTION_EASE.emphasized },
  },
  liveBadge: {
    animate: { scale: [1, 1.05, 1], opacity: [1, 0.9, 1] },
    transition: { duration: MOTION_DURATION.pulse, ease: MOTION_EASE.standardInOut },
  },
} as const;
