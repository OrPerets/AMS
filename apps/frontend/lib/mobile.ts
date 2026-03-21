export type HapticPattern = 'light' | 'success' | 'warning';

export function isTouchDevice() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(
    window.matchMedia?.('(pointer: coarse)').matches ||
      'ontouchstart' in window ||
      window.navigator.maxTouchPoints > 0,
  );
}

export function triggerHaptic(pattern: HapticPattern = 'light') {
  if (typeof window === 'undefined' || typeof window.navigator === 'undefined') {
    return;
  }

  const vibration =
    pattern === 'success' ? [12, 18, 12] : pattern === 'warning' ? [18, 28, 18] : [10];

  try {
    window.navigator.vibrate?.(vibration);
  } catch {
    // Haptics are optional and should fail silently.
  }
}
