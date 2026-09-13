import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { listLessonPosts } from "@/lib/queries/posts";
import { localeAlternates } from "@/lib/seo";
import { TOPIC_IDS, TOPIC_TONE } from "@/lib/constants";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "lessons" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/bai-hoc", locale as Locale),
  };
}

export default async function LessonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: { tab?: string };
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("lessons");
  const tTopics = await getTranslations("topics");
  const tab = searchParams.tab === "video" ? "video" : "theory";

  const posts = await listLessonPosts(locale as Locale);

  return (
    <section className="px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-content">
        <header className="max-w-2xl">
          <h1 className="text-balance text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-text md:text-[44px]">
            {t("title")}
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-text-muted">
            {t("description")}
          </p>
        </header>

        <div
          role="tablist"
          className="mt-8 flex gap-1 rounded-xl border border-border bg-surface p-1 w-fit"
        >
          {(
            [
              { key: "theory", label: t("tabTheory") },
              { key: "video", label: t("tabVideo") },
            ] as const
          ).map((item) => (
            <Link
              key={item.key}
              href={{
                pathname: "/bai-hoc",
                query: item.key === "video" ? { tab: "video" } : {},
              }}
              role="tab"
              aria-selected={tab === item.key}
              className={cn(
                "rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors",
                tab === item.key
                  ? "bg-primary text-white"
                  : "text-text-nav hover:bg-surface-muted"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {tab === "video" ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-20 text-center">
            <PlayCircle className="size-8 text-text-muted" strokeWidth={1.6} />
            <p className="max-w-md text-sm text-text-muted">
              {t("videoComingSoon")}
            </p>
            <p className="max-w-md text-xs text-text-muted">
              {t("videoDescription")}
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {TOPIC_IDS.map((topic) => {
              const tone = TOPIC_TONE[topic];
              const count = posts.filter((p) => p.topic === topic).length;

              return (
                <Link
                  key={topic}
                  href={{ pathname: "/bai-hoc/[topic]", params: { topic } }}
                  className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:shadow-card-hover"
                  style={{ borderTopColor: tone.bg, borderTopWidth: 4 }}
                >
                  <span
                    className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: tone.soft, color: tone.text }}
                  >
                    {count > 0
                      ? t("tabTheory") + ` · ${count}`
                      : t("tabTheory")}
                  </span>

                  <h2 className="text-balance text-lg font-bold tracking-[-0.01em] text-text">
                    {tTopics(`${topic}.title`)}
                  </h2>

                  <p className="text-sm leading-relaxed text-text-muted">
                    {tTopics(`${topic}.description`)}
                  </p>

                  <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-accent transition-transform duration-300 group-hover:translate-x-0.5">
                    {t("tabTheory")}
                    <ArrowRight className="size-4" strokeWidth={2.2} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
