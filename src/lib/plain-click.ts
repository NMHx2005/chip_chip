/**
 * How long the expanding blog card grows before navigating. Inside the spec's
 * 0.35–0.45 s window and under its 450 ms ceiling on delaying navigation.
 */
export const EXPAND_MS = 400;

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
