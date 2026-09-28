import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SearchForm } from "@/components/search/SearchForm";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { SearchParams } from "@/lib/listing-params";
import { parseSearchQuery } from "@/lib/search-query";
import { postHref } from "@/lib/paths";
import { searchPosts } from "@/lib/queries/posts";
import { localeAlternates } from "@/lib/seo";
import type { PostKind, PostSummary } from "@/lib/types";

// Every query is different; nothing here is worth caching.
export const dynamic = "force-dynamic";

/** Rows asked of search_posts per group — also its own upper bound. */
const FETCH_LIMIT = 50;
/** Rows shown per group. */
const SHOWN = 10;
const GROUPS: PostKind[] = ["lesson", "video", "forum"];

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

  const query = parseSearchQuery(searchParams.q);
  const t = await getTranslations("search");

  // One request per group, so a group's count is not squeezed by the others.
  const groups = query
    ? await Promise.all(
        GROUPS.map(async (kind) => ({
          kind,
          // A row no page can serve (a lesson without a topic) is not a result.
          posts: (await searchPosts(locale as Locale, query, [kind], FETCH_LIMIT)).filter(
            (post) => postHref(post) !== null
          ),
        }))
      )
    : [];
  const found = groups.filter((group) => group.posts.length > 0);

  return (
    <section className="px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-balance text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-text md:text-[44px]">
          {query ? t("resultsFor", { query }) : t("title")}
        </h1>

        <div className="mt-6">
          <SearchForm
            action={getPathname({ href: "/tim-kiem", locale: locale as Locale })}
            label={t("label")}
            placeholder={t("placeholder")}
            submitLabel={t("submit")}
            defaultValue={query}
          />
        </div>

        {!query ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-text-muted">
            {t("prompt")}
          </p>
        ) : found.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-text-muted">
            {t("noResults", { query })}
          </p>
        ) : (
          <div className="mt-10 flex flex-col gap-12">
            {found.map((group) => (
              <ResultGroup
                key={group.kind}
                kind={group.kind}
                posts={group.posts}
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
        )}
      </div>
    </section>
  );
}

function ResultGroup({
  kind,
  posts,
  title,
  count,
  note,
}: {
  kind: PostKind;
  posts: PostSummary[];
  title: string;
  count: string;
  note: string | null;
}) {
  return (
    <section aria-labelledby={`results-${kind}`}>
      <h2 id={`results-${kind}`} className="flex items-baseline gap-3 text-lg font-bold tracking-[-0.01em] text-text">
        {title}
        <span className="text-sm font-medium text-text-muted">{count}</span>
      </h2>
      {note && <p className="mt-1 text-xs text-text-muted">{note}</p>}

      <ul className="mt-4 flex flex-col gap-3">
        {posts.slice(0, SHOWN).map((post) => {
          const href = postHref(post);
          if (!href) return null;
          return (
            <li key={post.id}>
              <Link
                href={href}
                className="block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-black/20"
              >
                <span className="block text-base font-semibold leading-snug text-text">{post.title}</span>
                {post.excerpt && (
                  <span className="mt-1.5 line-clamp-2 block text-sm leading-relaxed text-text-muted">
                    {post.excerpt}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
