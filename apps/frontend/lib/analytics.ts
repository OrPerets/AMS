type AnalyticsEventName =
  | 'landing_cta_click'
  | 'login_success'
  | 'login_failed'
  | 'role_selection_view'
  | 'role_selection_choice'
  | 'role_selection_resume'
  | 'role_selection_abandon'
  | 'workspace_enter_ams'
  | 'workspace_enter_supervision'
  | 'workspace_enter_gardens'
  | 'unsupported_role_state'
  | 'last_used_shortcut'
  | 'remember_choice_toggle'
  | 'quick_action_click'
  | 'home_top_card_impression'
  | 'home_first_action_click'
  | 'resume_click'
  | 'empty_state_cta_click'
  | 'success_next_step_click'
  | 'onboarding_complete'
  | 'onboarding_dismiss'
  | 'page_view'
  | 'navigation_misclick_loop'
  | 'navigation_backtrack_churn'
  | 'navigation_dedupe_suppressed'
  | 'interaction_started'
  | 'interaction_threshold_reached'
  | 'interaction_committed'
  | 'interaction_undone'
  | 'interaction_cancelled'
  | 'live_event_received'
  | 'live_event_reaction_rendered'
  | 'live_event_navigation_follow';

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

type AnalyticsHandler = (event: AnalyticsEventName, payload: AnalyticsPayload) => void;

const handlers: AnalyticsHandler[] = [];

const eventLog: Array<{ event: AnalyticsEventName; payload: AnalyticsPayload; timestamp: number }> = [];
const MAX_LOG_SIZE = 200;

export function registerAnalyticsHandler(handler: AnalyticsHandler) {
  handlers.push(handler);
  return () => {
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
  };
}

export function trackEvent(event: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  const entry = { event, payload, timestamp: Date.now() };

  eventLog.push(entry);
  if (eventLog.length > MAX_LOG_SIZE) {
    eventLog.splice(0, eventLog.length - MAX_LOG_SIZE);
  }

  for (const handler of handlers) {
    try {
      handler(event, payload);
    } catch {
      // silently ignore handler errors
    }
  }

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event, payload);
  }
}

export function getEventLog() {
  return [...eventLog];
}

export function trackPageView(path: string, role?: string | null) {
  trackEvent('page_view', { path, role: role ?? undefined });
}

export function trackLandingCtaClick() {
  trackEvent('landing_cta_click');
}

export function trackLoginSuccess(role?: string | null) {
  trackEvent('login_success', { role: role ?? undefined });
}

export function trackLoginFailed(reason?: string) {
  trackEvent('login_failed', { reason: reason ?? undefined });
}

export function trackRoleSelectionView(role?: string | null) {
  trackEvent('role_selection_view', { role: role ?? undefined });
}

export function trackRoleSelectionChoice(choice: string, role?: string | null) {
  trackEvent('role_selection_choice', { choice, role: role ?? undefined });
}

export function trackRoleSelectionResume(choice: string) {
  trackEvent('role_selection_resume', { choice });
}

export function trackRoleSelectionAbandon(role?: string | null) {
  trackEvent('role_selection_abandon', { role: role ?? undefined });
}

export function trackWorkspaceEnter(workspace: 'ams' | 'supervision' | 'gardens', role?: string | null) {
  const eventMap = {
    ams: 'workspace_enter_ams',
    supervision: 'workspace_enter_supervision',
    gardens: 'workspace_enter_gardens',
  } as const;
  trackEvent(eventMap[workspace], { role: role ?? undefined });
}

export function trackLastUsedShortcut(destination: string) {
  trackEvent('last_used_shortcut', { destination });
}

export function trackRememberChoiceToggle(enabled: boolean) {
  trackEvent('remember_choice_toggle', { enabled });
}

export function trackQuickActionClick(actionId: string, screen: string, role?: string | null) {
  trackEvent('quick_action_click', { actionId, screen, role: role ?? undefined });
}

