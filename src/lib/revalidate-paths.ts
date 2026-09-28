import { routing, type Locale } from "@/i18n/routing";
import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import { localizedPath, postPath } from "@/lib/paths";
import type { PostKind } from "@/lib/types";

/**
 * One post row's identity for the purpose of cache invalidation: enough to
 * build every localized URL that shows it.
 *
 * A caller passes both the row's old and new shape (e.g. old topic and new
 * topic) in the same array when something about the row changed, so both
 * locations get revalidated — this module has no notion of "before/after"
 * itself, only of which paths a given shape resolves to.
 */
export type PostRow = {
  locale: Locale;
  slug: string;
  kind: PostKind;
  topic: TopicId | null;
};

/**
 * Every path whose cached rendering could depend on the given rows.
 *
 * Kept separate from the `revalidatePath` calls (in src/app/admin/actions.ts)
 * so the path logic can be unit tested without a request context.
 */
export function revalidatePostRows(rows: PostRow[]): string[] {
  const paths = new Set<string>();

  for (const locale of routing.locales) {
    paths.add(localizedPath("/", locale));
    paths.add(localizedPath("/blog", locale));
    paths.add(localizedPath("/bai-hoc", locale));
    paths.add(localizedPath("/video", locale));
  }

  for (const row of rows) {
    if (row.kind === "lesson" && row.topic) {
      paths.add(localizedPath("/bai-hoc/[topic]", row.locale, { topic: row.topic }));
    }
    const own = postPath(row, row.locale);
    if (own) paths.add(own);
  }

  return [...paths];
}

const POST_KINDS: readonly string[] = ["lesson", "forum", "video"];

function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

function isPostKind(value: string): value is PostKind {
  return POST_KINDS.includes(value);
}

function isTopicId(value: string | null): value is TopicId {
  return value !== null && (TOPIC_IDS as readonly string[]).includes(value);
}

/**
 * Turns `posts` rows as read back from the database (`locale, slug, kind,
 * topic`) into PostRow values. A row whose locale or kind is not one the app
 * knows is skipped rather than guessed at.
 */
export function postRowsFrom(
  rows: { locale: string; slug: string; kind: string; topic: string | null }[] | null
): PostRow[] {
  return (rows ?? []).flatMap((row) =>
    isLocale(row.locale) && isPostKind(row.kind)
      ? [{ locale: row.locale, slug: row.slug, kind: row.kind, topic: isTopicId(row.topic) ? row.topic : null }]
      : []
  );
}
