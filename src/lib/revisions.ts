import type { PostStatus } from "@/lib/types";

/** Snapshots kept per post; older ones are pruned after each write. */
export const REVISION_KEEP = 20;

/** The part of a post row a snapshot captures. */
export type RevisionSnapshot = {
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  content: unknown;
  status: PostStatus;
};

/**
 * Whether a write would actually change the row.
 *
 * Saving an untouched tab is a normal thing to do — it must not fill the
 * history with snapshots of the same article, or the twenty kept slots would
 * hold nothing but copies.
 */
export function revisionChanged(
  previous: RevisionSnapshot,
  next: RevisionSnapshot
): boolean {
  return (
    previous.title !== next.title ||
    previous.slug !== next.slug ||
    (previous.excerpt ?? "") !== (next.excerpt ?? "") ||
    (previous.coverImageUrl ?? "") !== (next.coverImageUrl ?? "") ||
    JSON.stringify(previous.content ?? null) !== JSON.stringify(next.content ?? null) ||
    previous.status !== next.status
  );
}
