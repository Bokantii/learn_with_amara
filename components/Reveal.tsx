'use client';

import type { ReactNode } from 'react';
import { MotionConfig, motion, type Variants } from 'motion/react';

// Scroll-triggered entrance wrappers for public marketing pages. Client-only
// wrappers so server pages can pass server-rendered children straight through.
// MotionConfig reducedMotion="user" drops transforms (keeps a short fade) for
// visitors with prefers-reduced-motion, without a server/client markup mismatch.

type Direction = 'up' | 'left' | 'right' | 'none';
type Tag = 'div' | 'section' | 'li';

const EASE = [0.22, 1, 0.36, 1] as const;
const DISTANCE = 24;
const VIEWPORT = { once: true, amount: 0.2 } as const;

const motionTags = { div: motion.div, section: motion.section, li: motion.li };

function hiddenFor(direction: Direction) {
  switch (direction) {
    case 'left':
      return { opacity: 0, x: -DISTANCE };
    case 'right':
      return { opacity: 0, x: DISTANCE };
    case 'none':
      return { opacity: 0 };
    default:
      return { opacity: 0, y: DISTANCE };
  }
}

function itemVariants(direction: Direction, delay = 0): Variants {
  return {
    hidden: hiddenFor(direction),
    visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0.6, ease: EASE, delay } },
  };
}

interface RevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  as?: Tag;
}

export function Reveal({ children, direction = 'up', delay, className, as = 'div' }: RevealProps) {
  const Component = motionTags[as];
  return (
    <MotionConfig reducedMotion="user">
      <Component
        className={className}
        variants={itemVariants(direction, delay)}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
      >
        {children}
      </Component>
    </MotionConfig>
  );
}

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: Tag;
}

/** Parent that staggers its RevealItem children as the group scrolls into view. */
export function RevealGroup({ children, className, stagger = 0.1, as = 'div' }: RevealGroupProps) {
  const Component = motionTags[as];
  return (
    <MotionConfig reducedMotion="user">
      <Component
        className={className}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger } } }}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
      >
        {children}
      </Component>
    </MotionConfig>
  );
}

interface RevealItemProps {
  children: ReactNode;
  direction?: Direction;
  className?: string;
  as?: Tag;
}

/** Child of RevealGroup; inherits the group's hidden/visible state. */
export function RevealItem({ children, direction = 'up', className, as = 'div' }: RevealItemProps) {
  const Component = motionTags[as];
  return (
    <Component className={className} variants={itemVariants(direction)}>
      {children}
    </Component>
  );
}
