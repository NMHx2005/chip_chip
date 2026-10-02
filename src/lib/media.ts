import { SUPABASE_URL } from "@/lib/supabase/config";

/** The one bucket the site stores images in (see 20260912000000_init.sql). */
export const MEDIA_BUCKET = "post-images";

export type MediaObject = {
  /** Bucket-relative path, e.g. `2026-10/3f9a….webp`. */
  path: string;
  name: string;
  /** The `YYYY-MM` folder it lives in. */
  folder: string;
  url: string;
  size: number;
  createdAt: string | null;
};

/**
 * A path the app itself would have written: `YYYY-MM/<name>.<ext>`, with no
 * traversal and nothing nested. Everything the media library deletes comes from
 * the client, so the shape is checked before it reaches Storage.
 */
export function isMediaPath(path: string): boolean {
  return /^\d{4}-\d{2}\/[A-Za-z0-9._-]{1,80}$/.test(path) && !path.includes("..");
}

/** The public URL of an object, built the same way Storage builds it. */
export function mediaPublicUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

/** Newest first, with anything missing a timestamp last. */
export function sortMediaNewestFirst(objects: MediaObject[]): MediaObject[] {
  return [...objects].sort((a, b) => {
    if (a.createdAt === b.createdAt) return a.path.localeCompare(b.path);
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** A file size a person can read; the grid has no room for raw bytes. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Which articles use an image.
 *
 * An article refers to an image twice over: as its cover, and inside the body
 * document (a plain URL in the Tiptap JSON). Deleting either kind out from
 * under a published page leaves a broken image, so both are checked.
 */
export function postsUsingUrl(
  posts: readonly { id: string; title: string; content: unknown; coverImageUrl: string | null }[],
  url: string
): { id: string; title: string }[] {
  return posts
    .filter(
      (post) =>
        post.coverImageUrl === url ||
        (post.content !== null && JSON.stringify(post.content).includes(url))
    )
    .map((post) => ({ id: post.id, title: post.title || "(chưa có tiêu đề)" }));
}
