"use client";

import { useEffect, useId, useState } from "react";
import { LayoutGrid, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ListingHref } from "@/components/listing/FilterPills";
import { TOPIC_TONE, type TopicId } from "@/lib/constants";
import { topicNumber } from "@/lib/post-display";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "chipchip.lessons.topicsCollapsed";

export type TopicNavEntry = {
  key: string;
  label: string;
  count: number;
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
 * Widths animate 260 to 48px over 0.45s; labels fade over 0.25s, waiting 0.2s on
 * the way back so the column is wide enough before they return. Under reduced
 * motion the column switches at once.
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

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {
      // Storage can be blocked (private mode): stay open.
    }
    const frame = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Not remembered, but the column still folds for this visit.
    }
  };

  const fade = animate ? "transition-opacity duration-fast ease-standard motion-reduce:transition-none" : "";

  return (
    <aside
      aria-label={heading}
      className={cn(
        "sticky top-28 hidden shrink-0 flex-col gap-3 overflow-hidden lg:flex",
        collapsed ? "w-12" : "w-[260px]",
        animate && "transition-[width] duration-panel ease-standard motion-reduce:transition-none",
        className
      )}
    >
      <div className="flex h-11 items-center justify-between gap-2">
        <h2
          aria-hidden={collapsed}
          className={cn(
            "whitespace-nowrap text-sm font-bold text-text",
            fade,
            collapsed ? "opacity-0" : "opacity-100 delay-200"
          )}
        >
          {heading}
        </h2>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls={listId}
          aria-label={collapsed ? expandLabel : collapseLabel}
          title={collapsed ? expandLabel : collapseLabel}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-border bg-surface text-text-nav transition-colors duration-fast ease-standard hover:border-black/20 hover:text-accent motion-reduce:transition-none"
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
          collapsed ? "p-1" : "p-2"
        )}
      >
        {entries.map((entry) => (
          <Link
            key={entry.key}
            href={entry.href}
            aria-current={entry.active ? "page" : undefined}
            aria-label={collapsed ? entry.label : undefined}
            className={cn(
              "group relative flex min-h-12 items-center rounded-xl text-sm font-medium transition-colors duration-fast ease-standard motion-reduce:transition-none",
              collapsed ? "justify-center px-0" : "gap-3 py-1.5 pl-2.5 pr-3",
              entry.active
                ? "bg-primary text-white"
                : "text-text-nav [@media(hover:hover)]:hover:bg-surface-muted"
            )}
          >
            <TopicDisc topic={entry.topic} active={entry.active} />
            <span
              aria-hidden={collapsed}
              className={cn(
                "min-w-0 flex-1 leading-[1.3]",
                fade,
                collapsed ? "hidden opacity-0" : "opacity-100 delay-200"
              )}
            >
              {entry.label}
            </span>
            <span
              aria-hidden={collapsed}
              className={cn(
                "min-w-7 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums",
                entry.active ? "bg-white/[0.16] text-white" : "bg-surface-muted text-text-muted",
                fade,
                collapsed ? "hidden opacity-0" : "opacity-100 delay-200"
              )}
            >
              {entry.count}
            </span>
            {collapsed && (
              <span
                role="presentation"
                aria-hidden
                className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-float transition-[opacity,transform] duration-fast ease-standard group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:delay-100"
              >
                {entry.label} · {entry.count}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {!collapsed && (
        <p className="px-1 text-[13px] leading-[1.5] text-text-muted">
          {hint.lead}{" "}
          <Link
            href={hint.href}
            className="font-semibold text-accent underline underline-offset-[3px] hover:text-primary"
          >
            {hint.link}
          </Link>
        </p>
      )}
    </aside>
  );
}
