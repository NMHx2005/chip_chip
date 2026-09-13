"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const VIEW_W = 1200;

/**
 * Text drifting sideways along a shallow arc.
 *
 * The animation runs on its own rAF loop rather than as a CSS keyframe because
 * it has to stop when the band leaves the viewport — a marquee ticking away
 * off-screen burns battery on the phones this site is built for.
 *
 * Hidden below `md`: the arc needs width to read as a curve rather than as a
 * crooked line.
 */
export function DriftTextPath({
  text,
  className,
  speed = 10,
  arcHeight = 60,
}: {
  text: string;
  className?: string;
  /** Pixels per second, negative drifts right. */
  speed?: number;
  /** How far the middle of the arc dips, in viewBox units. */
  arcHeight?: number;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    let last = 0;
    let running = false;

    const tick = (now: number) => {
      if (last) {
        offsetRef.current =
          (offsetRef.current - (speed * (now - last)) / 1000 + VIEW_W) % VIEW_W;
        setOffset(offsetRef.current);
      }
      last = now;
      rafId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          last = 0;
          rafId = requestAnimationFrame(tick);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(rafId);
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(host);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [speed]);

  const pathId = `drift-${text.length}-${arcHeight}`;

  return (
    <div ref={hostRef} className={cn("hidden w-full md:block", className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${arcHeight * 2}`}
        className="w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <path
            id={pathId}
            d={`M 0 ${arcHeight} Q ${VIEW_W / 2} ${arcHeight * 2} ${VIEW_W} ${arcHeight}`}
            fill="none"
          />
        </defs>
        <text className="fill-current">
          <textPath href={`#${pathId}`} startOffset={-offset}>
            {`${text}  `.repeat(6)}
          </textPath>
        </text>
      </svg>
      <span className="sr-only">{text}</span>
    </div>
  );
}
