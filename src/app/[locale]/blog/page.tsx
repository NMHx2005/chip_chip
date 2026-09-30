import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PostCard } from "@/components/forum/PostCard";
import { CardReveal } from "@/components/motion";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeroStat, PageHero } from "@/components/sections/PageHero";
import { listForumPosts } from "@/lib/queries/posts";
import { localeAlternates } from "@/lib/seo";
import { BLOG_CLIP, BLOG_CLIP_CREDIT, PAGE_SIZE } from "@/lib/constants";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "forum" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/blog", locale as Locale),
  };
}

export default async function ForumPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: { page?: string };
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tPagination, tCommon, tNav] = await Promise.all([
    getTranslations("forum"),
    getTranslations("pagination"),
    getTranslations("common"),
    getTranslations("nav"),
  ]);
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);

  const { posts, total } = await listForumPosts(locale as Locale, {
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // A page past the last one (a stale link, or someone probing `?page=999`)
  // is not a real view of this listing — a bare 200 with no posts would tell
  // a crawler this URL is worth indexing when it is not.
  if (page > 1 && page > totalPages) notFound();

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        backdropVideo={BLOG_CLIP}
      >
        <HeroStat value={total} label={t("title")} />
      </PageHero>

      <p className="mx-auto mt-4 w-full max-w-content px-5 text-xs text-text-muted md:px-8">
        {tCommon("videoCredit")}{" "}
        <a
          href={BLOG_CLIP_CREDIT.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-accent"
        >
          {BLOG_CLIP_CREDIT.label}
        </a>
      </p>

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto w-full max-w-content">
          {posts.length === 0 ? (
            <EmptyState
              compact
              title={t("empty")}
              actions={
                <Button href="/bai-hoc" arrow>
                  {tNav("lessons")}
                </Button>
              }
            />
          ) : (
            <>
              <h2 className="sr-only">{t("postsHeading")}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, index) => (
                  <CardReveal key={post.id} index={index} className="h-full">
                    <PostCard post={post} expand />
                  </CardReveal>
                ))}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <nav
              aria-label={tPagination("label")}
              className="mt-10 flex items-center justify-center gap-2"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <a
                  key={n}
                  href={`?page=${n}`}
                  aria-current={n === page ? "page" : undefined}
                  className={
                    n === page
                      ? "flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white"
                      : "flex size-9 items-center justify-center rounded-lg border border-border text-sm text-text-nav transition-colors hover:border-black/20"
                  }
                >
                  {n}
                </a>
              ))}
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
