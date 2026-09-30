"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_STANDARD, VIEWPORT_ONCE } from "@/components/motion/tokens";
import { cardRevealMotion, revealDelay } from "@/lib/post-display";

/**
 * Fades a grid card in the first time it scrolls into view (design M3).
 *
 * The delay depends on the card's column (`revealDelay`), restarted every row,
 * so a long grid never queues. Under prefers-reduced-motion it goes straight to
 * the visible state. It always renders the same element as the server did: see
 * `cardRevealMotion` for why a plain <div> for reduced motion would leave the
 * card hidden.
 */
export function CardReveal({
  index,
  columns = 3,
  className,
  children,
}: {
  /** Position of the card in the list, from 0. */
  index: number;
  columns?: number;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      {...cardRevealMotion(reduce)}
      viewport={VIEWPORT_ONCE}
      transition={{
        // Same 0.55s as `staggerItem`, which the design names for card entrances.
        duration: 0.55,
        ease: EASE_STANDARD,
        delay: revealDelay(index, columns),
      }}
    >
      {children}
    </motion.div>
  );
}
