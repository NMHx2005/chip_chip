"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { DURATION, EASE_STANDARD } from "@/components/motion/tokens";
import { buildLetterMeta, type LetterMeta } from "@/components/motion/letterDance";
import { cn } from "@/lib/utils";

const buildVariants = (restWeight: number, hoverWeight: number): Variants => ({
  rest: {
    y: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
    fontWeight: restWeight,
    transition: { duration: DURATION.fast, ease: EASE_STANDARD },
  },
  active: (meta: LetterMeta) => ({
    y: [0, meta.y, 0],
    scale: [1, meta.scale, 1],
    rotate: [0, meta.rotate, 0],
    opacity: [1, meta.opacity, 1],
    fontWeight: [restWeight, hoverWeight, restWeight],
    transition: {
      delay: meta.delay,
      duration: 0.55,
      ease: EASE_STANDARD,
      // Peak at 45% rather than halfway: the letter snaps up and settles back
      // slowly, which reads as spring rather than as a bounce.
      times: [0, 0.45, 1],
    },
  }),
});

/**
 * Button label whose letters lift, tilt and thicken on hover.
 *
 * A hidden copy at the heaviest weight reserves the widest layout the label
 * can ever occupy, so the button does not resize mid-animation. The visible
 * letters are `aria-hidden` and a plain `sr-only` copy carries the text, so
 * assistive tech reads one word rather than a string of separate letters.
 *
 * Disabled on coarse pointers: without hover there is nothing to trigger it,
 * and the per-letter spans would only cost layout work.
 */
export function AnimatedButtonLabel({
  children,
  className,
  active = false,
  weightRange = [500, 700],
}: {
  children: string;
  className?: string;
  /** Drive from the parent's hover state. */
  active?: boolean;
  /** `[rest, hover]` font weights. Use `[400, 700]` on outline buttons. */
  weightRange?: [number, number];
}) {
  const prefersReducedMotion = useReducedMotion();
  const letters = useMemo(() => children.split(""), [children]);
  const letterMeta = useMemo(() => buildLetterMeta(children), [children]);
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    setCanAnimate(
      prefersReducedMotion !== true &&
        window.matchMedia("(pointer: fine)").matches
    );
  }, [prefersReducedMotion]);

  const [restWeight, hoverWeight] = weightRange;
  const variants = useMemo(
    () => buildVariants(restWeight, hoverWeight),
    [restWeight, hoverWeight]
  );
  const shouldAnimate = canAnimate && active;

  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      <span
        className="invisible whitespace-pre"
        aria-hidden="true"
        style={{ fontWeight: hoverWeight }}
      >
        {children}
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center whitespace-pre"
        aria-hidden="true"
      >
        {letters.map((char, i) => (
          <motion.span
            key={i}
            className="inline-block"
            custom={letterMeta[i]}
            initial={false}
            animate={shouldAnimate ? "active" : "rest"}
            variants={canAnimate ? variants : undefined}
            style={{
              willChange: shouldAnimate ? "transform, font-weight, opacity" : undefined,
              fontWeight: canAnimate ? undefined : restWeight,
              transformOrigin: "50% 60%",
            }}
          >
            {char}
          </motion.span>
        ))}
      </span>
      <span className="sr-only">{children}</span>
    </span>
  );
}
