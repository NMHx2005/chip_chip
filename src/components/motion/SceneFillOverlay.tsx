"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { FILL, fillProgress } from "@/components/motion/fillProgress";
import { cn } from "@/lib/utils";

/**
 * A white sheet that rises from the bottom-centre of the viewport as the
 * reader approaches a given section, swallowing whatever sits behind it.
 *
 * This is the scene change between the upper half of the page (which floats
 * over a sticky backdrop) and the lower half. It sits above the hero layer but
 * below `MainSection`, so the incoming section stays legible on top of it.
 *
 * Scroll position is read through a rAF-throttled listener rather than
 * `useScroll`, because the measurement is against another element's rect.
 */
export function SceneFillOverlay({
  targetId,
  className,
}: {
  /** `id` of the section whose approach drives the fill. */
  targetId: string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const smooth = useSpring(progress, {
    stiffness: 220,
    damping: 32,
    mass: 0.6,
  });
  const radius = useTransform(smooth, [0, 1], [0, FILL.maxRadius]);
  const clipPath = useMotionTemplate`circle(${radius}% at 50% 100%)`;

  useEffect(() => {
    if (prefersReducedMotion) return;

    let rafId = 0;

    const update = () => {
      const el = document.getElementById(targetId);
      if (!el) return;
      progress.set(
        fillProgress(el.getBoundingClientRect().top, window.innerHeight)
      );
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        update();
        rafId = 0;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [progress, prefersReducedMotion, targetId]);

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 z-[15] bg-bg", className)}
      style={{ clipPath, willChange: "clip-path" }}
    />
  );
}
