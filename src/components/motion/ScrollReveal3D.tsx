// src/components/motion/ScrollReveal3D.tsx
"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { REVEAL } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

/**
 * Tilts its content up as the reader scrolls to it: lying back at 55° and
 * scaled to 72%, standing upright at full size by the time it is on screen.
 *
 * `transformOrigin: 50% 100%` is what sells it — the element hinges on its own
 * bottom edge like a lid opening, rather than spinning about its centre.
 *
 * The transform maps linearly onto scroll progress with no easing, matching
 * the original. Easing here would fight the reader's own scroll speed.
 */
export function ScrollReveal3D({
  children,
  className,
  targetRef,
}: {
  children: ReactNode;
  className?: string;
  /** Share a scroll timeline with other elements; omit to measure itself. */
  targetRef?: RefObject<HTMLDivElement | null>;
}) {
  const prefersReducedMotion = useReducedMotion();
  const internalRef = useRef<HTMLDivElement | null>(null);
  const containerRef = (targetRef ?? internalRef) as RefObject<HTMLDivElement>;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: REVEAL.offset as unknown as ["start end", "center 65%"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [REVEAL.rotateXDeg, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [REVEAL.scale, 1]);

  if (prefersReducedMotion) {
    return (
      <div ref={containerRef} className={cn("w-full", className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("w-full", className)}
      style={{ perspective: `${REVEAL.perspectivePx}px` }}
    >
      <motion.div
        style={{
          rotateX,
          scale,
          transformOrigin: "50% 100%",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
