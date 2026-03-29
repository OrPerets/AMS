export type RouteTransitionKey = 'tickets' | 'notifications' | 'payments' | 'requests' | 'jobs' | 'settings';

export type RouteTransitionTokens = {
  key: RouteTransitionKey;
  container: string;
  icon: string;
  badge: string;
  title: string;
  header: string;
};

const ROUTE_TRANSITION_PREFIX = 'route-transition';

const ROUTE_TRANSITION_CONTRACT: Record<RouteTransitionKey, RouteTransitionTokens> = {
  tickets: {
    key: 'tickets',
    container: `${ROUTE_TRANSITION_PREFIX}-tickets-container`,
    icon: `${ROUTE_TRANSITION_PREFIX}-tickets-icon`,
    badge: `${ROUTE_TRANSITION_PREFIX}-tickets-badge`,
    title: `${ROUTE_TRANSITION_PREFIX}-tickets-title`,
    header: `${ROUTE_TRANSITION_PREFIX}-tickets-header`,
  },
  notifications: {
    key: 'notifications',
    container: `${ROUTE_TRANSITION_PREFIX}-notifications-container`,
    icon: `${ROUTE_TRANSITION_PREFIX}-notifications-icon`,
    badge: `${ROUTE_TRANSITION_PREFIX}-notifications-badge`,
    title: `${ROUTE_TRANSITION_PREFIX}-notifications-title`,
    header: `${ROUTE_TRANSITION_PREFIX}-notifications-header`,
  },
  payments: {
    key: 'payments',
    container: `${ROUTE_TRANSITION_PREFIX}-payments-container`,
    icon: `${ROUTE_TRANSITION_PREFIX}-payments-icon`,
    badge: `${ROUTE_TRANSITION_PREFIX}-payments-badge`,
    title: `${ROUTE_TRANSITION_PREFIX}-payments-title`,
    header: `${ROUTE_TRANSITION_PREFIX}-payments-header`,
  },
  requests: {
    key: 'requests',
    container: `${ROUTE_TRANSITION_PREFIX}-requests-container`,
    icon: `${ROUTE_TRANSITION_PREFIX}-requests-icon`,
    badge: `${ROUTE_TRANSITION_PREFIX}-requests-badge`,
    title: `${ROUTE_TRANSITION_PREFIX}-requests-title`,
    header: `${ROUTE_TRANSITION_PREFIX}-requests-header`,
  },
  jobs: {
    key: 'jobs',
    container: `${ROUTE_TRANSITION_PREFIX}-jobs-container`,
    icon: `${ROUTE_TRANSITION_PREFIX}-jobs-icon`,
    badge: `${ROUTE_TRANSITION_PREFIX}-jobs-badge`,
    title: `${ROUTE_TRANSITION_PREFIX}-jobs-title`,
    header: `${ROUTE_TRANSITION_PREFIX}-jobs-header`,
  },
  settings: {
    key: 'settings',
    container: `${ROUTE_TRANSITION_PREFIX}-settings-container`,
    icon: `${ROUTE_TRANSITION_PREFIX}-settings-icon`,
    badge: `${ROUTE_TRANSITION_PREFIX}-settings-badge`,
    title: `${ROUTE_TRANSITION_PREFIX}-settings-title`,
    header: `${ROUTE_TRANSITION_PREFIX}-settings-header`,
  },
};

function normalizeHref(href?: string): string {
  if (!href) return '';
  return href.split('?')[0].trim().toLowerCase();
}

export function resolveRouteTransitionTokensByHref(href?: string): RouteTransitionTokens | null {
  const normalizedHref = normalizeHref(href);

  if (normalizedHref.startsWith('/tickets')) return ROUTE_TRANSITION_CONTRACT.tickets;
  if (normalizedHref.startsWith('/notifications') || normalizedHref.startsWith('/communications')) return ROUTE_TRANSITION_CONTRACT.notifications;
  if (normalizedHref.startsWith('/payments')) return ROUTE_TRANSITION_CONTRACT.payments;
  if (normalizedHref.startsWith('/resident/requests')) return ROUTE_TRANSITION_CONTRACT.requests;
  if (normalizedHref.startsWith('/tech/jobs') || normalizedHref.startsWith('/work-orders')) return ROUTE_TRANSITION_CONTRACT.jobs;
  if (normalizedHref.startsWith('/settings')) return ROUTE_TRANSITION_CONTRACT.settings;

  return null;
}

export function getRouteTransitionTokensByKey(key: RouteTransitionKey): RouteTransitionTokens {
  return ROUTE_TRANSITION_CONTRACT[key];
}
