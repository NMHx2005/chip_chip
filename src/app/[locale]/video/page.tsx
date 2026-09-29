import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Pagination } from "@/components/listing/Pagination";
import { HeroStat, PageHero } from "@/components/sections/PageHero";
import { VideoCard } from "@/components/video/VideoCard";
import { VideoFilters } from "@/components/video/VideoFilters";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { LISTING_PAGE_SIZE } from "@/lib/listing-order";
import { listingQuery, parseListingParams, type SearchParams } from "@/lib/listing-params";
import { listVideos } from "@/lib/queries/posts";
import { localeAlternates } from "@/lib/seo";

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

  const totalPages = Math.ceil(total / LISTING_PAGE_SIZE);
  // A page past the last one is not a real view of this listing — see the
  // same check on the blog listing for why that is a 404, not an empty 200.
  if (current.page > 1 && current.page > totalPages) notFound();

  const isFiltered = Object.keys(listingQuery(current, { page: 1 })).length > 0;
  const emptyMessage =
    current.page > 1
      ? tPagination("pageEmpty")
      : isFiltered
        ? t("emptyFiltered")
        : t("empty");

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      >
        <HeroStat value={total} label={t("title")} />
      </PageHero>

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto w-full max-w-content">
          <VideoFilters locale={locale as Locale} current={current} />

          {posts.length === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <p className="text-sm text-text-muted">{emptyMessage}</p>
              {current.page > 1 && (
                <Link
                  href={{ pathname: "/video", query: listingQuery(current, { page: 1 }) }}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:text-black"
                >
                  {tPagination("backToFirst")}
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <VideoCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <Pagination
            page={current.page}
            totalPages={totalPages}
            hrefFor={(page) => ({ pathname: "/video", query: listingQuery(current, { page }) })}
          />
        </div>
      </section>
    </>
  );
}
