export function residentScreenMotion(reducedMotion: boolean, delay = 0) {
  return {
    initial: reducedMotion ? false : { opacity: 0, y: 16, scale: 0.99 },
    animate: reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.26, delay: reducedMotion ? 0 : delay, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function residentStepMotion(reducedMotion: boolean) {
  return {
    initial: reducedMotion ? false : { opacity: 0, x: 18, y: 8 },
    animate: reducedMotion ? undefined : { opacity: 1, x: 0, y: 0 },
    exit: reducedMotion ? undefined : { opacity: 0, x: -14, y: -4 },
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function residentSuccessMotion(reducedMotion: boolean) {
  return {
    initial: reducedMotion ? false : { opacity: 0, scale: 0.97, y: 18 },
    animate: reducedMotion ? undefined : { opacity: 1, scale: 1 },
    exit: reducedMotion ? undefined : { opacity: 0 },
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const },
  };
}
