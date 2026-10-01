import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { QueryQuote } from "@/components/search/QueryQuote";
import { TopicBrowseChip } from "@/components/search/TopicBrowseChip";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Link } from "@/i18n/navigation";
import type { TopicId } from "@/lib/constants";

const SUGGESTION =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-text-nav transition-colors duration-fast ease-standard [@media(hover:hover)]:hover:border-black/25";

function Suggestions({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-text-muted">{label}</p>
      <ul className="flex flex-wrap justify-center gap-2.5">
        {items.map((item) => (
          <li key={item}>
            <Link href={{ pathname: "/tim-kiem", query: { q: item } }} className={SUGGESTION}>
              <Search aria-hidden className="size-4 shrink-0" strokeWidth={2} />
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** No query yet: invite a keyword, offer a few, and point at the topics. */
export async function SearchInitialState({
  topics,
}: {
  topics: { id: TopicId; label: string; count: number }[];
}) {
  const t = await getTranslations("search");
  const suggestions = t.raw("suggestions") as string[];

  return (
    <EmptyState title={t("initialTitle")} description={t("initialBody")}>
      <Suggestions label={t("trySearching")} items={suggestions} />
      {topics.length > 0 && (
        <>
          <div aria-hidden className="h-px w-full max-w-[560px] bg-border" />
          <div className="flex flex-col items-center gap-2.5">
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-text-muted">
              {t("browseTopics")}
            </p>
            <ul className="flex flex-wrap justify-center gap-2.5">
              {topics.map((topic) => (
                <li key={topic.id}>
                  <TopicBrowseChip topic={topic.id} label={topic.label} count={topic.count} />
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </EmptyState>
  );
}

/** A query that matched nothing: quote it back, explain, and offer a way out. */
export async function SearchNoResultsState({ query }: { query: string }) {
  const t = await getTranslations("search");
  const suggestions = t.raw("suggestions") as string[];

  return (
    <EmptyState
      title={t("noResultsTitle")}
      actions={
        <>
          <Button href={{ pathname: "/tim-kiem" }}>{t("clearKeyword")}</Button>
          <Button href="/bai-hoc" variant="secondary">
            {t("browseLessons")}
          </Button>
        </>
      }
    >
      <QueryQuote query={query} />
      <p className="max-w-[520px] text-pretty text-base leading-[1.6] text-text-muted">
        {t("noResultsBody")}
      </p>
      <Suggestions label={t("tryKeywords")} items={suggestions} />
    </EmptyState>
  );
}

/** The query itself failed (the RPC errored): say so, and offer a retry. */
export async function SearchErrorState({ query }: { query: string }) {
  const t = await getTranslations("search");

  return (
    <EmptyState
      tone="error"
      chip="error"
      title={t("errorTitle")}
      description={t("errorBody")}
      actions={
        <>
          <Button href={{ pathname: "/tim-kiem", query: { q: query } }}>{t("retry")}</Button>
          <Button href="/bai-hoc" variant="secondary">
            {t("browseLessons")}
          </Button>
        </>
      }
    />
  );
}
