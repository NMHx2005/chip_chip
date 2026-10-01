import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { AuthorSection } from "@/components/sections/about/AuthorSection";
import { Commitments } from "@/components/sections/about/Commitments";
import { ContributeCta } from "@/components/sections/about/ContributeCta";
import { Contributors } from "@/components/sections/about/Contributors";
import { Faq } from "@/components/sections/about/Faq";
import { MediaSlot } from "@/components/sections/about/MediaSlot";
import { PageHero } from "@/components/sections/PageHero";
import { SignupForm } from "@/components/signup/SignupForm";
import { Link } from "@/i18n/navigation";
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
    description: t("metaDescription"),
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

      <section aria-labelledby="about-join" className="px-5 py-14 md:px-8 md:py-16">
        <div className="mx-auto w-full max-w-content">
          <div className="grid gap-8 rounded-3xl border border-border bg-surface p-6 md:grid-cols-[1fr_1.2fr] md:gap-12 md:p-12">
            <div className="max-w-md">
              <h2
                id="about-join"
                className="text-balance text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text md:text-[34px]"
              >
                {t("join.headline")}
              </h2>
              <p className="mt-4 text-pretty text-base leading-relaxed text-text-muted">
                {t("join.lead")}
              </p>
              <Link
                href="/dang-ky"
                className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent underline underline-offset-4 transition-colors duration-fast ease-standard [@media(hover:hover)]:hover:text-black"
              >
                {t("join.link")}
                <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />
              </Link>
            </div>

            <SignupForm />
          </div>
        </div>
      </section>

      <ContributeCta />
    </>
  );
}
