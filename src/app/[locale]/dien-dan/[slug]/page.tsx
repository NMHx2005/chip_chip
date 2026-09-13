import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Languages } from "lucide-react";
import { ArticleBody } from "@/components/forum/ArticleBody";
import { ArticleToc } from "@/components/forum/ArticleToc";
import { UpdatedAt } from "@/components/forum/UpdatedAt";
import { CommentSection } from "@/components/forum/CommentSection";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import {
  countComments,
  getPostBySlug,
  getTranslationSlug,
  listComments,
} from "@/lib/queries/posts";
import { articleToPlainText } from "@/lib/tiptap/render";
import {
  MAX_ROOT_COMMENTS,
  ROOT_PAGE_SIZE,
} from "@/components/forum/CommentSection";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(locale as Locale, slug, "forum");

  if (!post) return { title: "404" };

  const description =
    post.excerpt ?? articleToPlainText(post.content, 160) ?? "";

  return {
    title: post.title,
    description,
    // The image comes from the sibling opengraph-image.tsx route, which
    // draws a branded card instead of using the cover photo.
    openGraph: {
      type: "article",
      title: post.title,
      description,
      publishedTime: post.publishedAt ?? undefined,
    },
    alternates: {
      canonical: `/${locale}/dien-dan/${post.slug}`,
      languages: Object.fromEntries(
        await Promise.all(
          routing.locales.map(async (l) => {
            const alt = await getTranslationSlug(post.translationId, l);
            return [l, alt ? `/${l}/dien-dan/${alt}` : `/${l}/dien-dan`];
          })
        )
      ),
    },
  };
}

export default async function ForumPostPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: { comments?: string };
}) {
  const { locale, slug } = await params;

  // `?comments=N` reveals more root comments; capped so a crafted URL cannot
  // ask the database for an unbounded page.
  const rootLimit = Math.min(
    Math.max(ROOT_PAGE_SIZE, Number(searchParams.comments ?? "0") || 0),
    MAX_ROOT_COMMENTS
  );
  setRequestLocale(locale);

  const t = await getTranslations("forum");
  const format = await getFormatter();

  const post = await getPostBySlug(locale as Locale, slug, "forum");
  if (!post) notFound();

  const [{ comments, totalRoots }, commentCount] = await Promise.all([
    listComments(post.id, { rootLimit }),
    countComments(post.id),
  ]);

  // Offer the translation only when one actually exists in the other locale.
  const otherLocales = routing.locales.filter((l) => l !== locale);
  const alternates = (
    await Promise.all(
      otherLocales.map(async (l) => ({
        locale: l,
        slug: await getTranslationSlug(post.translationId, l),
      }))
    )
  ).filter((entry): entry is { locale: Locale; slug: string } =>
    Boolean(entry.slug)
  );

  return (
    <article className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/dien-dan"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-4" strokeWidth={2.2} />
          {t("backToForum")}
        </Link>

        <header className="mt-8">
          <h1 className="text-balance text-[30px] font-extrabold leading-[1.15] tracking-[-0.03em] text-text md:text-[42px]">
            {post.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-text-muted">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {t("publishedOn", {
                  date: format.dateTime(new Date(post.publishedAt), {
                    dateStyle: "long",
                  }),
                })}
              </time>
            )}

            <UpdatedAt
              publishedAt={post.publishedAt}
              updatedAt={post.updatedAt}
            />

            {alternates.map((alt) => (
              <Link
                key={alt.locale}
                href={{
                  pathname: "/dien-dan/[slug]",
                  params: { slug: alt.slug },
                }}
                locale={alt.locale}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-black/20 hover:text-accent"
              >
                <Languages className="size-3.5" strokeWidth={2} />
                {alt.locale === "en" ? "Read in English" : "Đọc bản tiếng Việt"}
              </Link>
            ))}
          </div>
        </header>

        {post.coverImageUrl && (
          <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl">
            <Image
              src={post.coverImageUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        <ArticleToc content={post.content} />

        <div className="mt-10">
          <ArticleBody content={post.content} />
        </div>

        <CommentSection
          postId={post.id}
          slug={post.slug}
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
