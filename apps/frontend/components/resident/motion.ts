import { MOBILE_MOTION_PRESET } from '../../lib/motion-tokens';

export function residentScreenMotion(reducedMotion: boolean, delay = 0) {
  return {
    initial: reducedMotion ? false : MOBILE_MOTION_PRESET.routeEnter.initial,
    animate: reducedMotion ? undefined : MOBILE_MOTION_PRESET.routeEnter.animate,
    transition: {
      ...MOBILE_MOTION_PRESET.routeEnter.transition,
      delay: reducedMotion ? 0 : delay,
    },
  };
}

export function residentStepMotion(reducedMotion: boolean) {
  return {
    initial: reducedMotion ? false : MOBILE_MOTION_PRESET.stepAdvance.initial,
    animate: reducedMotion ? undefined : MOBILE_MOTION_PRESET.stepAdvance.animate,
    exit: reducedMotion ? undefined : MOBILE_MOTION_PRESET.stepAdvance.exit,
    transition: MOBILE_MOTION_PRESET.stepAdvance.transition,
  };
}

export function residentSuccessMotion(reducedMotion: boolean) {
  return {
    initial: reducedMotion ? false : MOBILE_MOTION_PRESET.successReveal.initial,
    animate: reducedMotion ? undefined : MOBILE_MOTION_PRESET.successReveal.animate,
    exit: reducedMotion ? undefined : MOBILE_MOTION_PRESET.successReveal.exit,
    transition: MOBILE_MOTION_PRESET.successReveal.transition,
  };
}
