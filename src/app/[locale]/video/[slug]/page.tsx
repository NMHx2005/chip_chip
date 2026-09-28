import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, BookOpen, ExternalLink, Languages } from "lucide-react";
import { ReportMistake } from "@/components/contact/ReportMistake";
import { ArticleBody } from "@/components/forum/ArticleBody";
import {
  CommentSection,
  MAX_ROOT_COMMENTS,
  ROOT_PAGE_SIZE,
} from "@/components/forum/CommentSection";
import { VideoFacades } from "@/components/forum/VideoFacades";
import { articleLanguageAlternates } from "@/lib/article-alternates";
import { Link, getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { TOPIC_TONE } from "@/lib/constants";
import { firstParam, type SearchParams } from "@/lib/listing-params";
import {
  countComments,
  getLessonByTranslation,
  getTranslationSlug,
  getVideoBySlug,
  listComments,
} from "@/lib/queries/posts";
import { articleToPlainText } from "@/lib/tiptap/render";
import { videoFacadeHtml } from "@/lib/tiptap/video-embed";
import { PLATFORM_LABEL, videoRefFrom, watchUrl } from "@/lib/video";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getVideoBySlug(locale as Locale, slug);

  if (!post) return { title: "404" };

  const description = post.excerpt || articleToPlainText(post.content, 160) || undefined;

  return {
    title: post.title,
    description,
    // The image comes from the sibling opengraph-image.tsx route.
    openGraph: {
      type: "video.other",
      title: post.title,
      description,
    },
    alternates: {
      // Same approach as the blog and lesson pages: the path is built through
      // next-intl's localized routing. A missing translation is left out of
      // `languages` rather than pointed at the listing page.
      canonical: getPathname({
        href: { pathname: "/video/[slug]", params: { slug: post.slug } },
        locale: locale as Locale,
      }),
      languages: articleLanguageAlternates(
        Object.fromEntries(
          await Promise.all(
            routing.locales.map(async (l) => {
              const alt = await getTranslationSlug(post.translationId, l);
              return [
                l,
                alt
                  ? getPathname({ href: { pathname: "/video/[slug]", params: { slug: alt } }, locale: l })
                  : null,
              ];
            })
          )
        ),
        routing.defaultLocale
      ),
    },
  };
}

export default async function VideoPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // `?comments=N` reveals more root comments; capped exactly as on the blog.
  const rootLimit = Math.min(
    Math.max(ROOT_PAGE_SIZE, Number(firstParam(searchParams.comments) ?? "0") || 0),
    MAX_ROOT_COMMENTS
  );

  const post = await getVideoBySlug(locale as Locale, slug);
  if (!post) notFound();

  const [t, tForum, tTopics, tDifficulty, format] = await Promise.all([
    getTranslations("videos"),
    getTranslations("forum"),
    getTranslations("topics"),
    getTranslations("difficulty"),
    getFormatter(),
  ]);

  const otherLocales = routing.locales.filter((l) => l !== locale);
  const [{ comments, totalRoots }, commentCount, lesson, alternates] = await Promise.all([
    listComments(post.id, { rootLimit }),
    countComments(post.id),
    post.relatedLessonTranslationId
      ? getLessonByTranslation(locale as Locale, post.relatedLessonTranslationId)
      : Promise.resolve(null),
    Promise.all(
      otherLocales.map(async (l) => ({ locale: l, slug: await getTranslationSlug(post.translationId, l) }))
    ),
  ]);

  const ref = videoRefFrom(post.videoPlatform, post.videoExternalId);
  const tone = post.topic ? TOPIC_TONE[post.topic] : null;
  const source =
    post.videoSource === "own"
      ? t("sourceOwn")
      : post.videoSource === "curated"
        ? post.channelName
          ? t("sourceCuratedBy", { channel: post.channelName })
          : t("sourceCurated")
        : null;

  return (
    <article className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/video"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-4" strokeWidth={2.2} />
          {t("backToVideos")}
        </Link>

        {ref && (
          <>
            {/* Built only from the validated (platform, id); see videoFacadeHtml.
                Eager: this facade image is the page's LCP element. */}
            <div
              className="chip-prose mt-6"
              dangerouslySetInnerHTML={{ __html: videoFacadeHtml(ref, locale as Locale, { eager: true }) }}
            />
            <VideoFacades />
          </>
        )}

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {source && <span className="rounded-full bg-surface-muted px-3 py-1 text-text-nav">{source}</span>}
            {post.difficulty && (
              <span className="rounded-full border border-border px-3 py-1 text-text-muted">
                {tDifficulty(post.difficulty)}
              </span>
            )}
            {post.topic && tone && (
              <span className="rounded-full px-3 py-1" style={{ background: tone.soft, color: tone.text }}>
                {tTopics(`${post.topic}.title`)}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-balance text-[28px] font-extrabold leading-[1.15] tracking-[-0.03em] text-text md:text-[38px]">
            {post.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-muted">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {tForum("publishedOn", {
                  date: format.dateTime(new Date(post.publishedAt), { dateStyle: "long" }),
                })}
              </time>
            )}
            {alternates.map((alt) =>
              alt.slug ? (
                <Link
                  key={alt.locale}
                  href={{ pathname: "/video/[slug]", params: { slug: alt.slug } }}
                  locale={alt.locale}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:border-black/20 hover:text-accent"
                >
                  <Languages className="size-3.5" strokeWidth={2} />
                  {t(`switchTo.${alt.locale}`)}
                </Link>
              ) : null
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {lesson && (
              <Link
                href={{ pathname: "/bai-hoc/[topic]/[slug]", params: { topic: lesson.topic, slug: lesson.slug } }}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
              >
                <BookOpen className="size-4" strokeWidth={2} />
                {t("relatedLesson")}
              </Link>
            )}
            {ref && (
              <a
                href={watchUrl(ref)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-text-nav transition-colors hover:border-black/20 hover:text-accent"
              >
                <ExternalLink className="size-4" strokeWidth={2} />
                {t("watchOn", { platform: PLATFORM_LABEL[ref.platform] })}
              </a>
            )}
          </div>
        </header>

        <div className="mt-10">
          <ArticleBody content={post.content} locale={locale as Locale} />
        </div>

        <ReportMistake postId={post.id} />

        <CommentSection
          postId={post.id}
          slug={post.slug}
          section="/video/[slug]"
          comments={comments}
          count={commentCount}
          totalRoots={totalRoots}
          shownRoots={comments.length}
          maxRoots={MAX_ROOT_COMMENTS}
        />
      </div>
    </article>
  );
}
