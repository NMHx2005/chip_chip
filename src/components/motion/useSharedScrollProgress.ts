// src/components/motion/useSharedScrollProgress.ts
"use client";

import { useRef } from "react";
import { useScroll, type MotionValue } from "framer-motion";
import { REVEAL } from "@/components/motion/tokens";

/**
 * One scroll timeline that several elements can read.
 *
 * The hero title shrinks and fades against the *video's* position, not its
 * own. Measuring each separately would let them drift apart, and the drift is
 * exactly what makes a page feel assembled rather than composed.
 *
 * Attach `targetRef` to the element that owns the timeline, then feed
 * `scrollYProgress` into `useTransform` wherever it is needed.
 */
export function useSharedScrollProgress(): {
  targetRef: React.RefObject<HTMLDivElement | null>;
  scrollYProgress: MotionValue<number>;
} {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: REVEAL.offset as unknown as ["start end", "center 65%"],
  });

  return { targetRef, scrollYProgress };
}
