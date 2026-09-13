"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  HOLD,
  holdReducer,
  initialHoldState,
  type HoldState,
} from "@/components/motion/holdToReveal";

/**
 * Wires `holdReducer` to real pointer events.
 *
 * Only active on coarse pointers. On a mouse the card already has `:hover`,
 * and running both would fight each other.
 */
export function useHoldToReveal() {
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const stateRef = useRef<HoldState>(initialHoldState);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const sync = () => setIsCoarsePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const clearTimers = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    hideTimer.current = null;
    holdTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (isCoarsePointer) return;
    clearTimers();
    stateRef.current = initialHoldState;
    setRevealed(false);
  }, [isCoarsePointer, clearTimers]);

  const dispatch = useCallback(
    (event: Parameters<typeof holdReducer>[1]) => {
      if (!isCoarsePointer) return;

      const result = holdReducer(stateRef.current, event);
      stateRef.current = result.state;
      setRevealed(result.state.revealed);

      if (result.startHoldTimer) {
        if (holdTimer.current) clearTimeout(holdTimer.current);
        holdTimer.current = setTimeout(() => {
          const next = holdReducer(stateRef.current, { type: "holdTimer" });
          stateRef.current = next.state;
          holdTimer.current = null;
        }, HOLD.holdMs);
      }

      if (result.hideAfterMs !== null) {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => {
          const next = holdReducer(stateRef.current, { type: "hide" });
          stateRef.current = next.state;
          setRevealed(false);
          hideTimer.current = null;
        }, result.hideAfterMs);
      }
    },
    [isCoarsePointer]
  );

  return {
    revealed,
    isCoarsePointer,
    handlers: {
      onPointerDown: (e: React.PointerEvent) =>
        dispatch({ type: "down", x: e.clientX, y: e.clientY }),
      onPointerMove: (e: React.PointerEvent) =>
        dispatch({ type: "move", x: e.clientX, y: e.clientY }),
      onPointerUp: () => dispatch({ type: "up" }),
      onPointerCancel: () => dispatch({ type: "hide" }),
    },
  };
}
