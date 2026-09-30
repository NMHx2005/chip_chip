import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArticleShell } from "@/components/forum/ArticleShell";
import { LangPill } from "@/components/forum/LangPill";
import { UpdatedAt } from "@/components/forum/UpdatedAt";
import { CommentSection } from "@/components/forum/CommentSection";
import { articleLanguageAlternates } from "@/lib/article-alternates";
import { getPathname } from "@/i18n/navigation";
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
    post.excerpt || articleToPlainText(post.content, 160) || undefined;

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
      // Built through next-intl's localised routing rather than string
      // concatenation, so the English canonical resolves to `/en/blog/...`
      // instead of the source locale's `/en/blog/...`, which 307s.
      canonical: getPathname({
        href: { pathname: "/blog/[slug]", params: { slug: post.slug } },
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
                  ? getPathname({
                      href: { pathname: "/blog/[slug]", params: { slug: alt } },
                      locale: l,
                    })
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
    <ArticleShell
      back={{ href: "/blog", label: t("backToForum") }}
      title={post.title}
      meta={
        <>
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>
              {t("publishedOn", {
                date: format.dateTime(new Date(post.publishedAt), {
                  dateStyle: "long",
                }),
              })}
            </time>
          )}

          <UpdatedAt publishedAt={post.publishedAt} updatedAt={post.updatedAt} />

          {alternates.map((alt) => (
            <LangPill
              key={alt.locale}
              href={{ pathname: "/blog/[slug]", params: { slug: alt.slug } }}
              locale={alt.locale}
            />
          ))}
        </>
      }
      coverImageUrl={post.coverImageUrl}
      content={post.content}
      locale={locale as Locale}
      postId={post.id}
    >
      <CommentSection
        postId={post.id}
        slug={post.slug}
        comments={comments}
        count={commentCount}
        totalRoots={totalRoots}
        shownRoots={comments.length}
        maxRoots={MAX_ROOT_COMMENTS}
      />
    </ArticleShell>
  );
}
