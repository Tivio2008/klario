'use client';

import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 2000, startOnMount = false) {
  const [count, setCount] = useState(startOnMount ? 0 : target);
  const [started, setStarted] = useState(startOnMount);
  const rafRef = useRef<number | null>(null);

  function start() {
    setStarted(true);
  }

  useEffect(() => {
    if (!started) return;

    const startTime = performance.now();
    const startValue = 0;

    function easeOut(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function frame(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      setCount(Math.round(startValue + (target - startValue) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame);
      }
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [started, target, duration]);

  return { count, start };
}
