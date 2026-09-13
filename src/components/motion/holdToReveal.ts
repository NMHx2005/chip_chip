/**
 * Touch replacement for hover.
 *
 * The hard part is telling a deliberate press apart from a finger that is on
 * its way to scrolling the page. Both start as a pointerdown on the card. The
 * rule: hold still past `holdMs` and it counts as a press; move more than
 * `moveThresholdPx` first and it is a scroll, so the reveal fades out on its
 * own instead of sticking.
 *
 * A pure reducer so the timing rules can be tested without a browser.
 */

export const HOLD = {
  holdMs: 280,
  moveThresholdPx: 8,
  /** After a deliberate press, the reader has seen it — hide sooner. */
  hideAfterHoldMs: 1000,
  /** After a glancing tap, leave it up long enough to read. */
  hideAfterTapMs: 2500,
} as const;

export type HoldState = {
  revealed: boolean;
  pointerDown: boolean;
  holding: boolean;
  moved: boolean;
  startX: number;
  startY: number;
};

export const initialHoldState: HoldState = {
  revealed: false,
  pointerDown: false,
  holding: false,
  moved: false,
  startX: 0,
  startY: 0,
};

export type HoldEvent =
  | { type: "down"; x: number; y: number }
  | { type: "move"; x: number; y: number }
  | { type: "up" }
  | { type: "holdTimer" }
  | { type: "hide" };

export type HoldResult = {
  state: HoldState;
  /** Schedule a hide this many ms from now, or null to leave timers alone. */
  hideAfterMs: number | null;
  /** Start the `holdMs` timer that decides press-vs-scroll. */
  startHoldTimer: boolean;
};

export function holdReducer(state: HoldState, event: HoldEvent): HoldResult {
  switch (event.type) {
    case "down":
      return {
        state: {
          revealed: true,
          pointerDown: true,
          holding: false,
          moved: false,
          startX: event.x,
          startY: event.y,
        },
        hideAfterMs: null,
        startHoldTimer: true,
      };

    case "move": {
      if (!state.pointerDown) {
        return {
          state: { ...state, revealed: true },
          hideAfterMs: HOLD.hideAfterTapMs,
          startHoldTimer: false,
        };
      }
      const moved =
        Math.hypot(event.x - state.startX, event.y - state.startY) >
        HOLD.moveThresholdPx;
      if (!moved) {
        return { state, hideAfterMs: null, startHoldTimer: false };
      }
      return {
        state: { ...state, moved: true, holding: false },
        hideAfterMs: HOLD.hideAfterTapMs,
        startHoldTimer: false,
      };
    }

    case "holdTimer":
      if (!state.pointerDown || state.moved) {
        return { state, hideAfterMs: null, startHoldTimer: false };
      }
      return {
        state: { ...state, holding: true },
        hideAfterMs: null,
        startHoldTimer: false,
      };

    case "up":
      return {
        state: { ...state, pointerDown: false, holding: false, moved: false },
        hideAfterMs:
          state.holding && !state.moved
            ? HOLD.hideAfterHoldMs
            : HOLD.hideAfterTapMs,
        startHoldTimer: false,
      };

    case "hide":
      return { state: initialHoldState, hideAfterMs: null, startHoldTimer: false };
  }
}
