import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PostCard } from "@/components/forum/PostCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardReveal } from "@/components/motion";
import type { ListingHref } from "@/components/listing/FilterPills";
import { Pagination } from "@/components/listing/Pagination";
import { SegmentedFilter } from "@/components/lessons/SegmentedFilter";
import { TopicNav, type TopicNavEntry } from "@/components/lessons/TopicNav";
import { TopicTrail } from "@/components/lessons/TopicTrail";
import { PageHero } from "@/components/sections/PageHero";
import type { Locale } from "@/i18n/routing";
import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import { lessonHeroStats, startHere } from "@/lib/lesson-listing";
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

/** `/bai-hoc` when no topic is chosen, `/bai-hoc/[topic]` otherwise. */
function lessonsHref(topic: TopicId | null, query: Record<string, string>): ListingHref {
  return topic
    ? { pathname: "/bai-hoc/[topic]", params: { topic }, query }
    : { pathname: "/bai-hoc", query };
}

const GRID_ID = "danh-sach";

/** Send a page change to the top of the list instead of leaving the reader mid-page. */
function toGrid(href: ListingHref): ListingHref {
  return typeof href === "string" ? href : ({ ...href, hash: GRID_ID } as ListingHref);
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

  const [t, tTopics, tDifficulty, tPagination, tNav] = await Promise.all([
    getTranslations("lessons"),
    getTranslations("topics"),
    getTranslations("difficulty"),
    getTranslations("pagination"),
    getTranslations("nav"),
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

  const topicEntries: TopicNavEntry[] = [
    {
      key: "all",
      label: t("allTopics"),
      count: allCount,
      href: lessonsHref(null, topicQuery),
      active: topic === null,
      topic: null,
    },
    ...TOPIC_IDS.map((id) => ({
      key: id,
      label: tTopics(`${id}.title`),
      count: counts[id] ?? 0,
      href: lessonsHref(id, topicQuery),
      active: topic === id,
      topic: id,
    })),
  ];

  const start = startHere();
  const scope = topic ? tTopics(`${topic}.title`) : t("allTopicsScope");

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={topic ? tTopics(`${topic}.title`) : t("title")}
        description={topic ? tTopics(`${topic}.description`) : t("description")}
        stats={lessonHeroStats({ total: statTotal, topic }).map((stat) => ({
          value: stat.value,
          label: t(`stats.${stat.key}`),
        }))}
      />

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto w-full max-w-content">
          <div className="lg:flex lg:items-start lg:gap-10">
            <TopicNav
              heading={t("topicsHeading")}
              collapseLabel={t("collapseTopics")}
              expandLabel={t("expandTopics")}
              hint={{
                lead: t("hintLead"),
                link: t("hintLink"),
                href: lessonsHref(start.topic, { difficulty: start.difficulty }),
              }}
              entries={topicEntries}
            />

            <div className="min-w-0 flex-1">
              <TopicTrail label={t("topicsHeading")} entries={topicEntries} className="mb-6" />

              <div className="flex flex-col gap-3 sm:min-h-[52px] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
                    {tDifficulty("label")}
                  </span>
                  <SegmentedFilter
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
                        difficulty: level,
                      })),
                    ]}
                  />
                </div>
                <p
                  role="status"
                  aria-live="polite"
                  className="text-sm tabular-nums text-text-muted"
                >
                  {t("result", { shown: posts.length, total, scope })}
                </p>
              </div>

              {/* Page changes link here (see `toGrid`), clear of the fixed navbar. */}
              <div id={GRID_ID} className="scroll-mt-24">
                <h2 className="sr-only">{t("listHeading")}</h2>

                {posts.length === 0 ? (
                  <EmptyState
                    compact
                    className="mt-6"
                    title={
                      current.page > 1
                        ? tPagination("pageEmpty")
                        : current.difficulty
                          ? t("emptyFiltered")
                          : topic
                            ? tTopics("empty")
                            : t("emptyTitle")
                    }
                    description={
                      current.page === 1 && !current.difficulty && !topic
                        ? t("emptyBody")
                        : undefined
                    }
                    actions={
                      current.page > 1 ? (
                        <Button href={lessonsHref(topic, listingQuery(current, { page: 1 }))}>
                          {tPagination("backToFirst")}
                        </Button>
                      ) : current.difficulty ? (
                        <Button
                          href={lessonsHref(topic, listingQuery(current, { difficulty: null }))}
                        >
                          {t("clearDifficulty")}
                        </Button>
                      ) : topic ? (
                        <Button variant="secondary" href={lessonsHref(null, {})}>
                          {t("allLessons")}
                        </Button>
                      ) : (
                        <>
                          <Button href="/video" arrow>
                            {tNav("lessonsVideo")}
                          </Button>
                          <Button href="/blog" variant="secondary">
                            {tNav("forum")}
                          </Button>
                        </>
                      )
                    }
                  />
                ) : (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                  hrefFor={(page) => toGrid(lessonsHref(topic, listingQuery(current, { page })))}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
