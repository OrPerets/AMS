import { motion, useReducedMotion } from 'framer-motion';
import { DispatchWorkspace } from '../components/tickets/dispatch/DispatchWorkspace';
import { MOTION_DISTANCE, MOTION_DURATION, MOTION_EASE } from '../lib/motion-tokens';

export default function TicketsPage() {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0.98, y: MOTION_DISTANCE.xxs }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION.instant, ease: MOTION_EASE.emphasized }}
    >
      <DispatchWorkspace />
    </motion.div>
  );
}
