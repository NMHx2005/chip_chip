import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase/config";
import type { Locale } from "@/i18n/routing";
import { TOPIC_IDS, type TopicId } from "@/lib/constants";
import { listingOrder, pageRange } from "@/lib/listing-order";
import type { ListingParams } from "@/lib/listing-params";
import type { Comment, Difficulty, Post, PostKind, PostSummary, VideoPost } from "@/lib/types";
import { videoRefFrom } from "@/lib/video";

/**
 * Read queries for published content.
 *
 * Every function degrades to an empty result when Supabase is not configured,
 * so a fresh clone builds and renders instead of crashing.
 */

const VIDEO_COLUMNS = "video_platform, video_external_id, video_source, channel_name";

const SUMMARY_COLUMNS = `id, title, slug, excerpt, cover_image_url, kind, topic, difficulty, published_at, ${VIDEO_COLUMNS}`;

const POST_COLUMNS = `id, translation_id, locale, kind, topic, difficulty, title, slug, excerpt, cover_image_url, content, published_at, updated_at, ${VIDEO_COLUMNS}`;

type Row = Record<string, unknown>;

function toSummary(row: Row): PostSummary {
  // Re-checked against the platform's id format: the thumbnail URL and the
  // player are built from these two values.
  const video = videoRefFrom(row.video_platform, row.video_external_id);
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    excerpt: (row.excerpt as string | null) ?? null,
    coverImageUrl: (row.cover_image_url as string | null) ?? null,
    kind: row.kind as PostSummary["kind"],
    topic: (row.topic as TopicId | null) ?? null,
    difficulty: (row.difficulty as Difficulty | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    videoPlatform: video?.platform ?? null,
    videoExternalId: video?.externalId ?? null,
    videoSource:
      row.video_source === "own" || row.video_source === "curated" ? row.video_source : null,
    channelName: typeof row.channel_name === "string" ? row.channel_name : null,
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

type PageOf = { posts: PostSummary[]; total: number };

function toPage(
  scope: string,
  { data, error, count }: { data: Row[] | null; error: { code: string; message: string } | null; count: number | null }
): PageOf {
  if (error) {
    // PGRST103: the requested page starts past the last row. That is an empty
    // page (a stale or hand-edited ?page=), not a failure worth logging.
    if (error.code !== "PGRST103") console.error(`[${scope}]`, error.message);
    return { posts: [], total: 0 };
  }
  return { posts: (data ?? []).map(toSummary), total: count ?? 0 };
}

/** One page of published lessons, newest first, optionally narrowed. */
export async function listLessons(
  locale: Locale,
  { topic, difficulty, page }: Pick<ListingParams, "topic" | "difficulty" | "page">
): Promise<PageOf> {
  if (!requireSupabase("listLessons")) return { posts: [], total: 0 };

  const supabase = createClient();
  const { from, to } = pageRange(page);
  let query = supabase
    .from("posts")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "lesson");

  if (topic) query = query.eq("topic", topic);
  if (difficulty) query = query.eq("difficulty", difficulty);

  for (const clause of listingOrder("newest")) {
    query = query.order(clause.column, { ascending: clause.ascending, nullsFirst: clause.nullsFirst });
  }

  return toPage("listLessons", await query.range(from, to));
}

/** One page of published videos, filtered and sorted as the URL asks. */
export async function listVideos(locale: Locale, params: ListingParams): Promise<PageOf> {
  if (!requireSupabase("listVideos")) return { posts: [], total: 0 };

  const supabase = createClient();
  const { from, to } = pageRange(params.page);
  let query = supabase
    .from("posts")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "video");

  if (params.platform) query = query.eq("video_platform", params.platform);
  if (params.source) query = query.eq("video_source", params.source);
  if (params.topic) query = query.eq("topic", params.topic);
  if (params.difficulty) query = query.eq("difficulty", params.difficulty);

  for (const clause of listingOrder(params.sort)) {
    query = query.order(clause.column, { ascending: clause.ascending, nullsFirst: clause.nullsFirst });
  }

  return toPage("listVideos", await query.range(from, to));
}

/**
 * Wrapped in React `cache` so `generateMetadata`, the page and the OG image
 * route — each invoked separately by Next for the same request — share one
 * round trip instead of three.
 */
export const getVideoBySlug = cache(async function getVideoBySlug(
  locale: Locale,
  slug: string
): Promise<VideoPost | null> {
  if (!requireSupabase("getVideoBySlug")) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`${POST_COLUMNS}, related_lesson_translation_id`)
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "video")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[getVideoBySlug]", error.message);
    return null;
  }
  if (!data) return null;
  const related = data.related_lesson_translation_id;
  return { ...toPost(data), relatedLessonTranslationId: typeof related === "string" ? related : null };
});

/** Published videos in this locale that point at the given lesson group. */
export async function listRelatedVideos(
  locale: Locale,
  lessonTranslationId: string
): Promise<PostSummary[]> {
  if (!requireSupabase("listRelatedVideos")) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(SUMMARY_COLUMNS)
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "video")
    .eq("related_lesson_translation_id", lessonTranslationId)
    .order("published_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("[listRelatedVideos]", error.message);
    return [];
  }
  return (data ?? []).map(toSummary);
}

/**
 * The published lesson of a translation group in one locale, so a video page
 * can link back to it. Null when the lesson is unpublished, deleted, or has
 * lost its topic — the link then simply does not render.
 */
export async function getLessonByTranslation(
  locale: Locale,
  translationId: string
): Promise<{ slug: string; topic: TopicId; title: string } | null> {
  if (!requireSupabase("getLessonByTranslation")) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("slug, topic, title")
    .eq("status", "published")
    .eq("locale", locale)
    .eq("kind", "lesson")
    .eq("translation_id", translationId)
    .maybeSingle();

  if (error) {
    console.error("[getLessonByTranslation]", error.message);
    return null;
  }
  const topic = TOPIC_IDS.find((id) => id === data?.topic);
  return data && topic ? { slug: String(data.slug), topic, title: String(data.title ?? "") } : null;
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
export const getTranslationSlug = cache(async function getTranslationSlug(
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
});

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

/**
 * Accent-insensitive search over published posts (see search_posts in the
 * migrations). A blank query never reaches the database.
 */
export async function searchPosts(
  locale: Locale,
  query: string,
  kinds: PostKind[] = ["lesson", "forum", "video"],
  limit = 30
): Promise<PostSummary[]> {
  const q = query.trim();
  if (!q) return [];
  if (!requireSupabase("searchPosts")) return [];

  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_posts", {
    p_query: q,
    p_locale: locale,
    p_kinds: kinds,
    // search_posts clamps this to 1–50 itself.
    p_limit: limit,
  });

  if (error) {
    console.error("[searchPosts]", error.message);
    return [];
  }
  return ((data ?? []) as Row[]).map(toSummary);
}
