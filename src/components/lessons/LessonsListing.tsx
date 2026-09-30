import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PostCard } from "@/components/forum/PostCard";
import { CardReveal } from "@/components/motion";
import { FilterPills, type ListingHref } from "@/components/listing/FilterPills";
import { Pagination } from "@/components/listing/Pagination";
import { TopicSidebar } from "@/components/lessons/TopicSidebar";
import { HeroStat, PageHero } from "@/components/sections/PageHero";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import { LISTING_PAGE_SIZE } from "@/lib/listing-order";
import {
  DEFAULT_LISTING,
  listingQuery,
  parseListingParams,
  type ListingParams,
  type SearchParams,
} from "@/lib/listing-params";
import { countLessonsByTopic, listLessons } from "@/lib/queries/posts";
import { DIFFICULTIES } from "@/lib/types";
import { cn } from "@/lib/utils";

/** `/bai-hoc` when no topic is chosen, `/bai-hoc/[topic]` otherwise. */
function lessonsHref(topic: TopicId | null, query: Record<string, string>): ListingHref {
  return topic
    ? { pathname: "/bai-hoc/[topic]", params: { topic }, query }
    : { pathname: "/bai-hoc", query };
}

/**
 * The lessons listing, shared by `/bai-hoc` and `/bai-hoc/[topic]`.
 *
 * The topic lives in the path (each topic page is its own canonical URL);
 * only the difficulty and the page travel in the query. Anything else in the
 * query — a video filter pasted onto a lessons URL — is dropped here, so it
 * can never leak into the links this page builds.
 */
export async function LessonsListing({
  locale,
  topic,
  searchParams,
}: {
  locale: Locale;
  topic: TopicId | null;
  searchParams: SearchParams;
}) {
  const parsed = parseListingParams(searchParams);
  const current: ListingParams = {
    ...DEFAULT_LISTING,
    difficulty: parsed.difficulty,
    page: parsed.page,
  };

  const [t, tTopics, tDifficulty, tPagination] = await Promise.all([
    getTranslations("lessons"),
    getTranslations("topics"),
    getTranslations("difficulty"),
    getTranslations("pagination"),
  ]);

  const [{ posts, total }, counts] = await Promise.all([
    listLessons(locale, { topic, difficulty: current.difficulty, page: current.page }),
    countLessonsByTopic(locale),
  ]);

  const totalPages = Math.ceil(total / LISTING_PAGE_SIZE);
  // A page past the last one is not a real view of this listing — see the
  // same check on the blog listing for why that is a 404, not an empty 200.
  if (current.page > 1 && current.page > totalPages) notFound();

  const allCount = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const statTotal = topic ? counts[topic] ?? 0 : allCount;
  // Changing topic keeps the difficulty but starts again from page 1.
  const topicQuery = listingQuery(current);

  const topicEntries = [
    { key: "all", label: t("allTopics"), count: allCount, href: lessonsHref(null, topicQuery), active: topic === null },
    ...TOPIC_IDS.map((id) => ({
      key: id,
      label: tTopics(`${id}.title`),
      count: counts[id] ?? 0,
      href: lessonsHref(id, topicQuery),
      active: topic === id,
    })),
  ];

  const emptyMessage =
    current.page > 1
      ? tPagination("pageEmpty")
      : current.difficulty
        ? t("emptyFiltered")
        : topic
          ? tTopics("empty")
          : t("empty");

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={topic ? tTopics(`${topic}.title`) : t("title")}
        description={topic ? tTopics(`${topic}.description`) : t("description")}
      >
        <HeroStat value={statTotal} label={t("title")} />
      </PageHero>

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto w-full max-w-content">
          <div className="lg:flex lg:items-start lg:gap-10">
          <TopicSidebar
            heading={t("topicsHeading")}
            collapseLabel={t("collapseTopics")}
            expandLabel={t("expandTopics")}
          >
            <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:-mx-8 md:px-8 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
              {topicEntries.map((entry) => (
                <li key={entry.key} className="shrink-0">
                  <Link
                    href={entry.href}
                    aria-current={entry.active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center justify-between gap-3 rounded-full border px-4 text-sm font-medium transition-colors",
                      entry.active
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-surface text-text-nav hover:border-black/20 hover:text-accent"
                    )}
                  >
                    <span className="whitespace-nowrap">{entry.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs tabular-nums",
                        entry.active ? "bg-white/15 text-white" : "bg-surface-muted text-text-muted"
                      )}
                    >
                      {entry.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </TopicSidebar>

          <div className="min-w-0 flex-1">
            <FilterPills
              label={tDifficulty("label")}
              options={[
                {
                  key: "all",
                  label: tDifficulty("all"),
                  href: lessonsHref(topic, listingQuery(current, { difficulty: null })),
                  active: current.difficulty === null,
                },
                ...DIFFICULTIES.map((level) => ({
                  key: level,
                  label: tDifficulty(level),
                  href: lessonsHref(topic, listingQuery(current, { difficulty: level })),
                  active: current.difficulty === level,
                })),
              ]}
            />

            {posts.length === 0 ? (
              <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
                <p className="text-sm text-text-muted">{emptyMessage}</p>
                {current.page > 1 && (
                  <Link
                    href={lessonsHref(topic, listingQuery(current, { page: 1 }))}
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:text-black"
                  >
                    {tPagination("backToFirst")}
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {posts.map((post, index) => (
                  <CardReveal key={post.id} index={index} className="h-full">
                    <PostCard post={post} showTopic={topic === null} />
                  </CardReveal>
                ))}
              </div>
            )}

            <Pagination
              page={current.page}
              totalPages={totalPages}
              hrefFor={(page) => lessonsHref(topic, listingQuery(current, { page }))}
            />
          </div>
          </div>
        </div>
      </section>
    </>
  );
}
