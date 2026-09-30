import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Pagination } from "@/components/listing/Pagination";
import { CardReveal } from "@/components/motion";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/sections/PageHero";
import { VideoCard } from "@/components/video/VideoCard";
import { VideoFilters } from "@/components/video/VideoFilters";
import type { Locale } from "@/i18n/routing";
import { LISTING_PAGE_SIZE } from "@/lib/listing-order";
import { listingQuery, parseListingParams, type SearchParams } from "@/lib/listing-params";
import { countVideos, listVideos } from "@/lib/queries/posts";
import { VIDEO_BANNER } from "@/lib/constants";
import { localeAlternates } from "@/lib/seo";
import { activeFilterCount, isFiltered, videoHeroStats, withHash } from "@/lib/video-listing";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "videos" });
  return {
    title: t("title"),
    description: t("description"),
    // Filtered views all point at the one unfiltered listing.
    alternates: localeAlternates("/video", locale as Locale),
  };
}

const LIST_ID = "danh-sach";

export default async function VideosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const current = parseListingParams(searchParams);
  const [t, tPagination, { posts, total }] = await Promise.all([
    getTranslations("videos"),
    getTranslations("pagination"),
    listVideos(locale as Locale, current),
  ]);
  // Unfiltered, `total` already is every video (sort does not narrow it), so the
  // extra count is only needed when a filter is on; a failed count cannot then
  // hide a list that loaded.
  const allVideos = activeFilterCount(current) === 0 ? total : await countVideos(locale as Locale);

  const totalPages = Math.ceil(total / LISTING_PAGE_SIZE);
  // A page past the last one is not a real view of this listing — see the
  // same check on the blog listing for why that is a 404, not an empty 200.
  if (current.page > 1 && current.page > totalPages) notFound();

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        stats={videoHeroStats({ total: allVideos }).map((stat) => ({
          value: stat.value,
          label: t(`stats.${stat.key}`),
        }))}
        backdropImage={VIDEO_BANNER}
      />

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto w-full max-w-content">
          {allVideos === 0 ? (
            <EmptyState
              compact
              title={t("emptyTitle")}
              description={t("emptyBody")}
              actions={
                <>
                  <Button href="/bai-hoc" arrow>
                    {t("readLessons")}
                  </Button>
                  <Button href="/blog" variant="secondary">
                    {t("readBlog")}
                  </Button>
                </>
              }
            />
          ) : (
            <>
              <VideoFilters current={current} shown={posts.length} total={total} />

              {/* Page changes link here (see `withHash`); `html { scroll-padding-top }` clears the navbar. */}
              <div id={LIST_ID} className="mt-6">
                <h2 className="sr-only">{t("listHeading")}</h2>

                {posts.length === 0 ? (
                  <EmptyState
                    compact
                    title={current.page > 1 ? tPagination("pageEmpty") : t("emptyFilteredTitle")}
                    description={current.page > 1 ? undefined : t("emptyFilteredBody")}
                    actions={
                      current.page > 1 ? (
                        <Button href={{ pathname: "/video", query: listingQuery(current, { page: 1 }) }}>
                          {tPagination("backToFirst")}
                        </Button>
                      ) : (
                        <>
                          {isFiltered(current) && <Button href="/video">{t("clearAll")}</Button>}
                          <Button href="/bai-hoc" variant="secondary">
                            {t("readLessons")}
                          </Button>
                        </>
                      )
                    }
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post, index) => (
                      <CardReveal key={post.id} index={index} className="h-full">
                        <VideoCard post={post} />
                      </CardReveal>
                    ))}
                  </div>
                )}
              </div>

              <Pagination
                page={current.page}
                totalPages={totalPages}
                hrefFor={(page) =>
                  withHash({ pathname: "/video", query: listingQuery(current, { page }) }, LIST_ID)
                }
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
