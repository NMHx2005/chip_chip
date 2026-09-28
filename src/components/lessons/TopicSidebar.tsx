"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { EASE_STANDARD } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "chipchip.lessons.topicsCollapsed";

// Spec value for this one transition; the easing is the site-wide one.
const COLLAPSE_TRANSITION = {
  transitionDuration: "450ms",
  transitionTimingFunction: `cubic-bezier(${EASE_STANDARD.join(", ")})`,
};

/**
 * The topic column of the lessons pages.
 *
 * The only client code on those pages: it folds the column on desktop and
 * remembers that choice. The topic links themselves arrive as server-rendered
 * children. Below `lg` there is nothing to fold — the links are a horizontal
 * row above the grid — so the button and the collapsed state apply only from
 * `lg` up.
 */
export function TopicSidebar({
  heading,
  collapseLabel,
  expandLabel,
  children,
}: {
  heading: string;
  collapseLabel: string;
  expandLabel: string;
  children: ReactNode;
}) {
  const listId = useId();
  const [collapsed, setCollapsed] = useState(false);
  // Off until the stored state is applied, so a returning reader who left it
  // folded does not watch it fold again on every page load.
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {
      // Storage can be blocked (private mode, disabled cookies): stay open.
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

  return (
    <aside
      aria-label={heading}
      className={cn(
        "mb-8 shrink-0 lg:sticky lg:top-28 lg:mb-0",
        collapsed ? "lg:w-11" : "lg:w-[260px]",
        animate && "lg:transition-[width] motion-reduce:transition-none"
      )}
      style={animate ? COLLAPSE_TRANSITION : undefined}
    >
      <div className="mb-3 hidden items-center justify-between gap-2 lg:flex">
        {!collapsed && <h2 className="text-sm font-semibold text-text">{heading}</h2>}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls={listId}
          aria-label={collapsed ? expandLabel : collapseLabel}
          title={collapsed ? expandLabel : collapseLabel}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-text-nav transition-colors hover:border-black/20 hover:text-accent"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" strokeWidth={1.8} />
          ) : (
            <PanelLeftClose className="size-5" strokeWidth={1.8} />
          )}
        </button>
      </div>

      <div id={listId} className={cn(collapsed && "lg:hidden")}>
        {children}
      </div>
    </aside>
  );
}
