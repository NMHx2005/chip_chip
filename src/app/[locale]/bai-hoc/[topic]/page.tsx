import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { PostCard } from "@/components/forum/PostCard";
import { Link } from "@/i18n/navigation";
import { listLessonPosts } from "@/lib/queries/posts";
import { localeAlternates } from "@/lib/seo";
import { TOPIC_IDS, TOPIC_TONE, type TopicId } from "@/lib/constants";
import type { Locale } from "@/i18n/routing";

type Params = Promise<{ locale: string; topic: string }>;

export function generateStaticParams() {
  return TOPIC_IDS.map((topic) => ({ topic }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, topic } = await params;
  if (!TOPIC_IDS.includes(topic as TopicId)) return {};

  const t = await getTranslations({ locale, namespace: "topics" });
  return {
    title: t(`${topic as TopicId}.title`),
    description: t(`${topic as TopicId}.description`),
    alternates: localeAlternates(
      { pathname: "/bai-hoc/[topic]", params: { topic } },
      locale as Locale
    ),
  };
}

export default async function TopicPage({ params }: { params: Params }) {
  const { locale, topic } = await params;
  setRequestLocale(locale);

  if (!TOPIC_IDS.includes(topic as TopicId)) notFound();

  const topicId = topic as TopicId;
  const t = await getTranslations("topics");
  const tLessons = await getTranslations("lessons");
  const tone = TOPIC_TONE[topicId];

  const posts = await listLessonPosts(locale as Locale, topicId);

  return (
    <section className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-content">
        <Link
          href="/bai-hoc"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-4" strokeWidth={2.2} />
          {tLessons("backToLessons")}
        </Link>

        <header className="mt-8 max-w-2xl">
          <span
            className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: tone.soft, color: tone.text }}
          >
            {tLessons("tabTheory")}
          </span>

          <h1 className="mt-4 text-balance text-[30px] font-extrabold leading-tight tracking-[-0.03em] text-text md:text-[42px]">
            {t(`${topicId}.title`)}
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-text-muted">
            {t(`${topicId}.description`)}
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-text-muted">
            {t("empty")}
          </p>
        ) : (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
