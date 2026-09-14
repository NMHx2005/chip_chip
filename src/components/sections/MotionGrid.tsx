"use client";

import { Children, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  TiltCard,
  VIEWPORT_ONCE,
  staggerContainer,
  staggerItem,
} from "@/components/motion";
import { cn } from "@/lib/utils";

/**
 * Staggers a grid of cards into view and tilts each on hover.
 *
 * Takes `children` rather than data so the cards themselves stay server
 * components — a client component cannot render an async server child, and
 * `PostCard` is async.
 */
export function MotionGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const gridClassName = cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className);

  // Same branch shape as SectionHeading: reduced motion renders plain
  // elements instead of motion ones left at their `hidden` variant, so
  // nothing stays opacity:0 waiting on a viewport check that never fires.
  // TiltCard's hover tilt is plain CSS with no reduced-motion guard of its
  // own, so it is skipped here too rather than left to tilt on hover.
  if (prefersReducedMotion) {
    return (
      <div className={gridClassName}>
        {Children.map(children, (child) => (
          <div className="h-full">{child}</div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      className={gridClassName}
    >
      {Children.map(children, (child, index) => (
        <motion.div variants={staggerItem} className="h-full">
          <TiltCard side={index % 2 === 0 ? "left" : "right"} className="h-full">
            {child}
          </TiltCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
