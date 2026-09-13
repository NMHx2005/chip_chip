import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check } from "lucide-react";
import { JoinFormEmbed } from "@/components/sections/about/JoinFormEmbed";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { TeamStructure } from "@/components/sections/about/TeamStructure";
import { localeAlternates } from "@/lib/seo";
import { JOIN_FORM_URL } from "@/lib/constants";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    description: t("hero.description"),
    alternates: localeAlternates("/gioi-thieu", locale as Locale),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const benefits = [
    t("join.benefit1"),
    t("join.benefit2"),
    t("join.benefit3"),
    t("join.benefit4"),
  ];

  return (
    <>
      <section className="px-5 pb-10 pt-14 md:px-8 md:pt-20">
        <div className="mx-auto w-full max-w-content">
          <header className="max-w-3xl">
            <h1 className="text-balance text-[32px] font-extrabold leading-[1.12] tracking-[-0.03em] text-text md:text-[48px]">
              {t("hero.headline")}
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-text-muted md:text-lg">
              {t("hero.description")}
            </p>
          </header>
        </div>
      </section>

      <section
        aria-label={t("mission.headline")}
        className="px-5 py-14 md:px-8 md:py-16"
      >
        <div className="mx-auto w-full max-w-content">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-12 md:px-14 md:py-16">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-1 bg-brand-gradient md:inset-y-0 md:left-0 md:right-auto md:h-full md:w-1"
            />
            <SectionHeading
              namespace="about.mission"
              titleKey="headline"
              descriptionKey="body"
            />
          </div>
        </div>
      </section>

      <TeamStructure />

      <section
        aria-label={t("join.headline")}
        className="px-5 py-14 md:px-8 md:py-20"
      >
        <div className="mx-auto grid w-full max-w-content gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text md:text-[34px]">
              {t("join.headline")}
            </h2>
            <p className="mt-4 text-pretty text-[15px] leading-relaxed text-text-muted md:text-base">
              {t("join.description")}
            </p>

            <ul className="mt-7 flex flex-col gap-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-100">
                    <Check
                      className="size-3 text-brand-600"
                      strokeWidth={3}
                      aria-hidden
                    />
                  </span>
                  <span className="text-sm leading-relaxed text-text-nav">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <JoinFormEmbed url={JOIN_FORM_URL} />
          </div>
        </div>
      </section>
    </>
  );
}
