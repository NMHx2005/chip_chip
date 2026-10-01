import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Clapperboard, Flag, Info, Languages, PenLine, type LucideIcon } from "lucide-react";
import { WayCard } from "@/components/contribute/WayCard";
import { Link } from "@/i18n/navigation";
import { CardReveal } from "@/components/motion";
import { PageHero } from "@/components/sections/PageHero";
import type { Locale } from "@/i18n/routing";
import { localeAlternates } from "@/lib/seo";
import { cn } from "@/lib/utils";

const WAYS: { id: "write" | "translate" | "video" | "report"; icon: LucideIcon }[] = [
  { id: "write", icon: PenLine },
  { id: "translate", icon: Languages },
  { id: "video", icon: Clapperboard },
  { id: "report", icon: Flag },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contribute" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/dong-gop", locale as Locale),
  };
}

export default async function ContributePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contribute");
  // An odd number of cards leaves the last one alone on its row; let it span.
  const loneCard = WAYS.length % 2 === 1;

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <section className="px-5 pb-16 md:px-8 md:pb-20">
        <div className="mx-auto w-full max-w-content">
          {/* Keeps the card titles (h3) from skipping a level under the hero's h1. */}
          <h2 className="sr-only">{t("waysHead")}</h2>

          <ul className="grid gap-4 sm:grid-cols-2">
            {WAYS.map(({ id, icon }, index) => (
              <li
                key={id}
                className={cn("flex", loneCard && index === WAYS.length - 1 && "sm:col-span-2")}
              >
                <CardReveal index={index} columns={2} className="flex w-full">
                  <WayCard
                    icon={icon}
                    title={t(`ways.${id}.title`)}
                    body={t(`ways.${id}.body`)}
                    ctaLabel={t("cta")}
                    index={index}
                  />
                </CardReveal>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-4 rounded-3xl border border-border bg-white/50 p-5 sm:flex-row sm:items-start md:p-7">
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-muted text-accent"
            >
              <Info className="size-5" strokeWidth={2} />
            </span>
            <div className="flex flex-col gap-2">
              <p className="text-pretty text-base leading-relaxed text-text-muted">{t("note")}</p>
              <Link
                href="/gioi-thieu"
                className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold text-accent underline underline-offset-4 transition-colors duration-fast ease-standard [@media(hover:hover)]:hover:text-black"
              >
                {t("noteLink")}
                <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
