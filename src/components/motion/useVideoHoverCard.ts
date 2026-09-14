// src/components/motion/useVideoHoverCard.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shows a preview card while the pointer is over the video, and keeps it up
 * for a beat after the pointer leaves.
 *
 * The delay on the way out is the whole point: the card appears next to the
 * video, so a reader moving towards it would otherwise dismiss it by leaving
 * the video they were hovering.
 *
 * Desktop only. On a touch screen there is no hover to open it with, and the
 * tap already plays the video.
 */
export function useVideoHoverCard(hideDelayMs = 2500) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);

  useEffect(() => clearHideTimer, [clearHideTimer]);

  useEffect(() => {
    if (isDesktop) return;
    clearHideTimer();
    setCardVisible(false);
  }, [isDesktop, clearHideTimer]);

  const onVideoEnter = useCallback(() => {
    if (!isDesktop) return;
    clearHideTimer();
    setCardVisible(true);
  }, [isDesktop, clearHideTimer]);

  const onVideoLeave = useCallback(() => {
    if (!isDesktop) return;
    clearHideTimer();
    hideTimer.current = setTimeout(() => {
      setCardVisible(false);
      hideTimer.current = null;
    }, hideDelayMs);
  }, [isDesktop, clearHideTimer, hideDelayMs]);

  return { isDesktop, cardVisible, onVideoEnter, onVideoLeave };
}
