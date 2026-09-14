"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { VIEWPORT_ONCE, staggerContainer, staggerItem } from "@/components/motion";

/**
 * Shared by every section heading on the site (SimpleStart, LessonTopics,
 * CountryBands, LatestPosts, and the gioi-thieu page). Animating here — not
 * in each caller — is what keeps every section title entering on the same
 * stagger rhythm instead of drifting apart per-section.
 */
export function SectionHeading({
  titleKey,
  descriptionKey,
  namespace = "home",
  align = "left",
  variant = "default",
  className,
}: {
  titleKey: string;
  descriptionKey: string;
  namespace?: string;
  align?: "left" | "center";
  /**
   * `statement` sets the description beside the title instead of under it and
   * steps the type down a notch — for a block carrying two lines of copy, a
   * full-width title over a stacked paragraph reads as an empty box.
   */
  variant?: "default" | "statement";
  className?: string;
}) {
  const t = useTranslations(namespace);
  const prefersReducedMotion = useReducedMotion();
  const isStatement = variant === "statement";

  const wrapperClassName = [
    isStatement
      ? "grid gap-4 md:grid-cols-2 md:items-start md:gap-12"
      : "flex flex-col gap-3",
    align === "center" ? "items-center text-center" : "items-start",
    className ?? "",
  ].join(" ");

  const titleClassName = isStatement
    ? "max-w-3xl text-balance text-[24px] font-extrabold leading-[1.2] tracking-[-0.02em] text-text sm:text-[28px] md:text-[30px]"
    : "max-w-3xl text-balance text-[26px] font-extrabold leading-[1.18] tracking-[-0.02em] text-text sm:text-[32px] md:text-[38px]";

  const descriptionClassName =
    "max-w-2xl text-pretty text-[15px] leading-relaxed text-text-muted md:text-base";

  // Reduced motion renders plain elements rather than motion ones with a
  // `hidden` initial state — that way there is no opacity:0 style left
  // behind for a viewport check that never fires.
  if (prefersReducedMotion) {
    return (
      <div className={wrapperClassName}>
        <h2 className={titleClassName}>{t(titleKey)}</h2>
        <p className={descriptionClassName}>{t(descriptionKey)}</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      className={wrapperClassName}
    >
      <motion.h2 variants={staggerItem} className={titleClassName}>
        {t(titleKey)}
      </motion.h2>
      <motion.p variants={staggerItem} className={descriptionClassName}>
        {t(descriptionKey)}
      </motion.p>
    </motion.div>
  );
}
