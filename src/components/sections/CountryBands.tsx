"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { EASE_STANDARD } from "@/components/motion";
import { CountryVideo } from "@/components/sections/CountryVideo";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { COUNTRY_BANDS } from "@/lib/constants";

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
  const tc = useTranslations("home.countries");
  const country = t(band.labelKey);

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl border border-black/[0.06]"
      style={{ background: band.tone }}
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: EASE_STANDARD, delay: index * 0.07 }}
    >
      <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] md:items-center">
        <div className="relative min-h-[7rem]">
          <div
            aria-hidden
            className="relative mb-3 h-24 w-40 sm:absolute sm:inset-y-0 sm:left-0 sm:mb-0 sm:h-auto sm:w-52"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={band.flag}
              alt=""
              loading="lazy"
              className="absolute left-0 top-1/2 h-16 -translate-y-1/2 rounded-md object-cover shadow-sm"
            />
            {/* The map overlaps the flag: flag first, map on top. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={band.map}
              alt=""
              loading="lazy"
              className="absolute left-10 top-1/2 h-24 -translate-y-1/2 object-contain opacity-90 mix-blend-multiply"
            />
          </div>

          <div className="relative sm:pl-56">
            <h3 className="text-[26px] font-extrabold uppercase leading-none tracking-[-0.02em] text-text/90 sm:text-[32px]">
              {country}
            </h3>
            {/* Logos reveal on hover or keyboard focus. Where hover does not
                exist (touch) they are always shown, so nothing is unreachable. */}
            <ul className="mt-3 flex max-h-0 flex-wrap gap-2 overflow-hidden opacity-0 transition-all duration-300 group-focus-within:max-h-56 group-focus-within:opacity-100 group-hover:max-h-56 group-hover:opacity-100 motion-reduce:transition-none [@media(hover:none)]:max-h-56 [@media(hover:none)]:opacity-100">
              {band.companies.map((company) => (
                <li key={company.name}>
                  <a
                    href={company.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={tc("openSite", { company: company.name })}
                    className="inline-flex h-9 items-center rounded-full border border-black/10 bg-white/80 px-3.5 text-sm font-semibold text-text/80 transition-colors [@media(hover:hover)]:hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
                  >
                    {company.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={company.logo}
                        alt={company.name}
                        loading="lazy"
                        className="h-4 w-auto"
                      />
                    ) : (
                      company.name
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <CountryVideo
          clip={band.clip}
          title={tc("videoTitle", { country })}
          playLabel={tc("playVideo", { country })}
        />
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
