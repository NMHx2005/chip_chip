"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChipArt, type ChipVariant } from "@/components/ui/ChipArt";
import { EASE_STANDARD } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

/**
 * One frame for "nothing here" and "something went wrong": a dashed box with the
 * chip drawing, a title, a line of explanation and the way out. `tone="error"`
 * announces itself (`role="alert"`); the empty tone is polite (`role="status"`).
 * It rises in (design M12); under prefers-reduced-motion it just appears.
 *
 * The error pages are this same frame with an eyebrow, a `h1` and the extra
 * slots (the design's separate "ErrorState"); everything else keeps the defaults.
 */
export function EmptyState({
  eyebrow,
  title,
  description,
  children,
  actions,
  after,
  tone = "empty",
  chip = "empty",
  headingLevel = "h2",
  compact = false,
  className,
}: {
  /** Accent label above the title (the error pages' "Error 404"). */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Extra content between the description and the actions (search suggestions, a query box). */
  children?: ReactNode;
  actions?: ReactNode;
  /** Rendered below the actions (quick links, an error code, a hint line). */
  after?: ReactNode;
  tone?: "empty" | "error";
  chip?: ChipVariant;
  /** `h1` where this is the page's only heading (the error pages). */
  headingLevel?: "h1" | "h2";
  /** Shorter box for a list that sits inside a page section. */
  compact?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const Heading = headingLevel;

  return (
    <motion.div
      role={tone === "error" ? "alert" : "status"}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_STANDARD }}
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-3xl border-[1.5px] border-dashed border-[#A8A8A8] bg-white/50 px-8 text-center",
        compact ? "min-h-[280px] py-10" : "min-h-[400px] py-14",
        className
      )}
    >
      <ChipArt variant={chip} />
      {eyebrow && (
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
          {eyebrow}
        </p>
      )}
      <Heading
        className={cn("text-balance text-text", headingLevel === "h1" ? "text-h1 md:text-h1-lg" : "text-h2")}
      >
        {title}
      </Heading>
      {description && (
        <p className="max-w-[460px] text-pretty text-base leading-[1.6] text-text-muted">
          {description}
        </p>
      )}
      {children}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-3">{actions}</div>}
      {after}
    </motion.div>
  );
}
