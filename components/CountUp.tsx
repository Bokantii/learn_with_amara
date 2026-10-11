'use client';

import { useEffect, useRef, useState } from 'react';
import {
  animate,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from 'motion/react';

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
  /** Wait until the number scrolls into view before counting. */
  startOnView?: boolean;
}

export function CountUp({
  end,
  duration = 1.8,
  suffix = '',
  className,
  startOnView = false,
}: CountUpProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const shouldStart = !startOnView || isInView;
  const motionValue = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useMotionValueEvent(motionValue, 'change', (latest) => {
    setDisplayValue(Math.round(latest));
  });

  useEffect(() => {
    if (shouldReduceMotion) {
      motionValue.set(end);
      return;
    }
    if (!shouldStart) return;

    const controls = animate(motionValue, end, {
      duration,
      ease: 'easeOut',
    });

    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, duration, shouldReduceMotion, shouldStart]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
      {suffix}
    </span>
  );
}
