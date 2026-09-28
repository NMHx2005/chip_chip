import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PRIVACY_UPDATED } from "@/lib/constants";
import { localeAlternates } from "@/lib/seo";

/**
 * Every sentence here describes what the code does today — see the DA4 plan
 * (Task 5) for the file each claim was checked against. Change the copy when
 * the behaviour changes, and move PRIVACY_UPDATED with it.
 */
const SECTIONS = [
  { id: "collect", items: ["comments", "messages", "ip", "none"] },
  { id: "device", items: ["locale", "local", "video", "staff"] },
  { id: "use", items: ["purpose", "never"] },
  { id: "retention", items: ["counter", "content"] },
  { id: "sharing", items: ["sell", "host", "translate"] },
  { id: "rights", items: ["request"] },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/chinh-sach-bao-mat", locale as Locale),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, format] = await Promise.all([getTranslations("privacy"), getFormatter()]);

  return (
    <article className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <header>
          <h1 className="text-balance text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-text md:text-[44px]">
            {t("title")}
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-text-muted">{t("description")}</p>
          <p className="mt-3 text-sm text-text-muted">
            <time dateTime={PRIVACY_UPDATED}>
              {t("updated", {
                date: format.dateTime(new Date(`${PRIVACY_UPDATED}T00:00:00Z`), {
                  dateStyle: "long",
                  timeZone: "UTC",
                }),
              })}
            </time>
          </p>
        </header>

        {SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={`privacy-${section.id}`} className="mt-10">
            <h2
              id={`privacy-${section.id}`}
              className="text-xl font-bold tracking-[-0.01em] text-text"
            >
              {t(`sections.${section.id}.title`)}
            </h2>
            <ul className="mt-4 flex list-disc flex-col gap-3 pl-5 text-[15px] leading-relaxed text-text-nav marker:text-text-muted">
              {section.items.map((item) => (
                <li key={item}>{t(`sections.${section.id}.items.${item}`)}</li>
              ))}
            </ul>
          </section>
        ))}

        <Link
          href="/lien-he"
          className="mt-10 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
        >
          {t("contactLink")}
        </Link>
      </div>
    </article>
  );
}
