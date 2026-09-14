"use client";

import { useCallback, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AnimatedSection,
  DURATION,
  EASE_STANDARD,
  VIEWPORT_ONCE,
  staggerContainer,
  staggerItem,
} from "@/components/motion";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { Link } from "@/i18n/navigation";
import { CAROUSEL_VIDEOS } from "@/lib/constants";

const COUNT = CAROUSEL_VIDEOS.length;

/**
 * Six clips with the current one centred and its neighbours peeled back.
 *
 * Written by hand rather than with a carousel library: the requirement is a
 * focused centre with shrunken, dimmed siblings, and every library here either
 * ships a full-width slider or turns itself off above a breakpoint.
 *
 * Position is computed from the offset to the active index rather than by
 * translating a track, so the same maths drives layout and the swipe.
 */
export function VideoCarousel() {
  const t = useTranslations("home.videos");
  const prefersReducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  const step = useCallback((delta: number) => {
    setActive((current) => (current + delta + COUNT) % COUNT);
  }, []);

  /** Shortest signed distance on a ring, so 5 → 0 counts as +1 not -5. */
  const offsetOf = (index: number) => {
    const raw = index - active;
    if (raw > COUNT / 2) return raw - COUNT;
    if (raw < -COUNT / 2) return raw + COUNT;
    return raw;
  };

  return (
    <AnimatedSection id="home-videos" className="cv-auto px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto w-full max-w-content">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2
            variants={staggerItem}
            className="text-balance text-[26px] font-extrabold tracking-[-0.02em] text-text md:text-[36px]"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="mt-4 text-pretty text-sm leading-relaxed text-text-muted md:text-base"
          >
            {t("subtitle")}
          </motion.p>
        </motion.div>

        <div
          className="relative mt-14 h-[240px] overflow-x-hidden md:h-[420px]"
          role="group"
          aria-roledescription="carousel"
          aria-label={t("title")}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") step(-1);
            if (e.key === "ArrowRight") step(1);
          }}
          tabIndex={0}
        >
          {CAROUSEL_VIDEOS.map((clip, index) => {
            const offset = offsetOf(index);
            const isActive = offset === 0;
            // Anything beyond an immediate neighbour is parked off-stage.
            const hidden = Math.abs(offset) > 1;
            const topicLabel = t(`topics.${clip.topicKey}`);

            return (
              <motion.button
                key={clip.id}
                type="button"
                aria-label={topicLabel}
                aria-current={isActive ? "true" : undefined}
                onClick={() => (isActive ? undefined : setActive(index))}
                drag={isActive ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) step(1);
                  if (info.offset.x > 60) step(-1);
                }}
                className="absolute left-1/2 top-0 w-[78%] max-w-3xl cursor-pointer md:w-[62%]"
                animate={{
                  x: `calc(-50% + ${offset * 58}%)`,
                  scale: isActive ? 1 : 0.85,
                  opacity: hidden ? 0 : isActive ? 1 : 0.55,
                  zIndex: isActive ? 2 : 1,
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: DURATION.base, ease: EASE_STANDARD }
                }
                style={{ pointerEvents: hidden ? "none" : "auto" }}
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-primary shadow-card">
                  <AutoplayVideo
                    src={clip.src}
                    ariaLabel={topicLabel}
                    loadOnScroll
                    paused={!isActive}
                  />
                </div>
                <span className="mt-3 inline-flex rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-nav">
                  {topicLabel}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={t("prev")}
            className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            <ChevronLeft className="size-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={t("next")}
            className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            <ChevronRight className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/bai-hoc"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            {t("cta")}
            <ArrowRight className="size-4" strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </AnimatedSection>
  );
}