export function trackHomeTopCardImpression(role: string, actionId: string) {
  trackEvent('home_top_card_impression', { role, actionId, screen: 'home' });
}

export function trackHomeFirstActionClick(role: string, actionId: string, destination?: string) {
  trackEvent('home_first_action_click', { role, actionId, destination: destination ?? undefined, screen: 'home' });
}

export function trackResumeClick(screen: string, destination: string) {
  trackEvent('resume_click', { screen, destination });
}

export function trackEmptyStateCta(screen: string, action: string) {
  trackEvent('empty_state_cta_click', { screen, action });
}

export function trackSuccessNextStep(screen: string, action: string) {
  trackEvent('success_next_step_click', { screen, action });
}

export function trackUnsupportedRoleState(role?: string | null) {
  trackEvent('unsupported_role_state', { role: role ?? undefined });
}

export function trackNavigationMisclickLoop(role: string, from: string, to: string, elapsedMs: number) {
  trackEvent('navigation_misclick_loop', {
    role,
    from,
    to,
    elapsedMs: Math.max(0, Math.round(elapsedMs)),
  });
}

export function trackNavigationBacktrackChurn(role: string, routeA: string, routeB: string, switches: number, windowMs: number) {
  trackEvent('navigation_backtrack_churn', {
    role,
    routeA,
    routeB,
    switches: Math.max(0, Math.round(switches)),
    windowMs: Math.max(0, Math.round(windowMs)),
  });
}

export function trackNavigationDedupeSuppressed(role: string, section: string, href: string) {
  trackEvent('navigation_dedupe_suppressed', {
    role,
    section,
    href,
  });
}


type InteractionLifecycleEvent =
  | 'interaction_started'
  | 'interaction_threshold_reached'
  | 'interaction_committed'
  | 'interaction_undone'
  | 'interaction_cancelled';

export function trackInteractionLifecycle(
  event: InteractionLifecycleEvent,
  context: {
    role?: string | null;
    pathname: string;
    sourceSurface: string;
    destinationSurface?: string | null;
    interactionType: string;
    interactionId?: string;
    tone?: string;
    cancelledAfterThreshold?: boolean;
  },
) {
  trackEvent(event, {
    role: context.role ?? undefined,
    pathname: context.pathname,
    sourceSurface: context.sourceSurface,
    destinationSurface: context.destinationSurface ?? undefined,
    interactionType: context.interactionType,
    interactionId: context.interactionId ?? undefined,
    tone: context.tone ?? undefined,
    cancelledAfterThreshold: context.cancelledAfterThreshold ?? undefined,
  });
}

export function trackLiveEventReceived(context: {
  eventType: string;
  sourceSurface: string;
  destinationSurface?: string | null;
  urgency?: string;
  role?: string | null;
}) {
  trackEvent('live_event_received', {
    eventType: context.eventType,
    sourceSurface: context.sourceSurface,
    destinationSurface: context.destinationSurface ?? undefined,
    urgency: context.urgency ?? undefined,
    role: context.role ?? undefined,
  });
}

export function trackLiveEventReactionRendered(context: {
  eventType: string;
  surface: string;
  reactionLatencyMs: number;
  destinationSurface?: string | null;
}) {
  trackEvent('live_event_reaction_rendered', {
    eventType: context.eventType,
    surface: context.surface,
    destinationSurface: context.destinationSurface ?? undefined,
    reactionLatencyMs: Math.max(0, Math.round(context.reactionLatencyMs)),
  });
}

export function trackLiveEventNavigationFollow(context: {
  eventType: string;
  sourceSurface: string;
  destinationSurface: string;
  elapsedMs: number;
}) {
  trackEvent('live_event_navigation_follow', {
    eventType: context.eventType,
    sourceSurface: context.sourceSurface,
    destinationSurface: context.destinationSurface,
    elapsedMs: Math.max(0, Math.round(context.elapsedMs)),
  });
}
