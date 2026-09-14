// src/components/motion/VideoHoverCard.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { DURATION, EASE_STANDARD } from "@/components/motion/tokens";

/**
 * Frosted preview card that slides in beside the hero video.
 *
 * The border is an SVG stroke with a short dash travelling around it, rather
 * than a CSS border: `pathLength={100}` normalises the perimeter so one full
 * lap is always 100 units of dashoffset, whatever the card's size. Hovering
 * the card doubles the speed via `.hero-video-card:hover` in globals.css.
 *
 * `useVideoHoverCard` gates visibility to hover-capable desktops but not to
 * `prefers-reduced-motion` — the card itself is the static escape route: a
 * reduced-motion reader still gets the preview, just without the slide/scale
 * entrance (the border shine is muted globally by the `prefers-reduced-motion`
 * block in globals.css already).
 */
export function VideoHoverCard({
  label,
  sublabel,
}: {
  label: string;
  sublabel: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  const content = (
    <div className="relative rounded-2xl bg-black/45 p-5 backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:[transform:rotateX(2deg)_rotateY(-5deg)_rotateZ(-1deg)]">
      <svg
        className="pointer-events-none absolute inset-0 size-full"
        viewBox="0 0 260 120"
        preserveAspectRatio="none"
        aria-hidden
      >
        <rect
          x="1"
          y="1"
          width="258"
          height="118"
          rx="15"
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="1.5"
          pathLength={100}
          strokeDasharray="14 86"
          className="hero-card-border-run"
        />
      </svg>

      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-white/75">{sublabel}</p>
      <ArrowUpRight
        className="mt-3 size-4 text-white/80"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );

  if (prefersReducedMotion) {
    // No motion.div: appears/disappears instantly with the conditional
    // render in Hero instead of animating in and lingering out.
    return (
      <div className="hero-video-card pointer-events-none absolute bottom-5 right-5 z-10 w-[260px]">
        {content}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: DURATION.reveal, ease: EASE_STANDARD }}
      style={{ perspective: 1400 }}
      className="hero-video-card pointer-events-none absolute bottom-5 right-5 z-10 w-[260px]"
    >
      {content}
    </motion.div>
  );
}
