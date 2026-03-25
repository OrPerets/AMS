export function residentScreenMotion(reducedMotion: boolean, delay = 0) {
  return {
    initial: reducedMotion ? false : { opacity: 0, y: 12 },
    animate: reducedMotion ? undefined : { opacity: 1, y: 0 },
    transition: { duration: 0.22, delay: reducedMotion ? 0 : delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function residentStepMotion(reducedMotion: boolean) {
  return {
    initial: reducedMotion ? false : { opacity: 0, y: 14 },
    animate: reducedMotion ? undefined : { opacity: 1, y: 0 },
    exit: reducedMotion ? undefined : { opacity: 0, y: -8 },
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function residentSuccessMotion(reducedMotion: boolean) {
  return {
    initial: reducedMotion ? false : { opacity: 0, scale: 0.985, y: 10 },
    animate: reducedMotion ? undefined : { opacity: 1, scale: 1 },
    exit: reducedMotion ? undefined : { opacity: 0 },
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
  };
}
