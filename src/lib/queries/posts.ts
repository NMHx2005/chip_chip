import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase/config";
import type { Locale } from "@/i18n/routing";
import type { TopicId } from "@/lib/constants";
import type { Comment, Post, PostSummary } from "@/lib/types";

/**
 * Read queries for published content.
 *
 * Every function degrades to an empty result when Supabase is not configured,
 * so a fresh clone builds and renders instead of crashing.
 */

const SUMMARY_COLUMNS =
  "id, title, slug, excerpt, cover_image_url, kind, topic, published_at";

const POST_COLUMNS =
  "id, translation_id, locale, kind, topic, title, slug, excerpt, cover_image_url, content, published_at, updated_at";

type Row = Record<string, unknown>;

function toSummary(row: Row): PostSummary {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    excerpt: (row.excerpt as string | null) ?? null,
    coverImageUrl: (row.cover_image_url as string | null) ?? null,
    kind: row.kind as PostSummary["kind"],
    topic: (row.topic as TopicId | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
  };
}

function toPost(row: Row): Post {
  return {
    ...toSummary(row),
    translationId: String(row.translation_id),
    locale: row.locale as Locale,
    content: row.content,
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function getLatestPosts(
  locale: Locale,
  limit = 3
): Promise<PostSummary[]> {
  if (!requireSupabase("getLatestPosts")) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(SUMMARY_COLUMNS)
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "forum")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getLatestPosts]", error.message);
    return [];
  }
  return (data ?? []).map(toSummary);
}

export async function listForumPosts(
  locale: Locale,
  { page = 1, pageSize = 9 }: { page?: number; pageSize?: number } = {}
): Promise<{ posts: PostSummary[]; total: number }> {
  if (!requireSupabase("listForumPosts")) return { posts: [], total: 0 };

  const supabase = createClient();
  const from = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from("posts")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "forum")
    .order("published_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    console.error("[listForumPosts]", error.message);
    return { posts: [], total: 0 };
  }
  return { posts: (data ?? []).map(toSummary), total: count ?? 0 };
}

export async function listLessonPosts(
  locale: Locale,
  topic?: TopicId
): Promise<PostSummary[]> {
  if (!requireSupabase("listLessonPosts")) return [];

  const supabase = createClient();
  let query = supabase
    .from("posts")
    .select(SUMMARY_COLUMNS)
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "lesson")
    .order("published_at", { ascending: false });

  if (topic) query = query.eq("topic", topic);

  const { data, error } = await query;
  if (error) {
    console.error("[listLessonPosts]", error.message);
    return [];
  }
  return (data ?? []).map(toSummary);
}

/** How many published lessons sit under each topic — drives the topic cards. */
export async function countLessonsByTopic(
  locale: Locale
): Promise<Record<string, number>> {
  if (!requireSupabase("countLessonsByTopic")) return {};

  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("topic")
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "lesson");

  if (error) {
    console.error("[countLessonsByTopic]", error.message);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const topic = row.topic as string | null;
    if (!topic) continue;
    counts[topic] = (counts[topic] ?? 0) + 1;
  }
  return counts;
}

export async function getPostBySlug(
  locale: Locale,
  slug: string,
  kind: "lesson" | "forum"
): Promise<Post | null> {
  if (!requireSupabase("getPostBySlug")) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", kind)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[getPostBySlug]", error.message);
    return null;
  }
  return data ? toPost(data) : null;
}

/**
 * Finds the counterpart of an article in another locale, so the language
 * switcher can keep the reader on the same article when a translation exists.
 */
export async function getTranslationSlug(
  translationId: string,
  locale: Locale
): Promise<string | null> {
  if (!requireSupabase("getTranslationSlug")) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("slug")
    .eq("translation_id", translationId)
    .eq("locale", locale)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data.slug;
}

/**
 * Visible comments for a post, nested one level deep.
 *
 * Root comments are paged so a thread with hundreds of replies does not load
 * in one go; every reply of the roots on the page is fetched with them, since
 * a reply without its parent would be meaningless.
 *
 * `author_email` is deliberately absent from the column list — it is never
 * read on the public site.
 */
export async function listComments(
  postId: string,
  { rootLimit = 20 }: { rootLimit?: number } = {}
): Promise<{ comments: Comment[]; totalRoots: number }> {
  if (!isSupabaseConfigured) return { comments: [], totalRoots: 0 };

  const supabase = createClient();

  const { data: roots, count, error } = await supabase
    .from("comments")
    .select(
      "id, post_id, parent_id, author_name, body, is_post_author, created_at",
      { count: "exact" }
    )
    .eq("post_id", postId)
    .eq("is_hidden", false)
    .is("parent_id", null)
    .order("created_at", { ascending: true })
    .limit(rootLimit);

  if (error) {
    console.error("[listComments]", error.message);
    return { comments: [], totalRoots: 0 };
  }

  const rootIds = (roots ?? []).map((r) => r.id);
  const replies = rootIds.length
    ? (
        await supabase
          .from("comments")
          .select(
            "id, post_id, parent_id, author_name, body, is_post_author, created_at"
          )
          .eq("post_id", postId)
          .eq("is_hidden", false)
          .in("parent_id", rootIds)
          .order("created_at", { ascending: true })
      ).data ?? []
    : [];

  const byId = new Map<string, Comment>();
  const result: Comment[] = [];

  for (const row of roots ?? []) {
    const comment: Comment = {
      id: row.id,
      postId: row.post_id,
      parentId: row.parent_id,
      authorName: row.author_name,
      body: row.body,
      isPostAuthor: row.is_post_author,
      createdAt: row.created_at,
      replies: [],
    };
    byId.set(comment.id, comment);
    result.push(comment);
  }

  for (const row of replies) {
    const parent = row.parent_id ? byId.get(row.parent_id) : null;
    // A reply whose parent fell outside this page has no anchor — skip it.
    if (!parent) continue;
    parent.replies.push({
      id: row.id,
      postId: row.post_id,
      parentId: row.parent_id,
      authorName: row.author_name,
      body: row.body,
      isPostAuthor: row.is_post_author,
      createdAt: row.created_at,
      replies: [],
    });
  }

  return { comments: result, totalRoots: count ?? result.length };
}

export async function countComments(postId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const supabase = createClient();
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("is_hidden", false);

  return count ?? 0;
}
