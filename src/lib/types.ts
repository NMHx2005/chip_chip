import type { Locale } from "@/i18n/routing";
import type { TopicId } from "@/lib/constants";

export type PostKind = "lesson" | "forum";
export type PostStatus = "draft" | "published";

/**
 * A published article, resolved to a single locale (VI or EN).
 *
 * VI and EN versions of the same article are two rows sharing a
 * `translationId`; a query always selects the row for the active locale.
 */
export type Post = {
  id: string;
  translationId: string;
  locale: Locale;
  kind: PostKind;
  topic: TopicId | null;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  content: unknown;
  publishedAt: string | null;
  updatedAt: string;
};

/** Just the fields a card or list row needs. */
export type PostSummary = Pick<
  Post,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "coverImageUrl"
  | "kind"
  | "topic"
  | "publishedAt"
>;

export type Comment = {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  body: string;
  isPostAuthor: boolean;
  createdAt: string;
  replies: Comment[];
};
