import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthorSection } from "@/components/sections/about/AuthorSection";
import { Commitments } from "@/components/sections/about/Commitments";
import { ContributeCta } from "@/components/sections/about/ContributeCta";
import { Contributors } from "@/components/sections/about/Contributors";
import { Faq } from "@/components/sections/about/Faq";
import { localeAlternates } from "@/lib/seo";
import { ABOUT_BANNER } from "@/lib/constants";
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

  return (
    <>
      <section className="px-5 pb-10 pt-14 md:px-8 md:pt-20">
        <div className="mx-auto grid w-full max-w-content items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <header className="max-w-3xl">
            <p className="rise-in mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />
              {t("eyebrow")}
            </p>
            <h1 className="text-balance text-[32px] font-extrabold leading-[1.12] tracking-[-0.03em] text-text md:text-[48px]">
              {t("hero.headline")}
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-text-muted md:text-lg">
              {t("hero.description")}
            </p>
          </header>

          {/* The page opened with nothing but type; this gives it something to
              look at before the reader starts reading. Placeholder art — see
              ABOUT_BANNER in lib/constants.ts. */}
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-3xl border border-border bg-surface-muted">
            <Image
              src={ABOUT_BANNER}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <AuthorSection />
      <Commitments />
      <Faq />
      <Contributors />
      <ContributeCta />
    </>
  );
}
