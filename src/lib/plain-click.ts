/**
 * How long the expanding blog card grows before navigating. Inside the spec's
 * 0.35–0.45 s window and under its 450 ms ceiling on delaying navigation.
 */
export const EXPAND_MS = 400;

/**
 * How long, after navigation starts, `ExpandingCardLink` waits before fading
 * its full-screen panel back out. There is no `loading.tsx` boundary for the
 * detail routes it links to (removed — it made a missing article answer 200
 * instead of 404), so a slow article load has nothing to show while it waits
 * and would otherwise leave the reader staring at a blank panel forever.
 * Fading out reveals the still-mounted listing underneath instead.
 */
export const PANEL_FADE_MS = 600;

type ClickLike = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

/**
 * True only for an unmodified primary click — the one case the card may take
 * over. Ctrl/Cmd-click (new tab), Shift-click (new window), Alt-click
 * (download), middle click and anything already handled stay with the browser.
 */
export function isPlainLeftClick(event: ClickLike): boolean {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export type CardClickOutcome = "ignore" | "swallow" | "expand";

/**
 * What ExpandingCardLink's onClick should do with an activation.
 *
 * `alreadyExpanding` wins over every other check: a second activation while
 * the first one's panel is still growing must be swallowed (`preventDefault`,
 * do nothing), not `"ignore"`d. Left to the browser, next/link navigates
 * immediately on that second click while the first click's timer is still
 * armed to push the same href again a moment later.
 */
export function classifyCardClick(
  event: ClickLike,
  { prefersReducedMotion, alreadyExpanding }: { prefersReducedMotion: boolean; alreadyExpanding: boolean }
): CardClickOutcome {
  if (alreadyExpanding) return "swallow";
  if (prefersReducedMotion || !isPlainLeftClick(event)) return "ignore";
  return "expand";
}
