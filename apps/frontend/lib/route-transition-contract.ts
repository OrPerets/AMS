export type RouteTransitionKey = 'tickets' | 'notifications' | 'payments';

export type RouteTransitionTokens = {
  key: RouteTransitionKey;
  icon: string;
  badge: string;
  title: string;
};

const ROUTE_TRANSITION_PREFIX = 'route-transition';

const ROUTE_TRANSITION_CONTRACT: Record<RouteTransitionKey, RouteTransitionTokens> = {
  tickets: {
    key: 'tickets',
    icon: `${ROUTE_TRANSITION_PREFIX}-tickets-icon`,
    badge: `${ROUTE_TRANSITION_PREFIX}-tickets-badge`,
    title: `${ROUTE_TRANSITION_PREFIX}-tickets-title`,
  },
  notifications: {
    key: 'notifications',
    icon: `${ROUTE_TRANSITION_PREFIX}-notifications-icon`,
    badge: `${ROUTE_TRANSITION_PREFIX}-notifications-badge`,
    title: `${ROUTE_TRANSITION_PREFIX}-notifications-title`,
  },
  payments: {
    key: 'payments',
    icon: `${ROUTE_TRANSITION_PREFIX}-payments-icon`,
    badge: `${ROUTE_TRANSITION_PREFIX}-payments-badge`,
    title: `${ROUTE_TRANSITION_PREFIX}-payments-title`,
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

  return null;
}

export function getRouteTransitionTokensByKey(key: RouteTransitionKey): RouteTransitionTokens {
  return ROUTE_TRANSITION_CONTRACT[key];
}
