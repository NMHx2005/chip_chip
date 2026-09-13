/**
 * Per-letter motion for the button hover effect.
 *
 * The jitter is hashed from each letter's index rather than drawn at random,
 * so a given label dances identically every time it is hovered. Random values
 * would make the button feel unreliable instead of alive.
 */

export type LetterMeta = {
  /** Vertical lift in px, negative is up. */
  y: number;
  scale: number;
  /** Degrees, signed. */
  rotate: number;
  opacity: number;
  /** Seconds of phase offset, so letters do not move in lockstep. */
  delay: number;
};

/** Deterministic hash in [0, 1). The classic sine-fract trick from GLSL. */
export function pseudoRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function buildLetterMeta(text: string): LetterMeta[] {
  return text.split("").map((char, i) => {
    if (char === " ") {
      return { y: 0, scale: 1, rotate: 0, opacity: 1, delay: 0 };
    }
    return {
      y: -(1 + pseudoRand(i + 1) * 3),
      scale: 1.2 + pseudoRand(i + 53) * 0.25,
      rotate: (pseudoRand(i + 11) - 0.5) * 24,
      opacity: 0.7 + pseudoRand(i + 23) * 0.22,
      delay: pseudoRand(i + 37) * 0.08,
    };
  });
}
