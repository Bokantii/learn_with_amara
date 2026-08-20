'use client';

import { useEffect, useState } from 'react';
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react';

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export function CountUp({ end, duration = 1.8, suffix = '', className }: CountUpProps) {
  const shouldReduceMotion = useReducedMotion();
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

    const controls = animate(motionValue, end, {
      duration,
      ease: 'easeOut',
    });

    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, duration, shouldReduceMotion]);

  return (
    <span className={className}>
      {displayValue}
      {suffix}
    </span>
  );
}
