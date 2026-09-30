import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge, validators } from "tailwind-merge";

// tailwind-merge 3 targets Tailwind 4; this project is on Tailwind 3. Two things
// differ, and both would silently drop classes passed through cn():
// - our type tokens (text-h1, text-h2 ...) look like colours, so they are
//   registered as font sizes;
// - a bare `outline` is the outline *style* in Tailwind 3, not a width, so it
//   must not be merged away by `outline-2`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["h1", "h1-lg", "h2", "h2-lg"] }],
    },
  },
  override: {
    classGroups: {
      "outline-w": [
        {
          outline: [
            validators.isNumber,
            validators.isArbitraryVariableLength,
            validators.isArbitraryLength,
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
