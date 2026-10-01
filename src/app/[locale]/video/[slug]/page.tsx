import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Bookmark, BookOpen, Cpu, ExternalLink, Languages, Lock } from "lucide-react";
import { ReportMistake } from "@/components/contact/ReportMistake";
import { ArticleBody } from "@/components/forum/ArticleBody";
import {
  CommentSection,
  MAX_ROOT_COMMENTS,
  ROOT_PAGE_SIZE,
} from "@/components/forum/CommentSection";
import { VideoFacades } from "@/components/forum/VideoFacades";
import { Button, buttonClassName } from "@/components/ui/Button";
import { DifficultyMark } from "@/components/ui/DifficultyMark";
import { TopicChip } from "@/components/ui/TopicChip";
import { RelatedLessonCard } from "@/components/video/RelatedLessonCard";
import { articleLanguageAlternates } from "@/lib/article-alternates";
import { Link, getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
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
  const source =
    post.videoSource === "own"
      ? t("sourceOwn")
      : post.videoSource === "curated"
        ? post.channelName
          ? t("sourceCuratedBy", { channel: post.channelName })
          : t("sourceCurated")
        : null;
  const SourceIcon = post.videoSource === "own" ? Cpu : Bookmark;

  return (
    <article className="px-5 pb-12 pt-4 lg:px-8 lg:pb-20 lg:pt-10">
      <div className="mx-auto w-full max-w-[896px]">
        <Link
          href="/video"
          className="inline-flex min-h-11 items-center gap-2 rounded-full pr-3 text-sm font-semibold text-accent transition-colors duration-fast ease-standard hover:text-black"
        >
          <ArrowLeft className="size-4" strokeWidth={2.2} />
          {t("backToVideos")}
        </Link>

        {ref && (
          <div className="mt-1 lg:mt-3">
            {/* Built only from the validated (platform, id); see videoFacadeHtml.
                Eager: this facade image is the page's LCP element; large: the
                bigger player; title: names the video in the accessible name. */}
            <div
              className="chip-prose"
              dangerouslySetInnerHTML={{
                __html: videoFacadeHtml(ref, locale as Locale, {
                  eager: true,
                  large: true,
                  title: post.title,
                }),
              }}
            />
            <VideoFacades />
            <p className="mt-3 flex items-start gap-2 text-[13px] leading-[1.5] text-text-nav">
              <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
              <span>{t("loadsAfterPlay", { platform: PLATFORM_LABEL[ref.platform] })}</span>
            </p>
          </div>
        )}

        <header className="mt-6 flex flex-col items-start gap-5 lg:mt-8">
          <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-2">
            {source && (
              <span className="inline-flex max-w-full items-center gap-1.5 self-start rounded-full border border-black/[0.08] bg-surface-muted py-[3px] pl-2 pr-2.5 text-xs font-semibold leading-4 text-[#262626]">
                <SourceIcon aria-hidden className="size-3.5 shrink-0" strokeWidth={2} />
                <span className="min-w-0 truncate">{source}</span>
              </span>
            )}
            {post.difficulty && (
              <DifficultyMark
                difficulty={post.difficulty}
                label={tDifficulty(post.difficulty)}
                className="text-[13px]"
              />
            )}
            {post.topic && (
              <TopicChip topic={post.topic} label={tTopics(`${post.topic}.title`)} />
            )}
          </div>

          <h1 className="max-w-3xl text-balance text-h1 text-text [overflow-wrap:anywhere] lg:text-h1-lg">
            {post.title}
          </h1>

          <div className="flex w-full max-w-3xl flex-wrap items-center gap-6">
            {post.publishedAt && (
              <time dateTime={post.publishedAt} className="text-sm text-text-muted">
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
                  hrefLang={alt.locale}
                  className={buttonClassName("secondary", "lg:ml-auto")}
                >
                  <Languages aria-hidden className="size-4 shrink-0" strokeWidth={2} />
                  {t(`switchTo.${alt.locale}`)}
                </Link>
              ) : null
            )}
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            {lesson && (
              <Button
                href={{
                  pathname: "/bai-hoc/[topic]/[slug]",
                  params: { topic: lesson.topic, slug: lesson.slug },
                }}
                arrow
                className="w-full sm:w-auto"
              >
                <BookOpen aria-hidden className="size-4 shrink-0" strokeWidth={2} />
                {t("relatedLesson")}
              </Button>
            )}
            {ref && (
              <a
                href={watchUrl(ref)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName("secondary", "w-full sm:w-auto")}
              >
                <ExternalLink aria-hidden className="size-4 shrink-0" strokeWidth={2} />
                {t("watchOn", { platform: PLATFORM_LABEL[ref.platform] })}
                <span className="sr-only"> {t("opensInNewTab")}</span>
              </a>
            )}
          </div>
        </header>

        <div className="mt-8 max-w-3xl lg:mt-10">
          <ArticleBody
            content={post.content}
            locale={locale as Locale}
            emptyText={t("noDescription")}
          />
        </div>

        {lesson && (
          <section className="mt-10 flex flex-col gap-4 lg:mt-14" aria-labelledby="related-lesson">
            <h2 id="related-lesson" className="text-h2 text-text">
              {t("relatedLessonHeading")}
            </h2>
            <RelatedLessonCard lesson={lesson} />
          </section>
        )}

        <div className="mt-8 lg:mt-12">
          <ReportMistake postId={post.id} />
        </div>

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
