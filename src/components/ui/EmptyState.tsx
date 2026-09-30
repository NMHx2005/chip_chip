"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChipArt } from "@/components/ui/ChipArt";
import { EASE_STANDARD } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

/**
 * One frame for "nothing here" and "something went wrong": a dashed box with the
 * chip drawing, a title, a line of explanation and the way out. `tone="error"`
 * announces itself (`role="alert"`); the empty tone is polite (`role="status"`).
 * It rises in (design M12); under prefers-reduced-motion it just appears.
 */
export function EmptyState({
  title,
  description,
  actions,
  tone = "empty",
  compact = false,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  tone?: "empty" | "error";
  /** Shorter box for a list that sits inside a page section. */
  compact?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();

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
      <ChipArt />
      <h2 className="text-balance text-h2 text-text">{title}</h2>
      {description && (
        <p className="max-w-[460px] text-pretty text-base leading-[1.6] text-text-muted">
          {description}
        </p>
      )}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-3">{actions}</div>}
    </motion.div>
  );
}
