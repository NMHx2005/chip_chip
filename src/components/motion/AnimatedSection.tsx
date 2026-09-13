// src/components/motion/AnimatedSection.tsx
"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  DURATION,
  EASE_STANDARD,
  VIEWPORT_ONCE,
} from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

/**
 * Section wrapper that fades and lifts into place the first time it is
 * scrolled to.
 *
 * `once: true` matters: a section that re-animates every time it scrolls back
 * into view reads as a gimmick rather than as polish.
 */
export function AnimatedSection({
  children,
  className,
  id,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Seconds to wait before starting — for staggering sibling sections. */
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <section id={id} className={cn("relative", className)}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{ duration: DURATION.slow, ease: EASE_STANDARD, delay }}
      className={cn("relative", className)}
    >
      {children}
    </motion.section>
  );
}
