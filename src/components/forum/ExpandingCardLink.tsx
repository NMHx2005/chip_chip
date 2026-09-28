"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_STANDARD } from "@/components/motion";
import { Link, useRouter } from "@/i18n/navigation";
import type { PostHref } from "@/lib/paths";
import { classifyCardClick, EXPAND_MS } from "@/lib/plain-click";

type Box = { top: number; left: number; width: number; height: number };

/**
 * A card link that grows to fill the screen before navigating.
 *
 * Still a real `<a>`: Ctrl/Cmd-click, middle click and "open in new tab" are
 * left to the browser, and only a plain left click plays the animation. With
 * reduced motion it is an ordinary link.
 *
 * The growing surface is a blank panel portalled to `<body>` rather than the
 * card itself: cards sit inside TiltCard (`perspective`) and motion wrappers
 * (`transform`), and either one turns `position: fixed` into "fixed to the
 * card", so the card could never escape its grid cell.
 */
export function ExpandingCardLink({
  href,
  className,
  children,
}: {
  href: PostHref;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [from, setFrom] = useState<Box | null>(null);
  const [grown, setGrown] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Mount at the card's box first, then switch to full screen on the next
  // frame so `layout` has a before and an after to animate between.
  useEffect(() => {
    if (!from) return;
    const frame = window.requestAnimationFrame(() => setGrown(true));
    return () => window.cancelAnimationFrame(frame);
  }, [from]);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const outcome = classifyCardClick(event, {
      prefersReducedMotion: Boolean(prefersReducedMotion),
      alreadyExpanding: from !== null,
    });
    if (outcome === "ignore") return;
    event.preventDefault();
    if (outcome === "swallow") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setFrom({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    router.prefetch(href);
    timer.current = window.setTimeout(() => router.push(href), EXPAND_MS);
  };

  return (
    <>
      <Link href={href} onClick={onClick} className={className}>
        {children}
      </Link>
      {from &&
        createPortal(
          <motion.div
            aria-hidden
            layout
            transition={{ layout: { duration: EXPAND_MS / 1000, ease: EASE_STANDARD } }}
            className="fixed z-[1500] border border-border bg-surface shadow-card-hover"
            style={
              grown
                ? { top: 0, left: 0, width: "100vw", height: "100dvh", borderRadius: 16 }
                : { ...from, borderRadius: 16 }
            }
          />,
          document.body
        )}
    </>
  );
}
