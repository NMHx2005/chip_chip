import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthorSection } from "@/components/sections/about/AuthorSection";
import { Commitments } from "@/components/sections/about/Commitments";
import { ContributeCta } from "@/components/sections/about/ContributeCta";
import { Contributors } from "@/components/sections/about/Contributors";
import { Faq } from "@/components/sections/about/Faq";
import { MediaSlot } from "@/components/sections/about/MediaSlot";
import { PageHero } from "@/components/sections/PageHero";
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
      <PageHero eyebrow={t("eyebrow")} title={t("hero.headline")} description={t("hero.description")}>
        {/* Placeholder art — see ABOUT_BANNER in lib/constants.ts. */}
        <MediaSlot
          src={ABOUT_BANNER}
          alt=""
          sizes="(max-width: 1024px) 100vw, 560px"
          className="lg:w-[560px] lg:shrink-0"
        />
      </PageHero>

      <AuthorSection />
      <Commitments />
      <Faq />
      <Contributors />
      <ContributeCta />
    </>
  );
}
