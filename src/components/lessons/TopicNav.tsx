"use client";

import { useEffect, useId, useState } from "react";
import { LayoutGrid, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ListingHref } from "@/lib/types";
import { TOPIC_TONE, type TopicId } from "@/lib/constants";
import { topicNumber } from "@/lib/post-display";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "chipchip.lessons.topicsCollapsed";

export type TopicNavEntry = {
  key: string;
  label: string;
  /** Left out where no count is known (the video filters). */
  count?: number;
  href: ListingHref;
  active: boolean;
  /** `null` is the "all topics" row, drawn with a grid icon instead of a number. */
  topic: TopicId | null;
};

/** The number disc (or the grid icon for "all topics"). */
export function TopicDisc({
  topic,
  active,
}: {
  topic: TopicId | null;
  active: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-extrabold text-[#262626]",
        active ? "border-transparent bg-white/[0.14] text-white" : "border-black/10 bg-white"
      )}
      style={!active && topic ? { background: TOPIC_TONE[topic].soft } : undefined}
    >
      {topic ? topicNumber(topic) : <LayoutGrid className="size-3.5" strokeWidth={2} />}
    </span>
  );
}

/**
 * The topic column of the lessons pages, from `lg` up (below that the topics are
 * a `TopicTrail`). Expanded it is a white card of 48px rows: number disc, name,
 * count. Collapsed it is a 48px rail of number discs, each with a tooltip that
 * repeats its `aria-label`, so it still navigates. The choice is remembered.
 *
 * The width animates 260 to 48px over 0.45s. Names and counts are only drawn
 * while the column is fully open (`showLabels`): they disappear the moment it
 * starts to fold and come back, fading in, once it has finished opening. Drawing
 * them mid-transition made them wrap onto many lines in a column that was still
 * narrow. The aside itself must not clip (`overflow-hidden`): the rail's
 * tooltips sit outside its 48px. Under reduced motion it switches at once.
 */
export function TopicNav({
  heading,
  collapseLabel,
  expandLabel,
  hint,
  entries,
  className,
}: {
  heading: string;
  collapseLabel: string;
  expandLabel: string;
  hint: { lead: string; link: string; href: ListingHref };
  entries: TopicNavEntry[];
  className?: string;
}) {
  const listId = useId();
  const [collapsed, setCollapsed] = useState(false);
  // Off until the stored state is applied, so a returning reader who left the
  // column folded does not watch it fold on every page load.
  const [animate, setAnimate] = useState(false);
  // Names and counts are drawn only while the column is open; see above.
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {
      // Storage can be blocked (private mode): stay open.
    }
    const frame = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (collapsed) {
      setShowLabels(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduce) {
      setShowLabels(true);
      return;
    }
    // Wait for the 0.45s width transition to finish before the names return.
    const timer = window.setTimeout(() => setShowLabels(true), 460);
    return () => window.clearTimeout(timer);
  }, [collapsed, animate]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Not remembered, but the column still folds for this visit.
    }
  };

  const open = !collapsed && showLabels;

  return (
    <aside
      aria-label={heading}
      className={cn(
        "sticky top-28 hidden shrink-0 flex-col gap-3 lg:flex",
        collapsed ? "w-12" : "w-[260px]",
        animate && "transition-[width] duration-panel ease-standard motion-reduce:transition-none",
        className
      )}
    >
      <div className={cn("flex h-11 items-center gap-2", collapsed ? "justify-center" : "justify-between")}>
        {open && (
          <h2 className="whitespace-nowrap text-sm font-bold text-text motion-safe:animate-notice-in">
            {heading}
          </h2>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls={listId}
          aria-label={collapsed ? expandLabel : collapseLabel}
          title={collapsed ? expandLabel : collapseLabel}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-border bg-surface text-text-nav transition-colors duration-fast ease-standard [@media(hover:hover)]:hover:border-black/20 [@media(hover:hover)]:hover:text-accent motion-reduce:transition-none"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-[18px]" strokeWidth={2} />
          ) : (
            <PanelLeftClose className="size-[18px]" strokeWidth={2} />
          )}
        </button>
      </div>

      <nav
        id={listId}
        aria-label={heading}
        className={cn(
          "flex flex-col gap-0.5 rounded-2xl border border-border bg-surface",
          collapsed ? "p-1" : "overflow-hidden p-2"
        )}
      >
        {entries.map((entry) => {
          const name = entry.count === undefined ? entry.label : `${entry.label} (${entry.count})`;
          return (
            <Link
              key={entry.key}
              href={entry.href}
              aria-current={entry.active ? "page" : undefined}
              aria-label={collapsed ? name : undefined}
              className={cn(
                "group relative flex min-h-12 items-center rounded-xl text-sm font-medium transition-colors duration-fast ease-standard motion-reduce:transition-none",
                collapsed ? "justify-center px-0" : "gap-3 py-1.5 pl-2.5 pr-3",
                entry.active
                  ? "bg-primary text-white"
                  : "text-text-nav [@media(hover:hover)]:hover:bg-surface-muted"
              )}
            >
              <TopicDisc topic={entry.topic} active={entry.active} />
              {open && (
                <>
                  <span className="min-w-0 flex-1 leading-[1.3] motion-safe:animate-notice-in">
                    {entry.label}
                  </span>
                  {entry.count !== undefined && (
                    <span
                      className={cn(
                        "min-w-7 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums motion-safe:animate-notice-in",
                        entry.active ? "bg-white/[0.16] text-white" : "bg-surface-muted text-text-muted"
                      )}
                    >
                      {entry.count}
                    </span>
                  )}
                </>
              )}
              {collapsed && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-float transition-[opacity,transform] duration-fast ease-standard group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:delay-100"
                >
                  {name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {open && (
        <p className="px-1 text-[13px] leading-[1.5] text-text-muted motion-safe:animate-notice-in">
          {hint.lead}{" "}
          <Link
            href={hint.href}
            className="font-semibold text-accent underline underline-offset-[3px] [@media(hover:hover)]:hover:text-primary"
          >
            {hint.link}
          </Link>
        </p>
      )}
    </aside>
  );
}
