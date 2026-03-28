export type UIInteractionEventName =
  | 'swipe_started'
  | 'swipe_threshold_reached'
  | 'swipe_committed'
  | 'swipe_undone'
  | 'swipe_cancelled';

export type UIInteractionEvent = {
  name: UIInteractionEventName;
  timestamp: number;
  payload: Record<string, string | number | boolean | null | undefined>;
};

type InteractionListener = (event: UIInteractionEvent) => void;

const listeners = new Set<InteractionListener>();

export function subscribeUIInteraction(listener: InteractionListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitUIInteraction(
  name: UIInteractionEventName,
  payload: Record<string, string | number | boolean | null | undefined> = {},
) {
  const event: UIInteractionEvent = {
    name,
    timestamp: Date.now(),
    payload,
  };

  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // Keep event fan-out resilient to listener-level failures.
    }
  });

  return event;
}
