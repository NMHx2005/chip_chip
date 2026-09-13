/**
 * Motion constants for the whole site.
 *
 * Every animated component reads from here. The point is not tidiness: a site
 * where each component picks its own easing reads as a collection of parts
 * rather than one design, and that was the main complaint about the previous
 * build. Values are copied from Strike_Robot_LandingPage_Desing verbatim.
 */

/** Used by every entrance animation. The signature easing of the design. */
export const EASE_STANDARD = [0.25, 0.1, 0.25, 1] as const;

/**
 * Declared by the original for the 3D scroll reveal but never actually applied
 * there — the transform runs linearly against scroll progress. Kept for parity
 * and for anyone who later wants a non-linear reveal.
 */
export const EASE_SCROLL_REVEAL = [0.16, 1, 0.3, 1] as const;

export const DURATION = {
  /** Returning to rest — deliberately quicker than leaving it. */
  fast: 0.25,
  base: 0.6,
  slow: 0.7,
  reveal: 0.5,
} as const;

export const STAGGER = {
  step: 0.12,
  delay: 0.1,
  fastStep: 0.07,
  fastDelay: 0.05,
  slowStep: 0.18,
  slowDelay: 0.15,
} as const;

/**
 * Fires 100px before the element truly enters the viewport, so the animation
 * is already underway by the time the reader looks at it.
 */
export const VIEWPORT_ONCE = { once: true, margin: "-100px" } as const;

export const REVEAL = {
  rotateXDeg: 55,
  scale: 0.72,
  perspectivePx: 1600,
  /** Starts when the top of the target meets the viewport bottom; ends when
   *  its centre reaches 65% down the viewport. */
  offset: ["start end", "center 65%"],
} as const;

export const STAR_SPEED = { idle: "5s", hover: "2s" } as const;
