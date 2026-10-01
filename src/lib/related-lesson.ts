import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";

/** The published lesson a video points back to, as its card needs it. */
export type RelatedLesson = {
  slug: string;
  topic: TopicId;
  title: string;
  excerpt: string | null;
  difficulty: Difficulty | null;
  publishedAt: string | null;
};

/**
 * Shapes a `posts` row (or a missing one) into a `RelatedLesson`.
 *
 * Every value is re-checked rather than cast: the row arrives from Supabase
 * untyped, and a lesson only becomes a card if it has a known topic — without
 * one there is no `/bai-hoc/[topic]/[slug]` page to link to.
 */
export function toRelatedLesson(row: Record<string, unknown> | null): RelatedLesson | null {
  if (!row) return null;
  const topic = TOPIC_IDS.find((id) => id === row.topic);
  if (!topic) return null;

  const difficulty = DIFFICULTIES.find((d) => d === row.difficulty);

  return {
    slug: String(row.slug ?? ""),
    topic,
    title: String(row.title ?? ""),
    excerpt: typeof row.excerpt === "string" && row.excerpt.length > 0 ? row.excerpt : null,
    difficulty: difficulty ?? null,
    publishedAt: typeof row.published_at === "string" ? row.published_at : null,
  };
}
