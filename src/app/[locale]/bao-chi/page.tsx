import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import { localeAlternates } from "@/lib/seo";

const SECTIONS = [
  { id: "about", body: "aboutBody" },
  { id: "credit", body: "creditBody" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "press" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/bao-chi", locale as Locale),
  };
}

export default async function PressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("press");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <article className="px-5 pb-16 md:px-8 md:pb-20">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-surface px-6 py-10 md:px-12 md:py-12">
          {SECTIONS.map((section) => (
            <section key={section.id} aria-labelledby={`press-${section.id}`} className="mt-10 first:mt-0">
              <h2
                id={`press-${section.id}`}
                tabIndex={-1}
                className="text-balance text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-text [overflow-wrap:anywhere] focus:outline-none md:text-h2"
              >
                {t(`${section.id}Title`)}
              </h2>
              <p className="mt-4 text-pretty text-base leading-[1.7] text-[#262626]">
                {t(section.body)}
              </p>
            </section>
          ))}

          <section aria-labelledby="press-contact" className="mt-10">
            <h2
              id="press-contact"
              tabIndex={-1}
              className="text-balance text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-text [overflow-wrap:anywhere] focus:outline-none md:text-h2"
            >
              {t("contactTitle")}
            </h2>
            <p className="mt-4 text-pretty text-base leading-[1.7] text-[#262626]">
              {t("contactBody")}
            </p>
            <div className="mt-6">
              <Button href="/lien-he" arrow className="w-full sm:w-auto">
                {t("contactLink")}
              </Button>
            </div>
          </section>

          <p className="mt-10 border-t border-hairline pt-6 text-sm leading-relaxed text-text-muted">
            {t("mentionsNote")}
          </p>
        </div>
      </article>
    </>
  );
}
