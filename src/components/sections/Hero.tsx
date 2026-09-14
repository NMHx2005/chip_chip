"use client";

import { useState, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  AnimatedButtonLabel,
  ScrollReveal3D,
  VideoHoverCard,
  staggerContainer,
  staggerItem,
  useSharedScrollProgress,
  useVideoHoverCard,
} from "@/components/motion";
import { AutoplayVideo } from "@/components/ui/AutoplayVideo";
import { PillButton } from "@/components/ui/PillButton";
import { HOME_VIDEO, HOME_VIDEO_CREDIT } from "@/lib/constants";

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3.5 py-1.5 text-[13px] font-medium text-accent">
      <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden="true">
        <path
          d="M6 0c.4 3.1 2.9 5.6 6 6-3.1.4-5.6 2.9-6 6-.4-3.1-2.9-5.6-6-6 3.1-.4 5.6-2.9 6-6Z"
          fill="currentColor"
        />
      </svg>
      {label}
    </span>
  );
}

/**
 * Homepage opening: headline, calls to action, and the intro clip that stands
 * upright as the reader scrolls to it.
 *
 * The headline and the clip share one scroll timeline — the title recedes on
 * the clip's progress, not its own. Measuring them separately lets the two
 * drift apart, and the drift is what makes a page feel assembled rather than
 * composed.
 *
 * Entrance runs on mount rather than on `whileInView`: this block is already
 * on screen when the page loads, so waiting for a scroll would leave it blank.
 */
export function Hero() {
  const t = useTranslations("home.hero");
  const prefersReducedMotion = useReducedMotion();
  const [ctaHovered, setCtaHovered] = useState(false);
  const { targetRef, scrollYProgress } = useSharedScrollProgress();
  const { cardVisible, onVideoEnter, onVideoLeave } = useVideoHoverCard();

  const titleOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.7, 0]);
  const titleScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const recede = prefersReducedMotion
    ? undefined
    : { opacity: titleOpacity, scale: titleScale };

  return (
    <section className="px-5 pb-4 md:px-8">
      {/*
        Fills the viewport below the fixed navbar and centers the headline
        block vertically inside it. Height is a *minimum*, not fixed: on a
        short viewport the content simply grows past it instead of clipping.
        68px/76px mirrors Navbar's own spacer (src/components/layout/Navbar.tsx)
        exactly, so this block's bottom always lands on the viewport's bottom
        edge (or lower, if content overflows) — which is what keeps the video
        below entirely off-screen on load.
      */}
      <div className="flex min-h-[calc(100dvh-68px)] flex-col items-center justify-center md:min-h-[calc(100dvh-76px)]">
        <motion.div
          variants={staggerContainer}
          initial={prefersReducedMotion ? undefined : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          style={recede}
          className="mx-auto flex w-full max-w-content flex-col items-center text-center"
        >
          <motion.div
            variants={staggerItem}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            <Badge label={t("badge1")} />
            <Badge label={t("badge2")} />
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="mt-6 max-w-4xl text-balance text-[32px] font-extrabold leading-[1.12] tracking-[-0.03em] text-text sm:text-[44px] md:text-[56px] lg:text-[64px]"
          >
            {t("headlinePart1")}{" "}
            <span className="text-gradient-brand">{t("headlinePart2")}</span>
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-text-muted md:text-lg"
          >
            {t("description")}
          </motion.p>

          <motion.div
            variants={staggerItem}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <span
              onMouseEnter={() => setCtaHovered(true)}
              onMouseLeave={() => setCtaHovered(false)}
            >
              <PillButton href="/bai-hoc" size="lg" className="px-6">
                <AnimatedButtonLabel active={ctaHovered}>
                  {t("ctaPrimary")}
                </AnimatedButtonLabel>
              </PillButton>
            </span>
            <PillButton href="/gioi-thieu" variant="outline" size="lg">
              {t("ctaSecondary")}
            </PillButton>
          </motion.div>
        </motion.div>
      </div>

      <div
        // React's ref attribute requires RefObject<HTMLDivElement> exactly,
        // but targetRef is legitimately nullable (holds null before mount).
        ref={targetRef as RefObject<HTMLDivElement>}
        className="mx-auto mt-14 w-full max-w-content"
      >
        <ScrollReveal3D targetRef={targetRef}>
          <figure className="m-0">
            <div
              className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-primary shadow-card md:rounded-3xl"
              onMouseEnter={onVideoEnter}
              onMouseLeave={onVideoLeave}
            >
              <AutoplayVideo
                src={HOME_VIDEO}
                ariaLabel={t("videoAriaLabel")}
                loadOnScroll
                mobileTapFullscreen
              />
              <AnimatePresence>
                {cardVisible && (
                  <VideoHoverCard
                    key="hero-video-card"
                    label={t("hoverCardLabel")}
                    sublabel={t("hoverCardSublabel")}
                  />
                )}
              </AnimatePresence>
            </div>

            <figcaption className="mx-auto mt-4 max-w-2xl text-center text-sm text-text-muted">
              {t("videoCaption")}
              {HOME_VIDEO_CREDIT && (
                <>
                  {" · "}
                  {/* External URL (YouTube) — next-intl's Link only accepts
                      internal pathnames declared in i18n/routing.ts. */}
                  <a
                    href={HOME_VIDEO_CREDIT.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 hover:text-brand-600"
                  >
                    {HOME_VIDEO_CREDIT.label}
                  </a>
                </>
              )}
            </figcaption>
          </figure>
        </ScrollReveal3D>
      </div>
    </section>
  );
}
