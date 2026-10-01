import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, FileText, PlayCircle } from "lucide-react";
import { SearchForm } from "@/components/search/SearchForm";
import { SearchResultRow } from "@/components/search/SearchResultRow";
import { SearchInitialState, SearchNoResultsState } from "@/components/search/SearchStates";
import { PageHero } from "@/components/sections/PageHero";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { TOPIC_IDS } from "@/lib/constants";
import type { SearchParams } from "@/lib/listing-params";
import { parseSearchQuery } from "@/lib/search-query";
import { postHref } from "@/lib/paths";
import { countLessonsByTopic, searchPosts } from "@/lib/queries/posts";
import { localeAlternates } from "@/lib/seo";
import type { PostKind, PostSummary } from "@/lib/types";

// Every query is different; nothing here is worth caching.
export const dynamic = "force-dynamic";

/** Rows asked of search_posts per group — also its own upper bound. */
const FETCH_LIMIT = 50;
/** Rows shown per group. */
const SHOWN = 10;
const GROUPS: PostKind[] = ["lesson", "video", "forum"];

const GROUP_ICON = { lesson: BookOpen, video: PlayCircle, forum: FileText } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "search" });
  return {
    title: t("title"),
    description: t("description"),
    // Result pages are thin and endless; keep them out of the index but let
    // crawlers follow the links on them.
    robots: { index: false, follow: true },
    alternates: localeAlternates("/tim-kiem", locale as Locale),
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const activeLocale = locale as Locale;

  const query = parseSearchQuery(searchParams.q);
  const t = await getTranslations("search");

  // One request per group, so a group's count is not squeezed by the others.
  const groups = query
    ? await Promise.all(
        GROUPS.map(async (kind) => ({
          kind,
          // A row no page can serve (a lesson without a topic) is not a result.
          posts: (await searchPosts(activeLocale, query, [kind], FETCH_LIMIT)).filter(
            (post) => postHref(post) !== null
          ),
        }))
      )
    : [];
  const found = groups.filter((group) => group.posts.length > 0);
  const total = found.reduce((sum, group) => sum + group.posts.length, 0);
  const shown = found.reduce((sum, group) => sum + Math.min(SHOWN, group.posts.length), 0);
  // A group that filled the fetch cap makes `total` a floor, not a count.
  const capped = found.some((group) => group.posts.length >= FETCH_LIMIT);

  // The "browse by topic" chips are only built for the empty state.
  const tTopics = await getTranslations("topics");
  const counts = query ? {} : await countLessonsByTopic(activeLocale);
  const topics = query
    ? []
    : TOPIC_IDS.map((id) => ({ id, label: tTopics(`${id}.title`), count: counts[id] ?? 0 }));

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={query ? t("resultsFor", { query }) : t("title")}
        description={query ? undefined : t("description")}
        stats={
          query
            ? [
                { value: groups[0].posts.length, label: t("groups.lesson") },
                { value: groups[1].posts.length, label: t("groups.video") },
                { value: groups[2].posts.length, label: t("groups.forum") },
              ]
            : undefined
        }
      />

      <section className="px-5 pb-16 md:px-8 md:pb-20">
        <div className="mx-auto w-full max-w-content">
          <div className="max-w-[720px]">
            <SearchForm
              action={getPathname({ href: "/tim-kiem", locale: activeLocale })}
              label={t("label")}
              placeholder={t("placeholder")}
              submitLabel={t("submit")}
              inputId="search-q"
              defaultValue={query}
            />
          </div>

          {!query ? (
            <div className="mt-8">
              <SearchInitialState topics={topics} />
            </div>
          ) : found.length === 0 ? (
            <div className="mt-8">
              <SearchNoResultsState query={query} />
            </div>
          ) : (
            <>
              <p
                role="status"
                aria-live="polite"
                className="mt-5 text-sm leading-[1.5] tabular-nums text-text-muted"
              >
                {t(capped ? "resultLineCapped" : "resultLine", { shown, total, query })}
              </p>
              <div className="mt-8 flex flex-col gap-12">
                {found.map((group) => (
                  <ResultGroup
                    key={group.kind}
                    kind={group.kind}
                    posts={group.posts}
                    query={query}
                    title={t(`groups.${group.kind}`)}
                    count={
                      group.posts.length >= FETCH_LIMIT
                        ? t("resultCountCapped", { count: FETCH_LIMIT })
                        : t("resultCount", { count: group.posts.length })
                    }
                    note={group.posts.length > SHOWN ? t("showingFirst", { shown: SHOWN }) : null}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

async function ResultGroup({
  kind,
  posts,
  query,
  title,
  count,
  note,
}: {
  kind: PostKind;
  posts: PostSummary[];
  query: string;
  title: string;
  count: string;
  note: string | null;
}) {
  const Icon = GROUP_ICON[kind];

  return (
    <section aria-labelledby={`results-${kind}`}>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface text-[#262626] md:size-10"
        >
          <Icon className="size-5" strokeWidth={2} />
        </span>
        <h2
          id={`results-${kind}`}
          className="text-[22px] font-extrabold leading-[1.2] tracking-[-0.02em] text-text md:text-h2"
        >
          {title}
        </h2>
        <span className="text-sm tabular-nums text-text-muted">{count}</span>
        {note && (
          <span className="w-full text-[13px] text-text-muted sm:ml-auto sm:w-auto">{note}</span>
        )}
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {posts.slice(0, SHOWN).map((post) => (
          <li key={post.id} className="flex">
            <SearchResultRow post={post} query={query} />
          </li>
        ))}
      </ul>
    </section>
  );
}
