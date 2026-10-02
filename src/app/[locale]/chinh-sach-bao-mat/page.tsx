import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Calendar } from "lucide-react";
import { TocRail } from "@/components/forum/TocRail";
import { DocTocTrail } from "@/components/legal/DocTocTrail";
import { PageHero } from "@/components/sections/PageHero";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { localeAlternates } from "@/lib/seo";

/**
 * Every sentence here describes what the code does today — see the DA4 plan
 * (Task 5) for the file each claim was checked against. Change the copy when
 * the behaviour changes, and move the "privacy updated" date with it (now
 * editable at /admin/cai-dat, defaulting to PRIVACY_UPDATED in constants.ts).
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

  const [t, format, settings] = await Promise.all([
    getTranslations("privacy"),
    getFormatter(),
    getSiteSettings(),
  ]);
  const privacyUpdated = settings.privacyUpdated;

  const entries = SECTIONS.map((section) => ({
    id: `privacy-${section.id}`,
    text: t(`sections.${section.id}.title`),
    level: 2,
  }));
  const updated = format.dateTime(new Date(`${privacyUpdated}T00:00:00Z`), {
    dateStyle: "long",
    timeZone: "UTC",
  });

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <section className="px-5 pb-16 md:px-8 md:pb-20">
        <div className="mx-auto w-full max-w-content">
          <DocTocTrail label={t("tocHead")} entries={entries} className="mb-6" />

          <div className="flex gap-10">
            <aside className="hidden w-[260px] shrink-0 lg:block">
              <div className="sticky top-24">
                <p aria-hidden className="mb-2 text-sm font-bold text-text">
                  {t("tocHead")}
                </p>
                <TocRail label={t("tocHead")} entries={entries} />
              </div>
            </aside>

            <article className="min-w-0 flex-1 rounded-3xl border border-border bg-surface px-5 py-8 lg:px-14 lg:py-12">
              <div className="mx-auto max-w-[768px]">
                <p className="flex items-center gap-2 border-b border-hairline pb-6 text-sm tabular-nums text-text-muted">
                  <Calendar aria-hidden className="size-4 shrink-0" strokeWidth={2} />
                  <time dateTime={privacyUpdated}>{t("updated", { date: updated })}</time>
                </p>

                {SECTIONS.map((section, index) => (
                  <section
                    key={section.id}
                    aria-labelledby={`privacy-${section.id}`}
                    className="mt-8 md:mt-10"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-extrabold tabular-nums text-[#262626] md:size-8 md:text-[13px]"
                      >
                        {index + 1}
                      </span>
                      <h2
                        id={`privacy-${section.id}`}
                        tabIndex={-1}
                        className="text-balance text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-text [overflow-wrap:anywhere] focus:outline-none md:text-h2"
                      >
                        {t(`sections.${section.id}.title`)}
                      </h2>
                    </div>
                    <ul
                      role="list"
                      className="mt-4 flex flex-col gap-3.5 text-base leading-[1.7] text-[#262626]"
                    >
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="relative pl-[22px] [overflow-wrap:anywhere] before:absolute before:left-0 before:top-[0.62em] before:size-1.5 before:rounded-full before:bg-[#8C8C8C] before:content-['']"
                        >
                          {t(`sections.${section.id}.items.${item}`)}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}

                <div className="mt-10 border-t border-hairline pt-8">
                  <Button href="/lien-he" arrow className="w-full sm:w-auto">
                    {t("contactLink")}
                  </Button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
