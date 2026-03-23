import { useEffect, useState } from 'react';

export function useAnimatedNumber(value: number, duration = 400) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const initial = displayValue;
    const delta = value - initial;

    if (delta === 0) return;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(initial + delta * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, value]);

  return displayValue;
}
