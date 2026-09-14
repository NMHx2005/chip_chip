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
  className,
}: {
  titleKey: string;
  descriptionKey: string;
  namespace?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const t = useTranslations(namespace);
  const prefersReducedMotion = useReducedMotion();

  const wrapperClassName = [
    "flex flex-col gap-3",
    align === "center" ? "items-center text-center" : "items-start",
    className ?? "",
  ].join(" ");

  // Reduced motion renders plain elements rather than motion ones with a
  // `hidden` initial state — that way there is no opacity:0 style left
  // behind for a viewport check that never fires.
  if (prefersReducedMotion) {
    return (
      <div className={wrapperClassName}>
        <h2 className="max-w-3xl text-balance text-[26px] font-extrabold leading-[1.18] tracking-[-0.02em] text-text sm:text-[32px] md:text-[38px]">
          {t(titleKey)}
        </h2>
        <p className="max-w-2xl text-pretty text-[15px] leading-relaxed text-text-muted md:text-base">
          {t(descriptionKey)}
        </p>
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
      <motion.h2
        variants={staggerItem}
        className="max-w-3xl text-balance text-[26px] font-extrabold leading-[1.18] tracking-[-0.02em] text-text sm:text-[32px] md:text-[38px]"
      >
        {t(titleKey)}
      </motion.h2>
      <motion.p
        variants={staggerItem}
        className="max-w-2xl text-pretty text-[15px] leading-relaxed text-text-muted md:text-base"
      >
        {t(descriptionKey)}
      </motion.p>
    </motion.div>
  );
}
