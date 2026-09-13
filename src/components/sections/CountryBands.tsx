"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { EASE_STANDARD } from "@/components/motion";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { COUNTRY_BANDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function CountryBandRow({
  band,
  index,
  prefersReducedMotion,
}: {
  band: (typeof COUNTRY_BANDS)[number];
  index: number;
  prefersReducedMotion: boolean | null;
}) {
  const t = useTranslations("countries");
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl border border-black/[0.06]"
      style={{ background: band.tone }}
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: EASE_STANDARD, delay: index * 0.07 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Deepen the tint on hover so the focused band lifts visually */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-300"
        style={{ opacity: hovered ? 0.06 : 0 }}
      />

      <div className="relative flex flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8 md:py-9">
        <h3 className="text-balance text-[28px] font-extrabold uppercase leading-none tracking-[-0.02em] text-text/90 sm:text-[34px] md:text-[40px]">
          {t(band.labelKey)}
        </h3>

        <ul className="flex flex-wrap items-center gap-x-2.5 gap-y-2 sm:justify-end">
          {band.companies.map((company) => (
            <li key={company}>
              <span
                className={cn(
                  "inline-flex rounded-full border border-black/10 bg-white/60 px-3.5 py-1.5 text-[13px] font-semibold text-text/80 backdrop-blur-sm transition-all duration-300 sm:text-sm",
                  hovered && "border-black/15 bg-white/90 text-text"
                )}
              >
                {company}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export function CountryBands() {
  const t = useTranslations("home.countries");
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="countries"
      aria-label={t("headline")}
      className="px-5 py-16 md:px-8 md:py-24"
    >
      <div className="mx-auto w-full max-w-content">
        <SectionHeading
          namespace="home.countries"
          titleKey="headline"
          descriptionKey="description"
        />

        <div className="mt-10 flex flex-col gap-3 md:mt-14">
          {COUNTRY_BANDS.map((band, index) => (
            <CountryBandRow
              key={band.id}
              band={band}
              index={index}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-text-muted">
          {t("note")}
        </p>
      </div>
    </section>
  );
}
