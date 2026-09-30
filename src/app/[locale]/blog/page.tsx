import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PostCard } from "@/components/forum/PostCard";
import { CardReveal } from "@/components/motion";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/listing/Pagination";
import {
  HeroBackdropCredit,
  HeroBackdropLayer,
  HeroBackdropProvider,
} from "@/components/sections/HeroBackdrop";
import { PageHero } from "@/components/sections/PageHero";
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

const LIST_ID = "danh-sach";

export default async function ForumPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: { page?: string };
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tNav] = await Promise.all([getTranslations("forum"), getTranslations("nav")]);
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
      <HeroBackdropProvider>
        <PageHero
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          stats={[{ value: total, label: t("statPosts") }]}
          backdrop={<HeroBackdropLayer src={BLOG_CLIP} />}
          below={<HeroBackdropCredit credit={BLOG_CLIP_CREDIT} />}
        />
      </HeroBackdropProvider>

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto w-full max-w-content">
          {/* Page changes link here, clear of the fixed navbar. */}
          <div id={LIST_ID} className="scroll-mt-24">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <h2 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.02em] text-text">
                {t("listHeading")}
              </h2>
              <p role="status" aria-live="polite" className="text-sm text-text-muted">
                {t("result", { shown: posts.length, total })}
              </p>
            </div>

            {posts.length === 0 ? (
              <EmptyState
                compact
                className="mt-6"
                title={t("emptyTitle")}
                description={t("emptyBody")}
                actions={
                  <>
                    <Button href="/bai-hoc" arrow>
                      {tNav("lessons")}
                    </Button>
                    <Button href="/video" variant="secondary">
                      {tNav("lessonsVideo")}
                    </Button>
                  </>
                }
              />
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, index) => (
                  <CardReveal key={post.id} index={index} className="h-full">
                    <PostCard post={post} expand />
                  </CardReveal>
                ))}
              </div>
            )}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            hrefFor={(n) => ({ pathname: "/blog", query: n > 1 ? { page: n } : {}, hash: LIST_ID })}
          />
        </div>
      </section>
    </>
  );
}
