import { getFormatter, getTranslations } from "next-intl/server";
import { KindLabel } from "@/components/search/KindLabel";
import { Mark } from "@/components/search/Mark";
import { DifficultyMark } from "@/components/ui/DifficultyMark";
import { TopicChip } from "@/components/ui/TopicChip";
import { Link } from "@/i18n/navigation";
import { postHref } from "@/lib/paths";
import type { PostSummary } from "@/lib/types";

/**
 * One search result: a card whose whole surface is the link. The kind, topic,
 * difficulty and date sit in a meta line; the title and excerpt mark the words
 * the query matched.
 */
export async function SearchResultRow({ post, query }: { post: PostSummary; query: string }) {
  const href = postHref(post);
  // A row no page can serve (a lesson without a topic) is not a result.
  if (!href) return null;

  const [format, tSearch, tTopics, tDifficulty] = await Promise.all([
    getFormatter(),
    getTranslations("search"),
    getTranslations("topics"),
    getTranslations("difficulty"),
  ]);

  const date = post.publishedAt
    ? format.dateTime(new Date(post.publishedAt), { year: "numeric", month: "short", day: "numeric" })
    : null;

  return (
    <Link
      href={href}
      className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-surface p-5 transition-[border-color,box-shadow,transform] duration-card ease-standard [@media(hover:hover)]:hover:border-black/20 [@media(hover:hover)]:hover:shadow-card-hover active:scale-[0.98] motion-reduce:active:scale-100"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-text-muted">
        <KindLabel kind={post.kind} label={tSearch(`groups.${post.kind}`)} />
        {post.topic && <TopicChip topic={post.topic} label={tTopics(`${post.topic}.title`)} />}
        {post.difficulty && (
          <DifficultyMark difficulty={post.difficulty} label={tDifficulty(post.difficulty)} />
        )}
        {date && (
          <time dateTime={post.publishedAt ?? undefined} className="ml-auto tabular-nums">
            {date}
          </time>
        )}
      </div>
      <h3 className="line-clamp-3 text-balance text-lg font-bold leading-[1.3] tracking-[-0.01em] text-text [overflow-wrap:anywhere]">
        <Mark text={post.title} query={query} />
      </h3>
      {post.excerpt && (
        <p className="line-clamp-2 text-sm leading-[1.55] text-text-muted [overflow-wrap:anywhere]">
          <Mark text={post.excerpt} query={query} />
        </p>
      )}
    </Link>
  );
}
