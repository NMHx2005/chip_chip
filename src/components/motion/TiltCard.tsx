"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Card that tilts away from the centre of the row on hover.
 *
 * Plain CSS, not a tilt library: the angles are fixed per side rather than
 * tracking the cursor, so there is no pointer maths and nothing to clean up.
 * The original project shipped a `vanilla-tilt` hook that nothing imported —
 * this is what it actually used.
 *
 * Tilt only from `md` up. On a phone the card fills the width and tilting it
 * would just clip the corners.
 */
export function TiltCard({
  children,
  side,
  className,
  ...rest
}: {
  children: ReactNode;
  /** Which way to lean — mirror the pair so they splay outwards. */
  side: "left" | "right";
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <article
      {...rest}
      className={cn(
        "[perspective:1400px] transition-transform duration-300",
        "ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        side === "left"
          ? "md:hover:[transform:rotateX(2deg)_rotateY(-5deg)_rotateZ(-1deg)]"
          : "md:hover:[transform:rotateX(2deg)_rotateY(5deg)_rotateZ(1deg)]",
        className
      )}
    >
      {children}
    </article>
  );
}
