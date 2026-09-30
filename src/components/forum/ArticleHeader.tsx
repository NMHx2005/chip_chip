"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_STANDARD, STAGGER } from "@/components/motion/tokens";

/**
 * The head of an article (back link, title, meta) rises in once when the page
 * opens (BL8). Only opacity and a 20px shift move, so the title's layout, and
 * with it LCP, is not affected. The content is server-rendered and visible
 * without JavaScript; under prefers-reduced-motion it simply appears.
 */
export function ArticleHeader({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE_STANDARD, delay: STAGGER.delay }}
    >
      {children}
    </motion.div>
  );
}
