"use client";

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { MOTION_DURATION, MOTION_EASE } from '../../lib/motion-tokens';
import { isMobileInteractionFeatureEnabled } from '../../lib/mobile-interaction-flags';

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
}

const PARTICLE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(48, 96%, 53%)',
  'hsl(280, 87%, 65%)',
  'hsl(var(--accent))',
  'hsl(199, 89%, 48%)',
];

const PARTICLE_COUNT = 18;
const BURST_DURATION = MOTION_DURATION.confettiBurst;

function generateParticles(): ConfettiParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const distance = 30 + Math.random() * 60;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 20,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.7,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      delay: Math.random() * 0.08,
    };
  });
}

interface ConfettiLiteProps {
  trigger: boolean;
  className?: string;
  onComplete?: () => void;
}

export function ConfettiLite({ trigger, className, onComplete }: ConfettiLiteProps) {
  const reducedMotion = useReducedMotion();
  const featureEnabled = isMobileInteractionFeatureEnabled('mobile-wow-confetti-lite');
  const [particles, setParticles] = React.useState<ConfettiParticle[]>([]);
  const [isActive, setIsActive] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (trigger && featureEnabled && !reducedMotion) {
      setParticles(generateParticles());
      setIsActive(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsActive(false);
        setParticles([]);
        onComplete?.();
      }, BURST_DURATION * 1000 + 50);
    }
  }, [trigger, featureEnabled, reducedMotion, onComplete]);

  React.useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (!featureEnabled || reducedMotion) return null;

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-50 overflow-hidden', className)}
      aria-hidden
    >
      <AnimatePresence>
        {isActive &&
          particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute left-1/2 top-1/2"
              initial={{
                x: 0,
                y: 0,
                opacity: 1,
                scale: 0,
                rotate: 0,
              }}
              animate={{
                x: particle.x,
                y: particle.y,
                opacity: [1, 1, 0],
                scale: [0, particle.scale * 1.2, particle.scale * 0.3],
                rotate: particle.rotation,
              }}
              transition={{
                duration: BURST_DURATION,
                delay: particle.delay,
                ease: MOTION_EASE.standardOut,
              }}
              style={{
                width: 6,
                height: 6,
                borderRadius: particle.id % 3 === 0 ? '50%' : particle.id % 3 === 1 ? '2px' : '1px',
                backgroundColor: particle.color,
              }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}

export function useConfettiLite() {
  const [shouldFire, setShouldFire] = React.useState(false);

  const fire = React.useCallback(() => {
    setShouldFire(true);
  }, []);

  const reset = React.useCallback(() => {
    setShouldFire(false);
  }, []);

  return { shouldFire, fire, reset };
}
