"use client";

import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { TopicDisc, type TopicNavEntry } from "@/components/lessons/TopicNav";
import { centerScrollLeft } from "@/lib/lesson-listing";
import { cn } from "@/lib/utils";

/**
 * The topics as a row of chips for phones and tablets (below `lg`, where the
 * `TopicNav` column is not shown). It scrolls sideways inside its own box; the
 * chosen chip is brought to the middle when the page loads, without animation.
 * The faded right edge is only a hint that there is more, it never covers a chip.
 */
export function TopicTrail({
  label,
  entries,
  className,
  inset = false,
}: {
  label: string;
  entries: TopicNavEntry[];
  className?: string;
  /** Inside a padded card (16px): bleed to the card edge, not to the 20/32px page gutter. */
  inset?: boolean;
}) {
  const rowRef = useRef<HTMLUListElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Centre the chosen chip by moving the row only. scrollIntoView would also
  // scroll the window, which jumps the page on a short phone.
  useEffect(() => {
    const row = rowRef.current;
    const chip = activeRef.current;
    if (!row || !chip) return;
    row.scrollLeft = centerScrollLeft({
      chipLeft: chip.offsetLeft,
      chipWidth: chip.offsetWidth,
      rowWidth: row.clientWidth,
      contentWidth: row.scrollWidth,
    });
  }, []);

  return (
    <nav aria-label={label} className={cn("lg:hidden", className)}>
      <ul
        ref={rowRef}
        className={cn(
          "relative flex snap-x snap-proximity gap-2 overflow-x-auto pb-1 [mask-image:linear-gradient(to_right,#000_calc(100%_-_32px),transparent)]",
          inset ? "-mx-4 pl-4 pr-10" : "-mx-5 pl-5 pr-10 md:-mx-8 md:pl-8 md:pr-12"
        )}
      >
        {entries.map((entry) => (
          <li key={entry.key} className="shrink-0 snap-center">
            <Link
              ref={entry.active ? activeRef : undefined}
              href={entry.href}
              scroll={false}
              aria-current={entry.active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-full border py-1 pl-1.5 pr-3.5 text-sm font-medium transition-colors duration-fast ease-standard motion-reduce:transition-none",
                entry.active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text-nav [@media(hover:hover)]:hover:border-black/20"
              )}
            >
              <TopicDisc topic={entry.topic} active={entry.active} />
              <span className="whitespace-nowrap">{entry.label}</span>
              {entry.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                    entry.active ? "bg-white/[0.16] text-white" : "bg-surface-muted text-text-muted"
                  )}
                >
                  {entry.count}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
