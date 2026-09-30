"use client";

import { useEffect, useRef, useState } from "react";
import { centerScrollLeft } from "@/lib/lesson-listing";
import { pickActiveHeading } from "@/lib/toc";
import { cn } from "@/lib/utils";

export type TocEntry = { id: string; text: string; level: number };

// The fixed navbar plus a little air; headings stop at `html { scroll-padding-top }` (96px).
const OFFSET = 120;

/**
 * The contents card of the desktop rail. The row of the section being read is
 * dark and carries `aria-current="location"`; it follows the scroll (rAF-throttled)
 * and changes at once under reduced motion. Links are plain anchors, so it works
 * without JavaScript apart from the highlight.
 */
export function TocRail({ label, entries }: { label: string; entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);
  const navRef = useRef<HTMLElement>(null);

  // A long list is capped to the viewport and scrolls inside its own box; keep
  // the active row in the middle of it. Only the box moves, never the window.
  useEffect(() => {
    const nav = navRef.current;
    const row = nav?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!nav || !row) return;
    nav.scrollTop = centerScrollLeft({
      chipLeft: row.offsetTop,
      chipWidth: row.offsetHeight,
      rowWidth: nav.clientHeight,
      contentWidth: nav.scrollHeight,
    });
  }, [activeId]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const tops = entries.flatMap((entry) => {
        const el = document.getElementById(entry.id);
        return el ? [{ id: entry.id, top: el.getBoundingClientRect().top }] : [];
      });
      setActiveId(pickActiveHeading(tops, OFFSET));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [entries]);

  return (
    <nav
      ref={navRef}
      aria-label={label}
      className="relative flex max-h-[calc(100vh-13rem)] flex-col gap-0.5 overflow-y-auto rounded-2xl border border-border bg-surface p-2"
    >
      {entries.map((entry) => {
        const active = entry.id === activeId;
        return (
          <a
            key={entry.id}
            href={`#${entry.id}`}
            aria-current={active ? "location" : undefined}
            className={cn(
              "flex min-h-12 items-center rounded-xl px-3 py-1.5 font-medium leading-[1.35] transition-colors duration-fast ease-standard motion-reduce:transition-none",
              entry.level === 3 ? "pl-7 text-[13px]" : "text-sm",
              active
                ? "bg-primary text-white"
                : "text-text-nav [@media(hover:hover)]:hover:bg-surface-muted"
            )}
          >
            {entry.text}
          </a>
        );
      })}
    </nav>
  );
}
