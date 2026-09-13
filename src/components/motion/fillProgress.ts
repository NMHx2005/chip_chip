/**
 * Maps a target section's position onto the 0–1 progress of the scene-fill
 * overlay.
 *
 * Extracted from the component so the arithmetic can be tested without a DOM.
 * Getting the direction wrong here inverts the whole effect, and that is not
 * obvious from reading the component.
 */

export const FILL = {
  /** Progress 0: the target's top is level with the viewport bottom. */
  startVh: 1.0,
  /** Progress 1: the target's top has risen to 30% down the viewport. */
  endVh: 0.3,
  /** Final clip radius as a percentage — 150% covers any aspect ratio. */
  maxRadius: 150,
} as const;

export function fillProgress(rectTop: number, viewportHeight: number): number {
  const start = FILL.startVh * viewportHeight;
  const end = FILL.endVh * viewportHeight;
  const range = start - end;
  if (range <= 0) return 0;
  const raw = (start - rectTop) / range;
  return Math.max(0, Math.min(1, raw));
}
