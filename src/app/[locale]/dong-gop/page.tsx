import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Clapperboard, Flag, Languages, PenLine, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/sections/PageHero";
import type { Locale } from "@/i18n/routing";
import { localeAlternates } from "@/lib/seo";

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

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <section className="px-5 pb-16 md:px-8 md:pb-20">
        <div className="mx-auto w-full max-w-content">
        <ul className="grid gap-4 sm:grid-cols-2">
          {WAYS.map(({ id, icon: Icon }) => (
            <li
              key={id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 md:p-7"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-surface-muted">
                <Icon className="size-5 text-accent" strokeWidth={2} aria-hidden />
              </span>
              <h2 className="text-lg font-bold tracking-[-0.01em] text-text">{t(`ways.${id}.title`)}</h2>
              <p className="text-sm leading-relaxed text-text-muted">{t(`ways.${id}.body`)}</p>
              <Link
                href="/lien-he"
                className="mt-auto inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-black"
              >
                {t("cta")}
                <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 max-w-2xl text-pretty text-sm leading-relaxed text-text-muted">{t("note")}</p>
        </div>
      </section>
    </>
  );
}
