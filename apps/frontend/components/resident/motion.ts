export function residentScreenMotion(reducedMotion: boolean, delay = 0) {
  return {
    initial: reducedMotion ? false : { opacity: 0, y: 18 },
    animate: reducedMotion ? undefined : { opacity: 1, y: 0 },
    transition: { duration: 0.32, delay: reducedMotion ? 0 : delay, ease: 'easeOut' as const },
  };
}

export function residentStepMotion(reducedMotion: boolean) {
  return {
    initial: reducedMotion ? false : { opacity: 0, y: 16 },
    animate: reducedMotion ? undefined : { opacity: 1, y: 0 },
    exit: reducedMotion ? undefined : { opacity: 0, y: -10 },
    transition: { duration: 0.22, ease: 'easeOut' as const },
  };
}

export function residentSuccessMotion(reducedMotion: boolean) {
  return {
    initial: reducedMotion ? false : { opacity: 0, scale: 0.96 },
    animate: reducedMotion ? undefined : { opacity: 1, scale: 1 },
    exit: reducedMotion ? undefined : { opacity: 0 },
    transition: { duration: 0.22, ease: 'easeOut' as const },
  };
}
