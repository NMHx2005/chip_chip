"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AnimatedButtonLabel,
  DURATION,
  EASE_STANDARD,
  VIEWPORT_ONCE,
  fadeUp,
  staggerContainer,
} from "@/components/motion";
import { CircularText } from "@/components/ui/CircularText";
import { Link } from "@/i18n/navigation";
import {
  CONTACT_EMAIL,
  CTA_BACKDROP,
  JOIN_FORM_URL,
  NAV_ITEMS,
} from "@/lib/constants";

/**
 * Closing block of the homepage, built to Strike's CTA layout: a black card
 * with a full-bleed backdrop, the rotating badge cropped by the right edge,
 * centred copy on a minimum height, and the site links sitting inside the card
 * along its bottom-left.
 *
 * The links live here rather than in the footer because the footer is a single
 * row now (see Footer.tsx) — this is the only place on the page that carries
 * the full navigation.
 */
export function JoinCta() {
  const t = useTranslations("home.join");
  const tNav = useTranslations("nav");
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  return (
    <section
      id="join"
      aria-label={t("headline")}
      className="cv-auto px-5 py-16 md:px-8 md:py-24"
    >
      <div className="mx-auto w-full max-w-content">
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-black"
          // Fixed floor rather than a height: the block is a card, and on a
          // narrow screen the copy simply grows past it.
          style={{ minHeight: 423 }}
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: DURATION.slow, ease: EASE_STANDARD }}
        >
          <Image
            src={CTA_BACKDROP}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-center"
          />

          {/* Cropped by the card's right edge, exactly as in Strike. Held back
              below `lg`: at tablet width the card is not wide enough for the
              ring and it cuts straight through the headline. */}
          <CircularText
            text={t("badge")}
            diameter={220}
            fontSize={16}
            letterSpacing={0.2}
            durationSeconds={28}
            className="absolute -right-[10%] top-[25%] hidden h-[180px] w-[180px] text-white opacity-60 lg:block xl:h-[220px] xl:w-[220px]"
          />

          <motion.div
            variants={prefersReducedMotion ? undefined : staggerContainer}
            initial={prefersReducedMotion ? undefined : "hidden"}
            whileInView={prefersReducedMotion ? undefined : "visible"}
            viewport={VIEWPORT_ONCE}
            className="relative z-10 flex min-h-[423px] flex-col items-start justify-center px-7 py-16 text-left md:items-center md:px-8 md:py-20 md:text-center"
          >
            <motion.h2
              variants={prefersReducedMotion ? undefined : fadeUp}
              className="max-w-2xl text-balance text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-[34px] md:text-[42px]"
            >
              {t("headline")}
            </motion.h2>

            <motion.p
              variants={prefersReducedMotion ? undefined : fadeUp}
              className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-white/85 md:text-base"
            >
              {t("description")}
            </motion.p>

            <motion.div
              variants={prefersReducedMotion ? undefined : fadeUp}
              className="mt-9 flex flex-col items-start gap-3 md:items-center"
            >
              {/* Until the form exists there is nothing to click. A disabled
                  pill still reads as a button and invites a tap that does
                  nothing, so the pending state is plain text instead. */}
              {JOIN_FORM_URL ? (
                <>
                  <a
                    href={JOIN_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    className="inline-flex h-[52px] items-center gap-2 rounded-3xl bg-white px-6 text-base font-semibold text-accent transition-transform duration-200 hover:scale-[1.02]"
                  >
                    <AnimatedButtonLabel active={hovered}>
                      {t("formCta")}
                    </AnimatedButtonLabel>
                    <ArrowUpRight className="size-[18px]" strokeWidth={2.2} />
                  </a>
                  <p className="text-xs text-white/85">{t("formNote")}</p>
                </>
              ) : (
                <p className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-white/40 px-5 py-3 text-sm text-white/90">
                  <Clock className="size-4 shrink-0" strokeWidth={2} />
                  {t("formPending")}
                </p>
              )}

              {CONTACT_EMAIL && (
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-mono text-xs text-white/75 underline underline-offset-4 transition-colors hover:text-white"
                >
                  {CONTACT_EMAIL}
                </a>
              )}
            </motion.div>

            {/* Bottom-left on desktop, a centred row under the button on
                tablets, stacked on phones — Strike's arrangement, except at
                `md`, where its absolute column lands in the same band as the
                centred button and the two read as a collision. */}
            <motion.nav
              aria-label={tNav("quickLinks")}
              variants={prefersReducedMotion ? undefined : fadeUp}
              className="z-10 mt-10 flex w-full flex-col gap-5 text-[16px] tracking-[-0.16px] text-white/70 md:mt-12 md:flex-row md:flex-wrap md:items-center md:justify-center md:gap-x-8 md:gap-y-3 md:text-[15px] md:tracking-normal md:text-white/75 lg:absolute lg:bottom-10 lg:left-12 lg:mt-0 lg:w-auto lg:flex-col lg:items-start lg:gap-3"
            >
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="w-fit text-left transition-colors hover:text-white"
                >
                  {tNav(item.key)}
                </Link>
              ))}
            </motion.nav>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
